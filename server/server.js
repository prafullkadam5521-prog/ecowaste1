const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/facilities', require('./routes/facilityRoutes'));
app.use('/api/requests',   require('./routes/requestRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/reviews',    require('./routes/reviewRoutes'));
app.use('/api/rewards',    require('./routes/rewardRoutes'));   // ← NEW
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/dustbin',    require('./routes/dustbinRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));
