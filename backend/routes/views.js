import express from 'express';
import auth from '../middleware/auth.js';
import View from '../models/View.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRoom from '../models/ChatRoom.js';
import ClientCommunication from '../models/ClientCommunication.js';
import ClientDocument from '../models/ClientDocument.js';
import Notification from '../models/Notification.js';
import { fieldDefinitions, computeField } from '../config/viewFieldDefinitions.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Settings from '../models/Settings.js';

const router = express.Router();

// Build a Mongo filter from simple config
function buildFilter(filters = []) {
  const query = {};
  for (const f of filters) {
    const { field, op = 'eq', value } = f;
    if (!field) continue;
    switch (op) {
      case 'eq':
        query[field] = value;
        break;
      case 'in':
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'ne':
        query[field] = { $ne: value };
        break;
      case 'gt':
        query[field] = { $gt: value };
        break;
      case 'gte':
        query[field] = { $gte: value };
        break;
      case 'lt':
        query[field] = { $lt: value };
        break;
      case 'lte':
        query[field] = { $lte: value };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          query[field] = { $gte: value[0], $lte: value[1] };
        }
        break;
      case 'regex':
        query[field] = { $regex: value, $options: 'i' };
        break;
      case 'exists':
        query[field] = { $exists: value === 'yes' || value === true };
        break;
      default:
        query[field] = value;
    }
  }
  return query;
}

// Get model for entity
function getModelForEntity(entity) {
  const models = {
    clients: Client,
    tasks: Task,
    invoices: Invoice,
    users: User,
    chat_messages: ChatMessage,
    chat_rooms: ChatRoom,
    communications: ClientCommunication,
    documents: ClientDocument,
    notifications: Notification,
  };
  return models[entity];
}

// Get firm field for entity
function getFirmFieldForEntity(entity) {
  const firmFields = {
    clients: 'firmId',
    tasks: 'firm',
    invoices: 'firm',
    users: 'firmId',
    chat_messages: null, // Cross-firm
    chat_rooms: null, // Cross-firm
    communications: 'firm',
    documents: 'firm',
    notifications: 'firm',
  };
  return firmFields[entity];
}

// GET /api/views/fields - Get all available fields for entities
router.get('/fields', auth, async (req, res) => {
  try {
    const { entity } = req.query;
    
    if (entity) {
      const fields = fieldDefinitions[entity] || [];
      return res.json({ success: true, data: fields });
    }
    
    // Return all entity fields
    res.json({ success: true, data: fieldDefinitions });
  } catch (err) {
    console.error('Get fields error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/views
router.get('/', auth, async (req, res) => {
  try {
    const { scope, entity } = req.query;
    const base = { firm: req.user.firmId._id };
    const scopeFilter = scope === 'team' || scope === 'public' ? { scope } : { $or: [
      { scope: 'public' },
      { owner: req.user._id },
      { scope: 'team' } // refine with team membership later
    ]};
    const entityFilter = entity ? { entity } : {};

    const views = await View.find({ ...base, ...scopeFilter, ...entityFilter })
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: views });
  } catch (err) {
    console.error('List views error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, scope = 'private', entity, config } = req.body;
    const view = await View.create({
      name,
      description,
      scope,
      entity,
      config: config || {},
      owner: req.user._id,
      firm: req.user.firmId._id,
    });
    res.status(201).json({ success: true, data: view });
  } catch (err) {
    console.error('Create view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/views/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Get view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/views/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await View.findOneAndUpdate(
      { _id: req.params.id, firm: req.user.firmId._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/views/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await View.findOneAndDelete({ _id: req.params.id, firm: req.user.firmId._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, message: 'View deleted' });
  } catch (err) {
    console.error('Delete view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views/:id/share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { scope, users = [], teams = [] } = req.body;
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });
    if (!['private', 'team', 'public'].includes(scope)) {
      return res.status(400).json({ success: false, message: 'Invalid scope' });
    }
    view.scope = scope;
    view.sharedWithUsers = users;
    view.sharedWithTeams = teams;
    await view.save();
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Share view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views/:id/run
router.post('/:id/run', auth, async (req, res) => {
  try {
    console.log('=== VIEW RUN DEBUG ===');
    console.log('View ID:', req.params.id);
    console.log('User firm ID:', req.user.firmId._id);
    
    const { page = 1, pageSize = 25 } = req.body || {};
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    console.log('Found view:', !!view);
    console.log('View entity:', view?.entity);
    console.log('View config:', JSON.stringify(view?.config, null, 2));
    
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });

    const filter = buildFilter(view.config?.filters || []);
    console.log('Built filter (before firm constraint):', JSON.stringify(filter, null, 2));
    
    const sort = {};
    const sortRules = view.config?.sort || [];
    for (const s of sortRules) {
      if (s?.field) sort[s.field] = s.direction === 'desc' ? -1 : 1;
    }

    const Model = getModelForEntity(view.entity);
    const firmField = getFirmFieldForEntity(view.entity);
    
    // Always constrain to firm if entity has firm field
    if (firmField) {
      filter[firmField] = req.user.firmId._id;
    }
    
    console.log('Final filter (after firm constraint):', JSON.stringify(filter, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    if (!Model) {
      console.log('No model found for entity:', view.entity);
      return res.status(400).json({ success: false, message: `Invalid entity type: ${view.entity}` });
    }

    console.log('Using model:', Model.modelName);
    const total = await Model.countDocuments(filter);
    console.log('Total count:', total);
    
    let rows = await Model.find(filter)
      .sort(Object.keys(sort).length ? sort : { updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean();
    
    // Populate references if needed
    if (view.entity === 'tasks' && rows.length) {
      rows = await Model.populate(rows, [
        { path: 'assignedTo', select: 'name email' },
        { path: 'clientId', select: 'name' }
      ]);
    }
    if (view.entity === 'invoices' && rows.length) {
      rows = await Model.populate(rows, { path: 'clientId', select: 'name email' });
    }
    if (view.entity === 'chat_messages' && rows.length) {
      rows = await Model.populate(rows, [
        { path: 'sender', select: 'name email' },
        { path: 'room', select: 'name type' }
      ]);
    }
      
    console.log('Returned rows count:', rows.length);
    
    // Add computed fields
    rows = rows.map(row => {
      const entity = view.entity;
      const fields = fieldDefinitions[entity] || [];
      const computedFields = fields.filter(f => f.type === 'computed');
      
      computedFields.forEach(cf => {
        row[cf.name] = computeField(entity, cf.computeFn, row);
      });
      
      return row;
    });
    
    console.log('=== END VIEW RUN DEBUG ===');

    res.json({ 
      success: true, 
      data: { 
        rows, 
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total },
        entity: view.entity,
        fieldDefinitions: fieldDefinitions[view.entity] || []
      } 
    });
  } catch (err) {
    console.error('Run view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/views/:id/export/csv - Export view data as CSV
router.get('/:id/export/csv', auth, async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });

    const filter = buildFilter(view.config?.filters || []);
    const Model = getModelForEntity(view.entity);
    const firmField = getFirmFieldForEntity(view.entity);
    
    if (firmField) filter[firmField] = req.user.firmId._id;
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid entity' });

    const sort = {};
    const sortRules = view.config?.sort || [];
    for (const s of sortRules) {
      if (s?.field) sort[s.field] = s.direction === 'desc' ? -1 : 1;
    }

    let rows = await Model.find(filter)
      .sort(Object.keys(sort).length ? sort : { updatedAt: -1 })
      .limit(10000) // Max export limit
      .lean();

    // Flatten rows for CSV
    const flatRows = rows.map(row => {
      const flatRow = { ...row };
      if (flatRow._id) flatRow._id = flatRow._id.toString();
      if (flatRow.firmId) flatRow.firmId = flatRow.firmId.toString();
      if (flatRow.firm) flatRow.firm = flatRow.firm.toString();
      return flatRow;
    });

    const fields = view.config?.columns?.length 
      ? view.config.columns 
      : Object.keys(flatRows[0] || {});
    
    const parser = new Parser({ fields });
    const csv = parser.parse(flatRows);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${view.name}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// GET /api/views/:id/export/excel - Export view data as Excel
router.get('/:id/export/excel', auth, async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });

    const filter = buildFilter(view.config?.filters || []);
    const Model = getModelForEntity(view.entity);
    const firmField = getFirmFieldForEntity(view.entity);
    
    if (firmField) filter[firmField] = req.user.firmId._id;
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid entity' });

    let rows = await Model.find(filter).limit(10000).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(view.name);

    // Get field definitions
    const fields = fieldDefinitions[view.entity] || [];
    const columns = fields.map(f => ({ header: f.label, key: f.name, width: 20 }));
    worksheet.columns = columns;

    // Add rows
    rows.forEach(row => {
      const rowData = {};
      fields.forEach(f => {
        let value = row[f.name];
        if (f.type === 'date' && value) value = new Date(value).toLocaleDateString();
        if (f.type === 'reference' && value && typeof value === 'object') {
          value = value.name || value._id;
        }
        if (f.type === 'computed') {
          value = computeField(view.entity, f.computeFn, row);
        }
        rowData[f.name] = value;
      });
      worksheet.addRow(rowData);
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="${view.name}-${Date.now()}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// GET /api/views/:id/export/pdf - Export view data as PDF with branding
router.get('/:id/export/pdf', auth, async (req, res) => {
  let doc;
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) {
      return res.status(404).json({ success: false, message: 'View not found' });
    }

    const settings = await Settings.findOne({ firm: req.user.firmId._id });
    const firmName = settings?.companyName || req.user.firmId.name || 'CA Firm';
    
    const filter = buildFilter(view.config?.filters || []);
    const Model = getModelForEntity(view.entity);
    const firmField = getFirmFieldForEntity(view.entity);
    
    if (firmField) filter[firmField] = req.user.firmId._id;
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid entity' });
    }

    let rows = await Model.find(filter).limit(1000).lean();

    // Create PDF document
    doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4', 
      bufferPages: true,
      autoFirstPage: true 
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${view.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', 0); // Will be calculated automatically
    
    // Pipe to response
    doc.pipe(res);

    // Header with branding
    doc.fontSize(20).fillColor('#4F46E5').text(firmName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#000').text(view.name, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Add table if we have fields
    const fields = fieldDefinitions[view.entity] || [];
    if (fields.length === 0) {
      doc.fontSize(12).fillColor('#000').text('No field definitions available for this entity.', { align: 'center' });
      doc.end();
      return;
    }

    const displayFields = fields.slice(0, 6); // Limit columns for PDF width
    
    // Table header
    doc.fontSize(10).fillColor('#000');
    let yPosition = doc.y;
    displayFields.forEach((field, i) => {
      doc.text(field.label, 50 + i * 90, yPosition, { width: 85, continued: false });
    });
    
    doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
    doc.moveDown(1);

    // Table rows
    const maxRows = Math.min(rows.length, 50);
    
    if (maxRows === 0) {
      doc.fontSize(10).fillColor('#666').text('No data to display', { align: 'center' });
    } else {
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = rows[rowIndex];
        
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        yPosition = doc.y;
        displayFields.forEach((field, i) => {
          let value = row[field.name];
          
          try {
            if (field.type === 'date' && value) {
              value = new Date(value).toLocaleDateString();
            } else if (field.type === 'reference' && value && typeof value === 'object') {
              value = value.name || value.email || String(value._id || '');
            } else if (field.type === 'computed' && field.computeFn) {
              value = computeField(view.entity, field.computeFn, row);
            }
            
            if (value === null || value === undefined || value === '') {
              value = '-';
            }
            
            // Convert to string safely and truncate if too long
            let strValue = '';
            try {
              strValue = String(value).substring(0, 50);
            } catch (e) {
              strValue = '-';
            }
            
            doc.fontSize(9).fillColor('#000').text(strValue, 50 + i * 90, yPosition, { 
              width: 85, 
              height: 20, 
              ellipsis: true,
              continued: false
            });
          } catch (fieldError) {
            console.error(`Error rendering field ${field.name}:`, fieldError);
            doc.fontSize(9).fillColor('#000').text('-', 50 + i * 90, yPosition, { 
              width: 85,
              continued: false 
            });
          }
        });
        doc.moveDown(0.8);
      }
    }

    // Footer
    doc.fontSize(8).fillColor('#999').text(
      `Total records: ${rows.length} | ${firmName}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
    
  } catch (err) {
    console.error('Export PDF error:', err);
    
    // If doc was created and piped, end it
    if (doc) {
      try {
        doc.end();
      } catch (e) {
        // Ignore if already ended
      }
    }
    
    // Only send JSON error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
    }
  }
});

// GET /api/views/:id/chart - Get chart data for visualization
router.get('/:id/chart', auth, async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });

    const { chartType = 'bar', xAxis, yAxis, groupBy, aggregation = 'count' } = req.query;
    
    const filter = buildFilter(view.config?.filters || []);
    const Model = getModelForEntity(view.entity);
    const firmField = getFirmFieldForEntity(view.entity);
    
    if (firmField) filter[firmField] = req.user.firmId._id;
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid entity' });

    let pipeline = [{ $match: filter }];

    if (groupBy) {
      // Group data for charts
      const groupStage = {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 }
        }
      };

      if (aggregation === 'sum' && yAxis) {
        groupStage.$group.value = { $sum: `$${yAxis}` };
      } else if (aggregation === 'avg' && yAxis) {
        groupStage.$group.value = { $avg: `$${yAxis}` };
      } else if (aggregation === 'min' && yAxis) {
        groupStage.$group.value = { $min: `$${yAxis}` };
      } else if (aggregation === 'max' && yAxis) {
        groupStage.$group.value = { $max: `$${yAxis}` };
      } else {
        groupStage.$group.value = { $sum: 1 };
      }

      pipeline.push(groupStage);
      pipeline.push({ $sort: { value: -1 } });
      pipeline.push({ $limit: 20 });
    }

    const results = await Model.aggregate(pipeline);

    const chartData = {
      labels: results.map(r => r._id || 'Unknown'),
      datasets: [{
        label: view.name,
        data: results.map(r => r.value || r.count),
        backgroundColor: [
          '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
        ]
      }]
    };

    res.json({ success: true, data: chartData, chartType });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ success: false, message: 'Chart generation failed' });
  }
});

export default router;
