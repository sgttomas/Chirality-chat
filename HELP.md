# Help & Troubleshooting - Chirality Core Chat

Having issues? This guide covers common problems and their solutions.

## 🚨 Quick Fixes

### App Won't Start
```bash
# Check Node.js version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check environment file
cat .env.local
```

### Missing OpenAI API Key
```bash
# Create/check your environment file
echo "OPENAI_API_KEY=sk-proj-your-key-here" > .env.local
echo "OPENAI_MODEL=gpt-4.1-nano" >> .env.local
```

### Port Issues
The app automatically tries different ports:
- First tries port 3000
- Falls back to 3001 if 3000 is busy
- Check the terminal output for the actual port

## 🔧 Document Generation Issues

### "DS payload invalid" Errors
**Cause**: Model response doesn't match expected format
**Solution**: 
- Check OpenAI API key has sufficient credits
- Verify model access to `gpt-4.1-nano`
- Try single-pass generation first

### Generation Hangs or Times Out
**Cause**: Network issues or model availability
**Solutions**:
1. Check internet connection
2. Verify OpenAI service status
3. Try refreshing and generating again
4. Use single-pass mode if two-pass fails

### Documents Show "Error generating document"
**Debug Steps**:
1. Check browser console for errors
2. Check terminal logs for detailed error messages
3. Visit `/chat-admin` to see system state
4. Verify API key permissions

## 💬 Chat Issues

### Chat Not Referencing Documents
**Cause**: Documents not properly injected or no documents generated
**Solutions**:
1. Generate documents first using `/chirality-core`
2. Verify documents exist by visiting `/chat-admin`
3. Try clearing state and regenerating documents

### Streaming Stops or Breaks
**Cause**: Network issues or SSE connection problems
**Solutions**:
1. Refresh the page
2. Check browser network tab for failed requests
3. Try a different browser
4. Check terminal for server errors

### Empty or Incomplete Responses
**Cause**: Model context issues or API problems
**Solutions**:
1. Clear documents and regenerate
2. Check OpenAI API status
3. Verify model access

## 🔍 Debugging Tools

### Admin Dashboard (`/chat-admin`)
Access detailed system information:
- Current document state
- Generated content
- System prompts being sent to AI
- Debug information

### Browser Developer Tools
1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Monitor API calls and responses
3. **Application Tab**: Check local storage

### Server Logs
Check the terminal where you ran `npm run dev` for:
- Document generation progress
- API call details
- Validation errors
- Performance metrics

## 🌐 API Testing

### Test Document Generation
```bash
# Test single document generation
curl -X POST http://localhost:3001/api/core/run \
  -H "Content-Type: application/json" \
  -d '{"kind": "DS"}'

# Test two-pass generation
curl -X POST http://localhost:3001/api/core/orchestrate

# Check current state
curl http://localhost:3001/api/core/state
```

### Test Chat
```bash
# Test chat endpoint
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "test message"}'
```

## ⚠️ Common Error Messages

### "OpenAI API error: 401"
**Problem**: Invalid API key
**Solution**: Check your `.env.local` file and verify the API key

### "OpenAI API error: 429"
**Problem**: Rate limit exceeded or insufficient credits
**Solution**: Wait or add credits to your OpenAI account

### "Module not found" errors
**Problem**: Missing dependencies
**Solution**: Run `npm install`

### "Cannot find module critters"
**Problem**: Missing build dependency
**Solution**: Run `npm install critters`

### "Port 3000 is already in use"
**Not an error**: App automatically uses port 3001
**Check**: Terminal output for actual port number

## 🎯 Performance Issues

### Slow Document Generation
**Normal behavior**: Two-pass generation takes longer
- Single-pass: ~15-30 seconds
- Two-pass with resolution: ~60-90 seconds

**If unusually slow**:
1. Check internet speed
2. Try single-pass generation
3. Check OpenAI service status

### Memory Issues
**Rare but possible**:
1. Clear browser cache
2. Restart the development server
3. Clear document state: `curl -X DELETE http://localhost:3001/api/core/state`

## 🆘 Still Need Help?

### Check These Resources
1. **README.md** - Comprehensive documentation
2. **GETTING_STARTED.md** - Quick setup guide
3. **CLAUDE.md** - Technical details for developers

### Gather Debug Information
When reporting issues, include:
1. Browser and version
2. Node.js version (`node --version`)
3. Error messages from browser console
4. Error messages from terminal
5. Steps to reproduce the problem

### Reset Everything
If all else fails, complete reset:
```bash
# Stop the server (Ctrl+C)
rm -rf node_modules package-lock.json
rm -rf .next
npm install
npm run dev
```

## ✅ Verification Checklist

When everything works correctly, you should see:
- ✅ App starts on http://localhost:3001 (or 3000)
- ✅ Redirect to `/chirality-core` page works
- ✅ Can enter a problem statement
- ✅ Document generation completes successfully
- ✅ Can view generated documents in tabs
- ✅ Chat references the generated documents
- ✅ Admin dashboard shows system state

Happy troubleshooting! 🔧