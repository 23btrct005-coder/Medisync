const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api', authRoutes);

// Simple healthcheck
app.get('/', (req, res) => {
  res.send('Universal Health Record API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
