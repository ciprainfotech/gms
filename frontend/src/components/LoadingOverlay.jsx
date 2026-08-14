import React, { useState, useEffect } from 'react';

const LoadingOverlay = ({ isVisible, message = 'Processing...', delay = 180 }) => {
  const [shouldRender, setShouldRender] = useState(false);

  // Check if action is a heavy explicit mutation that requires instant overlay
  const isHeavyMutation = message && (
    message.toLowerCase().includes('sav') || 
    message.toLowerCase().includes('delet') || 
    message.toLowerCase().includes('process') || 
    message.toLowerCase().includes('updat') ||
    message.toLowerCase().includes('generat')
  );

  useEffect(() => {
    let timer;
    if (isVisible) {
      if (isHeavyMutation) {
        setShouldRender(true);
      } else {
        // Debounce read loading states so microsecond (50ms) fetches don't flicker dark overlay
        timer = setTimeout(() => {
          setShouldRender(true);
        }, delay);
      }
    } else {
      setShouldRender(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, delay, isHeavyMutation]);

  return (
    <>
      {/* Sleek Non-intrusive Top Accent Progress Bar (instant feedback without screen flicker) */}
      {isVisible && (
        <div className="saas-top-progress-container">
          <div className="saas-top-progress-bar"></div>
        </div>
      )}

      {/* Full-screen backdrop overlay only for heavy mutations or requests taking >180ms */}
      {shouldRender && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center saas-overlay-fade-in"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 99999,
          }}
        >
          <div 
            className="text-center p-4 rounded-4 shadow-lg border border-white border-opacity-20" 
            style={{ 
              minWidth: '220px', 
              background: 'rgba(15, 23, 42, 0.85)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <div className="spinner-border text-info mb-3" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="text-white fw-bold mb-1" style={{ fontSize: '0.92rem', letterSpacing: '0.3px' }}>{message}</h6>
            <small className="text-white-50" style={{ fontSize: '11px' }}>Powered by Cipra Infotech</small>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingOverlay;
