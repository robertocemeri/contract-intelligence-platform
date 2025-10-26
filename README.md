# Contract Intelligence Platform

AI-powered contract management system that analyzes legal documents, identifies risks, and provides smart recommendations.

---

## What It Does

Upload a contract and get instant AI analysis:
- **Extract Key Information** - Parties, dates, amounts, important clauses
- **Risk Assessment** - Identify potential legal and financial risks
- **Compliance Check** - Score contracts against business standards
- **Smart Recommendations** - Find similar contracts and pricing insights

---

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
MONGODB_URI=mongodb://localhost:27017/contract-platform
```

Get API key at: https://console.anthropic.com

### 3. Start MongoDB
```bash
mongod
```

### 4. Run Application
```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## Requirements

- Node.js 16+
- MongoDB 4.4+
- Anthropic API key

---

## Features

### 📄 Contract Intelligence
- Automatically extract parties and their roles
- Identify key dates (effective, expiration, renewal)
- Extract financial terms and amounts
- Categorize important clauses

### ⚠️ Risk Assessment
- Multi-category risk analysis (financial, legal, operational)
- Severity ratings (low, medium, high, critical)
- Specific recommendations for each risk
- Overall risk level scoring

### ✅ Compliance Checking
- Score contracts 0-100 for compliance
- Flag missing critical clauses
- Identify non-standard terms
- Actionable improvement suggestions

### 💰 Pricing Analysis
- Evaluate if terms are favorable
- Compare against market standards
- Identify hidden costs
- Negotiation recommendations

### 🔍 Similar Contracts
- Find contracts with similar terms
- Match by content and structure
- Show similarity percentage

---

## Usage

### Upload a Contract
1. Click "Upload Contract" button
2. Select PDF or TXT file (max 10MB)
3. Wait 5-10 seconds for AI analysis

### View Analysis
- Click any contract to see detailed analysis
- View parties, dates, and financial terms
- Check risk assessment and recommendations
- See compliance score and issues

### Dashboard
- Total contracts analyzed
- High-risk contracts count
- Average compliance score
- Upcoming deadlines

---

## API Endpoints

### Upload Contract
```bash
POST /api/contracts/upload
```

### Analyze Contract
```bash
POST /api/contracts/:id/analyze
```

### List Contracts
```bash
GET /api/contracts
```

### Get Contract Details
```bash
GET /api/contracts/:id
```

### Dashboard Stats
```bash
GET /api/contracts/stats/dashboard
```

### Delete Contract
```bash
DELETE /api/contracts/:id
```

---

## Configuration

### Environment Variables

**Required:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `MONGODB_URI` - MongoDB connection string

**Optional:**
- `PORT` - Server port (default: 5001)
- `EMAIL_HOST` - SMTP host for notifications
- `EMAIL_USER` - Email username
- `EMAIL_PASSWORD` - Email password
- `MAX_FILE_SIZE` - Upload limit (default: 10MB)

---

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **AI**: Anthropic Claude Sonnet 4.5
- **File Processing**: pdf-parse

---

## Project Structure

```
contract-intelligence-platform/
├── server/               # Backend API
│   └── src/
│       ├── services/    # AI and business logic
│       ├── routes/      # API endpoints
│       ├── models/      # Database schemas
│       └── middleware/  # Express middleware
├── client/              # React frontend
│   └── src/
│       ├── App.js       # Main component
│       └── services/    # API client
├── uploads/             # Uploaded files
└── .env                 # Configuration
```

---

## Development

### Run Backend Only
```bash
npm run server
```

### Run Frontend Only
```bash
npm run client
```

### Run Both
```bash
npm run dev
```

---

## Testing

Upload the sample contracts in `test-contracts/`:
- `service-agreement.txt` - Service contract with complex terms
- `software-license.txt` - SaaS license agreement
- `consulting-agreement.txt` - Consultant agreement

---

## Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/contracts
```

### API Key Error
Make sure your `.env` file has:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Port Already in Use
Change port in `.env`:
```bash
PORT=5001
```

### File Upload Fails
- Check file size (max 10MB)
- Only PDF and TXT files supported
- Ensure `uploads/` directory exists

---

## Performance

- **Upload**: < 1 second
- **Analysis**: 3-10 seconds (AI processing)
- **Dashboard**: < 200ms
- **List Contracts**: < 100ms

---

## Security

- Rate limiting (100 requests per 15 minutes)
- File type validation
- File size limits
- Security headers (Helmet.js)
- Input validation
- CORS protection

---

## Production Deployment

### 1. Build Frontend
```bash
cd client
npm run build
```

### 2. Set Environment
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
```

### 3. Start with PM2
```bash
npm install -g pm2
pm2 start server/src/index.js --name contract-platform
pm2 startup
pm2 save
```

---

## Scaling

### Current Setup
- Single server
- Local file storage
- Synchronous AI processing

### Production Recommendations
- Use AWS S3 for file storage
- Add Redis for caching
- Implement job queue for AI processing
- Use MongoDB Atlas for database
- Deploy to AWS/Heroku
- Add load balancer for multiple instances

---

## Documentation

- **README.md** - This file (getting started)
- **TECHNICAL_README.md** - Detailed technical documentation
- **ARCHITECTURE.md** - Design decisions and patterns
- **API_TESTING.md** - API test cases
- **DEPLOYMENT.md** - Production deployment guide

---

## Features in Detail

### AI Analysis Process

1. **Text Extraction**
   - PDF parsing with pdf-parse
   - Plain text file reading
   - Error handling for corrupted files

2. **Contract Intelligence**
   - Structured data extraction
   - Date parsing and validation
   - Financial term identification
   - Clause categorization

3. **Risk Assessment**
   - Multiple risk categories analyzed
   - Severity-based prioritization
   - Specific mitigation strategies
   - Overall risk level calculation

4. **Compliance Checking**
   - Standard clause verification
   - Missing protection identification
   - Best practice comparison
   - Improvement recommendations

5. **Smart Recommendations**
   - Similar contract matching
   - Pricing competitiveness analysis
   - Market position evaluation
   - Negotiation suggestions

---

## System Requirements

### Minimum
- 2 CPU cores
- 4GB RAM
- 10GB disk space
- Internet connection (for AI API)

### Recommended
- 4 CPU cores
- 8GB RAM
- 50GB disk space
- High-speed internet

---

## Support

- **Documentation**: See docs in project root
- **Issues**: Check console logs for errors
- **API Docs**: See TECHNICAL_README.md

---

## License

MIT

---

## Credits

Built with:
- Anthropic Claude for AI capabilities
- MongoDB for data storage
- React for user interface
- Express for API server

---

**Ready to analyze contracts? Upload your first document and see the AI in action!** 🚀