#!/usr/bin/env node
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Firm from '../models/Firm.js';

const listAllUsers = async () => {
  try {
    await connectDB();

    console.log('\n👥 Listing All Users\n');
    console.log('='.repeat(100));

    // Get all users
    const users = await User.find({})
      .populate('firmId', 'name')
      .sort({ role: 1, createdAt: -1 });

    if (users.length === 0) {
      console.log('\n❌ No users found in the database.\n');
      process.exit(0);
    }

    console.log(`\n✅ Found ${users.length} user(s)\n`);

    // Group by role
    const usersByRole = {};
    users.forEach(user => {
      const role = user.role || 'unknown';
      if (!usersByRole[role]) {
        usersByRole[role] = [];
      }
      usersByRole[role].push(user);
    });

    // Display grouped users
    const roleOrder = ['superadmin', 'owner', 'admin', 'employee', 'client'];
    const roleEmojis = {
      superadmin: '👑',
      owner: '🏢',
      admin: '⚙️',
      employee: '👨‍💼',
      client: '👤'
    };

    for (const role of roleOrder) {
      if (usersByRole[role]) {
        const roleUsers = usersByRole[role];
        console.log(`\n${roleEmojis[role] || '👤'} ${role.toUpperCase()} (${roleUsers.length})`);
        console.log('-'.repeat(100));
        
        roleUsers.forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.fullName}`);
          console.log(`   Username: ${user.username}`);
          console.log(`   Email: ${user.email || 'N/A'}`);
          console.log(`   Firm: ${user.firmId?.name || 'N/A'}`);
          console.log(`   Phone: ${user.phone || 'N/A'}`);
          console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
          console.log(`   Online: ${user.isOnline ? '🟢 Online' : '⚪ Offline'}`);
          console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
          console.log(`   Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
          
          // Role-specific details
          if (role === 'employee') {
            console.log(`   Employee ID: ${user.employeeId || 'N/A'}`);
            console.log(`   Department: ${user.department || 'general'}`);
            if (user.expertise && user.expertise.length > 0) {
              console.log(`   Expertise: ${user.expertise.join(', ')}`);
            }
          } else if (role === 'client') {
            console.log(`   Client ID: ${user.clientId || 'N/A'}`);
            console.log(`   Company: ${user.companyName || 'N/A'}`);
            console.log(`   GST: ${user.gstNumber || 'N/A'}`);
            console.log(`   PAN: ${user.panNumber || 'N/A'}`);
          }
        });
      }
    }

    // Summary statistics
    console.log('\n' + '='.repeat(100));
    console.log('\n📊 Summary:');
    for (const role of roleOrder) {
      if (usersByRole[role]) {
        console.log(`   ${roleEmojis[role] || '👤'} ${role}: ${usersByRole[role].length}`);
      }
    }
    console.log(`   📈 Total Users: ${users.length}`);
    console.log(`   ✅ Active: ${users.filter(u => u.isActive).length}`);
    console.log(`   ❌ Inactive: ${users.filter(u => !u.isActive).length}`);
    console.log(`   🟢 Online: ${users.filter(u => u.isOnline).length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error listing users:', error.message);
    process.exit(1);
  }
};

listAllUsers();
