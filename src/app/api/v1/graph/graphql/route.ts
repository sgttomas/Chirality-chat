import { NextRequest, NextResponse } from "next/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { graphql } from "graphql";

const typeDefs = /* GraphQL */ `
  type Document {
    id: ID!
    kind: String!
    slug: String!
    title: String!
    updatedAt: String
    components: [Component!]! @relationship(type: "CONTAINS", direction: OUT)
    references: [Document!]! @relationship(type: "REFERENCES", direction: OUT)
    derivedFrom: [Document!]! @relationship(type: "DERIVED_FROM", direction: OUT)
  }

  type Component {
    id: ID!
    type: String!
    title: String!
    anchor: String
    order: Int
    score: Int
    parent: Document! @relationship(type: "CONTAINS", direction: IN)
  }

  type Query {
    document(where: DocumentWhereOne!): Document
    documents(where: DocumentWhere): [Document!]!
    searchComponents(q: String!, limit: Int = 20): [Component!]!
      @cypher(
        statement: """
        MATCH (c:Component)
        WHERE toLower(c.title) CONTAINS toLower($q)
        RETURN c LIMIT $limit
        """
      )
  }
`;

let schemaPromise: Promise<any> | null = null;
function getSchema() {
  if (!schemaPromise) {
    const driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    );
    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    schemaPromise = neoSchema.getSchema();
  }
  return schemaPromise;
}

function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.GRAPHQL_CORS_ORIGINS || "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors() });
}

export async function POST(req: NextRequest) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") {
    return NextResponse.json({ error: "Graph disabled" }, { status: 503, headers: cors() });
  }
  // Basic auth
  const auth = req.headers.get("authorization") || "";
  const ok = auth === `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors() });

  const { query, variables, operationName } = await req.json();
  const schema = await getSchema();

  // Simple depth guard (cheap)
  if (typeof query === "string" && (query.match(/\{/g)?.length || 0) > 20) {
    return NextResponse.json({ error: "Query too deep" }, { status: 400, headers: cors() });
  }

  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    operationName,
    contextValue: {} // driver injected by @neo4j/graphql
  });

  return NextResponse.json(result, { headers: cors() });
}