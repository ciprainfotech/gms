import React from "react";
import "../App.css";

const ActivityLog = () => {
  const activities = [
    "Vehicle added: Toyota Corolla",
    "Service completed: Engine Oil Change",
    "Invoice generated: $200 for John Doe",
  ];

  return (
    <div className="activity-log">
      <h3>Recent Activity</h3>
      <ul>
        {activities.map((activity, index) => (
          <li key={index}>{activity}</li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;
