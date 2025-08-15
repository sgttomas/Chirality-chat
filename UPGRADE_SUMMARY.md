# Chirality Chat - Framework Integration Upgrade

## Overview

The Chirality Chat interface has been upgraded to integrate with the enhanced backend pipeline and Phase-2 Document Synthesis features. This upgrade adds comprehensive semantic matrix visualization, real-time pipeline monitoring, and MCP tool integration.

## New Features

### 🚀 Enhanced Dashboard
- **Location**: `/enhanced-dashboard`
- **Purpose**: Unified interface for all Chirality Framework operations
- **Features**:
  - Overview of all semantic stations and matrices
  - Quick navigation to specialized views
  - Real-time activity monitoring
  - System health indicators

### 📝 Phase-2 Document Synthesis
- **Components**: DocumentBuilder, DocumentViewer, DocumentControls
- **Matrices**: DS (Data Sheet), SP (Standard Procedure), X (Guidance), Z (Checklist), M (Solutions)
- **Features**:
  - Interactive table views for each document type
  - Export to Markdown, JSON formats
  - Real-time data filtering and search
  - Version tracking and convergence monitoring

### 🔢 Semantic Matrix Visualization
- **Component**: SemanticMatrixViewer
- **Features**:
  - Canvas-based rendering with zoom/pan
  - Cell-level stage visualization with color coding
  - Interactive cell inspection
  - Real-time data updates
  - Stage-aware tooltips and metadata

### 🔧 Real-Time Pipeline Monitor
- **Component**: PipelineMonitor
- **Features**:
  - Live SSE log streaming
  - Job status tracking
  - Progress visualization
  - Pipeline control (start/stop jobs)
  - Historical job management

### 🤖 MCP Tools Integration
- **Built-in Tools**:
  - `run_pipeline`: Execute Chirality CLI commands
  - `query_cell`: Inspect individual matrix cells
  - `generate_document`: Create Phase-2 documents
  - `create_ufo_claim`: Submit ontological claims
  - `get_pipeline_status`: Monitor job status
  - `export_document`: Export documents in various formats

## Backend Integration

### GraphQL Client
- **Apollo Client**: Full GraphQL integration with the backend service
- **Caching**: Intelligent caching with real-time updates
- **Error Handling**: Graceful fallback to REST APIs when needed
- **Types**: Complete TypeScript type safety

### Neo4j Schema Updates
- **Cell-Level Operations**: Updated queries for new cell-based schema
- **Station/Matrix Hierarchy**: Support for the semantic valley structure  
- **UFO Claims**: Integration with ontological claim system
- **Document Synthesis**: Queries for Phase-2 matrices

### Real-Time Updates
- **Server-Sent Events**: Live pipeline log streaming
- **Polling**: Automatic data refresh for matrix views
- **WebSocket Ready**: Infrastructure for real-time collaboration

## Architecture Improvements

### Component Organization
```
src/
├── components/
│   ├── document/        # Phase-2 document synthesis
│   ├── matrix/          # Semantic matrix visualization
│   ├── pipeline/        # Pipeline monitoring
│   ├── mcp/             # MCP tool integration
│   └── ...
├── lib/
│   ├── graphql/         # GraphQL client and queries
│   ├── mcp/             # MCP client and tools
│   └── ...
└── app/
    ├── enhanced-dashboard/  # Main dashboard
    └── ...
```

### Performance Optimizations
- **React Query**: Efficient data fetching and caching
- **Canvas Rendering**: Hardware-accelerated matrix visualization
- **Virtual Scrolling**: Handle large datasets efficiently
- **Memoization**: Prevent unnecessary re-renders

## Configuration

### Environment Variables
```bash
# GraphQL Backend
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql

# Neo4j Database
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# OpenAI Integration
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4.1-nano
```

### Service Dependencies
1. **Chirality Framework GraphQL Service** (localhost:8080)
2. **Admin UI Orchestrator API** (localhost:3001)
3. **Neo4j Database** (configured via env vars)

## Usage Examples

### Starting a Pipeline Job via MCP
```typescript
// Via the MCP Panel
{
  "tool": "run_pipeline",
  "args": {
    "command": "generate-c",
    "rows": [0, 1, 2],
    "cols": [0, 1, 2, 3],
    "ufo_propose": true
  }
}
```

### Querying Matrix Cells
```typescript
// Via GraphQL
query PullCell {
  pullCell(
    stationName: "Requirements"
    matrixName: "C"
    row: 0
    col: 0
    includeOntologies: true
  ) {
    stages {
      stage
      value
      createdAt
    }
    ontologies {
      curie
      label
    }
  }
}
```

### Exporting Documents
```typescript
// Via Document Builder
exportDocument('DS', 'markdown', {
  minConfidence: 0.8,
  status: ['final'],
  version: 'V3'
})
```

## Migration Notes

### From Previous Version
1. **Dependencies**: Install new GraphQL and MCP dependencies
2. **Environment**: Update environment variables for backend services
3. **API Calls**: Existing REST calls now complemented by GraphQL
4. **Components**: New components are additive - existing chat interface unchanged

### Database Schema
- **Cell-Based Model**: Supports the new cell-level operations
- **Station Hierarchy**: Semantic valley organization
- **UFO Integration**: Ontological claim management
- **Backward Compatibility**: Existing data structures preserved

## Development Commands

```bash
# Start development server
npm run dev

# Run in production
npm run build && npm start

# Test API connectivity
npm run smoke:rest
```

## Future Enhancements

1. **PDF Export**: Server-side PDF generation for documents
2. **Collaborative Editing**: Real-time multi-user document editing
3. **Advanced Visualizations**: 3D matrix representations
4. **Plugin System**: Extensible MCP tool architecture
5. **AI Assistance**: Integrated chat for matrix exploration

## Support

- **Documentation**: See CLAUDE.md for detailed development guide
- **Issues**: Report issues to the Chirality Framework repository
- **Architecture**: Refer to the admin UI orchestrator API documentation