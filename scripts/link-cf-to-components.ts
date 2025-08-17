#!/usr/bin/env tsx
/**
 * Link DS/SP/X/M Component nodes to CF14 CFNode terms by keyword match.
 * Non-invasive: adds ALIGNS_WITH edges only; does NOT change selection/scoring.
 */
import 'dotenv/config'
import neo4j, { Driver } from 'neo4j-driver'

const {
  NEO4J_URI = 'bolt://localhost:7687',
  NEO4J_USERNAME = 'neo4j',
  NEO4J_PASSWORD = 'testpass'
} = process.env

async function main() {
  const driver: Driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
  )
  const session = driver.session()
  try {
    // Adjust keyword source if your Component schema differs
    const res = await session.run(
      `
      MATCH (c:Component)
      WITH c, coalesce(c.keywords, []) AS kws
      UNWIND kws AS kw
      WITH c, trim(toLower(kw)) AS term
      MATCH (n:CFNode)
      WHERE toLower(n.term) = term
      MERGE (c)-[:ALIGNS_WITH]->(n)
      RETURN count(*) AS linked
      `
    )
    console.log('Linked relationships:', res.records[0]?.get('linked') ?? 0)
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})