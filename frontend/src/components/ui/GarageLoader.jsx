import React from 'react';
import { FaWrench } from 'react-icons/fa';

const GarageLoader = ({ title = 'Garage Workshop', subtext = 'Preparing your workspace...' }) => {
  return (
    <div className="garage-loader-overlay">
      <FaWrench className="garage-loader-icon" />
      <div className="garage-loader-title">{title}</div>
      <div className="garage-loader-subtext">{subtext}</div>
    </div>
  );
};

export default GarageLoader;
