import React from "react";
import "../App.css";

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="stats-card">
      <span className="stats-icon">{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
