const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/master-depot-rotation')
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));
console.log('Running in local mode (JSON storage)');

// Routes
app.get('/', (req, res) => {
    res.send('Master Depot Rotation API is running...');
});

// Import Routes
const rotationRoutes = require('./routes/rotationRoutes');
app.use('/api/rotation', rotationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
