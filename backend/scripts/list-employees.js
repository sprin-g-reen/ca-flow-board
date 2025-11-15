#!/usr/bin/env node
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Firm from '../models/Firm.js';

const listEmployees = async () => {
  try {
    await connectDB();

    console.log('\n📋 Listing All Employees\n');
    console.log('='.repeat(80));

    // Get all employees
    const employees = await User.find({ role: 'employee' })
      .populate('firmId', 'name')
      .sort({ createdAt: -1 });

    if (employees.length === 0) {
      console.log('\n❌ No employees found in the database.\n');
      process.exit(0);
    }

    console.log(`\n✅ Found ${employees.length} employee(s)\n`);

    // Group by firm
    const employeesByFirm = {};
    employees.forEach(emp => {
      const firmName = emp.firmId?.name || 'No Firm';
      if (!employeesByFirm[firmName]) {
        employeesByFirm[firmName] = [];
      }
      employeesByFirm[firmName].push(emp);
    });

    // Display grouped employees
    for (const [firmName, firmEmployees] of Object.entries(employeesByFirm)) {
      console.log(`\n🏢 ${firmName}`);
      console.log('-'.repeat(80));
      
      firmEmployees.forEach((emp, index) => {
        console.log(`\n${index + 1}. ${emp.fullName}`);
        console.log(`   Username: ${emp.username}`);
        console.log(`   Email: ${emp.email || 'N/A'}`);
        console.log(`   Employee ID: ${emp.employeeId || 'N/A'}`);
        console.log(`   Department: ${emp.department || 'general'}`);
        console.log(`   Phone: ${emp.phone || 'N/A'}`);
        console.log(`   Status: ${emp.isActive ? '✅ Active' : '❌ Inactive'}`);
        console.log(`   Join Date: ${emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}`);
        console.log(`   Last Login: ${emp.lastLogin ? new Date(emp.lastLogin).toLocaleString() : 'Never'}`);
        
        if (emp.expertise && emp.expertise.length > 0) {
          console.log(`   Expertise: ${emp.expertise.join(', ')}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Total: ${employees.length} employee(s)\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error listing employees:', error.message);
    process.exit(1);
  }
};

listEmployees();
