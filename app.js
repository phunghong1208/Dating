const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const { dbConnectURI, options } = require('./config/database');

mongoose.set('strictQuery', false);


const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(dbConnectURI, options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
require('./routes/admin')(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Admin Service is running!',
    timestamp: new Date().toISOString(),
    service: 'admin-service'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

const port = process.env.PORT || 3003;

app.listen(port, () => {
  console.log(`Admin Service listening on port ${port}`);
});

module.exports = app; 