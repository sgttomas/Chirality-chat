# Chirality Chat

A modern chat interface for the Chirality Framework, enabling semantic matrix operations and knowledge graph exploration through conversational AI.

(Previously: A simple chat app using Streamlit that integrated "Concept Crush" and the "Chirality Framework" - see Simple5.py for the original implementation)

## Features

- 🤖 **AI-Powered Chat**: OpenAI Responses API integration with streaming support
- 🧮 **Semantic Matrix Operations**: Visualize and interact with Chirality Framework matrices (A×B=C, J×C=F, A+F=D)
- 🔗 **Neo4j Integration**: Direct connection to knowledge graphs and semantic relationships
- 📊 **GraphQL API**: Flexible data querying with GraphQL service
- 🎨 **Matrix Visualization**: Interactive canvas rendering of semantic matrices
- ♿ **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- 📱 **PWA Support**: Offline capability with service workers
- 🚀 **Performance Optimized**: React memoization, canvas caching, and Turbopack bundling

## Tech Stack

- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom component library
- **State Management**: Zustand, React Query
- **Database**: Neo4j Aura
- **AI**: OpenAI Responses API
- **Backend**: GraphQL Yoga, Neo4j GraphQL Library
- **Tools**: Model Context Protocol (MCP) integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- Neo4j database instance
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sgttomas/Chirality-chat.git
cd Chirality-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with:
OPENAI_API_KEY=your-openai-api-key
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── api/           # API routes (chat, neo4j)
│   ├── dashboard/     # Dashboard page
│   ├── matrix/        # Matrix visualization
│   └── mcp/          # MCP integration
├── components/        # React components
│   ├── chat/         # Chat UI components
│   ├── matrix/       # Matrix visualization
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and services
│   ├── matrix/       # Matrix rendering logic
│   ├── mcp/          # MCP client
│   └── services/     # API services
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT