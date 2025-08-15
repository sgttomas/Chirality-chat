# CLAUDE-DEBUGGING.md

Specialized guidance for Claude Code when debugging and troubleshooting the Chirality Chat application.

## Debugging Philosophy

This application provides **comprehensive debugging tools** and **complete transparency** into system operations:
- **Admin Dashboard** at `/chat-admin` for real-time system monitoring
- **Debug endpoints** for API introspection
- **Detailed logging** throughout the application
- **Error tracking** with graceful degradation

## Admin Dashboard - Primary Debugging Tool

### Accessing the Admin Dashboard
Navigate to `http://localhost:3000/chat-admin` for complete system transparency.

**Dashboard Features**:
- **Real-time monitoring**: Auto-refresh every 2 seconds
- **Document status**: Visual indicators for DS/SP/X/M documents
- **System instructions**: Full prompt sent to OpenAI
- **Compacted documents**: Optimized content as injected into AI context
- **Raw documents**: Complete document data structures
- **Metrics**: Token counts, content lengths, timestamps

### Using the Admin Dashboard for Debugging

#### 1. Document Generation Issues
**Symptoms**: Documents not generating or appearing empty

**Debug Steps**:
1. Check **Document Status** section for missing documents
2. View **Problem Set** to ensure problem is defined
3. Check **Raw Documents** tab for actual data structure
4. Monitor **Last Updated** timestamp for recent changes

**Common Findings**:
- Problem not set (shows "No problem set")
- Documents generated but not properly saved
- LLM returning malformed JSON (handled automatically)

#### 2. Chat Context Issues  
**Symptoms**: Chat not aware of generated documents

**Debug Steps**:
1. Navigate to **Full Instructions** tab
2. Look for "--- Pinned Finals (compact) ---" section
3. Verify document content is properly injected
4. Check **Instructions Analysis** for content lengths

**Common Findings**:
- Documents not being compacted properly
- Injection logic not triggering
- Empty document content

#### 3. Streaming Problems
**Symptoms**: Messages not appearing or getting cut off

**Debug Steps**:
1. Use **Test Chat Endpoint** button
2. Monitor network tab for SSE events
3. Check console for JavaScript errors
4. Verify OpenAI API key and credits

### Admin Dashboard Code Example
```typescript
// Access debug data programmatically
const debugData = await fetch('/api/chat/debug').then(r => r.json())

console.log('Document Status:', debugData.state.documentsFound)
console.log('Instructions Length:', debugData.instructionsLength)
console.log('Compacted Documents:', debugData.compactedDocuments)
```

## Debug Endpoints

### 1. Chat Debug Endpoint (`/api/chat/debug`)
**Purpose**: Provides complete transparency into chat system state

```bash
curl http://localhost:3000/api/chat/debug | jq
```

**Response Structure**:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "state": {
    "problem": {
      "title": "Problem Title",
      "statement": "Problem description",
      "initialVector": ["keyword1", "keyword2"]
    },
    "documentsFound": {
      "DS": true,
      "SP": true,
      "X": false,
      "M": false
    }
  },
  "fullInstructions": "Complete system prompt...",
  "instructionsLength": 2847,
  "compactedDocuments": {
    "DS": "data_field: Example field, type: string...",
    "SP": "step: Step description, purpose: Step purpose...",
    "X": null,
    "M": null
  },
  "rawDocuments": {
    "DS": {
      "text": { "data_field": "Example field", "type": "string" },
      "terms_used": ["field", "data"],
      "warnings": []
    }
  }
}
```

### 2. Chat Test Endpoint (`/api/chat/test`)
**Purpose**: Test document injection without OpenAI API calls

```bash
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"testMessage": "What documents are available?"}'
```

**Response Structure**:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "testMessage": "What documents are available?",
  "documentsDetected": {
    "DS": true,
    "SP": true,
    "X": false,
    "M": false,
    "totalFound": 2
  },
  "instructionsAnalysis": {
    "totalLength": 2847,
    "documentMentions": {
      "DS": 1,
      "SP": 1,
      "X": 0,
      "M": 0
    },
    "documentContentLengths": {
      "DS": 156,
      "SP": 234,
      "X": 0,
      "M": 0
    },
    "totalDocumentContent": 390
  },
  "validation": {
    "hasDocuments": true,
    "instructionsContainDocuments": true,
    "allDocumentsInjected": false,
    "estimatedTokens": 711
  }
}
```

### 3. State Endpoint (`/api/core/state`)
**Purpose**: Direct access to document state

```bash
# Get current state
curl http://localhost:3000/api/core/state

# Clear all state
curl -X DELETE http://localhost:3000/api/core/state

# Update state
curl -X POST http://localhost:3000/api/core/state \
  -H "Content-Type: application/json" \
  -d '{"problem": {"title": "New Problem", "statement": "Test problem"}}'
```

## Common Issues & Debugging Steps

### Issue 1: "SSE error: {}"
**Symptoms**: Chat fails to stream responses, shows empty error

**Debugging Steps**:
1. **Check OpenAI API Key**:
   ```bash
   echo $OPENAI_API_KEY
   # Should show: sk-proj-...
   ```

2. **Verify Model Access**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY" | grep "gpt-4.1-nano"
   ```

3. **Test Direct API Call**:
   ```bash
   curl -X POST https://api.openai.com/v1/responses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -d '{
       "model": "gpt-4.1-nano",
       "instructions": "You are a helpful assistant.",
       "input": [{"role": "user", "content": [{"type": "input_text", "text": "Hello"}]}],
       "max_output_tokens": 50
     }'
   ```

4. **Check Network Tab**: Look for failed requests to `/api/chat/stream`

**Common Causes**:
- Invalid API key
- No access to gpt-4.1-nano model
- Network connectivity issues
- API quota exceeded

### Issue 2: Documents Not Generating
**Symptoms**: "Generate DS" command doesn't create documents

**Debugging Steps**:
1. **Check Problem Definition**:
   ```bash
   curl http://localhost:3000/api/core/state | jq '.problem'
   ```
   Should show non-empty statement.

2. **Test Direct Generation**:
   ```bash
   curl -X POST http://localhost:3000/api/core/run \
     -H "Content-Type: application/json" \
     -d '{"kind": "DS", "problem": "Test problem"}'
   ```

3. **Check LLM Integration**:
   Look at server console for errors from `/src/chirality-core/vendor/llm.ts`

4. **Verify File Permissions**:
   ```bash
   ls -la $(node -e "console.log(require('os').tmpdir())")/.chirality-state.json
   ```

**Common Causes**:
- Problem not set before generation
- OpenAI API errors
- File system permission issues
- JSON parsing errors (handled gracefully)

### Issue 3: Chat Not Aware of Documents
**Symptoms**: Chat responds as if no documents exist

**Debugging Steps**:
1. **Use Admin Dashboard**:
   - Navigate to `/chat-admin`
   - Check **Document Status** shows generated documents
   - View **Full Instructions** tab
   - Look for "--- Pinned Finals (compact) ---"

2. **Test Document Injection**:
   ```bash
   curl -X POST http://localhost:3000/api/chat/test | jq '.validation'
   ```

3. **Check Compaction**:
   ```bash
   curl http://localhost:3000/api/chat/debug | jq '.compactedDocuments'
   ```

4. **Verify State Persistence**:
   ```bash
   curl http://localhost:3000/api/core/state | jq '.finals'
   ```

**Common Causes**:
- Documents generated but not persisted
- Compaction functions not working
- State file corruption
- Document injection logic disabled

### Issue 4: Empty Document Fields
**Symptoms**: Generated documents show empty or "Error generating document"

**Debugging Steps**:
1. **Check Raw LLM Response**:
   Look at server console for JSON parsing messages

2. **Test with Minimal Problem**:
   ```bash
   curl -X POST http://localhost:3000/api/core/run \
     -H "Content-Type: application/json" \
     -d '{"kind": "DS", "problem": "Simple test problem with clear requirements"}'
   ```

3. **Verify JSON Unwrapping**:
   Check `/src/chirality-core/orchestrate.ts` lines 39-58 for unwrapping logic

4. **Test Different Document Types**:
   Try generating SP, X, M to see if issue is document-specific

**Common Causes** (Fixed in Current Version):
- LLM returning extra wrapper layers (automatically handled)
- Malformed JSON responses (gracefully handled)
- Temperature settings too high
- Insufficient problem context

## Logging and Console Output

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Key Log Messages to Watch

#### Document Generation Logs
```
✅ [orchestrate.ts] Starting DS generation for problem: "..."
🔄 [vendor/llm.ts] Making OpenAI Responses API call
📦 [orchestrate.ts] Unwrapping extra DS layer from text wrapper
✅ [orchestrate.ts] DS generation completed in 2.3s
```

#### State Management Logs
```
💾 [store.ts] Writing state to /tmp/.chirality-state.json
📖 [store.ts] Reading state from /tmp/.chirality-state.json
🗑️ [store.ts] Clearing all state
```

#### Chat Stream Logs
```
🔗 [stream/route.ts] Chat stream started for message: "..."
📋 [stream/route.ts] Injecting 3 documents into context (2,847 chars)
📤 [stream/route.ts] SSE chunk sent: {"type": "content", "content": "..."}
✅ [stream/route.ts] Stream completed successfully
```

### Error Patterns to Recognize

#### OpenAI API Errors
```
❌ [vendor/llm.ts] OpenAI API error: 401 Unauthorized
❌ [vendor/llm.ts] OpenAI API error: 429 Rate limit exceeded
❌ [vendor/llm.ts] OpenAI API error: 400 Invalid request format
```

#### State Management Errors
```
❌ [store.ts] Failed to write state: EACCES permission denied
❌ [store.ts] Failed to read state: ENOENT file not found
❌ [store.ts] State file corrupted, resetting to default
```

## Performance Debugging

### Monitor Token Usage
```bash
# Check current instructions length
curl http://localhost:3000/api/chat/debug | jq '.instructionsLength'

# Check document content sizes
curl http://localhost:3000/api/chat/test | jq '.instructionsAnalysis.documentContentLengths'
```

### Memory Usage Monitoring
```bash
# Check Node.js memory usage
node -e "console.log(process.memoryUsage())"

# Monitor file system usage
df -h $(node -e "console.log(require('os').tmpdir())")
```

### Response Time Analysis
```javascript
// Browser console - measure API response times
const start = performance.now()
await fetch('/api/chat/debug')
const end = performance.now()
console.log(`Debug endpoint: ${end - start}ms`)
```

## Browser Developer Tools

### Network Tab Debugging
1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Send chat message
4. Look for:
   - `/api/chat/stream` request (should be EventStream)
   - SSE events in Response tab
   - Any failed requests (red entries)

### Console Debugging
Key console patterns to look for:
```javascript
// Successful SSE connection
"SSE connected to /api/chat/stream"

// Content accumulation (should show growing content)
"Accumulated content: Hello wor..."
"Accumulated content: Hello world, this is..."

// Stream completion
"SSE stream completed"

// Errors
"SSE error: NetworkError"
"Chat stream failed: 500 Internal Server Error"
```

## Testing Procedures

### Complete System Test
1. **Clear State**: `curl -X DELETE http://localhost:3000/api/core/state`
2. **Set Problem**: Navigate to `/chirality-core`, click "Set Test Problem"
3. **Generate Documents**: Generate DS → SP → X → M in sequence
4. **Monitor Admin**: Watch `/chat-admin` for real-time updates
5. **Test Chat**: Send message like "What documents are available?"
6. **Verify Response**: Chat should reference generated documents

### Automated Health Check
```bash
#!/bin/bash
echo "=== Chirality Chat Health Check ==="

# Check API health
echo "1. API Health:"
curl -s http://localhost:3000/api/healthz | jq

# Check current state
echo "2. Document State:"
curl -s http://localhost:3000/api/core/state | jq '.finals | keys'

# Test debug endpoint
echo "3. Debug Endpoint:"
curl -s http://localhost:3000/api/chat/debug | jq '.state.documentsFound'

# Test chat configuration
echo "4. Chat Configuration:"
curl -s -X POST http://localhost:3000/api/chat/test | jq '.validation'

echo "=== Health Check Complete ==="
```

## When to Escalate Issues

### Contact for Help When:
1. **OpenAI API consistently fails** despite valid key and credits
2. **State file corruption** that persists after clearing
3. **SSE streaming completely broken** across all browsers
4. **Admin dashboard shows incorrect data** compared to actual state
5. **Document generation fails** with unexpected error patterns

### Information to Provide:
1. **Error logs** from server console
2. **Browser console output** 
3. **Network tab screenshots** showing failed requests
4. **Admin dashboard screenshots** showing current state
5. **Environment details** (Node.js version, OS, browser)
6. **Reproduction steps** with specific commands used

---

🔍 **For Claude Code**: The admin dashboard at `/chat-admin` is your primary debugging tool. When encountering issues, always check there first for real-time system state and comprehensive diagnostics. The debug endpoints provide programmatic access to the same information for automated testing.