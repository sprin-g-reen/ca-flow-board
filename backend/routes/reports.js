import express from 'express';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import gstService from '../services/gstService.js';

// Helper: robust parse of possible filing date formats (DD/MM/YYYY, YYYY-MM-DD, or timestamps)
function parseFilingDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === 'string') {
    // Try ISO first
    let d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
    // Try DD/MM/YYYY
    const dm = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dm) {
      const [_, dd, mm, yyyy] = dm;
      d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      return isNaN(d.getTime()) ? null : d;
    }
    // Try YYYY/MM/DD
    const ym = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (ym) {
      const [_, yyyy, mm, dd] = ym;
      d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

const router = express.Router();

// GET /api/reports/gst - Get GST reports (monthly, quarterly, annual)
router.get('/gst', auth, authorize('owner', 'superadmin'), async (req, res) => {
  try {
    const {
      reportType = 'monthly',
      month,
      year,
      quarter,
      filterMonth,
      filterGstStatus,
      filterClient,
      filterReturnType, // e.g. GSTR1, GSTR3B, GSTR9
      filterReturnStatus, // Filed, Partial, Pending, Unknown
      sortBy = 'createdAt',
      sortOrder = 'desc',
      sortReturnType, // if provided, sort by status of this return type
      page = 1,
      pageSize = 10
    } = req.query;

    // Extract firmId properly - it might be an object or a string
    const firmId = req.user.firmId?._id || req.user.firmId;
    
    // Build filter query
    const filter = { firm: firmId };
    
    // Date range filter based on report type
    let startDate, endDate;
    
    if (reportType === 'monthly') {
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Year and month are required for monthly reports'
        });
      }
      
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    } else if (reportType === 'quarterly') {
      if (!year || !quarter) {
        return res.status(400).json({
          success: false,
          message: 'Year and quarter are required for quarterly reports'
        });
      }
      
      const yearNum = parseInt(year);
      const quarterMap = {
        'Q1': { start: 3, end: 5 },   // Apr-Jun
        'Q2': { start: 6, end: 8 },   // Jul-Sep
        'Q3': { start: 9, end: 11 },  // Oct-Dec
        'Q4': { start: 0, end: 2 }    // Jan-Mar (next year)
      };
      
      const q = quarterMap[quarter];
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quarter. Use Q1, Q2, Q3, or Q4'
        });
      }
      
      if (quarter === 'Q4') {
        // Q4 spans two calendar years (Jan-Mar of next year)
        startDate = new Date(yearNum + 1, 0, 1);
        endDate = new Date(yearNum + 1, 2, 31, 23, 59, 59);
      } else {
        startDate = new Date(yearNum, q.start, 1);
        endDate = new Date(yearNum, q.end + 1, 0, 23, 59, 59);
      }
    } else if (reportType === 'annual') {
      if (!year) {
        return res.status(400).json({
          success: false,
          message: 'Year is required for annual reports'
        });
      }
      
      const yearNum = parseInt(year);
      // Financial year: April to March
      startDate = new Date(yearNum, 3, 1); // April 1
      endDate = new Date(yearNum + 1, 2, 31, 23, 59, 59); // March 31 next year
    }
    
  // Apply date filter
    filter.createdAt = { $gte: startDate, $lte: endDate };
    
    // Additional filters
    if (filterMonth) {
      const filterMonthNum = parseInt(filterMonth);
      const filterYear = parseInt(year);
      filter.createdAt = {
        $gte: new Date(filterYear, filterMonthNum - 1, 1),
        $lte: new Date(filterYear, filterMonthNum, 0, 23, 59, 59)
      };
    }
    
    if (filterClient) {
      filter.client = filterClient;
    }
    
    // Build client filter (Client schema uses firmId)
    const clientFilter = { 
      $or: [
        { firmId: firmId },
        { firmId: { $exists: false } }, // Include clients without firmId field (legacy data)
        { firmId: null } // Include clients with null firmId
      ]
    };
    
    if (filterGstStatus && filterGstStatus !== 'all') {
      clientFilter.gstStatus = filterGstStatus;
    }
    
    console.log('GST Report Debug:', {
      firmId,
      clientFilter,
      reportType,
      year,
      month,
      startDate,
      endDate
    });
    
    // Get all clients for the firm
    const clients = await Client.find(clientFilter)
      .select('name gstNumber status firmId')
      .lean();
    
    console.log('Clients found:', clients.length);
    if (clients.length > 0) {
      console.log('Sample client:', clients[0]);
    }
    
    // Also check total clients in database
  const allClients = await Client.find({}).select('name firmId').limit(3).lean();
    console.log('Total clients in DB (sample):', allClients.length);
    if (allClients.length > 0) {
      console.log('Sample client from DB:', allClients[0]);
    }
    
    // For each client, get invoices in the period
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // Apply pagination to clients
    const paginatedClients = clients.slice(skip, skip + limit);
    
    // Compute financial year start for GST filing API based on startDate (FY: Apr-Mar)
    const startMonthIndex = startDate.getMonth(); // 0 = Jan
    const fyStartYear = startMonthIndex >= 3 ? startDate.getFullYear() : startDate.getFullYear() - 1;

    // Determine months covered by the selected period for mapping to GST API records
    const periodMonths = (() => {
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      if (reportType === 'monthly') {
        return [monthNames[startDate.getMonth()]];
      } else if (reportType === 'quarterly') {
        const m = startDate.getMonth();
        return [monthNames[m], monthNames[m + 1], monthNames[m + 2]];
      } else {
        // Annual: Apr to Mar
        return ['April','May','June','July','August','September','October','November','December','January','February','March'];
      }
    })();

    // Cache GSTIN filing data per request to avoid duplicate calls
    const gstinFilingCache = new Map();

  let items = await Promise.all(paginatedClients.map(async (client) => {
      // Get invoices for this client in the period
      const clientInvoices = await Invoice.find({
        ...filter,
        client: client._id
      }).lean();
      
      // Calculate totals
      let totalAmount = 0;
      let taxAmount = 0;
      let totalWithTax = 0;
      let hasPaid = false;
      let invoiceRaised = false;
      let quoteRaised = false;
      let latestInvoice = null;
      
      if (clientInvoices.length > 0) {
        clientInvoices.forEach(invoice => {
          const subtotal = invoice.subtotal || 0;
          const tax = invoice.tax || 0;
          const total = invoice.total || subtotal + tax;
          
          totalAmount += subtotal;
          taxAmount += tax;
          totalWithTax += total;
          
          if (invoice.status === 'paid') hasPaid = true;
          if (invoice.status !== 'draft') invoiceRaised = true;
          if (invoice.status === 'draft' || invoice.status === 'pending') quoteRaised = true;
        });
        
        // Get the latest invoice for additional details
        latestInvoice = clientInvoices.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      }
      
      const monthName = startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      // Fetch GST return filing status using gstService for this client's GSTIN
      let gstReturnStatuses = [];
      let gstTypes = [];
      try {
  const gstin = (client.gstNumber || '').toString().trim();
        const isValidGSTIN = gstService.validateGSTIN(gstin);
        if (isValidGSTIN) {
          let filingData;
          if (gstinFilingCache.has(gstin)) {
            filingData = gstinFilingCache.get(gstin);
          } else {
            const filingRes = await gstService.getFilingStatus(gstin, fyStartYear.toString());
            if (filingRes?.success) {
              filingData = filingRes.data.filingStatus || [];
              gstinFilingCache.set(gstin, filingData);
            } else {
              filingData = [];
              gstinFilingCache.set(gstin, filingData);
            }
          }

          // Build status per return type for months in period
          const wantedTypes = reportType === 'annual' ? ['GSTR1', 'GSTR3B', 'GSTR9'] : ['GSTR1', 'GSTR3B'];
          const byType = new Map();

          for (const rtype of wantedTypes) {
            // Collect status across relevant months
            let anyFiled = false;
            let anyPending = false;
            let latestFilingDate = null;
            let latestArn = null;

            periodMonths.forEach(mon => {
              const rec = (filingData || []).find((rec) => {
                const recMonth = rec.period || rec.taxp; // month name like 'April'
                const recType = (rec.returnType || rec.rtntype || '').toUpperCase();
                return recType === rtype && recMonth === mon;
              });
              if (rec) {
                // Determine filed vs pending more accurately
                const rawFilingDate = rec.filingDate || rec.dof || rec.dofdt || rec.date || null;
                const parsedDate = parseFilingDate(rawFilingDate);
                const status = (rec.status || (parsedDate ? 'Filed' : 'Pending'));
                if (status?.toLowerCase() === 'filed') anyFiled = true;
                else anyPending = true;
                if (parsedDate) {
                  const d = parsedDate;
                  if (!latestFilingDate || d > latestFilingDate) {
                    latestFilingDate = d;
                    latestArn = rec.acknowledgmentNumber || rec.arn || null;
                  }
                }
              } else {
                anyPending = true; // No record implies pending/unknown; treat as pending for compliance view
              }
            });

            let aggStatus = 'Unknown';
            if (anyFiled && !anyPending) aggStatus = 'Filed';
            else if (anyFiled && anyPending) aggStatus = 'Partial';
            else if (!anyFiled && anyPending) aggStatus = 'Pending';

            if (rtype === 'GSTR9' && reportType !== 'annual') {
              // Skip GSTR9 unless annual report
              continue;
            }

            byType.set(rtype, {
              type: rtype,
              status: aggStatus,
              filingDate: latestFilingDate ? latestFilingDate.toISOString() : null,
              arn: latestArn
            });
          }

          // Attach reason when status is Unknown (e.g., noFiledRecords)
          gstReturnStatuses = Array.from(byType.values()).map(s => {
            if (s.status === 'Unknown') {
              return { ...s, reason: 'No records returned for months in period' };
            }
            return s;
          });
          gstTypes = gstReturnStatuses.map(s => s.type);
        }
      } catch (e) {
        console.warn('GST filing fetch failed for client', client._id, e.message);
        // Provide explicit unknown status with error reason if total failure
        gstReturnStatuses = [
          { type: 'GSTR1', status: 'Unknown', filingDate: null, arn: null, reason: e.message },
          { type: 'GSTR3B', status: 'Unknown', filingDate: null, arn: null, reason: e.message }
        ];
      }
      
      return {
        id: client._id,
        invoiceNumber: latestInvoice?.invoiceNumber || 'N/A',
        monthName,
        clientName: client.name,
        clientId: client._id,
  gstin: client.gstNumber || 'N/A',
  gstStatus: client.status || 'unknown',
        gstReturnStatuses,
        gstTypes,
        hasPaid,
        invoiceRaised,
        quoteRaised,
        totalAmount,
        taxAmount,
        totalWithTax,
        status: latestInvoice?.status || 'no_invoice',
        dueDate: latestInvoice?.dueDate,
        createdAt: latestInvoice?.createdAt || new Date(),
        invoiceCount: clientInvoices.length,
        // Additional fields for detail modal
        items: latestInvoice?.items || [],
        notes: latestInvoice?.notes || '',
        terms: latestInvoice?.terms || ''
      };
    }));

    // Optional filtering by GST return type/status
    if (filterReturnType) {
      items = items.filter(it => (it.gstReturnStatuses || []).some(r => r.type === filterReturnType));
    }
    if (filterReturnType && filterReturnStatus) {
      items = items.filter(it => (it.gstReturnStatuses || []).some(r => r.type === filterReturnType && r.status === filterReturnStatus));
    } else if (!filterReturnType && filterReturnStatus) {
      // Filter any type matching status
      items = items.filter(it => (it.gstReturnStatuses || []).some(r => r.status === filterReturnStatus));
    }

    // Sorting by GST return status of a specific type if requested
    if (sortReturnType) {
      const statusRank = { Filed: 4, Partial: 3, Pending: 2, Unknown: 1 };
      items.sort((a, b) => {
        const aStatusObj = (a.gstReturnStatuses || []).find(r => r.type === sortReturnType);
        const bStatusObj = (b.gstReturnStatuses || []).find(r => r.type === sortReturnType);
        const aRank = statusRank[aStatusObj?.status || 'Unknown'];
        const bRank = statusRank[bStatusObj?.status || 'Unknown'];
        return sortOrder === 'asc' ? aRank - bRank : bRank - aRank;
      });
    }
    
    // Standard field sorting (skip if sortReturnType used exclusively)
    if (!sortReturnType) {
      items.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        items,
        total: clients.length,
        filteredTotal: items.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(clients.length / parseInt(pageSize)),
        reportType,
        period: reportType === 'monthly' 
          ? `${year}-${month}` 
          : reportType === 'quarterly'
            ? `${year}-${quarter}`
            : year,
        availableGstReturnTypes: reportType === 'annual' ? ['GSTR1','GSTR3B','GSTR9'] : ['GSTR1','GSTR3B'],
        statusPriorityOrder: ['Filed','Partial','Pending','Unknown']
      }
    });
  } catch (error) {
    console.error('GST Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate GST report',
      error: error.message
    });
  }
});

export default router;
