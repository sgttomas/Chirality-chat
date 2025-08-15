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

      // Get all matrices stored in Neo4j (updated for new schema)
      if (query_type === 'get_matrices') {
        const result = await session.run(`
          MATCH (s:Station)-[:HAS_MATRIX]->(m:Matrix)
          OPTIONAL MATCH (m)-[:HAS_CELL]->(c:Cell)
          RETURN s.name AS stationName, m.name AS name, m.title AS title, 
                 m.matrixKey AS matrixKey, m.createdAt AS created,
                 count(c) AS cellCount
          ORDER BY m.createdAt DESC
          LIMIT 20
        `);
        
        const matrices = result.records.map(record => ({
          stationName: record.get('stationName'),
          name: record.get('name'),
          title: record.get('title'),
          matrixKey: record.get('matrixKey'),
          created: record.get('created'),
          cellCount: record.get('cellCount').toNumber()
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

      // Get stations with their matrices
      if (query_type === 'get_stations') {
        const result = await session.run(`
          MATCH (s:Station)
          OPTIONAL MATCH (s)-[:HAS_MATRIX]->(m:Matrix)
          OPTIONAL MATCH (m)-[:HAS_CELL]->(c:Cell)
          RETURN s.name AS name, s.index AS index, s.createdAt AS createdAt,
                 collect(DISTINCT {
                   name: m.name,
                   title: m.title,
                   matrixKey: m.matrixKey,
                   cellCount: COUNT { (m)-[:HAS_CELL]->() }
                 }) AS matrices
          ORDER BY s.index
        `);
        
        const stations = result.records.map(record => ({
          name: record.get('name'),
          index: record.get('index') ? record.get('index').toNumber() : 0,
          createdAt: record.get('createdAt'),
          matrices: record.get('matrices').filter((m: any) => m.name)
        }));
        
        return NextResponse.json({ ok: true, stations });
      }

      // Get cell data with stages
      if (query_type === 'get_cell') {
        const { stationName, matrixName, row, col } = params || {};
        if (!stationName || !matrixName || row === undefined || col === undefined) {
          return NextResponse.json({ ok: false, error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await session.run(`
          MATCH (s:Station {name: $stationName})-[:HAS_MATRIX]->(m:Matrix {name: $matrixName})
          MATCH (m)-[:HAS_CELL]->(c:Cell {row: $row, col: $col})
          OPTIONAL MATCH (c)-[:HAS_STAGE]->(stage:CellStage)
          RETURN c.labels AS labels, 
                 collect({
                   stage: stage.stage,
                   value: stage.value,
                   modelId: stage.modelId,
                   promptHash: stage.promptHash,
                   latencyMs: stage.latencyMs,
                   warnings: stage.warnings,
                   meta: stage.meta,
                   createdAt: stage.createdAt,
                   contentHash: stage.contentHash,
                   version: stage.version
                 }) AS stages
        `, { stationName, matrixName, row: parseInt(row), col: parseInt(col) });

        if (result.records.length === 0) {
          return NextResponse.json({ ok: false, error: 'Cell not found' }, { status: 404 });
        }

        const record = result.records[0];
        const cell = {
          matrixKey: `${stationName}::${matrixName}`,
          row: parseInt(row),
          col: parseInt(col),
          labels: record.get('labels'),
          stages: record.get('stages').filter((s: any) => s.stage)
        };

        return NextResponse.json({ ok: true, cell });
      }

      // Get matrix overview
      if (query_type === 'get_matrix_overview') {
        const { stationName, matrixName } = params || {};
        if (!stationName || !matrixName) {
          return NextResponse.json({ ok: false, error: 'Missing stationName or matrixName' }, { status: 400 });
        }

        const result = await session.run(`
          MATCH (s:Station {name: $stationName})-[:HAS_MATRIX]->(m:Matrix {name: $matrixName})
          OPTIONAL MATCH (m)-[:HAS_AXIS]->(ax:Axis)
          OPTIONAL MATCH (ax)-[r:HAS_LABEL]->(lbl:Label)
          OPTIONAL MATCH (m)-[:HAS_CELL]->(c:Cell)
          OPTIONAL MATCH (c)-[:HAS_STAGE]->(stage:CellStage)
          RETURN m.name AS name, m.title AS title, m.matrixKey AS matrixKey,
                 m.createdAt AS createdAt,
                 collect(DISTINCT {
                   kind: ax.kind,
                   labels: [(ax)-[:HAS_LABEL]->(l) | {index: r.index, value: l.value}]
                 }) AS axes,
                 collect(DISTINCT {
                   row: c.row,
                   col: c.col,
                   labels: c.labels,
                   latestStage: head([(c)-[:HAS_STAGE]->(s) | s ORDER BY s.createdAt DESC])
                 }) AS cells
        `, { stationName, matrixName });

        if (result.records.length === 0) {
          return NextResponse.json({ ok: false, error: 'Matrix not found' }, { status: 404 });
        }

        const record = result.records[0];
        const matrix = {
          name: record.get('name'),
          title: record.get('title'),
          matrixKey: record.get('matrixKey'),
          stationName,
          createdAt: record.get('createdAt'),
          axes: record.get('axes').filter((a: any) => a.kind),
          cells: record.get('cells').filter((c: any) => c.row !== null)
        };

        return NextResponse.json({ ok: true, matrix });
      }

      // Get Phase-1 matrices status (C, F, D)
      if (query_type === 'get_phase1_status') {
        const result = await session.run(`
          MATCH (s:Station)-[:HAS_MATRIX]->(m:Matrix)
          WHERE m.name IN ["C", "F", "D"] AND s.name IN ["Requirements", "Objectives", "Solution Objectives"]
          OPTIONAL MATCH (m)-[:HAS_CELL]->(c:Cell)
          OPTIONAL MATCH (c)-[:HAS_STAGE]->(stage:CellStage)
          WHERE stage.stage = "final_resolved"
          RETURN s.name AS stationName, m.name AS matrixName, 
                 count(stage) AS completedCells,
                 count(c) AS totalCells
          ORDER BY 
            CASE s.name 
              WHEN "Requirements" THEN 1
              WHEN "Objectives" THEN 2  
              WHEN "Solution Objectives" THEN 3
            END
        `);

        const phase1Status = result.records.map(record => ({
          station: record.get('stationName'),
          matrix: record.get('matrixName'),
          completedCells: record.get('completedCells').toNumber(),
          totalCells: record.get('totalCells').toNumber(),
          progress: record.get('totalCells').toNumber() > 0 
            ? (record.get('completedCells').toNumber() / record.get('totalCells').toNumber() * 100).toFixed(1)
            : 0
        }));

        const isComplete = phase1Status.every(status => status.completedCells > 0);

        return NextResponse.json({ 
          ok: true, 
          phase1Status,
          isComplete,
          summary: `${phase1Status.reduce((sum, s) => sum + s.completedCells, 0)} cells completed across ${phase1Status.length} matrices`
        });
      }

      // Get Phase-2 Document Synthesis matrices
      if (query_type === 'get_document_synthesis') {
        const result = await session.run(`
          MATCH (s:Station {name: "Document Synthesis"})-[:HAS_MATRIX]->(m:Matrix)
          WHERE m.name IN ["DS", "SP", "X", "Z", "M", "W", "U", "N"]
          OPTIONAL MATCH (m)-[:HAS_CELL]->(c:Cell)
          OPTIONAL MATCH (c)-[:HAS_STAGE]->(stage:CellStage)
          WHERE stage.stage = "doc_finalize" OR stage.stage = "final_resolved"
          RETURN m.name AS matrixName, m.title AS title,
                 collect({
                   row: c.row,
                   col: c.col,
                   labels: c.labels,
                   value: stage.value,
                   meta: stage.meta,
                   createdAt: stage.createdAt
                 }) AS cells
          ORDER BY 
            CASE m.name 
              WHEN "DS" THEN 1
              WHEN "SP" THEN 2
              WHEN "X" THEN 3
              WHEN "Z" THEN 4
              WHEN "M" THEN 5
              WHEN "W" THEN 6
              WHEN "U" THEN 7
              WHEN "N" THEN 8
            END
        `);

        const matrices = result.records.map(record => ({
          name: record.get('matrixName'),
          title: record.get('title'),
          cells: record.get('cells').filter((c: any) => c.value)
        }));

        return NextResponse.json({ ok: true, matrices });
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