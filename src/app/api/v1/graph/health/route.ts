import { NextResponse } from "next/server";
import { getDriver } from "@/lib/graph/mirror";

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    // Test connection
    await session.run('RETURN 1 as health');
    
    // Get database stats
    const docCount = await session.run('MATCH (d:Document) RETURN count(d) as count');
    const compCount = await session.run('MATCH (c:Component) RETURN count(c) as count');
    
    await session.close();
    await driver.close();
    
    return NextResponse.json({
      status: 'healthy',
      neo4j: {
        connected: true,
        documents: docCount.records[0].get('count').toNumber(),
        components: compCount.records[0].get('count').toNumber()
      },
      graph_enabled: process.env.FEATURE_GRAPH_ENABLED === 'true',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      graph_enabled: process.env.FEATURE_GRAPH_ENABLED === 'true',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}