const Contract = require('../models/Contract');
const aiService = require('./aiService');
const emailService = require('./emailService');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

/**
 * Contract Service - Business Logic Layer
 * Following Selego principles: Service layer separation, early returns
 */

class ContractService {
  /**
   * Create new contract and extract text
   */
  async createContract(fileData, title) {
    try {
      // Extract text from file
      const textContent = await this._extractText(fileData);
      
      if (!textContent || textContent.trim().length === 0) {
        return {
          ok: false,
          error: 'Could not extract text from file',
        };
      }

      // Create contract document
      const contract = new Contract({
        title: title || fileData.originalname,
        fileName: fileData.originalname,
        filePath: fileData.path,
        fileType: fileData.mimetype === 'application/pdf' ? 'pdf' : 'text',
        textContent,
        status: 'pending',
      });

      await contract.save();

      return {
        ok: true,
        data: contract,
      };
      
    } catch (error) {
      console.error('Create contract error:', error);
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze contract with AI - Main orchestration method
   * This is where we combine multiple AI features
   */
  async analyzeContract(contractId) {
    try {
      const contract = await Contract.findById(contractId);
      
      if (!contract) {
        return {
          ok: false,
          error: 'Contract not found',
        };
      }

      if (!contract.textContent) {
        return {
          ok: false,
          error: 'Contract has no text content',
        };
      }

      // Update status
      contract.status = 'processing';
      await contract.save();

      const startTime = Date.now();

      // Step 1: Extract Contract Intelligence
      const intelligenceResult = await aiService.extractContractIntelligence(
        contract.textContent,
        contract.title
      );

      if (!intelligenceResult.ok) {
        return this._handleAnalysisError(contract, intelligenceResult.error);
      }

      const intelligence = intelligenceResult.data;
      
      // Debug logging
      console.log('Intelligence data received:', {
        partiesType: typeof intelligence.parties,
        partiesIsArray: Array.isArray(intelligence.parties),
        financialTermsType: typeof intelligence.financialTerms,
        financialTermsIsArray: Array.isArray(intelligence.financialTerms),
        financialTermsLength: intelligence.financialTerms?.length,
        financialTermsFirstItem: intelligence.financialTerms?.[0],
      });

      // Update contract with extracted data - directly assign arrays, don't spread
      // Use set() method to avoid validation issues during assignment
      try {
        if (Array.isArray(intelligence.parties) && intelligence.parties.length > 0) {
          contract.set('parties', intelligence.parties);
          contract.markModified('parties');
        }
        
        if (Array.isArray(intelligence.keyDates) && intelligence.keyDates.length > 0) {
          contract.set('keyDates', intelligence.keyDates);
          contract.markModified('keyDates');
        }
        
        if (Array.isArray(intelligence.financialTerms) && intelligence.financialTerms.length > 0) {
          console.log('Setting financialTerms with', intelligence.financialTerms.length, 'items');
          contract.set('financialTerms', intelligence.financialTerms);
          contract.markModified('financialTerms');
          console.log('After set - contract.financialTerms:', contract.get('financialTerms'));
        }
        
        if (Array.isArray(intelligence.clauses) && intelligence.clauses.length > 0) {
          contract.set('clauses', intelligence.clauses);
          contract.markModified('clauses');
        }
      } catch (assignError) {
        console.error('Error during assignment:', assignError);
        throw assignError;
      }
      
      console.log('After all assignments - contract.financialTerms type:', typeof contract.financialTerms);
      console.log('After all assignments - contract.financialTerms isArray:', Array.isArray(contract.financialTerms));
      console.log('After all assignments - contract.financialTerms length:', contract.financialTerms?.length);

      // Step 2: Risk Assessment
      const riskResult = await aiService.assessRisks(
        contract.textContent,
        intelligence
      );

      if (riskResult.ok) {
        contract.riskLevel = riskResult.data.riskLevel;
        contract.risks = Array.isArray(riskResult.data.risks) ? riskResult.data.risks : [];
      }

      // Step 3: Compliance Check
      const complianceResult = await aiService.checkCompliance(
        contract.textContent,
        intelligence
      );

      if (complianceResult.ok) {
        contract.complianceScore = complianceResult.data.complianceScore;
        contract.complianceIssues = Array.isArray(complianceResult.data.issues) ? complianceResult.data.issues : [];
      }

      // Step 4: Pricing Analysis
      if (contract.financialTerms && contract.financialTerms.length > 0) {
        const pricingResult = await aiService.analyzePricing(
          contract.textContent,
          contract.financialTerms
        );

        if (pricingResult.ok) {
          contract.pricingAnalysis = {
            marketPosition: pricingResult.data.marketPosition,
            recommendations: pricingResult.data.recommendations || [],
            comparableTerms: pricingResult.data.comparableTerms || [],
          };
        }
      }

      // Step 5: Find Similar Contracts
      const otherContracts = await Contract.find({
        _id: { $ne: contractId },
        textContent: { $exists: true, $ne: null },
      }).limit(50);

      const similarityResult = await aiService.findSimilarContracts(
        contract.textContent,
        otherContracts
      );

      if (similarityResult.ok) {
        contract.similarContracts = similarityResult.data;
      }

      // Finalize
      const processingTime = Date.now() - startTime;
      contract.aiAnalysisDate = new Date();
      contract.aiProcessingTime = processingTime;
      contract.aiConfidenceScore = this._calculateOverallConfidence(
        { confidence: intelligence.confidence || 0 }, 
        riskResult, 
        complianceResult
      );
      contract.status = 'analyzed';
      contract.errorCount = 0;
      contract.lastError = null;

      console.log('Before save - financialTerms:', JSON.stringify(contract.financialTerms).substring(0, 200));
      
      await contract.save();

      // Check for upcoming deadlines and send alerts
      this._checkDeadlinesAndAlert(contract);

      return {
        ok: true,
        data: contract,
      };
      
    } catch (error) {
      console.error('Analyze contract error:', error);
      
      // Update contract with error
      const contract = await Contract.findById(contractId);
      if (contract) {
        return this._handleAnalysisError(contract, error.message);
      }
      
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Get single contract with all analysis
   */
  async getContract(contractId) {
    try {
      const contract = await Contract.findById(contractId);
      
      if (!contract) {
        return {
          ok: false,
          error: 'Contract not found',
        };
      }

      return {
        ok: true,
        data: contract,
      };
      
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * List all contracts with filtering
   */
  async listContracts(filters = {}) {
    try {
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.riskLevel) {
        query.riskLevel = filters.riskLevel;
      }

      const contracts = await Contract.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100);

      return {
        ok: true,
        data: contracts,
      };
      
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [total, analyzed, highRisk, upcomingDeadlines] = await Promise.all([
        Contract.countDocuments(),
        Contract.countDocuments({ status: 'analyzed' }),
        Contract.countDocuments({ riskLevel: { $in: ['high', 'critical'] } }),
        this._getUpcomingDeadlines(),
      ]);

      const avgCompliance = await Contract.aggregate([
        { $match: { complianceScore: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$complianceScore' } } },
      ]);

      return {
        ok: true,
        data: {
          totalContracts: total,
          analyzedContracts: analyzed,
          highRiskContracts: highRisk,
          avgComplianceScore: avgCompliance[0]?.avg || 0,
          upcomingDeadlines: upcomingDeadlines.length,
        },
      };
      
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete contract and associated file
   */
  async deleteContract(contractId) {
    try {
      const contract = await Contract.findById(contractId);
      
      if (!contract) {
        return {
          ok: false,
          error: 'Contract not found',
        };
      }

      // Delete file
      try {
        await fs.unlink(contract.filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError.message);
        // Continue even if file deletion fails
      }

      await Contract.findByIdAndDelete(contractId);

      return {
        ok: true,
        data: { deleted: true },
      };
      
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  // Private Helper Methods

  async _extractText(fileData) {
    try {
      if (fileData.mimetype === 'application/pdf') {
        const dataBuffer = await fs.readFile(fileData.path);
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text;
      }
      
      // Plain text file
      return await fs.readFile(fileData.path, 'utf-8');
      
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  async _handleAnalysisError(contract, errorMessage) {
    contract.status = 'failed';
    contract.lastError = errorMessage;
    contract.errorCount += 1;
    await contract.save();

    return {
      ok: false,
      error: errorMessage,
      data: contract,
    };
  }

  _calculateOverallConfidence(intelligence, riskResult, complianceResult) {
    const confidences = [
      typeof intelligence.confidence === 'number' ? intelligence.confidence : 0,
      riskResult.ok && riskResult.data.confidence ? riskResult.data.confidence : 0,
      complianceResult.ok && complianceResult.data.confidence ? complianceResult.data.confidence : 0,
    ];

    const validConfidences = confidences.filter(c => c > 0);
    if (validConfidences.length === 0) return 0;
    
    return validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length;
  }

  async _getUpcomingDeadlines() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contracts = await Contract.find({
      'keyDates.date': {
        $gte: now,
        $lte: thirtyDaysFromNow,
      },
    });

    const deadlines = [];
    contracts.forEach(contract => {
      contract.keyDates.forEach(kd => {
        if (kd.date >= now && kd.date <= thirtyDaysFromNow) {
          deadlines.push({
            contractId: contract._id,
            contractTitle: contract.title,
            dateType: kd.dateType,
            date: kd.date,
            description: kd.description,
          });
        }
      });
    });

    return deadlines.sort((a, b) => a.date - b.date);
  }

  async _checkDeadlinesAndAlert(contract) {
    const upcomingDeadlines = contract.keyDates.filter(kd => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return kd.date >= now && kd.date <= thirtyDaysFromNow;
    });

    if (upcomingDeadlines.length > 0) {
      // Send email alert (async, don't wait)
      emailService.sendDeadlineAlert(contract, upcomingDeadlines)
        .catch(err => console.error('Email alert error:', err.message));
    }
  }
}

module.exports = new ContractService();