#!/usr/bin/env tsx
import { getDriver, ensureConstraints } from "../lib/graph/mirror";

(async () => {
  const required = [
    'NEO4J_URI',
    'NEO4J_USERNAME', 
    'NEO4J_PASSWORD',
    'GRAPHQL_BEARER_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.log('Please add these to your .env.local file:');
    missing.forEach(key => console.log(`${key}=your-value-here`));
    process.exit(1);
  }
  
  try {
    const driver = getDriver();
    await ensureConstraints(driver);
    
    const session = driver.session();
    await session.run('RETURN "connection test" as message');
    
    console.log('✅ Neo4j connection successful');
    console.log('✅ Constraints ensured');
    console.log('✅ Environment validation passed');
    console.log(`✅ Feature enabled: ${process.env.FEATURE_GRAPH_ENABLED === 'true'}`);
    
    await session.close();
    await driver.close();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Neo4j is running: docker compose -f docker-compose.neo4j.yml up -d');
    console.log('2. Check your .env.local file has correct Neo4j connection details');
    console.log('3. Verify Neo4j is accessible at', process.env.NEO4J_URI);
    process.exit(1);
  }
})();