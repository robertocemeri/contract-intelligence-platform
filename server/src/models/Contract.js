const mongoose = require('mongoose');

/**
 * Contract Model
 * Following Selego principle: Flat data structures
 * Complex nested data is stored as separate documents or flattened
 */
const contractSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
  },
  
  fileName: {
    type: String,
    required: true,
  },
  
  filePath: {
    type: String,
    required: true,
  },
  
  fileType: {
    type: String,
    enum: ['pdf', 'text'],
    required: true,
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'analyzed', 'failed'],
    default: 'pending',
  },
  
  // Extracted Content
  textContent: {
    type: String,
    required: false,
  },
  
  // AI Analysis Results - Stored flat, not nested
  // Contract Intelligence (Option A)
  parties: [{
    name: String,
    role: String, // e.g., 'provider', 'client'
  }],
  
  keyDates: [{
    dateType: String, // e.g., 'effective', 'expiration', 'renewal'
    date: Date,
    description: String,
  }],
  
  financialTerms: [{
    type: { type: String }, // Notice: using {type: String} instead of just String to avoid conflict with Mongoose's 'type' keyword
    amount: Number,
    currency: String,
    description: String,
  }],
  
  clauses: [{
    clauseType: String, // e.g., 'termination', 'confidentiality', 'liability'
    content: String,
    importance: String, // 'high', 'medium', 'low'
  }],
  
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  
  risks: [{
    category: String,
    severity: String,
    description: String,
    recommendation: String,
  }],
  
  // Compliance
  complianceScore: Number, // 0-100
  
  complianceIssues: [{
    standard: String,
    issue: String,
    severity: String,
  }],
  
  // Smart Recommendations (Option B)
  similarContracts: [{
    contractId: mongoose.Schema.Types.ObjectId,
    similarity: Number, // 0-1
    matchedFeatures: [String],
  }],
  
  pricingAnalysis: {
    marketPosition: String, // 'favorable', 'average', 'unfavorable'
    recommendations: [String],
    comparableTerms: [String],
  },
  
  // AI Processing Metadata
  aiAnalysisDate: Date,
  aiConfidenceScore: Number, // Overall confidence 0-1
  aiProcessingTime: Number, // milliseconds
  
  // Error tracking
  lastError: String,
  errorCount: {
    type: Number,
    default: 0,
  },
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for performance
contractSchema.index({ status: 1 });
contractSchema.index({ riskLevel: 1 });
contractSchema.index({ 'keyDates.date': 1 });
contractSchema.index({ createdAt: -1 });

// Virtual for upcoming deadlines
contractSchema.virtual('upcomingDeadlines').get(function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return this.keyDates.filter(kd => {
    return kd.date > now && kd.date <= thirtyDaysFromNow;
  });
});

module.exports = mongoose.model('Contract', contractSchema);