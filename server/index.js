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
const connectDB = async () => {
    try {
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('MongoDB connected');
        } else {
            console.log('Running in local mode (JSON storage) - WARNING: Data will not persist on Vercel');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

connectDB();

// Routes
app.get('/', (req, res) => {
    res.send('Master Depot Rotation API is running...');
});

// Import Routes
const rotationRoutes = require('./routes/rotationRoutes');
app.use('/api/rotation', rotationRoutes);

// For Vercel, we need to export the app
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
