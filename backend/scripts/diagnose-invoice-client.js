import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import User from '../models/User.js';

dotenv.config();

async function diagnoseInvoiceIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the problem invoice
    const invoice = await Invoice.findOne({ invoiceNumber: 'QD-2025-0001' });
    
    if (!invoice) {
      console.log('❌ Invoice not found');
      return;
    }

    console.log('📄 Invoice Details:');
    console.log('   Number:', invoice.invoiceNumber);
    console.log('   Client ID:', invoice.client);
    console.log('   Type:', invoice.type);
    console.log('   Status:', invoice.status);
    console.log('   Amount:', invoice.totalAmount);

    // Try to populate client
    await invoice.populate('client');
    console.log('\n👤 Client Population Result:');
    console.log('   Client:', invoice.client);

    // Check if relatedTask exists
    if (invoice.relatedTask) {
      const task = await Task.findById(invoice.relatedTask).populate('client assignedTo assignedBy');
      console.log('\n📋 Related Task:');
      console.log('   Title:', task?.title);
      console.log('   Client (from task):', task?.client);
      console.log('   Assigned To:', task?.assignedTo?.fullName);
      console.log('   Assigned By:', task?.assignedBy?.fullName);

      if (task?.client) {
        // Check if it's a Client model or User model reference
        const client = await Client.findById(task.client);
        const user = await User.findById(task.client);
        
        console.log('\n🔍 Client/User Check:');
        console.log('   Found in Client model:', !!client);
        console.log('   Found in User model:', !!user);
        
        if (client) {
          console.log('   Client Name:', client.name);
          console.log('   Client Email:', client.email);
        }
        if (user) {
          console.log('   User Name:', user.fullName);
          console.log('   User Email:', user.email);
          console.log('   User Role:', user.role);
        }
      }
    }

    // Check all invoices
    console.log('\n📊 All Invoices:');
    const allInvoices = await Invoice.find({})
      .populate('client createdBy')
      .select('invoiceNumber client createdBy type status');
    
    allInvoices.forEach(inv => {
      console.log(`   ${inv.invoiceNumber}: Client=${inv.client?.fullName || inv.client?.name || 'Unknown'}, Type=${inv.type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected');
  }
}

diagnoseInvoiceIssue();
