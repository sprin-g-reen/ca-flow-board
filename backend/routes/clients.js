import express from 'express';
import Client from '../models/Client.js';
import auth from '../middleware/auth.js';
import gstService from '../services/gstService.js';

const router = express.Router();

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { 
      firmId: req.user.firmId, 
      isDeleted: false 
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { cinNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Client.countDocuments(query);

    res.json({
      success: true,
      data: clients,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      firmId: req.user.firmId,
      isDeleted: false
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error.message
    });
  }
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      firmId: req.user.firmId,
      createdBy: req.user._id
    };

    // Map frontend field names to backend field names
    if (clientData.contact_person) {
      clientData.contactPerson = clientData.contact_person;
      delete clientData.contact_person;
    }
    if (clientData.billing_address) {
      clientData.billingAddress = clientData.billing_address;
      delete clientData.billing_address;
    }
    if (clientData.shipping_address) {
      clientData.shippingAddress = clientData.shipping_address;
      delete clientData.shipping_address;
    }
    if (clientData.company_registration_number) {
      clientData.companyRegistrationNumber = clientData.company_registration_number;
      delete clientData.company_registration_number;
    }
    if (clientData.gst_number) {
      clientData.gstNumber = clientData.gst_number;
      delete clientData.gst_number;
    }
    if (clientData.pan_number) {
      clientData.panNumber = clientData.pan_number;
      delete clientData.pan_number;
    }
    if (clientData.business_type) {
      clientData.businessType = clientData.business_type;
      delete clientData.business_type;
    }
    if (clientData.payment_terms) {
      clientData.paymentTerms = clientData.payment_terms;
      delete clientData.payment_terms;
    }
    if (clientData.credit_limit) {
      clientData.creditLimit = clientData.credit_limit;
      delete clientData.credit_limit;
    }

    // Normalize status to lowercase (if provided)
    if (clientData.status && typeof clientData.status === 'string') {
      clientData.status = clientData.status.toLowerCase();
    }

    console.log('Creating client with processed data:', clientData);

    const client = new Client(clientData);
    await client.save();

    // Fetch GST/CIN data if provided
    if (client.gstNumber) {
      await client.fetchGSTData();
    }
    if (client.cinNumber) {
      await client.fetchCINData();
    }

    // Populate created client
    await client.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Create client error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email or GST number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error.message
    });
  }
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Map frontend field names to backend field names
    if (updateData.contact_person) {
      updateData.contactPerson = updateData.contact_person;
      delete updateData.contact_person;
    }
    if (updateData.billing_address) {
      updateData.billingAddress = updateData.billing_address;
      delete updateData.billing_address;
    }
    if (updateData.shipping_address) {
      updateData.shippingAddress = updateData.shipping_address;
      delete updateData.shipping_address;
    }
    if (updateData.company_registration_number) {
      updateData.companyRegistrationNumber = updateData.company_registration_number;
      delete updateData.company_registration_number;
    }
    if (updateData.gst_number) {
      updateData.gstNumber = updateData.gst_number;
      delete updateData.gst_number;
    }
    if (updateData.pan_number) {
      updateData.panNumber = updateData.pan_number;
      delete updateData.pan_number;
    }
    if (updateData.business_type) {
      updateData.businessType = updateData.business_type;
      delete updateData.business_type;
    }
    if (updateData.payment_terms) {
      updateData.paymentTerms = updateData.payment_terms;
      delete updateData.payment_terms;
    }
    if (updateData.credit_limit) {
      updateData.creditLimit = updateData.credit_limit;
      delete updateData.credit_limit;
    }

    // Normalize status to lowercase (if provided)
    if (updateData.status && typeof updateData.status === 'string') {
      updateData.status = updateData.status.toLowerCase();
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        firmId: req.user.firmId,
        isDeleted: false
      },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Fetch updated GST/CIN data if numbers were changed
    if (updateData.gstNumber && updateData.gstNumber !== client.gstNumber) {
      await client.fetchGSTData();
    }
    if (updateData.cinNumber && updateData.cinNumber !== client.cinNumber) {
      await client.fetchCINData();
    }

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message
    });
  }
});

// @desc    Delete client (soft delete - moves to recycle bin)
// @route   DELETE /api/clients/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        firmId: req.user.firmId,
        isDeleted: false
      },
      { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client moved to recycle bin'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message
    });
  }
});

// @desc    Lookup company by GST number
// @route   POST /api/clients/lookup/gst
// @access  Private
router.post('/lookup/gst', auth, async (req, res) => {
  try {
    const { gstNumber } = req.body;

    if (!gstNumber) {
      return res.status(400).json({
        success: false,
        message: 'GST number is required'
      });
    }

    // Validate GST number format
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST number format'
      });
    }

    // Check if client already exists with this GST number
    const existingClient = await Client.findOne({
      gstNumber: gstNumber.toUpperCase(),
      firmId: req.user.firmId,
      isDeleted: false
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Client with this GST number already exists',
        data: existingClient
      });
    }

    // Integrate with actual GST API using gstService
    try {
      const gstResult = await gstService.getComprehensiveGSTInfo(gstNumber.toUpperCase());
      
      if (gstResult.success && gstResult.data && gstResult.data.taxpayerDetails) {
        const taxpayerDetails = gstResult.data.taxpayerDetails;
        
        // Format the data to match frontend expectations
        const formattedGSTData = {
          gstNumber: gstNumber.toUpperCase(),
          legalName: taxpayerDetails.lgnm || taxpayerDetails.company_name || 'Unknown Company',
          tradeName: taxpayerDetails.tradeNam || taxpayerDetails.lgnm || 'Unknown Company',
          name: taxpayerDetails.lgnm || taxpayerDetails.company_name || 'Unknown Company',
          registrationDate: taxpayerDetails.rgdt || 'Unknown',
          status: (taxpayerDetails.sts || 'active').toLowerCase(),
          businessType: taxpayerDetails.ctb || 'Private Limited Company',
          stateCode: gstNumber.substring(0, 2),
          address: taxpayerDetails.pradr?.adr || taxpayerDetails.address || 'Address not available',
          filingFrequency: 'Monthly',
          panNumber: gstNumber.substring(2, 12),
          // Additional fields from GST API
          ctj: taxpayerDetails.ctj,
          stj: taxpayerDetails.stj,
          dty: taxpayerDetails.dty,
          nba: taxpayerDetails.nba,
          industry: taxpayerDetails.nba?.[0] || 'General Business'
        };

        res.json({
          success: true,
          data: formattedGSTData,
          message: 'GST data retrieved successfully from government database'
        });
      } else {
        // If GST service fails, return a basic response with GST structure
        const basicGSTData = {
          gstNumber: gstNumber.toUpperCase(),
          legalName: `Company with GST: ${gstNumber.toUpperCase()}`,
          tradeName: `Company with GST: ${gstNumber.toUpperCase()}`,
          name: `Company with GST: ${gstNumber.toUpperCase()}`,
          registrationDate: 'Unknown',
          status: 'active',
          businessType: 'Private Limited Company',
          stateCode: gstNumber.substring(0, 2),
          address: 'Address to be updated',
          filingFrequency: 'Monthly',
          panNumber: gstNumber.substring(2, 12),
          industry: 'General Business'
        };

        res.json({
          success: true,
          data: basicGSTData,
          message: 'GST number validated - company details to be updated manually'
        });
      }
    } catch (gstError) {
      console.error('GST API Error:', gstError);
      
      // Fallback response if GST service fails
      const fallbackGSTData = {
        gstNumber: gstNumber.toUpperCase(),
        legalName: `Company with GST: ${gstNumber.toUpperCase()}`,
        tradeName: `Company with GST: ${gstNumber.toUpperCase()}`,
        name: `Company with GST: ${gstNumber.toUpperCase()}`,
        registrationDate: 'Unknown',
        status: 'active',
        businessType: 'Private Limited Company',
        stateCode: gstNumber.substring(0, 2),
        address: 'Address to be updated',
        filingFrequency: 'Monthly',
        panNumber: gstNumber.substring(2, 12),
        industry: 'General Business'
      };

      res.json({
        success: true,
        data: fallbackGSTData,
        message: 'GST number validated - external API unavailable, company details to be updated manually'
      });
    }
  } catch (error) {
    console.error('GST lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup GST data',
      error: error.message
    });
  }
});

// @desc    Lookup company by CIN number
// @route   POST /api/clients/lookup/cin
// @access  Private
router.post('/lookup/cin', auth, async (req, res) => {
  try {
    const { cinNumber } = req.body;

    if (!cinNumber) {
      return res.status(400).json({
        success: false,
        message: 'CIN number is required'
      });
    }

    // Validate CIN number format
    const cinPattern = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
    if (!cinPattern.test(cinNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CIN number format'
      });
    }

    // Check if client already exists with this CIN number
    const existingClient = await Client.findOne({
      cinNumber: cinNumber.toUpperCase(),
      firmId: req.user.firmId,
      isDeleted: false
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Client with this CIN number already exists',
        data: existingClient
      });
    }

    // TODO: Integrate with actual MCA API
    // For now, returning mock data
    const mockCINData = {
      cinNumber: cinNumber.toUpperCase(),
      registeredName: 'Sample Company Private Limited',
      registrationDate: '2020-01-15',
      status: 'active',
      address: '123, Corporate District, Sample City, Sample State - 123456',
      directors: [
        {
          name: 'John Doe',
          din: 'DIN12345678',
          designation: 'Director'
        }
      ],
      authorizedCapital: 1000000,
      paidUpCapital: 500000,
      businessActivity: 'Software Development'
    };

    res.json({
      success: true,
      data: mockCINData,
      message: 'CIN data retrieved successfully'
    });
  } catch (error) {
    console.error('CIN lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup CIN data',
      error: error.message
    });
  }
});

// @desc    Bulk import clients
// @route   POST /api/clients/bulk-import
// @access  Private
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { clients: clientsData } = req.body;

    if (!clientsData || !Array.isArray(clientsData) || clientsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No client data provided for import'
      });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const clientData of clientsData) {
      try {
        // Check for duplicates by GST number or email
        const existingClient = await Client.findOne({
          firmId: req.user.firmId,
          isDeleted: false,
          $or: [
            { gstNumber: clientData.gst_number || clientData.gstNumber },
            { email: clientData.email }
          ].filter(condition => Object.values(condition)[0]) // Remove empty conditions
        });

        if (existingClient) {
          results.duplicates.push({
            data: clientData,
            reason: 'Client with same GST number or email already exists',
            existing: {
              id: existingClient._id,
              name: existingClient.name,
              gstNumber: existingClient.gstNumber,
              email: existingClient.email
            }
          });
          continue;
        }

        // Prepare client data with proper field mapping
        const processedData = {
          ...clientData,
          firmId: req.user.firmId,
          createdBy: req.user._id
        };

        // Map frontend field names to backend field names
        const fieldMappings = {
          contact_person: 'contactPerson',
          billing_address: 'billingAddress',
          shipping_address: 'shippingAddress',
          company_registration_number: 'companyRegistrationNumber',
          gst_number: 'gstNumber',
          pan_number: 'panNumber',
          business_type: 'businessType',
          payment_terms: 'paymentTerms',
          credit_limit: 'creditLimit'
        };

        Object.keys(fieldMappings).forEach(frontendField => {
          if (processedData[frontendField]) {
            processedData[fieldMappings[frontendField]] = processedData[frontendField];
            delete processedData[frontendField];
          }
        });

        // Normalize status to lowercase (if provided)
        if (processedData.status && typeof processedData.status === 'string') {
          processedData.status = processedData.status.toLowerCase();
        }

        // Convert numeric fields to proper types
        if (processedData.paymentTerms) {
          processedData.paymentTerms = parseInt(processedData.paymentTerms) || 30;
        }
        if (processedData.creditLimit) {
          processedData.creditLimit = parseFloat(processedData.creditLimit) || 0;
        }

        // Ensure uppercase for certain fields
        if (processedData.gstNumber) {
          processedData.gstNumber = processedData.gstNumber.toString().toUpperCase().trim();
        }
        if (processedData.panNumber) {
          processedData.panNumber = processedData.panNumber.toString().toUpperCase().trim();
        }
        if (processedData.cinNumber) {
          processedData.cinNumber = processedData.cinNumber.toString().toUpperCase().trim();
        }

        // Create and save client
        const client = new Client(processedData);
        await client.save();

        // Fetch GST/CIN data if provided
        if (client.gstNumber) {
          try {
            await client.fetchGSTData();
          } catch (gstError) {
            console.warn(`Failed to fetch GST data for client ${client.name}:`, gstError.message);
          }
        }
        if (client.cinNumber) {
          try {
            await client.fetchCINData();
          } catch (cinError) {
            console.warn(`Failed to fetch CIN data for client ${client.name}:`, cinError.message);
          }
        }

        // Re-save with GST/CIN data
        await client.save();

        results.successful.push({
          id: client._id,
          name: client.name,
          gstNumber: client.gstNumber,
          email: client.email
        });

      } catch (error) {
        console.error(`Failed to import client ${clientData.name}:`, error);
        results.failed.push({
          data: clientData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates.`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk import',
      error: error.message
    });
  }
});

// @desc    Bulk delete clients (soft delete - moves to recycle bin)
// @route   POST /api/clients/bulk-delete
// @access  Private
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { clientIds } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No client IDs provided'
      });
    }

    const result = await Client.updateMany(
      {
        _id: { $in: clientIds },
        firmId: req.user.firmId,
        isDeleted: false
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `Successfully moved ${result.modifiedCount} clients to recycle bin`,
      data: {
        deletedCount: result.modifiedCount,
        totalRequested: clientIds.length
      }
    });
  } catch (error) {
    console.error('Bulk delete clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete clients',
      error: error.message
    });
  }
});

// @desc    Bulk update client status
// @route   POST /api/clients/bulk-status
// @access  Private
router.post('/bulk-status', auth, async (req, res) => {
  try {
    const { clientIds, status } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No client IDs provided'
      });
    }

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const result = await Client.updateMany(
      {
        _id: { $in: clientIds },
        firmId: req.user.firmId,
        isDeleted: false
      },
      {
        status: status,
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `Successfully updated status for ${result.modifiedCount} clients`,
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: clientIds.length,
        newStatus: status
      }
    });
  } catch (error) {
    console.error('Bulk update client status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client status',
      error: error.message
    });
  }
});

// @desc    Bulk archive clients
// @route   POST /api/clients/bulk-archive
// @access  Private
router.post('/bulk-archive', auth, async (req, res) => {
  try {
    const { clientIds, archived = true } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No client IDs provided'
      });
    }

    const result = await Client.updateMany(
      {
        _id: { $in: clientIds },
        firmId: req.user.firmId,
        isDeleted: false
      },
      {
        archived: archived,
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `Successfully ${archived ? 'archived' : 'unarchived'} ${result.modifiedCount} clients`,
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: clientIds.length,
        archived: archived
      }
    });
  } catch (error) {
    console.error('Bulk archive clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive clients',
      error: error.message
    });
  }
});

export default router;