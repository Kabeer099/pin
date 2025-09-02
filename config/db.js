// config/db.js
require('dotenv').config(); // local dev ke liye; Railway pe ignore ho jayega
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

module.exports = mongoose;
