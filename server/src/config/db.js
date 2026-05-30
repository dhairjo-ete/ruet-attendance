import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    
    // Drop the unique registration index if it exists
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'students' }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('students').indexes();
        const hasRegIndex = indexes.some(idx => idx.name === 'registration_1');
        if (hasRegIndex) {
          await db.collection('students').dropIndex('registration_1');
          console.log('Successfully dropped registration_1 unique index');
        }
      }
    } catch (indexError) {
      console.log('Error checking/dropping registration index:', indexError.message);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
