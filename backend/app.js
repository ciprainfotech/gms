require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');     // <-- ADD
const jobSheetRoutes = require('./routes/jobSheetRoutes');   // <-- ADD
const dashboardRoutes = require('./routes/dashboardRoutes');
const makeModelRoutes = require('./routes/makeModelRoutes');
const customerRoutes = require('./routes/customerRoutes');
const masterItemRoutes = require('./routes/masterItemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import other routes here as you build them
// e.g., const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- Middleware ---

// Configure CORS to allow your React app to communicate with the backend
// and to allow credentials (cookies) to be sent.
app.use(cors({
  origin: 'http://localhost:5173', // Your React app's URL
  credentials: true,
}));

// To parse cookies from the request headers
app.use(cookieParser());

// To parse JSON bodies from incoming requests
app.use(express.json());

// To parse URL-encoded bodies (for form submissions, though less common with React)
app.use(express.urlencoded({ extended: true }));


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);                     // <-- ADD
app.use('/api/jobsheets', jobSheetRoutes);                   // <-- ADD
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes); // Add this line
app.use('/api/meta', makeModelRoutes);     // Add this line
app.use('/api/master-items', masterItemRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);



// --- Basic Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

app.use((req, res, next) => {
    console.log(`Request received for path: ${req.path}`);
    next();
});

// --- Start the Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});