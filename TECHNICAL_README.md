# Contract Intelligence Platform - Technical Documentation

AI-powered contract analysis system built with React, Node.js, Express, MongoDB, and Anthropic Claude.

---

## Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express 4.18
- **Database**: MongoDB 4.4+ (Mongoose ODM)
- **AI**: Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **File Processing**: pdf-parse, multer
- **Email**: nodemailer (optional)

### Frontend
- **Framework**: React 18
- **HTTP Client**: Axios
- **Icons**: lucide-react
- **Styling**: Custom CSS (no framework)

### Security & Middleware
- helmet (security headers)
- express-rate-limit (100 req/15min)
- cors
- express-validator

---

## Quick Start

```bash
# Install dependencies
npm run install-all

# Configure environment
cp .env.example .env
# Edit .env - add ANTHROPIC_API_KEY

# Start MongoDB
mongod

# Run application
npm run dev
```

**Ports:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- MongoDB: `mongodb://localhost:27017`

---

## Project Structure

```
.
├── server/src/
│   ├── config/index.js           # Environment configuration
│   ├── models/Contract.js        # MongoDB schema
│   ├── services/
│   │   ├── aiService.js          # AI integration (Claude)
│   │   ├── contractService.js    # Business logic
│   │   └── emailService.js       # Email notifications
│   ├── routes/contracts.js       # API endpoints
│   ├── middleware/
│   │   ├── upload.js             # File upload (multer)
│   │   └── errorHandler.js       # Error handling
│   └── index.js                  # Server entry point
│
├── client/src/
│   ├── services/api.js           # API client
│   ├── App.js                    # Main React component
│   ├── App.css                   # Styles
│   └── index.js                  # React entry
│
└── uploads/                      # File storage (local)
```

---

## Database Schema

### Contract Model

```javascript
{
  // Basic Info
  title: String,
  fileName: String,
  filePath: String,
  fileType: String (enum: ['pdf', 'text']),
  status: String (enum: ['pending', 'processing', 'analyzed', 'failed']),
  textContent: String,
  
  // AI Analysis Results (flat arrays)
  parties: [{ name, role }],
  keyDates: [{ dateType, date, description }],
  financialTerms: [{ type: { type: String }, amount, currency, description }],
  clauses: [{ clauseType, content, importance }],
  
  // Risk Assessment
  riskLevel: String (enum: ['low', 'medium', 'high', 'critical']),
  risks: [{ category, severity, description, recommendation }],
  
  // Compliance
  complianceScore: Number (0-100),
  complianceIssues: [{ standard, issue, severity }],
  
  // Smart Recommendations
  similarContracts: [{ contractId, similarity, matchedFeatures }],
  pricingAnalysis: { marketPosition, recommendations, comparableTerms },
  
  // AI Metadata
  aiAnalysisDate: Date,
  aiConfidenceScore: Number (0-1),
  aiProcessingTime: Number (milliseconds),
  
  // Error Tracking
  lastError: String,
  errorCount: Number,
  
  timestamps: true  // createdAt, updatedAt
}
```

**Indexes:**
```javascript
{ status: 1 }
{ riskLevel: 1 }
{ 'keyDates.date': 1 }
{ createdAt: -1 }
```

**Important Note:** `type` field in nested objects must use `type: { type: String }` syntax due to Mongoose reserved keyword.

---

## API Endpoints

### Base URL: `/api/contracts`

#### POST `/upload`
Upload and create contract
```bash
curl -X POST http://localhost:5001/api/contracts/upload \
  -F "contract=@file.pdf" \
  -F "title=Service Agreement"
```

**Response:**
```json
{
  "ok": true,
  "data": { "_id": "...", "title": "...", "status": "pending" }
}
```

#### POST `/:id/analyze`
Trigger AI analysis
```bash
curl -X POST http://localhost:5001/api/contracts/{id}/analyze
```

**Response:**
```json
{
  "ok": true,
  "data": { 
    "_id": "...",
    "status": "analyzed",
    "parties": [...],
    "risks": [...],
    "complianceScore": 85
  }
}
```

#### GET `/`
List contracts (with optional filters)
```bash
curl "http://localhost:5001/api/contracts?status=analyzed&riskLevel=high"
```

**Query Params:**
- `status`: pending|processing|analyzed|failed
- `riskLevel`: low|medium|high|critical
- `limit`: number (default: 100)

#### GET `/:id`
Get single contract with full analysis

#### GET `/stats/dashboard`
Get dashboard statistics
```json
{
  "totalContracts": 10,
  "analyzedContracts": 8,
  "highRiskContracts": 2,
  "avgComplianceScore": 78.5,
  "upcomingDeadlines": 3
}
```

#### DELETE `/:id`
Delete contract and associated file

---

## AI Integration

### Service Architecture

```javascript
aiService
  ├── extractContractIntelligence()  // Parties, dates, amounts, clauses
  ├── assessRisks()                  // Risk analysis with recommendations
  ├── checkCompliance()              // Compliance scoring
  ├── analyzePricing()               // Financial terms analysis
  └── findSimilarContracts()         // Similarity matching
```

### AI Features

**1. Contract Intelligence**
- Extracts parties, dates, amounts, clauses
- Structured JSON output with confidence scoring
- Handles missing/unclear information

**2. Risk Assessment**
- Multi-category analysis (financial, legal, operational, compliance)
- Severity-based categorization
- Specific mitigation recommendations

**3. Compliance Checking**
- 0-100 scoring
- Identifies missing critical clauses
- Actionable improvement recommendations

**4. Pricing Analysis**
- Market position assessment
- Competitiveness evaluation
- Negotiation recommendations

**5. Similar Contracts**
- Keyword-based similarity (demo)
- Production-ready for vector embeddings

### Error Handling

All AI operations return `{ ok, data }` or `{ ok, error, fallback }`:

```javascript
const result = await aiService.extractContractIntelligence(text);
if (!result.ok) {
  // Use fallback data, continue processing
  contract.parties = result.fallback.parties || [];
}
```

### JSON Parsing

AI responses are parsed with multiple fallback strategies:
1. Direct JSON.parse()
2. Strip markdown code blocks
3. Fix single/double quote issues
4. Escape unescaped quotes
5. Return error with detailed logging

---

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
MONGODB_URI=mongodb://localhost:27017/contract-platform

# Server
PORT=5001
NODE_ENV=development

# Optional - Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Optional - Limits
MAX_FILE_SIZE=10485760  # 10MB
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### File Upload Limits
- **Max Size**: 10MB (configurable)
- **Allowed Types**: PDF, TXT
- **Storage**: Local filesystem (`./uploads/`)
- **Naming**: `{fieldname}-{timestamp}-{random}.{ext}`

---

## Development

### Run Development Servers
```bash
npm run dev          # Both frontend and backend
npm run server       # Backend only
npm run client       # Frontend only
```

### Backend Only
```bash
cd server
node src/index.js
```

### Frontend Only
```bash
cd client
npm start
```

### Debug Logging

Enable debug logs by checking console output. Key debug points:
- AI response parsing
- Data type validation
- Contract assignment
- Mongoose operations

---

## Architecture Patterns

### 1. Service Layer Separation
```
Routes → Services → Models → Database
       ↓
   External APIs (AI, Email)
```

### 2. Consistent API Responses
```javascript
// Success
{ ok: true, data: {...} }

// Error
{ ok: false, error: "message" }

// AI Error with Fallback
{ ok: false, error: "message", fallback: {...} }
```

### 3. Early Returns
```javascript
async function analyze(id) {
  const contract = await Contract.findById(id);
  if (!contract) {
    return { ok: false, error: 'Not found' };
  }
  
  // Continue processing...
}
```

### 4. Flat Data Structures
All MongoDB arrays are flat, not nested:
```javascript
// ✅ Good
parties: [{ name, role }]

// ❌ Avoid
parties: { providers: [...], clients: [...] }
```

### 5. Graceful Degradation
```javascript
// AI service fails → Use fallback values
// Risk assessment fails → Continue with partial data
// Email service disabled → System still works
```

---

## Performance Considerations

### Database
- Indexes on frequently queried fields
- Selective field loading for lists
- Aggregation pipelines for stats

### AI API
- Single analysis workflow (parallel where possible)
- Text truncation for large contracts (15,000 chars)
- No redundant API calls

### File Processing
- Streaming for large PDFs
- Async file operations
- Proper cleanup on errors

---

## Security

### Implemented
- Helmet.js security headers
- Rate limiting (disabled in development)
- CORS configuration
- File type validation
- File size limits
- Input validation (express-validator)
- No hardcoded credentials

### Production Additions Needed
- JWT authentication
- Role-based access control
- API key rotation
- Request signing
- File encryption at rest
- Audit logging

---

## Common Issues & Solutions

### Issue: MongoDB Connection Error
```bash
# Start MongoDB
mongod

# Check if running
ps aux | grep mongod
```

### Issue: "ANTHROPIC_API_KEY is required"
```bash
# Edit .env file
nano .env

# Add key
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Restart server
```

### Issue: Port Already in Use
```bash
# Find process
lsof -i :5001

# Kill it or change PORT in .env
PORT=5001
```

### Issue: Rate Limiting Warning in Dev
This is normal - rate limiting is disabled in development mode.

### Issue: Mongoose CastError with `type` field
Make sure schema uses `type: { type: String }` not `type: String` for fields named "type".

---

## Testing

### Manual API Testing
```bash
# Health check
curl http://localhost:5001/health

# Upload contract
curl -X POST http://localhost:5001/api/contracts/upload \
  -F "contract=@test.pdf"

# Analyze
curl -X POST http://localhost:5001/api/contracts/{id}/analyze

# List
curl http://localhost:5001/api/contracts
```

### Test Contracts
See `test-contracts/` directory for sample files:
- `service-agreement.txt` - Complex service contract
- `software-license.txt` - SaaS license agreement
- `consulting-agreement.txt` - Independent contractor agreement

---

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
ANTHROPIC_API_KEY=...
```

### Process Manager (PM2)
```bash
npm install -g pm2
pm2 start server/src/index.js --name contract-platform
pm2 startup
pm2 save
```

### Build Frontend
```bash
cd client
npm run build
# Serve build/ with nginx or express.static
```

### Recommended Infrastructure
- **App**: AWS EC2 / Heroku / Railway
- **Database**: MongoDB Atlas
- **Storage**: AWS S3 (replace local uploads)
- **CDN**: CloudFront
- **Monitoring**: Datadog / New Relic

---

## Scaling Considerations

### Current Limitations
- Synchronous AI processing
- Local file storage
- Single server instance
- In-memory rate limiting

### Scaling Path

**Phase 1: Horizontal Scaling**
- AWS S3 for file storage
- Redis for rate limiting & caching
- Load balancer + multiple instances
- MongoDB replica set

**Phase 2: Async Processing**
- Bull queue + Redis
- Worker processes for AI analysis
- WebSocket for real-time updates

**Phase 3: Microservices**
- Separate AI service
- Dedicated file processing service
- API gateway
- Kubernetes orchestration

---

## API Response Times

**Expected Performance:**
- Upload contract: < 1s
- AI analysis (full): 3-10s
- List contracts: < 100ms
- Get single contract: < 50ms
- Dashboard stats: < 200ms

---

## Dependencies

### Core Backend
```json
{
  "@anthropic-ai/sdk": "^0.27.0",
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "multer": "^1.4.5",
  "pdf-parse": "^1.1.1"
}
```

### Security & Middleware
```json
{
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "axios": "^1.6.2",
  "lucide-react": "^0.263.1"
}
```

---

## Contributing

### Code Style
- Use early returns
- Flat data structures
- Consistent error handling
- Service layer separation
- Meaningful variable names

### Commit Messages
```
feat: Add pricing analysis feature
fix: Resolve Mongoose type casting issue
docs: Update API documentation
refactor: Extract parsing logic to helper
```

---

## License

MIT

---

## Support

**Issues:** Check console logs for detailed error messages
**Logs Location:** Terminal output (stdout/stderr)
**Debug Mode:** Set `NODE_ENV=development` for verbose logging

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/src/index.js` | Server entry, middleware setup |
| `server/src/services/aiService.js` | AI integration, prompt engineering |
| `server/src/services/contractService.js` | Business logic orchestration |
| `server/src/models/Contract.js` | MongoDB schema definition |
| `server/src/routes/contracts.js` | API endpoint definitions |
| `client/src/App.js` | React application, UI components |
| `client/src/services/api.js` | HTTP client, API calls |
| `.env` | Environment configuration |

---

**Built for production-ready contract analysis with AI-powered insights.**