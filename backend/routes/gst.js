import express from 'express';
import gstService from '../services/gstService.js';

const router = express.Router();

// GET /api/gst/validate/:gstin - Validate GSTIN format
router.get('/validate/:gstin', async (req, res) => {
  try {
    const { gstin } = req.params;
    
    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    const isValid = gstService.validateGSTIN(gstin);
    const state = gstService.getStateFromGSTIN(gstin);

    res.json({
      success: true,
      data: {
        gstin,
        isValid,
        state,
        format: isValid ? 'Valid' : 'Invalid GSTIN format'
      }
    });
  } catch (error) {
    console.error('GST Validation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate GSTIN'
    });
  }
});

// POST /api/gst/lookup - Get GST filing status for current year
router.post('/lookup', async (req, res) => {
  try {
    const { gstin, fy = '2025' } = req.body;
    
    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    if (!gstService.validateGSTIN(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format'
      });
    }

    const result = await gstService.searchTaxpayerDetails(gstin, fy);
    
    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('GST Lookup Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup GST filing details'
    });
  }
});

// GET /api/gst/financial-years/:gstin - Get financial years for GSTIN
router.get('/financial-years/:gstin', async (req, res) => {
  try {
    const { gstin } = req.params;
    
    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    if (!gstService.validateGSTIN(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format'
      });
    }

    const result = await gstService.getFinancialYears(gstin);
    res.json(result);
  } catch (error) {
    console.error('GST Financial Years Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial years'
    });
  }
});

// POST /api/gst/filing-status - Get return filing details for specific year
router.post('/filing-status', async (req, res) => {
  try {
    const { gstin, fy } = req.body;
    
    if (!gstin || !fy) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN and financial year are required'
      });
    }

    if (!gstService.validateGSTIN(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format'
      });
    }

    const result = await gstService.getReturnDetails(gstin, fy);
    res.json(result);
  } catch (error) {
    console.error('GST Filing Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filing status'
    });
  }
});

// POST /api/gst/comprehensive - Get comprehensive GST information
router.post('/comprehensive', async (req, res) => {
  try {
    const { gstin, captcha = '000000' } = req.body;
    
    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    if (!gstService.validateGSTIN(gstin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GSTIN format'
      });
    }

    const result = await gstService.getComprehensiveGSTInfo(gstin, captcha);
    res.json(result);
  } catch (error) {
    console.error('GST Comprehensive Info Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comprehensive GST information'
    });
  }
});

export default router;