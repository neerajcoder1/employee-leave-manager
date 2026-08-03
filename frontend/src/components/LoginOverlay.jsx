import React, { useEffect, useState, useRef } from 'react';

const LoginOverlay = ({ isActive }) => {
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    let timer;
    if (isActive) {
      setCountdown(45);
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  let statusText = `WAKING SERVER: ${countdown}s`;
  if (countdown <= 4) {
    statusText = "ALMOST DONE...";
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
          filter: 'blur(8px) brightness(0.9)',
          transform: 'scale(1.05)' // prevents blur edges
        }}
        src="https://cdn.magicui.design/ocean-small.webm"
      />

      {/* Text Mask Layer */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          color: '#fff',
          mixBlendMode: 'multiply',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <h1 
          style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            margin: 0,
            textTransform: 'uppercase',
            textAlign: 'center'
          }}
        >
          Zollid Leave Portal
        </h1>
        <div style={{ 
          marginTop: '1.5rem', 
          fontSize: '1.5rem', 
          fontWeight: 600, 
          letterSpacing: '3px',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {statusText}
          <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px', borderColor: '#fff transparent transparent transparent' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoginOverlay;
