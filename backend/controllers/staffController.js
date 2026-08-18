const db = require('../config/db');
const { processWhatsAppDispatch } = require('./whatsappController');

// ─── Helper: Safely format Date to YYYY-MM-DD string ─────────────────────────
const formatDateStr = (d) => {
  if (!d) return null;
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
};

// ─── Helper: first & last day of month ──────────────────────────────────────
const monthBounds = (month) => {
  const [y, m] = month.split('-').map(Number);
  const firstDay = `${month}-01`;
  const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

// ─── Helper: is a staff member active during a given month? ─────────────────
const isActiveInMonth = (staff, month) => {
  const { firstDay, lastDay } = monthBounds(month);
  const joinedDate = formatDateStr(staff.joined_date);
  const leavingDate = formatDateStr(staff.leaving_date);

  if (!joinedDate) return false;
  if (joinedDate > lastDay) return false;           // joined after this month
  if (leavingDate && leavingDate < firstDay) return false; // left before this month
  return true;
};

// ════════════════════════════════════════════════════════════════════════════
// 1. STAFF CRUD OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

exports.getAllStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { rows } = await db.query(
      `SELECT id, garage_id, name, phone, role, salary_type, base_salary,
              status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, 
              TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date, 
              leaving_notes, created_at, updated_at
       FROM staff WHERE garage_id = $1 ORDER BY status ASC, name ASC`,
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

    const garageRes = await db.query('SELECT feature_payroll FROM garages WHERE id = $1', [garageId]);
    if (garageRes.rows.length > 0 && garageRes.rows[0].feature_payroll === false) {
      return res.status(403).json({ success: false, message: 'This action is restricted because the Staff & Payroll module is set to Read-Only Mode by your Super Admin.' });
    }

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Name and Role are required.' });
    }
    if (!joined_date) {
      return res.status(400).json({ success: false, message: 'Joining date is required.' });
    }

    const { rows } = await db.query(
      `INSERT INTO staff (garage_id, name, phone, role, salary_type, base_salary, joined_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, garage_id, name, phone, role, salary_type, base_salary,
                 status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, 
                 TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date, 
                 leaving_notes, created_at, updated_at`,
      [garageId, name.trim(), phone ? phone.trim() : null, role.trim(),
       salary_type || 'monthly', parseFloat(base_salary || 0), joined_date]
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
    if (!joined_date) {
      return res.status(400).json({ success: false, message: 'Joining date is required.' });
    }

    // Check if new joined_date conflicts with existing attendance/transactions
    const conflictCheck = await db.query(
      `SELECT TO_CHAR(MIN(date), 'YYYY-MM-DD') as earliest_attendance FROM attendance WHERE staff_id = $1`,
      [id]
    );
    const earliest = conflictCheck.rows[0]?.earliest_attendance;
    if (earliest && joined_date > earliest) {
      return res.status(400).json({
        success: false,
        message: `Cannot set joining date after ${earliest} — attendance records already exist from that date.`
      });
    }

    const { rows } = await db.query(
      `UPDATE staff
       SET name = $1, phone = $2, role = $3, salary_type = $4, base_salary = $5,
           joined_date = $6, updated_at = NOW()
       WHERE id = $7 AND garage_id = $8
       RETURNING id, garage_id, name, phone, role, salary_type, base_salary,
                 status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, 
                 TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date, 
                 leaving_notes, created_at, updated_at`,
      [name.trim(), phone ? phone.trim() : null, role.trim(),
       salary_type || 'monthly', parseFloat(base_salary || 0), joined_date, id, garageId]
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

    // Check for any attendance or transaction history
    const historyCheck = await db.query(
      `SELECT (SELECT COUNT(*) FROM attendance WHERE staff_id = $1) +
              (SELECT COUNT(*) FROM staff_transactions WHERE staff_id = $1) as total`,
      [id]
    );
    const hasHistory = parseInt(historyCheck.rows[0]?.total || 0) > 0;
    if (hasHistory) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete staff member with existing attendance or payroll records. Mark them as Resigned instead to preserve history.',
        code: 'HAS_HISTORY'
      });
    }

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

// ─── Staff Lifecycle: Resign ─────────────────────────────────────────────────
exports.resignStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;
    const { leaving_date, leaving_notes, status } = req.body;

    if (!leaving_date) {
      return res.status(400).json({ success: false, message: 'Leaving date is required.' });
    }

    // Get staff to validate
    const staffRes = await db.query(
      "SELECT id, name, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date FROM staff WHERE id = $1 AND garage_id = $2",
      [id, garageId]
    );
    if (staffRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    const staff = staffRes.rows[0];
    const joinedDate = staff.joined_date;

    if (joinedDate && leaving_date < joinedDate) {
      return res.status(400).json({
        success: false,
        message: `Leaving date cannot be before joining date (${joinedDate}).`
      });
    }

    const finalStatus = ['resigned', 'terminated'].includes(status) ? status : 'resigned';

    const { rows } = await db.query(
      `UPDATE staff
       SET status = $1, leaving_date = $2, leaving_notes = $3, updated_at = NOW()
       WHERE id = $4 AND garage_id = $5
       RETURNING id, garage_id, name, phone, role, salary_type, base_salary,
                 status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, 
                 TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date, 
                 leaving_notes, created_at, updated_at`,
      [finalStatus, leaving_date, leaving_notes || null, id, garageId]
    );

    res.json({
      success: true,
      message: `${staff.name} has been marked as ${finalStatus} effective ${leaving_date}.`,
      staff: rows[0]
    });
  } catch (error) {
    console.error('Error in resignStaff:', error);
    res.status(500).json({ success: false, message: 'Server error updating staff status.' });
  }
};

// ─── Staff Lifecycle: Reactivate ─────────────────────────────────────────────
exports.reactivateStaff = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;

    const { rows } = await db.query(
      `UPDATE staff
       SET status = 'active', leaving_date = NULL, leaving_notes = NULL, updated_at = NOW()
       WHERE id = $1 AND garage_id = $2
       RETURNING id, garage_id, name, phone, role, salary_type, base_salary,
                 status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, 
                 TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date, 
                 leaving_notes, created_at, updated_at`,
      [id, garageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    res.json({ success: true, message: `${rows[0].name} has been reactivated as Active.`, staff: rows[0] });
  } catch (error) {
    console.error('Error in reactivateStaff:', error);
    res.status(500).json({ success: false, message: 'Server error reactivating staff.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 2. ATTENDANCE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

exports.getDailyAttendance = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD).' });
    }

    const { rows } = await db.query(
      `SELECT s.id as staff_id, s.name, s.role, s.phone,
              TO_CHAR(s.joined_date, 'YYYY-MM-DD') as joined_date, 
              TO_CHAR(s.leaving_date, 'YYYY-MM-DD') as leaving_date, s.status,
              COALESCE(a.status, 'Holiday') as attendance_status, a.notes
       FROM staff s
       LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = $1
       WHERE s.garage_id = $2
         AND s.joined_date <= $1::DATE
         AND (s.leaving_date IS NULL OR s.leaving_date >= $1::DATE)
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
    const { date, attendanceList } = req.body;

    if (!date || !Array.isArray(attendanceList)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. Date and attendance list are required.' });
    }

    for (const record of attendanceList) {
      const { staff_id, date: recordDate, status, notes } = record;
      const targetDate = recordDate || date;

      if (!staff_id || !targetDate) continue;

      // Validate date is within staff's employment period
      const staffRes = await db.query(
        "SELECT TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date, TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date FROM staff WHERE id = $1 AND garage_id = $2",
        [staff_id, garageId]
      );
      if (staffRes.rows.length === 0) continue;

      const s = staffRes.rows[0];
      const jd = s.joined_date;
      const ld = s.leaving_date;

      if (jd && targetDate < jd) continue; // skip before joining date
      if (ld && targetDate > ld) continue; // skip after leaving date

      await db.query(
        `INSERT INTO attendance (garage_id, staff_id, date, status, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (staff_id, date)
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes`,
        [garageId, staff_id, targetDate, status || 'Holiday', notes || null]
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

    const { firstDay, lastDay } = monthBounds(month);

    const { rows } = await db.query(
      `SELECT
         s.id as staff_id,
         s.status,
         TO_CHAR(s.joined_date, 'YYYY-MM-DD') as joined_date,
         TO_CHAR(s.leaving_date, 'YYYY-MM-DD') as leaving_date,
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
       WHERE s.garage_id = $1
         AND s.joined_date <= $3::DATE
         AND (s.leaving_date IS NULL OR s.leaving_date >= $4::DATE)`,
      [garageId, month, lastDay, firstDay]
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

    const { firstDay, lastDay } = monthBounds(month);

    const { rows } = await db.query(
      `SELECT a.staff_id, TO_CHAR(a.date, 'YYYY-MM-DD') as date, a.status, a.notes
       FROM attendance a
       INNER JOIN staff s ON s.id = a.staff_id
       WHERE a.garage_id = $1
         AND TO_CHAR(a.date, 'YYYY-MM') = $2
         AND s.joined_date <= $3::DATE
         AND (s.leaving_date IS NULL OR s.leaving_date >= $4::DATE)
       ORDER BY a.date ASC`,
      [garageId, month, lastDay, firstDay]
    );

    res.json({ success: true, logs: rows });
  } catch (error) {
    console.error('Error in getMonthlyAttendanceDetails:', error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly attendance details.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. PAYROLL TRANSACTIONS OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

exports.getStaffLedger = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT id, garage_id, staff_id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, payment_method, notes, created_at
       FROM staff_transactions
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

    // Validate date against staff joining date
    const staffRes = await db.query(
      "SELECT id, name, phone, base_salary, salary_type, status, TO_CHAR(joined_date, 'YYYY-MM-DD') as joined_date FROM staff WHERE id = $1 AND garage_id = $2",
      [staff_id, garageId]
    );
    if (staffRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    const staff = staffRes.rows[0];
    const joinedDate = staff.joined_date;

    if (joinedDate && date < joinedDate) {
      return res.status(400).json({
        success: false,
        message: `Transaction date cannot be before ${staff.name}'s joining date (${joinedDate}).`
      });
    }

    const { rows } = await db.query(
      `INSERT INTO staff_transactions (garage_id, staff_id, type, amount, date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, garage_id, staff_id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, payment_method, notes, created_at`,
      [garageId, staff_id, type, parseFloat(amount), date, payment_method || 'Cash', notes || null]
    );

    const recordedTx = rows[0];

    // WhatsApp notification
    if (send_whatsapp && month) {
      try {
        if (staff.phone) {
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
          const earnedSalary = staff.salary_type === 'daily'
            ? baseSalary * paidDays
            : (baseSalary / totalDaysInMonth) * paidDays;

          const pendingSalary = earnedSalary - totalPaid;
          const dateObj = new Date(year, monthIndex - 1, 1);
          const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

          const formattedAmount = parseFloat(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
          const formattedEarned = earnedSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
          const formattedPaid = totalPaid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
          const formattedPending = pendingSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

          const txLabel = type === 'Advance' ? 'Salary Advance' : 'Salary Payout';
          const resignedNote = staff.status !== 'active' ? `\n⚠️ _Note: This staff member has ${staff.status}. The above is settlement of dues._` : '';

          const message = `Hello *${staff.name}* 👋,\n\nWe have recorded a *${txLabel}* of *${formattedAmount}* via *${payment_method}* on *${new Date(date).toLocaleDateString('en-IN')}*.${notes ? `\nRemarks: _"${notes}"_` : ''}${resignedNote}\n\n📊 *Accounts Statement Summary (${monthName}):*\n  - Dynamic Salary Earned: *${formattedEarned}* (${paidDays} paid days)\n  - Total Salary Payouts Received: *${formattedPaid}*\n  - *Net Pending Balance: ${formattedPending}*\n\nIf you have any questions, please contact management.`;

          await processWhatsAppDispatch({
            garageId,
            recipientPhone: staff.phone,
            messageType: 'invoice',
            messageText: message
          });
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

// ════════════════════════════════════════════════════════════════════════════
// 4. WHATSAPP SALARY STATEMENT
// ════════════════════════════════════════════════════════════════════════════

exports.sendStaffWhatsAppSummary = async (req, res) => {
  try {
    const garageId = req.garageId;
    const { id } = req.params;
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month parameter is required.' });
    }

    const staffRes = await db.query(
      "SELECT id, name, phone, base_salary, salary_type, status, TO_CHAR(leaving_date, 'YYYY-MM-DD') as leaving_date FROM staff WHERE id = $1 AND garage_id = $2",
      [id, garageId]
    );
    if (staffRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    const staff = staffRes.rows[0];

    if (!staff.phone) {
      return res.status(400).json({ success: false, message: 'Staff member does not have a phone number.' });
    }

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

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, monthIndex, 0).getDate();

    const paidDays = present + holiday + (0.5 * halfDay);
    const baseSalary = parseFloat(staff.base_salary || 0);
    const earnedSalary = staff.salary_type === 'daily'
      ? baseSalary * paidDays
      : (baseSalary / totalDaysInMonth) * paidDays;

    const pendingSalary = earnedSalary - advances - paid;
    const dateObj = new Date(year, monthIndex - 1, 1);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    const formattedEarned = earnedSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedBase = baseSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedAdvances = advances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedPaid = paid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedPending = pendingSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const resignedNote = staff.status !== 'active'
      ? `\n⚠️ _Note: ${staff.name} has ${staff.status} on ${staff.leaving_date || 'unknown date'}._`
      : '';

    const message = `Hello *${staff.name}* 👋,\n\nHere is your accounts & payroll summary for *${monthName}*:${resignedNote}\n\n📊 *Attendance Stats:*\n  - Present: *${present}* days\n  - Half Days: *${halfDay}* days\n  - Holidays: *${holiday}* days\n  - Absents: *${absent}* days\n  - Paid Days Count: *${paidDays}* days\n\n💵 *Salary & Accounts Breakdown:*\n  - Base Salary: *${formattedBase}* (${staff.salary_type})\n  - Dynamic Salary Earned: *${formattedEarned}*\n  - Total Advances Taken: *${formattedAdvances}*\n  - Salary Payouts Received: *${formattedPaid}*\n  - *Net Pending Balance: ${formattedPending}*\n\nIf you have any questions or find any discrepancies, please contact management.`;

    const result = await processWhatsAppDispatch({
      garageId,
      recipientPhone: staff.phone,
      messageType: 'invoice',
      messageText: message,
      req
    });

    res.json({ success: true, message: 'WhatsApp account summary sent successfully!', remainingBalance: result.remainingBalance });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT_FUNDS', message: error.message });
    }
    console.error('Error sending staff summary WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to dispatch summary message.' });
  }
};
