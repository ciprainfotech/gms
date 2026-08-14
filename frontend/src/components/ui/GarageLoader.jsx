import React, { useState, useEffect } from 'react';
import { FaWrench, FaCog } from 'react-icons/fa';

const GarageLoader = ({ title = 'Garage Workshop', subtext = 'Loading your workspace...' }) => {
  const [stepText, setStepText] = useState(subtext);

  useEffect(() => {
    const steps = [
      'Connecting to Garage Cloud DB...',
      'Verifying security credentials...',
      'Optimizing performance engine...',
      'Preparing your workspace...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setStepText(steps[i]);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="garage-loader-wrapper garage-loader-overlay">
      {/* Background ambient glowing spheres */}
      <div className="garage-loader-bg-glow glow-1"></div>
      <div className="garage-loader-bg-glow glow-2"></div>
      
      {/* Central Glassmorphic Loader Card */}
      <div className="garage-loader-card">
        {/* Animated Brand Emblem & Rings */}
        <div className="garage-loader-emblem-container">
          <div className="garage-loader-ring outer-ring"></div>
          <div className="garage-loader-ring inner-ring"></div>
          <div className="garage-loader-icon-box">
            <FaWrench className="garage-loader-main-icon garage-loader-icon" />
            <FaCog className="garage-loader-sub-icon" />
          </div>
        </div>

        {/* Title & Subtext */}
        <div className="garage-loader-content">
          <h2 className="garage-loader-title">{title}</h2>
          <p className="garage-loader-subtext">{subtext}</p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="garage-loader-progress-track">
          <div className="garage-loader-progress-bar"></div>
        </div>

        {/* Dynamic Status Pill */}
        <div className="garage-loader-status-pill">
          <span className="garage-loader-dot"></span>
          <span className="garage-loader-step">{stepText}</span>
        </div>
      </div>
    </div>
  );
};

export default GarageLoader;
