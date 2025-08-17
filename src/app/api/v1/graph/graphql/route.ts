import { NextRequest, NextResponse } from "next/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { graphql, parse, validate } from "graphql";
import depthLimit from "graphql-depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";

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

  """
  CF14 semantic matrix container: kind ∈ {A,B,C,D,F,J}
  Stored separately from Document/Component to avoid collisions.
  """
  type CFMatrix {
    id: ID!
    kind: String!
    name: String
    createdAt: String
    nodes(limit: Int = 50): [CFNode!]! @cypher(
      statement: """
      MATCH (m:CFMatrix {id: $this.id})-[:CONTAINS]->(n:CFNode)
      RETURN n LIMIT $limit
      """
    )
  }

  """
  CF14 semantic node. Term/station map to CF14 pipeline concepts.
  """
  type CFNode {
    id: ID!
    term: String!
    station: String
    score: Int
    payload: String
    relatesTo(limit: Int = 50): [CFNode!]! @cypher(
      statement: """
      MATCH (n:CFNode {id: $this.id})-[:RELATES_TO]->(x:CFNode)
      RETURN x LIMIT $limit
      """
    )
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
    
    """
    List CF14 matrices; filter by kind if provided.
    """
    cfMatrices(kind: String, limit: Int = 20): [CFMatrix!]! @cypher(
      columnName: "m",
      statement: """
      MATCH (m:CFMatrix)
      WHERE $kind IS NULL OR m.kind = $kind
      RETURN m LIMIT $limit
      """
    )

    """
    Basic term search over CF nodes (uses term index if present).
    """
    cfSearch(term: String!, limit: Int = 20): [CFNode!]! @cypher(
      columnName: "n",
      statement: """
      MATCH (n:CFNode)
      WHERE toLower(n.term) CONTAINS toLower($term)
      RETURN n LIMIT $limit
      """
    )
  }
`;

let schemaPromise: Promise<any> | null = null;
function getSchema() {
  if (!schemaPromise) {
    const driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
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

  // Validate query depth/complexity (fails fast)
  try {
    const schema = await getSchema();
    const documentAST = parse(query);
    const rules = [
      depthLimit(6),
      createComplexityLimitRule(1000, {
        onCost: () => void 0,
        formatErrorMessage: (cost: number) => `Query too complex: ${cost}`
      })
    ];
    const errors = validate(schema, documentAST, rules);
    if (errors.length) {
      return NextResponse.json(
        { code: 'QUERY_TOO_COMPLEX', message: errors[0].message },
        { status: 400, headers: cors() }
      );
    }
  } catch (e) {
    // parse/validation error—treat as bad request
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid GraphQL query' },
      { status: 400, headers: cors() }
    );
  }

  const schema = await getSchema();
  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    operationName,
    contextValue: {} // driver injected by @neo4j/graphql
  });

  return NextResponse.json(result, { headers: cors() });
}