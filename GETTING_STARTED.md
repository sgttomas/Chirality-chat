# Getting Started with Chirality Core Chat

Welcome! This guide will get you up and running with the Chirality Core Chat system in minutes.

## 🚀 Quick Setup

### 1. Prerequisites
- **Node.js 18+** installed
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

### 2. Installation
```bash
# Clone or navigate to the project
cd chirality-ai-app

# Install dependencies
npm install

# Set up environment
echo "OPENAI_API_KEY=sk-proj-your-key-here" > .env.local
echo "OPENAI_MODEL=gpt-4.1-nano" >> .env.local

# Start the app
npm run dev
```

### 3. First Use
1. Open **http://localhost:3001** in your browser
2. You'll be redirected to the Chirality Core interface
3. Enter a problem (e.g., "how to build a REST API")
4. Click **"🔄 Two-Pass with Resolution"** for best results
5. Watch the documents generate in real-time
6. Use the generated documents in chat at the home page

## 🎯 What You'll See

### Document Generation
The system creates four interconnected documents:
- **DS** (Data Sheet) - Technical specifications and data requirements
- **SP** (Procedural Checklist) - Step-by-step implementation procedures
- **X** (Solution Template) - Integrated solution approach
- **M** (Guidance) - Strategic recommendations and best practices

### Two-Pass Process
1. **Pass 1**: Generates all documents sequentially
2. **Pass 2**: Refines each document using insights from the others
3. **Resolution**: Final update to ensure maximum coherence

### RAG-Enhanced Chat
After generating documents, chat with the AI and it will automatically reference your generated content for more accurate, contextual responses.

## 💡 Pro Tips

- **Use Two-Pass Generation** for complex problems - the refinement makes a huge difference
- **Start with clear problem statements** - better input leads to better documents
- **Try different problem domains** - technical, business, creative, etc.
- **Use the chat after generation** - the AI has your documents as context

## 🔧 Troubleshooting

### Common Issues
- **"Missing OpenAI API key"** → Check your `.env.local` file
- **Port already in use** → The app will automatically use 3001 if 3000 is busy
- **Generation fails** → Check your OpenAI API key has sufficient credits

### Need Help?
- Check the **README.md** for detailed documentation
- Visit `/chat-admin` for system debugging
- Review the logs in the document generation interface

## 🎉 You're Ready!

That's it! You now have a powerful document generation and RAG chat system running locally. Start with a simple problem and watch the magic happen.

**Next Steps:**
- Try both single-pass and two-pass generation
- Experiment with different types of problems
- Use the generated documents in chat conversations
- Explore the admin dashboard for insights

Happy documenting! 🚀