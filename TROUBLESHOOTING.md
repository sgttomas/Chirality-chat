# Troubleshooting Guide

*Comprehensive solutions for common issues in Chirality AI App*

## Quick Diagnosis

### System Health Check
```bash
# Check all system components
curl http://localhost:3001/api/healthz     # Basic health
curl http://localhost:3001/api/readyz      # Dependency check
curl http://localhost:3001/api/chat/debug  # System status
curl http://localhost:3001/api/core/state  # Current state
```

### Common Issue Indicators
- **Document Generation Fails**: Check OpenAI API key and connectivity
- **Chat Not Streaming**: Verify browser SSE support and network
- **State Not Persisting**: Check file permissions and disk space
- **UI Not Loading**: Verify development server and port availability

## Installation and Setup Issues

### Environment Configuration Problems

#### OpenAI API Key Issues
**Problem**: Authentication errors, generation failures, or "API key required" messages

**Symptoms**:
```
Error: OpenAI API request failed: 401 Unauthorized
Invalid API key provided
Rate limit exceeded for organization
```

**Solutions**:
1. **Verify API Key Format**:
   ```bash
   # Correct format: sk-proj-...
   echo $OPENAI_API_KEY
   # Should start with sk-proj- for project keys
   ```

2. **Check Environment File**:
   ```bash
   # Verify .env.local exists and contains correct key
   cat .env.local
   # Should contain: OPENAI_API_KEY=sk-proj-your-actual-key
   ```

3. **Validate API Key**:
   ```bash
   # Test API key directly
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

4. **Common API Key Problems**:
   - **Expired Key**: Generate new key in OpenAI dashboard
   - **Insufficient Credits**: Check OpenAI account billing
   - **Wrong Project**: Ensure key belongs to correct project
   - **Rate Limits**: Wait or upgrade OpenAI plan

#### Node.js and npm Issues
**Problem**: Installation failures, version compatibility errors

**Symptoms**:
```
Node version not supported
npm install fails with peer dependency errors
Module not found errors during development
```

**Solutions**:
1. **Check Node.js Version**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be compatible with Node version
   ```

2. **Clean Installation**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Version Manager Setup**:
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   npm install
   ```

#### Port and Network Issues
**Problem**: Development server not accessible, port conflicts

**Symptoms**:
```
Port 3001 already in use
Cannot connect to localhost:3001
ERR_CONNECTION_REFUSED in browser
```

**Solutions**:
1. **Check Port Usage**:
   ```bash
   lsof -i :3001  # Check what's using port 3001
   lsof -i :3000  # Check fallback port
   ```

2. **Kill Conflicting Processes**:
   ```bash
   # Kill process using port
   kill -9 $(lsof -ti:3001)
   # Or restart with different port
   PORT=3002 npm run dev
   ```

3. **Network Configuration**:
   ```bash
   # Check if localhost resolves correctly
   ping localhost
   # Try 127.0.0.1 instead of localhost
   curl http://127.0.0.1:3001/api/healthz
   ```

## Document Generation Issues

### Two-Pass Generation Failures

#### Incomplete Generation
**Problem**: Generation stops partway through, missing documents

**Symptoms**:
- Progress stops at specific step (e.g., "Pass 1 DS complete, SP failed")
- Some documents generated but others missing
- Generation appears to hang indefinitely

**Diagnostic Steps**:
1. **Check Generation Logs**:
   ```bash
   # View real-time logs in browser console
   # Or check admin dashboard at /chat-admin
   curl http://localhost:3001/api/chat/debug
   ```

2. **Test Individual Documents**:
   ```bash
   # Test single document generation
   curl -X POST http://localhost:3001/api/core/run \
     -H "Content-Type: application/json" \
     -d '{"kind": "DS"}'
   ```

**Solutions**:
1. **OpenAI API Issues**:
   - Check rate limits and billing status
   - Verify model availability (gpt-4.1-nano)
   - Test with simpler problem statement

2. **Content Issues**:
   - Simplify problem statement if too complex
   - Avoid special characters that might break parsing
   - Check for extremely long problem descriptions

3. **Resource Issues**:
   - Ensure sufficient disk space for state files
   - Check system memory usage during generation
   - Restart development server if memory issues

#### Document Quality Issues
**Problem**: Generated documents are low quality, incomplete, or nonsensical

**Symptoms**:
- Documents contain placeholder text or incomplete information
- Pass 2 refinement doesn't improve quality
- Documents don't relate to the problem statement

**Solutions**:
1. **Problem Statement Optimization**:
   ```bash
   # Set clear, specific problem statement
   curl -X POST http://localhost:3001/api/core/state \
     -H "Content-Type: application/json" \
     -d '{"problem": {"statement": "Clear, specific problem description"}}'
   ```

2. **Generation Parameters**:
   - Check OPENAI_MODEL environment variable
   - Verify DEFAULT_TEMPERATURE setting (should be 0.6)
   - Ensure MAX_OUTPUT_TOKENS is sufficient (800+)

3. **Context Issues**:
   - Clear state before new generation if previous context interfering
   - Ensure problem statement is set before generation
   - Check for corrupted state files

### Single Document Generation Issues

#### Document Type Errors
**Problem**: Invalid document type requests, validation failures

**Symptoms**:
```
Invalid document kind. Must be one of: DS, SP, X, M
Document validation failed
Unexpected document structure
```

**Solutions**:
1. **Verify Request Format**:
   ```bash
   # Correct request format
   curl -X POST http://localhost:3001/api/core/run \
     -H "Content-Type: application/json" \
     -d '{"kind": "DS"}'  # Must be exact: DS, SP, X, or M
   ```

2. **Check Document Dependencies**:
   - DS: No dependencies (can generate independently)
   - SP: Benefits from existing DS context
   - X: Best with DS and SP context
   - M: Best with DS, SP, and X context

### State Management Issues

#### State Corruption or Loss
**Problem**: Documents disappear, state not persisting, generation history lost

**Symptoms**:
- Generated documents not appearing in chat context
- State resets after server restart
- Error messages about corrupted state files

**Diagnostic Steps**:
1. **Check State File**:
   ```bash
   # View current state
   cat store/state.json
   # Check file permissions
   ls -la store/
   ```

2. **Validate State Structure**:
   ```bash
   # State should be valid JSON
   python -m json.tool store/state.json
   ```

**Solutions**:
1. **File Permissions**:
   ```bash
   # Ensure write permissions
   chmod 755 store/
   chmod 644 store/state.json
   ```

2. **Disk Space**:
   ```bash
   # Check available disk space
   df -h .
   # Clean up if necessary
   ```

3. **State Recovery**:
   ```bash
   # Backup corrupted state
   cp store/state.json store/state.json.backup
   
   # Reset state (will lose current documents)
   curl -X DELETE http://localhost:3001/api/core/state
   ```

## Chat Interface Issues

### Streaming Response Problems

#### Chat Not Streaming
**Problem**: Messages appear all at once instead of streaming, or don't appear at all

**Symptoms**:
- Long delay followed by complete message
- "Connecting..." indicator that never resolves
- Browser console errors about EventSource

**Solutions**:
1. **Browser Support Check**:
   ```javascript
   // Check EventSource support in browser console
   console.log('EventSource' in window);
   // Should return true
   ```

2. **Network Issues**:
   ```bash
   # Test SSE endpoint directly
   curl -N -H "Accept: text/event-stream" \
     -X POST http://localhost:3001/api/chat/stream \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

3. **Browser Debugging**:
   - Check Network tab in DevTools for failed SSE connections
   - Look for CORS errors in console
   - Verify no ad blockers interfering with streaming

#### Context Injection Failures
**Problem**: Chat responses don't reference generated documents

**Symptoms**:
- AI gives generic responses instead of document-specific answers
- No references to DS/SP/X/M content in responses
- Chat works but ignores document context

**Diagnostic Steps**:
1. **Verify Documents Exist**:
   ```bash
   # Check current state has documents
   curl http://localhost:3001/api/core/state
   # Should show finals with DS/SP/X/M documents
   ```

2. **Test Document Context**:
   ```bash
   # Check debug endpoint for context info
   curl http://localhost:3001/api/chat/debug
   ```

**Solutions**:
1. **Generate Documents First**:
   - Ensure documents are generated before chatting
   - Verify generation completed successfully
   - Check that state persisted properly

2. **Context Size Issues**:
   - Large documents might exceed context window
   - Try with simpler documents
   - Check for document compaction failures

### Command Recognition Issues

#### Commands Not Working
**Problem**: `set problem:` and `generate` commands not recognized

**Symptoms**:
- Commands treated as regular chat messages
- No special processing of command syntax
- Error messages about invalid commands

**Solutions**:
1. **Command Format**:
   ```
   ✅ Correct: set problem: Implement user authentication system
   ❌ Wrong: set problem Implement user authentication system
   ❌ Wrong: setproblem: Implement user authentication system
   ```

2. **Case Sensitivity**:
   - Commands are case-sensitive
   - Use lowercase: `set problem:` not `Set Problem:`
   - Use exact format: `generate DS` not `Generate ds`

## Performance Issues

### Slow Generation Times

#### Two-Pass Taking Too Long
**Problem**: Document generation exceeds 2-3 minutes

**Expected Performance**:
- **Single Document**: 3-8 seconds
- **Complete Two-Pass**: 45-90 seconds
- **Chat Response**: <2 seconds first token

**Diagnostic Steps**:
1. **Check OpenAI API Status**:
   ```bash
   # Monitor API response times
   time curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **Monitor System Resources**:
   ```bash
   # Check CPU and memory usage
   top -p $(pgrep node)
   # Check network connectivity
   ping api.openai.com
   ```

**Solutions**:
1. **API Optimization**:
   - Check for rate limiting (reduce concurrent requests)
   - Verify optimal model parameters in environment
   - Consider using different model if available

2. **Problem Complexity**:
   - Simplify problem statement for testing
   - Break complex problems into smaller parts
   - Check for extremely long problem descriptions

### Memory and Resource Issues

#### High Memory Usage
**Problem**: Application consuming excessive memory, becoming unresponsive

**Symptoms**:
- Browser tabs becoming unresponsive
- Development server crashing with out-of-memory errors
- System performance degradation

**Solutions**:
1. **Development Server**:
   ```bash
   # Restart development server
   npm run dev
   # Increase Node.js memory limit if needed
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```

2. **Browser Resources**:
   - Close unnecessary browser tabs
   - Use browser task manager to check memory usage
   - Clear browser cache and restart

3. **State Management**:
   - Clear large state files periodically
   - Check for memory leaks in streaming responses
   - Monitor component memory usage in React DevTools

## Browser-Specific Issues

### Cross-Browser Compatibility

#### Safari Issues
**Problem**: Features not working correctly in Safari

**Common Safari Issues**:
- Server-Sent Events support limitations
- localStorage behavior differences
- CSS styling inconsistencies

**Solutions**:
1. **Enable Developer Features**:
   - Enable "Develop" menu in Safari preferences
   - Check console for specific error messages
   - Test in Safari Technology Preview for latest features

2. **Polyfills**:
   - EventSource polyfill for older Safari versions
   - Check for ES6 feature support
   - Verify async/await compatibility

#### Firefox Issues
**Problem**: Streaming or state management issues in Firefox

**Solutions**:
1. **Privacy Settings**:
   - Check that tracking protection isn't blocking requests
   - Verify localStorage is enabled
   - Test in private browsing mode to isolate extensions

2. **Developer Tools**:
   - Use Firefox DevTools Network tab to debug SSE
   - Check console for detailed error messages
   - Monitor performance tab for resource usage

## Development Environment Issues

### Hot Reloading Problems

#### Changes Not Reflecting
**Problem**: Code changes not appearing in browser

**Solutions**:
1. **Next.js Cache**:
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Disable cache in DevTools Network tab
   - Try incognito/private browsing mode

#### TypeScript Compilation Errors
**Problem**: Type errors preventing compilation

**Common Errors**:
```
Type 'string | undefined' is not assignable to type 'string'
Property 'xyz' does not exist on type 'ABC'
Cannot find module or its corresponding type declarations
```

**Solutions**:
1. **Type Checking**:
   ```bash
   # Run type checker
   npm run type-check
   # Fix errors before development
   ```

2. **Strict Mode Issues**:
   - Add proper null checks: `value?.property`
   - Use type assertions carefully: `value as Type`
   - Define comprehensive interfaces for API responses

## Advanced Troubleshooting

### Debug Mode Operations

#### Verbose Logging
```bash
# Enable debug logging
DEBUG=* npm run dev

# OpenAI API specific debugging
DEBUG=openai:* npm run dev
```

#### State Inspection
```bash
# Complete state dump
curl http://localhost:3001/api/core/state | python -m json.tool

# System status
curl http://localhost:3001/api/chat/debug | python -m json.tool
```

### Performance Profiling

#### Client-Side Profiling
1. **React DevTools Profiler**:
   - Install React DevTools browser extension
   - Use Profiler tab to identify slow components
   - Monitor re-render frequency and performance

2. **Browser Performance**:
   - Use DevTools Performance tab
   - Record during document generation
   - Identify bottlenecks in rendering or API calls

#### Server-Side Monitoring
```bash
# Monitor API response times
curl -w "@curl-format.txt" http://localhost:3001/api/core/orchestrate

# Where curl-format.txt contains:
#     time_namelookup:  %{time_namelookup}\n
#      time_connect:  %{time_connect}\n
#   time_appconnect:  %{time_appconnect}\n
#  time_pretransfer:  %{time_pretransfer}\n
#     time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#      time_total:  %{time_total}\n
```

### Log Analysis

#### Client-Side Logs
```javascript
// Enable detailed console logging
localStorage.setItem('debug', 'chirality:*');
// Refresh page and check console for detailed logs
```

#### Server-Side Logs
```bash
# Monitor development server logs
npm run dev 2>&1 | tee debug.log

# Filter for specific components
npm run dev 2>&1 | grep -i "error\|warning"
```

## Getting Additional Help

### Information to Collect Before Reporting Issues

1. **System Information**:
   ```bash
   node --version
   npm --version
   cat package.json | grep version
   echo $OPENAI_MODEL
   ```

2. **Error Details**:
   - Complete error messages from browser console
   - Network tab showing failed requests
   - Server logs from terminal

3. **Reproduction Steps**:
   - Exact steps to reproduce the issue
   - Problem statement used during generation
   - Browser and operating system details

### Support Channels
- **GitHub Issues**: Report bugs with complete information
- **Documentation**: Check latest documentation updates
- **Community**: Engage with other users and contributors

### Self-Help Resources
- **API Documentation**: Complete endpoint references
- **Architecture Documentation**: System design and implementation details
- **Contributing Guide**: Development setup and debugging techniques

---

*This troubleshooting guide provides comprehensive solutions for common issues. It's updated regularly based on user feedback and new issue patterns.*