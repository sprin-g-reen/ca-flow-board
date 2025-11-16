import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

mongoose.connect('mongodb://localhost:27017/ca_flow_board')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find Vijay
    const vijay = await User.findOne({ email: { $regex: 'vijay', $options: 'i' } });
    console.log('\nVijay:', vijay ? { id: vijay._id.toString(), email: vijay.email, fullName: vijay.fullName } : 'Not found');
    
    if (vijay) {
      // Find tasks assigned to Vijay
      const tasks = await Task.find({ assignedTo: vijay._id }).populate('client', 'name email');
      console.log('\nTasks assigned to Vijay:', tasks.length);
      tasks.forEach(task => {
        console.log('  - Task:', task.title);
        console.log('    Client ID:', task.client?._id?.toString() || task.client);
        console.log('    Client Name:', task.client?.name || 'N/A');
        console.log('    AssignedTo:', task.assignedTo?.map(id => id.toString()));
      });
    }
    
    // Find Vidhya client
    const vidhya = await Client.findOne({ name: { $regex: 'vidhya', $options: 'i' } });
    console.log('\nVidhya client:', vidhya ? { id: vidhya._id.toString(), name: vidhya.name } : 'Not found');
    
    if (vidhya) {
      // Find tasks for Vidhya client
      const vidhyaTasks = await Task.find({ client: vidhya._id }).populate('assignedTo', 'fullName email');
      console.log('\nTasks for Vidhya client:', vidhyaTasks.length);
      vidhyaTasks.forEach(task => {
        console.log('  - Task:', task.title);
        console.log('    AssignedTo:', task.assignedTo?.map(u => u.fullName || u.email));
      });
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
