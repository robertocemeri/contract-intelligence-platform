const express = require('express');
const { body, query, validationResult } = require('express-validator');
const contractService = require('../services/contractService');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

/**
 * Contract Routes
 * Following Selego principle: Consistent API responses { ok, data/error }
 */

// Validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/contracts/upload
 * Upload and create new contract
 */
router.post('/upload',
  uploadMiddleware,
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
  ],
  validate,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          error: 'No file uploaded',
        });
      }

      const result = await contractService.createContract(
        req.file,
        req.body.title
      );

      if (!result.ok) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        ok: false,
        error: 'Upload failed',
      });
    }
  }
);

/**
 * POST /api/contracts/:id/analyze
 * Trigger AI analysis for a contract
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await contractService.analyzeContract(req.params.id);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    res.json(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Analysis failed',
    });
  }
});

/**
 * GET /api/contracts
 * List all contracts with optional filters
 */
router.get('/',
  [
    query('status').optional().isIn(['pending', 'processing', 'analyzed', 'failed']),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        riskLevel: req.query.riskLevel,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      };

      const result = await contractService.listContracts(filters);

      if (!result.ok) {
        return res.status(400).json(result);
      }

      res.json(result);
      
    } catch (error) {
      console.error('List error:', error);
      res.status(500).json({
        ok: false,
        error: 'Failed to fetch contracts',
      });
    }
  }
);

/**
 * GET /api/contracts/:id
 * Get single contract with full analysis
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await contractService.getContract(req.params.id);

    if (!result.ok) {
      return res.status(404).json(result);
    }

    res.json(result);
    
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch contract',
    });
  }
});

/**
 * GET /api/contracts/stats/dashboard
 * Get dashboard statistics
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const result = await contractService.getDashboardStats();

    if (!result.ok) {
      return res.status(400).json(result);
    }

    res.json(result);
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * DELETE /api/contracts/:id
 * Delete contract and associated file
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await contractService.deleteContract(req.params.id);

    if (!result.ok) {
      return res.status(404).json(result);
    }

    res.json(result);
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to delete contract',
    });
  }
});

module.exports = router;