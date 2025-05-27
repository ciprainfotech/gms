import React from "react";
import "../App.css";

const Appointments = () => {
  const appointments = [
    { id: 1, customer: "John Doe", time: "10:00 AM", status: "Confirmed" },
    { id: 2, customer: "Jane Smith", time: "1:30 PM", status: "Pending" },
  ];

  return (
    <div className="appointments">
      <h3>Upcoming Appointments</h3>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>
            <span>{appt.customer}</span> - <span>{appt.time}</span> (<span className={appt.status.toLowerCase()}>{appt.status}</span>)
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Appointments;
