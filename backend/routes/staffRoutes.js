const express = require('express');
const router = express.Router();
const { authorizeGarage } = require('../middleware/authMiddleware');
const staffController = require('../controllers/staffController');

// All staff endpoints require garage authorization
router.use(authorizeGarage);

// Staff CRUD
router.get('/', staffController.getAllStaff);
router.post('/', staffController.addStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

// Attendance registry
router.get('/attendance', staffController.getDailyAttendance);
router.post('/attendance/bulk', staffController.saveBulkAttendance);
router.get('/attendance/summary', staffController.getMonthlyAttendanceSummary);
router.get('/attendance/month', staffController.getMonthlyAttendanceDetails);

// Ledgers & Transactions
router.get('/:id/ledger', staffController.getStaffLedger);
router.post('/transaction', staffController.recordTransaction);
router.delete('/transaction/:id', staffController.deleteTransaction);

// WhatsApp dispatch
router.post('/:id/send-summary', staffController.sendStaffWhatsAppSummary);

module.exports = router;
