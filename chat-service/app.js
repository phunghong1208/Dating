const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
// Sửa lại import config database cho đúng
const { dbConnectURI, options } = require('./config/database');

mongoose.set('strictQuery', false);

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Chat Service is running!',
    timestamp: new Date().toISOString(),
    service: 'chat-service',
    mongoState: mongoose.connection.readyState
  });
});

// Connect to MongoDB and then load routes
mongoose.connect(dbConnectURI, options)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Routes chỉ được load sau khi connect thành công
    require('./routes/chat')(app);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Chat Service listening on port ${port}`);
});

module.exports = app; 