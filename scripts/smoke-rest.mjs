const res = await fetch('http://localhost:3000/api/healthz');
console.log('Healthz:', res.status, await res.json());

const pingRes = await fetch('http://localhost:3000/api/neo4j/query', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query_type: 'ping' })
});
console.log('Neo4j Ping:', pingRes.status, await pingRes.json());
