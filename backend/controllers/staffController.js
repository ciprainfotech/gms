const db = require('../config/db');
const { processWhatsAppDispatch } = require('./whatsappController');

// 1. Staff CRUD Operations
exports.getAllStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { rows } = await db.query(
      'SELECT * FROM staff WHERE garage_id = $1 ORDER BY name ASC',
      [garageId]
    );
    res.json({ success: true, staff: rows });
  } catch (error) {
    console.error('Error in getAllStaff:', error);
    res.status(500).json({ success: false, message: 'Server error listing staff members.' });
  }
};

exports.addStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { name, phone, role, salary_type, base_salary, joined_date } = req.body;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Name and Role are required.' });
    }

    const { rows } = await db.query(
      `INSERT INTO staff (garage_id, name, phone, role, salary_type, base_salary, joined_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [garageId, name.trim(), phone ? phone.trim() : null, role.trim(), salary_type || 'monthly', parseFloat(base_salary || 0), joined_date || new Date().toISOString().split('T')[0]]
    );

    res.status(201).json({ success: true, message: 'Staff member added successfully!', staff: rows[0] });
  } catch (error) {
    console.error('Error in addStaff:', error);
    res.status(500).json({ success: false, message: 'Server error adding staff member.' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;
    const { name, phone, role, salary_type, base_salary, joined_date } = req.body;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Name and Role are required.' });
    }

    const { rows } = await db.query(
      `UPDATE staff 
       SET name = $1, phone = $2, role = $3, salary_type = $4, base_salary = $5, joined_date = $6, updated_at = NOW()
       WHERE id = $7 AND garage_id = $8
       RETURNING *`,
      [name.trim(), phone ? phone.trim() : null, role.trim(), salary_type || 'monthly', parseFloat(base_salary || 0), joined_date || new Date().toISOString().split('T')[0], id, garageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Staff member updated successfully!', staff: rows[0] });
  } catch (error) {
    console.error('Error in updateStaff:', error);
    res.status(500).json({ success: false, message: 'Server error updating staff member.' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;

    const { rowCount } = await db.query(
      'DELETE FROM staff WHERE id = $1 AND garage_id = $2',
      [id, garageId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Staff member deleted successfully!' });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    res.status(500).json({ success: false, message: 'Server error deleting staff member.' });
  }
};

// 2. Attendance Operations
exports.getDailyAttendance = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD).' });
    }

    const { rows } = await db.query(
      `SELECT s.id as staff_id, s.name, s.role, s.phone,
              COALESCE(a.status, 'Holiday') as status, a.notes
       FROM staff s
       LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = $1
       WHERE s.garage_id = $2
       ORDER BY s.name ASC`,
      [date, garageId]
    );

    res.json({ success: true, attendance: rows });
  } catch (error) {
    console.error('Error in getDailyAttendance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching daily attendance.' });
  }
};

exports.saveBulkAttendance = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { date, attendanceList } = req.body; // attendanceList: [{ staff_id, status, notes }]

    if (!date || !Array.isArray(attendanceList)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. Date and attendance list are required.' });
    }

    for (const record of attendanceList) {
      const { staff_id, status, notes } = record;
      await db.query(
        `INSERT INTO attendance (garage_id, staff_id, date, status, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (staff_id, date) 
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes`,
        [garageId, staff_id, date, status || 'Holiday', notes || null]
      );
    }

    res.json({ success: true, message: 'Daily attendance saved successfully!' });
  } catch (error) {
    console.error('Error in saveBulkAttendance:', error);
    res.status(500).json({ success: false, message: 'Server error saving attendance.' });
  }
};

exports.getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { month } = req.query; // YYYY-MM

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month parameter is required (YYYY-MM).' });
    }

    const { rows } = await db.query(
      `SELECT 
         s.id as staff_id,
         COALESCE(att.present_count, 0) as present_count,
         COALESCE(att.half_day_count, 0) as half_day_count,
         COALESCE(att.absent_count, 0) as absent_count,
         COALESCE(att.holiday_count, 0) as holiday_count,
         COALESCE(trans.total_paid, 0) as total_paid
       FROM staff s
       LEFT JOIN (
         SELECT staff_id,
                COUNT(*) FILTER (WHERE status = 'Present') as present_count,
                COUNT(*) FILTER (WHERE status = 'Half Day') as half_day_count,
                COUNT(*) FILTER (WHERE status = 'Absent') as absent_count,
                COUNT(*) FILTER (WHERE status = 'Holiday') as holiday_count
         FROM attendance
         WHERE garage_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
         GROUP BY staff_id
       ) att ON s.id = att.staff_id
       LEFT JOIN (
         SELECT staff_id,
                SUM(amount) as total_paid
         FROM staff_transactions
         WHERE garage_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
         GROUP BY staff_id
       ) trans ON s.id = trans.staff_id
       WHERE s.garage_id = $1`,
      [garageId, month]
    );

    res.json({ success: true, summary: rows });
  } catch (error) {
    console.error('Error in getMonthlyAttendanceSummary:', error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly attendance summary.' });
  }
};

exports.getMonthlyAttendanceDetails = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { month } = req.query; // YYYY-MM

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month parameter is required (YYYY-MM).' });
    }

    const { rows } = await db.query(
      `SELECT staff_id, TO_CHAR(date, 'YYYY-MM-DD') as date, status, notes
       FROM attendance
       WHERE garage_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       ORDER BY date ASC`,
      [garageId, month]
    );

    res.json({ success: true, logs: rows });
  } catch (error) {
    console.error('Error in getMonthlyAttendanceDetails:', error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly attendance details.' });
  }
};

// 3. Payroll Transactions Operations
exports.getStaffLedger = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM staff_transactions 
       WHERE staff_id = $1 AND garage_id = $2 
       ORDER BY date DESC, created_at DESC`,
      [id, garageId]
    );

    res.json({ success: true, transactions: rows });
  } catch (error) {
    console.error('Error in getStaffLedger:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ledger statement.' });
  }
};

exports.recordTransaction = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { staff_id, type, amount, date, payment_method, notes, send_whatsapp, month } = req.body;

    if (!staff_id || !type || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required payroll details.' });
    }

    const { rows } = await db.query(
      `INSERT INTO staff_transactions (garage_id, staff_id, type, amount, date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [garageId, staff_id, type, parseFloat(amount), date, payment_method || 'Cash', notes || null]
    );

    const recordedTx = rows[0];

    // If send_whatsapp is true, construct and send the real-time summary statement
    if (send_whatsapp && month) {
      try {
        const staffRes = await db.query('SELECT * FROM staff WHERE id = $1 AND garage_id = $2', [staff_id, garageId]);
        if (staffRes.rows.length > 0) {
          const staff = staffRes.rows[0];
          if (staff.phone) {
            // Get attendance summary for month
            const attRes = await db.query(
              `SELECT 
                 COUNT(*) FILTER (WHERE status = 'Present') as present_count,
                 COUNT(*) FILTER (WHERE status = 'Half Day') as half_day_count,
                 COUNT(*) FILTER (WHERE status = 'Holiday') as holiday_count
               FROM attendance
               WHERE staff_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
              [staff_id, month]
            );
            const att = attRes.rows[0] || { present_count: 0, half_day_count: 0, holiday_count: 0 };
            
            const present = parseInt(att.present_count || 0, 10);
            const halfDay = parseInt(att.half_day_count || 0, 10);
            const holiday = parseInt(att.holiday_count || 0, 10);

            // Get transactions summary for month
            const transRes = await db.query(
              `SELECT COALESCE(SUM(amount), 0) as total_paid
               FROM staff_transactions
               WHERE staff_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
              [staff_id, month]
            );
            const totalPaid = parseFloat(transRes.rows[0]?.total_paid || 0);

            const [yearStr, monthStr] = month.split('-');
            const year = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10);
            const totalDaysInMonth = new Date(year, monthIndex, 0).getDate();

            const paidDays = present + holiday + (0.5 * halfDay);
            const baseSalary = parseFloat(staff.base_salary || 0);
            
            let earnedSalary = 0;
            if (staff.salary_type === 'daily') {
              earnedSalary = baseSalary * paidDays;
            } else {
              earnedSalary = (baseSalary / totalDaysInMonth) * paidDays;
            }

            const pendingSalary = earnedSalary - totalPaid;
            const dateObj = new Date(year, monthIndex - 1, 1);
            const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

            const formattedAmount = parseFloat(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
            const formattedEarned = earnedSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
            const formattedPaid = totalPaid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
            const formattedPending = pendingSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

            const txLabel = type === 'Advance' ? 'Salary Advance' : 'Salary Payout';

            const message = `Hello *${staff.name}* 👋,\n\nWe have recorded a *${txLabel}* of *${formattedAmount}* via *${payment_method}* on *${new Date(date).toLocaleDateString('en-IN')}*.\n${notes ? `Remarks: _"${notes}"_\n` : ''}\n📊 *Accounts Statement Summary (${monthName}):*\n  - Dynamic Salary Earned: *${formattedEarned}* (${paidDays} paid days)\n  - Total Salary Payouts Received: *${formattedPaid}*\n  - *Net Pending Balance: ${formattedPending}*\n\nIf you have any questions, please contact management.`;

            await processWhatsAppDispatch({
              garageId,
              recipientPhone: staff.phone,
              messageType: 'invoice',
              messageText: message
            });
          }
        }
      } catch (waErr) {
        console.error('Error dispatching transactional WhatsApp updates:', waErr);
      }
    }

    res.status(201).json({ success: true, message: 'Payroll transaction recorded successfully!', transaction: recordedTx });
  } catch (error) {
    console.error('Error in recordTransaction:', error);
    res.status(500).json({ success: false, message: 'Server error saving payroll transaction.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;

    const { rowCount } = await db.query(
      'DELETE FROM staff_transactions WHERE id = $1 AND garage_id = $2',
      [id, garageId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Payroll transaction deleted/rolled back successfully!' });
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({ success: false, message: 'Server error deleting transaction.' });
  }
};

// 4. WhatsApp Salary Statement Sender
exports.sendStaffWhatsAppSummary = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;
    const { month } = req.body; // format 'YYYY-MM'

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month parameter is required.' });
    }

    // Get staff details
    const staffRes = await db.query('SELECT * FROM staff WHERE id = $1 AND garage_id = $2', [id, garageId]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    const staff = staffRes.rows[0];

    if (!staff.phone) {
      return res.status(400).json({ success: false, message: 'Staff member does not have a phone number.' });
    }

    // Get attendance totals for selected month
    const attRes = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'Present') as present_count,
         COUNT(*) FILTER (WHERE status = 'Half Day') as half_day_count,
         COUNT(*) FILTER (WHERE status = 'Holiday') as holiday_count,
         COUNT(*) FILTER (WHERE status = 'Absent') as absent_count
       FROM attendance
       WHERE staff_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [id, month]
    );
    const att = attRes.rows[0] || { present_count: 0, half_day_count: 0, holiday_count: 0, absent_count: 0 };
    
    const present = parseInt(att.present_count || 0, 10);
    const halfDay = parseInt(att.half_day_count || 0, 10);
    const holiday = parseInt(att.holiday_count || 0, 10);
    const absent = parseInt(att.absent_count || 0, 10);

    // Get transactions totals
    const transRes = await db.query(
      `SELECT 
         COALESCE(SUM(amount) FILTER (WHERE type = 'Advance'), 0) as total_advances,
         COALESCE(SUM(amount) FILTER (WHERE type = 'Payment'), 0) as total_paid
       FROM staff_transactions
       WHERE staff_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [id, month]
    );
    const trans = transRes.rows[0] || { total_advances: 0, total_paid: 0 };
    
    const advances = parseFloat(trans.total_advances || 0);
    const paid = parseFloat(trans.total_paid || 0);

    // Calculate dynamic earned salary
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, monthIndex, 0).getDate();
    
    const paidDays = present + holiday + (0.5 * halfDay);
    const baseSalary = parseFloat(staff.base_salary || 0);
    
    let earnedSalary = 0;
    if (staff.salary_type === 'daily') {
      earnedSalary = baseSalary * paidDays;
    } else {
      // Monthly base
      earnedSalary = (baseSalary / totalDaysInMonth) * paidDays;
    }

    const pendingSalary = earnedSalary - advances - paid;

    // Formatting date label
    const dateObj = new Date(year, monthIndex - 1, 1);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    const formattedEarned = earnedSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedBase = baseSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedAdvances = advances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedPaid = paid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedPending = pendingSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    // Compose message
    const message = `Hello *${staff.name}* 👋,\n\nHere is your accounts & payroll summary for *${monthName}*:\n\n📊 *Attendance Stats:*\n  - Present: *${present}* days\n  - Half Days: *${halfDay}* days\n  - Holidays: *${holiday}* days\n  - Absents: *${absent}* days\n  - Paid Days Count: *${paidDays}* days\n\n💵 *Salary & Accounts Breakdown:*\n  - Base Salary: *${formattedBase}* (${staff.salary_type})\n  - Dynamic Salary Earned: *${formattedEarned}*\n  - Total Advances Taken: *${formattedAdvances}*\n  - Salary Payouts Received: *${formattedPaid}*\n  - *Net Pending Balance: ${formattedPending}*\n\nIf you have any questions or find any discrepancies, please contact management.`;

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: staff.phone,
      messageType: 'invoice', // transactional
      messageText: message
    });

    res.json({ success: true, message: `WhatsApp account summary sent successfully!`, remainingBalance: result.remainingBalance });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    console.error('Error sending staff summary WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to dispatch summary message.' });
  }
};
