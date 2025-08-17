#!/usr/bin/env tsx
import { getDriver, ensureConstraints } from "../lib/graph/mirror";

(async () => {
  console.log('Initializing Neo4j graph constraints...');
  
  try {
    const driver = getDriver();
    await ensureConstraints(driver);
    
    console.log('✅ Neo4j constraints successfully created:');
    console.log('  - doc_id: UNIQUE constraint on Document.id');
    console.log('  - comp_id: UNIQUE constraint on Component.id');
    
    // Test the connection and show some info
    const session = driver.session();
    const result = await session.run('RETURN "Neo4j connection successful" as message');
    console.log(`✅ ${result.records[0].get('message')}`);
    
    await session.close();
    await driver.close();
    
  } catch (error) {
    console.error('❌ Failed to initialize constraints:', error);
    console.error('Make sure Neo4j is running and connection details are correct in .env.local');
    process.exit(1);
  }
})();