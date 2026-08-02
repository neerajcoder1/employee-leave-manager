import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 🚀 BACKGROUND WAKE UP PING
    // Fire and forget a ping to the Render backend to wake it up during the splash screen!
    fetch('https://employee-leave-api-62a7.onrender.com/api/health')
      .catch(() => {}); // ignore errors, we just want to hit the server

    // Show splash for 3.5 seconds, then start fading out
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 3500);

    // Call onComplete after the fade out transition finishes (500ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
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
      </div>
    </div>
  );
};

export default SplashScreen;
