import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Monitor, CheckCircle, Clock, RefreshCw, ServerCrash } from 'lucide-react';

const STAGES = [
  "Initializing application...",
  "Contacting backend service...",
  "Backend is waking up (Render Free cold start)...",
  "Secure connection established...",
  "Loading employee data...",
  "Application ready."
];

// Particle configuration for the background
const generateParticles = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * -20,
  }));
};

const PremiumLoader = ({ isBackendReady, onRetry, isRetrying }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [particles] = useState(() => generateParticles(30));

  // Handle stage progression based on time and backend readiness
  useEffect(() => {
    let timeoutIds = [];

    if (isBackendReady) {
      // Fast forward stages if backend is ready
      setCurrentStage(3);
      timeoutIds.push(setTimeout(() => setCurrentStage(4), 400));
      timeoutIds.push(setTimeout(() => setCurrentStage(5), 1000));
    } else if (!hasTimedOut) {
      // Initial local stages
      timeoutIds.push(setTimeout(() => setCurrentStage(1), 800));
      timeoutIds.push(setTimeout(() => setCurrentStage(2), 1600));
      
      // Setup timeout failure after 45 seconds
      timeoutIds.push(
        setTimeout(() => {
          if (!isBackendReady) {
            setHasTimedOut(true);
          }
        }, 45000)
      );
    }

    return () => timeoutIds.forEach(clearTimeout);
  }, [isBackendReady, hasTimedOut]);

  // Handle retry logic
  useEffect(() => {
    let retryInterval;
    if (hasTimedOut && !isBackendReady) {
      retryInterval = setInterval(() => {
        onRetry();
      }, 5000); // Auto-retry every 5 seconds
    }
    return () => clearInterval(retryInterval);
  }, [hasTimedOut, isBackendReady, onRetry]);

  const handleManualRetry = () => {
    onRetry();
  };

  return (
    <div className="premium-loader-overlay" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--bg-app)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      color: 'var(--text-primary)'
    }}>
      
      {/* Animated Grid Background */}
      <div className="loader-grid-bg" style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0, 193, 106, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 193, 106, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: 'center',
        zIndex: 0,
        opacity: 0.5
      }} />

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            opacity: 0.3,
            zIndex: 1,
          }}
          animate={{
            y: ['0vh', '-100vh'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', padding: '2rem' }}>
        
        {/* Animated Network Diagram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', width: '100%' }}>
          
          {/* Frontend Node */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="loader-node"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
          >
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Monitor size={32} color="var(--text-primary)" />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CLIENT</span>
          </motion.div>

          {/* Connection Line 1 */}
          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
              animate={{ x: ['-40px', '200px'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* API Server Node */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}
          >
            <motion.div 
              animate={hasTimedOut ? {} : { boxShadow: ['0 0 0px var(--accent-glow)', '0 0 20px var(--accent-glow)', '0 0 0px var(--accent-glow)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                padding: '1.25rem', 
                background: hasTimedOut ? 'rgba(244, 63, 94, 0.1)' : 'var(--accent-glow)', 
                borderRadius: '16px', 
                border: `2px solid ${hasTimedOut ? 'var(--danger-color)' : 'var(--accent-color)'}`,
                position: 'relative'
              }}
            >
              {hasTimedOut ? <ServerCrash size={40} color="var(--danger-color)" /> : <Server size={40} color="var(--accent-hover)" />}
            </motion.div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: hasTimedOut ? 'var(--danger-color)' : 'var(--accent-color)' }}>
              {hasTimedOut ? 'UNREACHABLE' : 'RENDER SERVER'}
            </span>
          </motion.div>

          {/* Connection Line 2 */}
          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence>
              {isBackendReady && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--success-color)' }}
                />
              )}
            </AnimatePresence>
            {!isBackendReady && (
              <motion.div
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
                animate={{ x: ['-40px', '200px'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>

          {/* Database Node */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
          >
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Database size={32} color={isBackendReady ? "var(--success-color)" : "var(--text-secondary)"} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DATABASE</span>
          </motion.div>

        </div>

        {/* Status Stages */}
        <div style={{ width: '100%', maxWidth: '360px', marginBottom: '2.5rem' }}>
          {STAGES.map((stage, index) => {
            const isCompleted = currentStage > index;
            const isActive = currentStage === index && !hasTimedOut;
            const isVisible = currentStage >= index || index <= 2; // Always show first 3

            if (!isVisible) return null;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isActive || isCompleted ? 1 : 0.4, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                  color: isCompleted ? 'var(--text-primary)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                  {isCompleted ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle size={18} color="var(--success-color)" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ width: '14px', height: '14px', border: '2px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
                    />
                  ) : (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
                  )}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 500 : 400 }}>{stage}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Timeout / Retry State */}
        <AnimatePresence>
          {hasTimedOut && !isBackendReady && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(244, 63, 94, 0.05)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                width: '100%',
                marginBottom: '2rem'
              }}
            >
              <h3 style={{ color: 'var(--danger-color)', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Backend Unreachable</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                The backend service is taking longer than expected to wake up. We are automatically retrying.
              </p>
              <button
                onClick={handleManualRetry}
                disabled={isRetrying}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: 'var(--danger-color)', borderColor: 'var(--danger-color)', color: 'white' }}
              >
                {isRetrying ? <RefreshCw size={16} className="spin-animation" /> : <RefreshCw size={16} />}
                {isRetrying ? "Retrying..." : "Retry Connection"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Honest Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            maxWidth: '480px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <Clock size={20} color="var(--text-secondary)" />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Cold Start Notice</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The first request may take up to <strong>30 seconds</strong> because the backend uses Render Free hosting. Subsequent requests will be much faster.
            </p>
          </div>
        </motion.div>

      </div>
      
      {/* Required spin animation for retry button */}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PremiumLoader;
