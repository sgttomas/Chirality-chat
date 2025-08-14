import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query_type, cypher, params } = body;

    // Ping mode — no DB needed
    if (query_type === 'ping') {
      return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
    }

    const driver = getNeo4jDriver();
    const session = driver.session();

    try {
      // Example query mode
      if (query_type === 'example') {
        const result = await session.run('RETURN "Hello from Neo4j" AS message');
        const message = result.records[0]?.get('message') ?? null;
        return NextResponse.json({ ok: true, message });
      }

      // Get all matrices stored in Neo4j
      if (query_type === 'get_matrices') {
        const result = await session.run(`
          MATCH (m:Matrix)
          RETURN m.id AS id, m.name AS name, m.type AS type, 
                 m.rows AS rows, m.cols AS cols, m.created AS created
          ORDER BY m.created DESC
          LIMIT 20
        `);
        
        const matrices = result.records.map(record => ({
          id: record.get('id'),
          name: record.get('name'),
          type: record.get('type'),
          rows: record.get('rows'),
          cols: record.get('cols'),
          created: record.get('created')
        }));
        
        return NextResponse.json({ ok: true, matrices });
      }

      // Get chirality components
      if (query_type === 'get_components') {
        const result = await session.run(`
          MATCH (c:Component)
          OPTIONAL MATCH (c)-[:HAS_CELL]->(cell:Cell)
          RETURN c.id AS id, c.name AS name, c.station AS station,
                 c.shape AS shape, count(cell) AS cellCount
          ORDER BY c.id DESC
          LIMIT 20
        `);
        
        const components = result.records.map(record => ({
          id: record.get('id'),
          name: record.get('name'),
          station: record.get('station'),
          shape: record.get('shape'),
          cellCount: record.get('cellCount').toNumber()
        }));
        
        return NextResponse.json({ ok: true, components });
      }

      // Get knowledge graph for a specific entity
      if (query_type === 'knowledge_graph') {
        const entityId = params?.entityId;
        if (!entityId) {
          return NextResponse.json({ ok: false, error: 'entityId required' }, { status: 400 });
        }

        const result = await session.run(`
          MATCH (n)
          WHERE id(n) = $entityId OR n.id = $entityId
          OPTIONAL MATCH (n)-[r]-(connected)
          RETURN n, collect({
            relationship: type(r),
            node: connected,
            direction: CASE 
              WHEN startNode(r) = n THEN 'outgoing'
              ELSE 'incoming'
            END
          }) AS connections
        `, { entityId });

        if (result.records.length === 0) {
          return NextResponse.json({ ok: false, error: 'Entity not found' }, { status: 404 });
        }

        const record = result.records[0];
        const node = record.get('n').properties;
        const connections = record.get('connections').filter((c: any) => c.node);

        return NextResponse.json({ 
          ok: true, 
          entity: node,
          connections: connections.map((c: any) => ({
            relationship: c.relationship,
            node: c.node.properties,
            direction: c.direction
          }))
        });
      }

      // Execute custom Cypher query
      if (query_type === 'custom' && cypher) {
        const result = await session.run(cypher, params || {});
        const records = result.records.map(record => {
          const obj: any = {};
          record.keys.forEach(key => {
            const value = record.get(key);
            obj[key] = value?.properties || value;
          });
          return obj;
        });
        
        return NextResponse.json({ ok: true, records });
      }

      // Get database statistics
      if (query_type === 'stats') {
        const result = await session.run(`
          CALL apoc.meta.stats() YIELD nodeCount, relCount, labels, relTypes
          RETURN nodeCount, relCount, labels, relTypes
        `).catch(() => null);

        if (result) {
          const stats = result.records[0];
          return NextResponse.json({ 
            ok: true, 
            stats: {
              nodeCount: stats.get('nodeCount').toNumber(),
              relCount: stats.get('relCount').toNumber(),
              labels: stats.get('labels'),
              relTypes: stats.get('relTypes')
            }
          });
        } else {
          // Fallback if APOC not available
          const nodeResult = await session.run('MATCH (n) RETURN count(n) as count');
          const relResult = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
          
          return NextResponse.json({
            ok: true,
            stats: {
              nodeCount: nodeResult.records[0].get('count').toNumber(),
              relCount: relResult.records[0].get('count').toNumber()
            }
          });
        }
      }

      return NextResponse.json({ ok: false, error: 'Unknown query_type' }, { status: 400 });
    } finally {
      await session.close();
    }
  } catch (err: any) {
    console.error('Neo4j query error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unhandled error' },
      { status: 500 }
    );
  }
}