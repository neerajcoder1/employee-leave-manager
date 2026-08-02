import React, { useEffect, useState, useRef } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [serverReady, setServerReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Start reverse number countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Background fetch to wake up the Render server
    const wakeUpServer = async () => {
      const startTime = Date.now();
      try {
        await fetch('https://employee-leave-api-62a7.onrender.com/api/health');
      } catch (err) {
        // ignore errors
      }
      
      // Minimum duration for the splash screen so it's not a glitchy flash if server is already awake
      const elapsed = Date.now() - startTime;
      const minWait = 3500;
      if (elapsed < minWait) {
        await new Promise(res => setTimeout(res, minWait - elapsed));
      }

      if (isMounted.current) {
        setServerReady(true);
        setCountdown(0);
        clearInterval(timer);
        
        // Trigger fade out
        setFadingOut(true);
        setTimeout(() => {
          if (isMounted.current) {
            onComplete();
          }
        }, 500); // Wait for CSS transition
      }
    };

    wakeUpServer();

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [onComplete]);

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
        transition: 'opacity 0.5s ease',
        opacity: fadingOut ? 0 : 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        pointerEvents: 'none'
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
          zIndex: 1
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
          fontFamily: 'monospace'
        }}>
          {serverReady ? 'SERVER CONNECTED' : `WAKING SERVER: ${countdown}s`}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
