# API Testing Guide

Manual test cases for validating the Contract Intelligence Platform API.

## Prerequisites
- Server running on http://localhost:5001
- Valid Anthropic API key configured
- MongoDB running and accessible

---

## Test Cases

### 1. Health Check
**Endpoint:** `GET /health`

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-25T...",
    "aiEnabled": true,
    "emailEnabled": false
  }
}
```

**cURL Command:**
```bash
curl http://localhost:5001/health
```

---

### 2. Upload Contract (PDF)
**Endpoint:** `POST /api/contracts/upload`

**Test with sample PDF:**
```bash
curl -X POST http://localhost:5001/api/contracts/upload \
  -F "contract=@sample-contract.pdf" \
  -F "title=Service Agreement 2024"
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Service Agreement 2024",
    "fileName": "sample-contract.pdf",
    "status": "pending",
    "textContent": "...",
    "createdAt": "2025-10-25T...",
    ...
  }
}
```

**Validation:**
- Status 201 Created
- Contract saved to database
- File saved to uploads directory
- Text extracted from PDF

---

### 3. Upload Contract (Invalid File)
**Test Error Handling:**
```bash
curl -X POST http://localhost:5001/api/contracts/upload \
  -F "contract=@image.jpg"
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Invalid file type. Only PDF and text files are allowed."
}
```

**Validation:**
- Status 400 Bad Request
- Clear error message
- No file saved

---

### 4. Analyze Contract
**Endpoint:** `POST /api/contracts/:id/analyze`

**cURL Command:**
```bash
curl -X POST http://localhost:5001/api/contracts/507f1f77bcf86cd799439011/analyze
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "analyzed",
    "parties": [
      {
        "name": "Acme Corp",
        "role": "provider"
      },
      {
        "name": "XYZ Inc",
        "role": "client"
      }
    ],
    "keyDates": [
      {
        "dateType": "effective",
        "date": "2024-01-01T00:00:00.000Z",
        "description": "Contract start date"
      }
    ],
    "financialTerms": [
      {
        "type": "payment",
        "amount": 50010,
        "currency": "USD",
        "description": "Annual service fee"
      }
    ],
    "riskLevel": "medium",
    "risks": [...],
    "complianceScore": 75,
    "complianceIssues": [...],
    "pricingAnalysis": {...},
    "similarContracts": [...],
    "aiConfidenceScore": 0.85,
    "aiProcessingTime": 3542
  }
}
```

**Validation:**
- Status 200 OK
- All AI features executed
- Confidence score present
- Processing time recorded

---

### 5. List All Contracts
**Endpoint:** `GET /api/contracts`

**cURL Command:**
```bash
curl http://localhost:5001/api/contracts
```

**Expected Response:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "...",
      "title": "Service Agreement 2024",
      "status": "analyzed",
      "riskLevel": "medium",
      "complianceScore": 75,
      ...
    },
    ...
  ]
}
```

---

### 6. List Contracts with Filters
**Filter by status:**
```bash
curl "http://localhost:5001/api/contracts?status=analyzed&limit=10"
```

**Filter by risk level:**
```bash
curl "http://localhost:5001/api/contracts?riskLevel=high"
```

**Expected Response:**
Filtered list matching criteria

---

### 7. Get Single Contract
**Endpoint:** `GET /api/contracts/:id`

**cURL Command:**
```bash
curl http://localhost:5001/api/contracts/507f1f77bcf86cd799439011
```

**Expected Response:**
Full contract details with all analysis results

---

### 8. Get Dashboard Stats
**Endpoint:** `GET /api/contracts/stats/dashboard`

**cURL Command:**
```bash
curl http://localhost:5001/api/contracts/stats/dashboard
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "totalContracts": 10,
    "analyzedContracts": 8,
    "highRiskContracts": 2,
    "avgComplianceScore": 78.5,
    "upcomingDeadlines": 3
  }
}
```

---

### 9. Delete Contract
**Endpoint:** `DELETE /api/contracts/:id`

**cURL Command:**
```bash
curl -X DELETE http://localhost:5001/api/contracts/507f1f77bcf86cd799439011
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "deleted": true
  }
}
```

**Validation:**
- Status 200 OK
- Contract removed from database
- File deleted from filesystem

---

### 10. Rate Limiting Test
**Test rate limiting:**
```bash
# Run this 101 times rapidly
for i in {1..101}; do
  curl http://localhost:5001/api/contracts
done
```

**Expected Behavior:**
- First 100 requests: Success
- 101st request: Status 429 Too Many Requests
```json
{
  "ok": false,
  "error": "Too many requests, please try again later"
}
```

---

## Error Scenarios to Test

### 1. AI Service Failure
**Simulate:** Remove or invalidate ANTHROPIC_API_KEY

**Expected Behavior:**
- Analysis still completes
- Fallback values returned
- Clear error message in response
- Contract status set to 'failed'

### 2. Missing Contract
**Test:**
```bash
curl http://localhost:5001/api/contracts/000000000000000000000000
```

**Expected:**
```json
{
  "ok": false,
  "error": "Contract not found"
}
```

### 3. Invalid File Size
**Test:** Upload file > 10MB

**Expected:**
```json
{
  "ok": false,
  "error": "File too large. Maximum size is 10MB"
}
```

### 4. Database Connection Error
**Simulate:** Stop MongoDB

**Expected Behavior:**
- Server fails to start with clear error
- Or returns 500 with database error message

---

## Performance Testing

### Response Time Benchmarks
- Upload contract: < 1 second
- Analyze contract: 3-10 seconds (depends on AI service)
- List contracts: < 100ms
- Get single contract: < 50ms
- Dashboard stats: < 200ms

### Load Testing (Optional)
Use Apache Bench or similar:
```bash
ab -n 100 -c 10 http://localhost:5001/api/contracts
```

---

## Postman Collection

Import this collection for easier testing:

```json
{
  "info": {
    "name": "Contract Intelligence Platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:5001/health"
      }
    },
    {
      "name": "Upload Contract",
      "request": {
        "method": "POST",
        "url": "http://localhost:5001/api/contracts/upload",
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "contract",
              "type": "file",
              "src": ""
            },
            {
              "key": "title",
              "value": "Test Contract",
              "type": "text"
            }
          ]
        }
      }
    },
    {
      "name": "Analyze Contract",
      "request": {
        "method": "POST",
        "url": "http://localhost:5001/api/contracts/{{contractId}}/analyze"
      }
    }
  ]
}
```

---

## Automated Testing Script

```bash
#!/bin/bash

# Quick API validation script

BASE_URL="http://localhost:5001"

echo "Testing Contract Intelligence Platform API..."

# 1. Health check
echo "1. Health check..."
curl -s $BASE_URL/health | jq .

# 2. List contracts
echo "2. Listing contracts..."
curl -s $BASE_URL/api/contracts | jq '.data | length'

# 3. Dashboard stats
echo "3. Dashboard stats..."
curl -s $BASE_URL/api/contracts/stats/dashboard | jq .

echo "Tests complete!"
```

Save as `test-api.sh`, make executable (`chmod +x test-api.sh`), and run.