import neo4j, { Driver } from "neo4j-driver";
import { SelCfg } from "./selector";

export function getDriver() {
  const uri = process.env.NEO4J_URI!;
  const user = process.env.NEO4J_USERNAME!;
  const pass = process.env.NEO4J_PASSWORD!;
  return neo4j.driver(uri, neo4j.auth.basic(user, pass), { /* timeouts */ });
}

export async function ensureConstraints(driver: Driver) {
  const session = driver.session();
  try {
    await session.run(`
      CREATE CONSTRAINT doc_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE;
      CREATE CONSTRAINT comp_id IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE;
    `);
  } finally { await session.close(); }
}

type MirrorPayload = {
  selection_v: string;
  docs: Array<{ id: string; props: any }>;
  components: Array<{ id: string; props: any; docId: string }>;
  references: Array<{ src: string; dst: string }>;
  derived: Array<{ src: string; dst: string }>;
  keepByDoc: Record<string, string[]>;
};

export async function mirrorGraph(payload: MirrorPayload) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;

  const driver = getDriver();
  const session = driver.session();
  const start = Date.now();
  try {
    await session.executeWrite(async tx => {
      await tx.run(
        `
        UNWIND $docs AS d
          MERGE (doc:Document {id:d.id})
          SET doc += d.props, doc.selection_v = $selection_v;

        UNWIND $components AS c
          MERGE (k:Component {id:c.id})
          SET k += c.props;

        UNWIND $components AS c
          MATCH (d:Document {id:c.docId}), (k:Component {id:c.id})
          MERGE (d)-[:CONTAINS]->(k);
        `,
        { docs: payload.docs, components: payload.components, selection_v: payload.selection_v }
      );

      // Delete stale CONTAINS per doc (set-diff)
      await tx.run(`
        UNWIND keys($keepByDoc) AS did
        WITH did, $keepByDoc[did] AS keep
        MATCH (d:Document {id:did})-[r:CONTAINS]->(k:Component)
        WHERE NOT k.id IN keep
        DELETE r
        WITH k
        WHERE size( (k)<-[:CONTAINS]-() ) = 0
        DETACH DELETE k
      `, { keepByDoc: payload.keepByDoc });

      // Refresh REFERENCES (safe re-merge)
      await tx.run(`
        UNWIND $refs AS r
        MATCH (s:Document {id:r.src})
        MERGE (t:Document {id:r.dst})
        MERGE (s)-[:REFERENCES]->(t)
      `, { refs: payload.references });

      // DERIVED_FROM with cycle guard
      await tx.run(`
        UNWIND $derived AS e
        MATCH (s:Document {id:e.src}), (t:Document {id:e.dst})
        WHERE NOT (t)-[:DERIVED_FROM*1..]->(s)
        MERGE (s)-[:DERIVED_FROM]->(t)
      `, { derived: payload.derived });
    });

    // metrics (replace with your logger/metrics)
    console.log(JSON.stringify({
      at: "graph_mirror", result: "success",
      docs: payload.docs.length, comps: payload.components.length,
      refs: payload.references.length, derived: payload.derived.length,
      ms: Date.now() - start, selection_v: payload.selection_v
    }));
  } catch (err) {
    console.warn("mirrorGraph failed", err);
    console.log(JSON.stringify({ at: "graph_mirror", result: "failure", ms: Date.now() - start }));
  } finally {
    await session.close();
    await driver.close();
  }
}