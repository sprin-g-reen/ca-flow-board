import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Prefer IPv4 loopback to avoid drivers resolving to IPv6 (::1) which may not be listening
    const defaultUri = 'mongodb://127.0.0.1:27017/ca-flow-board';
    const uri = process.env.MONGODB_URI || defaultUri;

    const conn = await mongoose.connect(uri, {
      // Fail faster and provide clearer errors when Mongo isn't available
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    // Log full error for easier debugging (stack included)
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('💡 Please ensure MongoDB is running and accessible.');
    console.error('   On Windows: Check if "MongoDB" service is started in Services.msc');
    console.error('   On macOS: brew services start mongodb-community');
    
    // Rethrow to allow caller to handle failure
    throw error;
  }
};

export default connectDB;