import mongoose from 'mongoose';
import dotenv from 'dotenv';
import pkg from 'bcryptjs';
const { hash, genSalt } = pkg;

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI not found in your server/.env file!");
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema);

async function run() {
  // Read new password from command line arguments
  const args = process.argv.slice(2);
  const newPassword = args[0];

  if (!newPassword || newPassword.trim().length < 6) {
    console.error("==========================================");
    console.error("❌ ERROR: Please provide a valid password!");
    console.error("Usage: node change_admin_password.js <your_new_password>");
    console.error("Note: Password must be at least 6 characters long.");
    console.error("==========================================");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const admin = await Admin.findOne({ email: 'bs.dhairjo@gmail.com' });
    
    if (!admin) {
      console.log("Admin account (bs.dhairjo@gmail.com) not found in database. Creating a new admin...");
      const salt = await genSalt(10);
      const hashedPassword = await hash(newPassword.trim(), salt);
      const newAdmin = new Admin({
        name: 'Admin',
        email: 'bs.dhairjo@gmail.com',
        password: hashedPassword
      });
      await newAdmin.save();
      console.log(`\n🎉 Success! Created a new Admin account.`);
      console.log(`📧 Email: bs.dhairjo@gmail.com`);
      console.log(`🔑 Password: ${newPassword.trim()}\n`);
    } else {
      console.log("Updating password for admin: bs.dhairjo@gmail.com...");
      const salt = await genSalt(10);
      const hashedPassword = await hash(newPassword.trim(), salt);
      admin.password = hashedPassword;
      await admin.save();
      console.log(`\n🎉 Success! The Admin password has been updated.`);
      console.log(`📧 Email: bs.dhairjo@gmail.com`);
      console.log(`🔑 New Password: ${newPassword.trim()}\n`);
    }
  } catch (err) {
    console.error("❌ Database Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
