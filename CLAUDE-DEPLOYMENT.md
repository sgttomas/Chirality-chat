# CLAUDE-DEPLOYMENT.md

Specialized guidance for Claude Code when deploying and managing production instances of the Chirality Chat application.

## Deployment Overview

This application is designed for easy deployment with minimal external dependencies:
- **Self-contained**: Graph-free architecture with file-based state
- **Stateless**: No database requirements (Neo4j optional for legacy features)
- **Scalable**: Horizontal scaling with shared file storage
- **Secure**: Environment-based configuration with no hardcoded secrets

## Pre-Deployment Checklist

### Required Environment Variables
```env
# CRITICAL - Required for basic functionality
OPENAI_API_KEY=sk-proj-your-production-api-key
OPENAI_MODEL=gpt-4.1-nano

# OPTIONAL - Tuning parameters
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800
OPENAI_API_TIMEOUT=60000

# OPTIONAL - Legacy GraphQL features
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# PRODUCTION - Performance and monitoring
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Security Verification
```bash
# Verify no secrets in codebase
grep -r "sk-proj-" src/ --exclude-dir=node_modules
grep -r "OPENAI_API_KEY.*=" src/ --exclude-dir=node_modules

# Should return no matches
```

### Performance Preparation
```bash
# Build and analyze bundle
npm run build
ANALYZE=true npm run build  # If bundle analyzer configured

# Test production build locally
npm start
```

## Platform-Specific Deployments

### Vercel Deployment (Recommended)

#### Setup Process
1. **Connect Repository**:
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel Dashboard:
   ```
   OPENAI_API_KEY = sk-proj-your-production-key
   OPENAI_MODEL = gpt-4.1-nano
   NODE_ENV = production
   ```

3. **Deploy Configuration** (`vercel.json`):
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "regions": ["iad1"],
     "functions": {
       "src/app/api/chat/stream/route.ts": {
         "maxDuration": 60
       },
       "src/app/api/core/run/route.ts": {
         "maxDuration": 60
       }
     },
     "headers": [
       {
         "source": "/api/chat/stream",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache, no-store, must-revalidate"
           }
         ]
       }
     ]
   }
   ```

#### Vercel-Specific Considerations
- **Edge Functions**: Chat streaming works on Vercel Edge Runtime
- **File Storage**: State files use Vercel's temporary storage (resets on redeploy)
- **Streaming**: SSE properly supported with Vercel's infrastructure
- **Cold Starts**: Minimal impact due to stateless design

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  chirality-chat:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=gpt-4.1-nano
      - NODE_ENV=production
    volumes:
      - chirality-data:/tmp
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  chirality-data:
```

#### Deployment Commands
```bash
# Build image
docker build -t chirality-chat .

# Run container
docker run -d \
  --name chirality-chat \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-proj-your-key \
  -e OPENAI_MODEL=gpt-4.1-nano \
  -e NODE_ENV=production \
  -v chirality-data:/tmp \
  chirality-chat

# Health check
docker exec chirality-chat curl -f http://localhost:3000/api/healthz
```

### AWS Deployment

#### EC2 with PM2
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/sgttomas/Chirality-chat.git
cd Chirality-chat
npm install
npm run build

# PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chirality-chat',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/Chirality-chat',
    env: {
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-proj-your-key',
      OPENAI_MODEL: 'gpt-4.1-nano'
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/chirality-chat/error.log',
    out_file: '/var/log/chirality-chat/access.log',
    log_file: '/var/log/chirality-chat/combined.log'
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Lambda Deployment (Experimental)
```bash
# Install Serverless Framework
npm install -g serverless

# Serverless configuration
cat > serverless.yml << EOF
service: chirality-chat

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  timeout: 60
  environment:
    OPENAI_API_KEY: \${env:OPENAI_API_KEY}
    OPENAI_MODEL: gpt-4.1-nano

functions:
  app:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-next-js

EOF

# Deploy
serverless deploy
```

### Kubernetes Deployment

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chirality-chat
  labels:
    app: chirality-chat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chirality-chat
  template:
    metadata:
      labels:
        app: chirality-chat
    spec:
      containers:
      - name: chirality-chat
        image: chirality-chat:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: chirality-secrets
              key: openai-api-key
        - name: OPENAI_MODEL
          value: "gpt-4.1-nano"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/healthz
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/readyz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        volumeMounts:
        - name: tmp-storage
          mountPath: /tmp
      volumes:
      - name: tmp-storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: chirality-chat-service
spec:
  selector:
    app: chirality-chat
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: v1
kind: Secret
metadata:
  name: chirality-secrets
type: Opaque
stringData:
  openai-api-key: sk-proj-your-production-key
```

## Monitoring and Observability

### Health Checks

#### Application Health Endpoints
```bash
# Liveness probe (is app running?)
curl http://your-domain.com/api/healthz

# Readiness probe (is app ready to serve traffic?)
curl http://your-domain.com/api/readyz

# Detailed health status
curl http://your-domain.com/api/chat/debug
```

#### Health Check Responses
```json
// Healthy response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "openai": "connected",
    "filesystem": "writable",
    "memory": "normal"
  }
}

// Unhealthy response (503 status)
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "openai": "api_key_invalid",
    "filesystem": "writable",
    "memory": "normal"
  },
  "errors": ["OpenAI API key authentication failed"]
}
```

### Logging Configuration

#### Production Logging
```typescript
// Production logger configuration
const logger = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: [
    {
      type: 'console',
      format: 'json'
    },
    {
      type: 'file',
      filename: '/var/log/chirality-chat/app.log',
      maxSize: '10mb',
      maxFiles: 5
    }
  ]
}
```

#### Key Metrics to Monitor
```javascript
// Application metrics
{
  "documents_generated_total": 1234,
  "chat_messages_total": 5678,
  "openai_api_calls_total": 2345,
  "openai_api_errors_total": 12,
  "active_sessions": 45,
  "average_response_time_ms": 850,
  "memory_usage_mb": 256,
  "document_state_size_bytes": 12345
}
```

### Error Tracking

#### Sentry Integration
```typescript
// Install: npm install @sentry/nextjs

// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out API key exposure
    if (event.message?.includes('sk-proj-')) {
      return null
    }
    return event
  }
})

// Usage in components
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'ChatWindow',
      operation: 'sendMessage'
    }
  })
}
```

### Performance Monitoring

#### OpenTelemetry Setup
```typescript
// Install: npm install @opentelemetry/api @opentelemetry/auto-instrumentations-node

// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'chirality-chat',
  serviceVersion: process.env.npm_package_version
})

sdk.start()
```

#### Custom Metrics
```typescript
// Usage tracking
const metrics = {
  documentGeneration: {
    duration: histogram('document_generation_duration_seconds'),
    errors: counter('document_generation_errors_total'),
    success: counter('document_generation_success_total')
  },
  chat: {
    messageLength: histogram('chat_message_length_characters'),
    responseTime: histogram('chat_response_time_seconds'),
    streamingErrors: counter('chat_streaming_errors_total')
  }
}
```

## Scaling Considerations

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
# Nginx configuration
upstream chirality_chat {
    server chirality-chat-1:3000;
    server chirality-chat-2:3000;
    server chirality-chat-3:3000;
    
    # Health checks
    check interval=30s rise=2 fall=3 timeout=10s;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://chirality_chat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

#### Session Affinity
```yaml
# For stateful deployments (if needed)
apiVersion: v1
kind: Service
metadata:
  name: chirality-chat-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

### State Management at Scale

#### Shared Storage
```bash
# Redis for shared state (optional enhancement)
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Modified state store using Redis
```

#### Database Migration (Future Enhancement)
```sql
-- PostgreSQL schema for persistent state
CREATE TABLE chirality_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_title TEXT,
    problem_statement TEXT NOT NULL,
    initial_vector JSONB,
    documents JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chirality_sessions_updated ON chirality_sessions(updated_at);
```

## Security Hardening

### Environment Security
```bash
# Secure environment file permissions
chmod 600 .env.production
chown app:app .env.production

# Verify no secrets in logs
grep -r "sk-proj-" /var/log/ 2>/dev/null || echo "No secrets found in logs"
```

### Container Security
```dockerfile
# Security-hardened Dockerfile additions
FROM node:18-alpine AS base

# Add security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Remove unnecessary packages
RUN apk del apk-tools

# Use dumb-init for proper signal handling
USER nextjs
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### API Security
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
```

## Backup and Recovery

### State Backup Strategy
```bash
#!/bin/bash
# Backup script for document state

BACKUP_DIR="/backups/chirality-chat"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STATE_FILE="/tmp/.chirality-state.json"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current state if exists
if [ -f "$STATE_FILE" ]; then
    cp "$STATE_FILE" "$BACKUP_DIR/state_backup_$TIMESTAMP.json"
    
    # Compress old backups
    find "$BACKUP_DIR" -name "*.json" -mtime +7 -exec gzip {} \;
    
    # Remove backups older than 30 days
    find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
    
    echo "State backed up to $BACKUP_DIR/state_backup_$TIMESTAMP.json"
else
    echo "No state file found to backup"
fi
```

### Disaster Recovery
```bash
#!/bin/bash
# Recovery script

BACKUP_DIR="/backups/chirality-chat"
STATE_FILE="/tmp/.chirality-state.json"

# List available backups
echo "Available backups:"
ls -la "$BACKUP_DIR"

# Restore latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/state_backup_*.json | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" "$STATE_FILE"
    echo "State restored from $LATEST_BACKUP"
    
    # Restart application
    pm2 restart chirality-chat
else
    echo "No backups found"
fi
```

---

🚀 **For Claude Code**: This application is designed for easy deployment with minimal dependencies. The admin dashboard provides excellent production monitoring capabilities. Focus on proper environment variable configuration and monitoring the health check endpoints for production reliability.