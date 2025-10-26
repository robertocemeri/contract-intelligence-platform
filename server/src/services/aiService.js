const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

/**
 * AI Service - Strategic AI Integration
 * 
 * Design Principles:
 * 1. Separation of Concerns - Each AI feature is a distinct method
 * 2. Error Resilience - Graceful degradation when AI fails
 * 3. Performance - Efficient API usage, minimal redundant calls
 * 4. Validation - Structured outputs with confidence scoring
 */

class AIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
    
    this.model = 'claude-sonnet-4-20250514';
    this.maxTokens = 4096;
  }

  /**
   * Contract Intelligence: Extract structured data from contract text
   * Returns: parties, dates, amounts, clauses
   */
  async extractContractIntelligence(contractText, contractTitle) {
    if (!config.ai.enabled) {
      return this._fallbackExtraction();
    }

    try {
      const startTime = Date.now();
      
      const prompt = `You are an expert contract analyst. Extract key information from this contract and return it as valid JSON.

Contract Title: ${contractTitle}

Contract Text:
${contractText}

Extract the following information and return ONLY a valid JSON object with DOUBLE QUOTES (no other text, no markdown):

{
  "parties": [
    {"name": "string", "role": "provider|client|other"}
  ],
  "keyDates": [
    {"dateType": "effective|expiration|renewal|other", "date": "YYYY-MM-DD", "description": "string"}
  ],
  "financialTerms": [
    {"type": "payment|penalty|bonus|fee", "amount": number, "currency": "USD|EUR|etc", "description": "string"}
  ],
  "clauses": [
    {"clauseType": "termination|confidentiality|liability|indemnification|other", "content": "brief summary", "importance": "high|medium|low"}
  ],
  "confidence": 0.0-1.0
}

CRITICAL RULES:
- Use DOUBLE QUOTES for all strings (not single quotes)
- Return ONLY the JSON object (no explanatory text before or after)
- Extract only information explicitly stated in the contract
- Use null for missing information
- Date format must be YYYY-MM-DD
- All numbers should be actual numbers, not strings
- Confidence should reflect data quality and clarity (0.0 to 1.0)`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const processingTime = Date.now() - startTime;
      const rawResponse = response.content[0].text;
      
      // Debug logging
      console.log('AI Response (first 500 chars):', rawResponse.substring(0, 500));
      
      const result = this._parseAIResponse(rawResponse);
      
      // Debug logging - be very explicit
      console.log('Parsed result keys:', Object.keys(result));
      if (result.financialTerms) {
        console.log('financialTerms type:', typeof result.financialTerms);
        console.log('financialTerms isArray:', Array.isArray(result.financialTerms));
        console.log('financialTerms value:', JSON.stringify(result.financialTerms).substring(0, 200));
      }
      
      // Don't spread the result - return it directly to avoid any conversion
      return {
        ok: true,
        data: result,
      };
      
    } catch (error) {
      console.error('AI extraction error:', error.message);
      return {
        ok: false,
        error: error.message,
        fallback: this._fallbackExtraction(),
      };
    }
  }

  /**
   * Risk Assessment: Identify potential legal and business risks
   */
  async assessRisks(contractText, extractedData) {
    if (!config.ai.enabled) {
      return this._fallbackRiskAssessment();
    }

    try {
      const prompt = `You are a legal risk analyst. Analyze this contract for potential risks.

Contract Summary:
- Parties: ${JSON.stringify(extractedData.parties || [])}
- Key Dates: ${JSON.stringify(extractedData.keyDates || [])}
- Financial Terms: ${JSON.stringify(extractedData.financialTerms || [])}

Full Contract Text:
${contractText.substring(0, 15000)} 

Return ONLY valid JSON (no markdown, no extra text):

{
  "riskLevel": "low|medium|high|critical",
  "risks": [
    {
      "category": "financial|legal|operational|compliance|reputational",
      "severity": "low|medium|high|critical",
      "description": "clear explanation",
      "recommendation": "specific action"
    }
  ],
  "overallAssessment": "brief summary",
  "confidence": 0.8
}

CRITICAL JSON RULES:
- Use DOUBLE QUOTES for all strings
- Escape any quotes inside descriptions (use \\" not ")
- No trailing commas
- All descriptions should be complete sentences
- Return raw JSON only, no markdown code blocks`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const result = this._parseAIResponse(response.content[0].text);
      
      return {
        ok: true,
        data: result,
      };
      
    } catch (error) {
      console.error('Risk assessment error:', error.message);
      return {
        ok: false,
        error: error.message,
        fallback: this._fallbackRiskAssessment(),
      };
    }
  }

  /**
   * Compliance Checking: Verify contract meets standards
   */
  async checkCompliance(contractText, extractedData) {
    if (!config.ai.enabled) {
      return this._fallbackCompliance();
    }

    try {
      const prompt = `You are a compliance officer. Check this contract against standard business practices and return valid JSON only.

Contract Details:
${JSON.stringify(extractedData, null, 2)}

Contract Text:
${contractText.substring(0, 15000)}

Check compliance and return ONLY a JSON object:

{
  "complianceScore": 0-100,
  "issues": [
    {
      "standard": "data protection|payment terms|termination|liability|other",
      "issue": "what's missing or problematic",
      "severity": "low|medium|high"
    }
  ],
  "recommendations": ["specific improvements"],
  "confidence": 0.0-1.0
}

Evaluate:
- Data protection clauses
- Clear payment terms
- Fair termination conditions
- Liability limitations
- Dispute resolution mechanisms`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const result = this._parseAIResponse(response.content[0].text);
      
      return {
        ok: true,
        data: result,
      };
      
    } catch (error) {
      console.error('Compliance check error:', error.message);
      return {
        ok: false,
        error: error.message,
        fallback: this._fallbackCompliance(),
      };
    }
  }

  /**
   * Pricing Analysis: Evaluate if contract terms are favorable
   */
  async analyzePricing(contractText, financialTerms) {
    if (!config.ai.enabled) {
      return this._fallbackPricingAnalysis();
    }

    try {
      const prompt = `You are a business analyst. Evaluate the financial terms of this contract and return valid JSON only.

Financial Terms:
${JSON.stringify(financialTerms, null, 2)}

Contract Context:
${contractText.substring(0, 10000)}

Analyze and return ONLY a JSON object:

{
  "marketPosition": "favorable|average|unfavorable",
  "analysis": "detailed analysis of pricing",
  "recommendations": ["specific suggestions"],
  "comparableTerms": ["industry standard comparisons"],
  "confidence": 0.0-1.0
}

Consider:
- Payment structure competitiveness
- Hidden costs or fees
- Payment terms favorability
- Value for money
- Industry benchmarks`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const result = this._parseAIResponse(response.content[0].text);
      
      return {
        ok: true,
        data: result,
      };
      
    } catch (error) {
      console.error('Pricing analysis error:', error.message);
      return {
        ok: false,
        error: error.message,
        fallback: this._fallbackPricingAnalysis(),
      };
    }
  }

  /**
   * Find Similar Contracts: Compare against database
   * Note: In production, this would use vector embeddings
   * For demo, using simpler text similarity
   */
  async findSimilarContracts(contractText, allContracts) {
    try {
      // Simple keyword-based similarity for demo
      // In production: Use embeddings API
      const keywords = this._extractKeywords(contractText);
      
      const similarities = allContracts
        .map(contract => ({
          contractId: contract._id,
          similarity: this._calculateSimilarity(keywords, contract.textContent),
          matchedFeatures: this._findMatchedFeatures(contractText, contract.textContent),
        }))
        .filter(s => s.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return {
        ok: true,
        data: similarities,
      };
      
    } catch (error) {
      console.error('Similar contract error:', error.message);
      return {
        ok: false,
        error: error.message,
        fallback: [],
      };
    }
  }

  // Helper Methods

  _parseAIResponse(text) {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract and fix common JSON issues
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      let jsonStr = jsonMatch[0];
      
      // Try parsing as-is first
      try {
        const parsed = JSON.parse(jsonStr);
        return this._validateAndFixParsedData(parsed);
      } catch (firstError) {
        // If that fails, try some fixes
        console.log('Initial parse failed, attempting fixes...');
        
        // Fix 1: Replace single quotes with double quotes (but be careful with apostrophes)
        jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');
        jsonStr = jsonStr.replace(/\{\s*'([^']*)'\s*:/g, '{"$1":');
        
        // Fix 2: Try to fix unescaped quotes in string values
        // This is a heuristic - look for quote followed by non-whitespace that isn't : or ,
        jsonStr = jsonStr.replace(/("description":\s*")([^"]*?)"/g, (match, prefix, content) => {
          // Escape internal quotes
          const escapedContent = content.replace(/"/g, '\\"');
          return prefix + escapedContent + '"';
        });
        
        try {
          const parsed = JSON.parse(jsonStr);
          return this._validateAndFixParsedData(parsed);
        } catch (secondError) {
          console.error('Second parse attempt failed:', secondError.message);
          throw new Error('Could not parse AI response as valid JSON: ' + secondError.message);
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      console.error('Raw text (first 1000 chars):', text.substring(0, 1000));
      throw new Error('Invalid AI response format: ' + error.message);
    }
  }
  
  _validateAndFixParsedData(parsed) {
    // Deep validation - ensure all nested data is properly parsed
    const validateAndParse = (obj) => {
      if (typeof obj === 'string') {
        // Try to parse if it looks like JSON
        if ((obj.startsWith('{') && obj.endsWith('}')) || 
            (obj.startsWith('[') && obj.endsWith(']'))) {
          try {
            return JSON.parse(obj.replace(/'/g, '"'));
          } catch (e) {
            return obj;
          }
        }
      }
      return obj;
    };
    
    // Validate and fix each field
    if (parsed.parties) parsed.parties = validateAndParse(parsed.parties);
    if (parsed.keyDates) parsed.keyDates = validateAndParse(parsed.keyDates);
    if (parsed.financialTerms) parsed.financialTerms = validateAndParse(parsed.financialTerms);
    if (parsed.clauses) parsed.clauses = validateAndParse(parsed.clauses);
    if (parsed.risks) parsed.risks = validateAndParse(parsed.risks);
    if (parsed.issues) parsed.issues = validateAndParse(parsed.issues);
    if (parsed.recommendations) parsed.recommendations = validateAndParse(parsed.recommendations);
    if (parsed.comparableTerms) parsed.comparableTerms = validateAndParse(parsed.comparableTerms);
    
    return parsed;
  }

  _extractKeywords(text) {
    // Simple keyword extraction for demo
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    const frequency = {};
    words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(e => e[0]);
  }

  _calculateSimilarity(keywords1, text2) {
    if (!text2) return 0;
    
    const text2Lower = text2.toLowerCase();
    const matches = keywords1.filter(k => text2Lower.includes(k)).length;
    return matches / keywords1.length;
  }

  _findMatchedFeatures(text1, text2) {
    const features = ['termination', 'payment', 'liability', 'confidentiality', 'indemnification'];
    return features.filter(f => text1.includes(f) && text2.includes(f));
  }

  // Fallback methods for resilience
  
  _fallbackExtraction() {
    return {
      parties: [],
      keyDates: [],
      financialTerms: [],
      clauses: [],
      confidence: 0,
      note: 'AI service unavailable - manual review required',
    };
  }

  _fallbackRiskAssessment() {
    return {
      riskLevel: 'medium',
      risks: [],
      overallAssessment: 'AI service unavailable - manual review recommended',
      confidence: 0,
    };
  }

  _fallbackCompliance() {
    return {
      complianceScore: 50,
      issues: [],
      recommendations: ['Manual compliance review recommended'],
      confidence: 0,
    };
  }

  _fallbackPricingAnalysis() {
    return {
      marketPosition: 'average',
      analysis: 'AI service unavailable',
      recommendations: ['Manual pricing review recommended'],
      comparableTerms: [],
      confidence: 0,
    };
  }
}

module.exports = new AIService();