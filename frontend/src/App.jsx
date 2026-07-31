import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Footer from './components/Footer';

// Glowing Tetris grid block background component using Canvas
const TetrisBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const shapes = [
      [[1, 1], [1, 1]], // O
      [[1, 1, 1, 1]],   // I
      [[0, 1, 0], [1, 1, 1]], // T
      [[1, 0, 0], [1, 1, 1]], // L
      [[0, 0, 1], [1, 1, 1]], // J
      [[0, 1, 1], [1, 1, 0]], // S
      [[1, 1, 0], [0, 1, 1]]  // Z
    ];

    const blockSize = 24; 
    const blocks = [];

    const columns = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);

    // Seed initial drift blocks
    for (let i = 0; i < 25; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const x = Math.floor(Math.random() * (columns - 4)) * blockSize;
      const y = Math.floor(Math.random() * (rows - 4)) * blockSize;
      blocks.push({ shape, x, y, opacity: Math.random() * 0.02 + 0.01 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle background grid lines
      ctx.strokeStyle = 'rgba(0, 193, 106, 0.012)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += blockSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += blockSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Tetris blocks
      blocks.forEach(b => {
        ctx.fillStyle = `rgba(0, 193, 106, ${b.opacity})`;
        ctx.strokeStyle = `rgba(0, 193, 106, ${b.opacity * 2})`;
        ctx.lineWidth = 1;

        b.shape.forEach((row, ri) => {
          row.forEach((col, ci) => {
            if (col === 1) {
              const px = b.x + ci * blockSize;
              const py = b.y + ri * blockSize;
              ctx.fillRect(px, py, blockSize, blockSize);
              ctx.strokeRect(px + 0.5, py + 0.5, blockSize - 1, blockSize - 1);
            }
          });
        });
      });
    };

    draw();

    let animationFrameId;
    const animate = () => {
      blocks.forEach(b => {
        b.y += 0.08; 
        if (b.y > height) {
          b.y = -blockSize * 4;
          b.x = Math.floor(Math.random() * (columns - 4)) * blockSize;
          b.opacity = Math.random() * 0.02 + 0.01;
        }
      });
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.85
      }}
    />
  );
};

const WelcomeScreen = ({ user, onComplete }) => {
  const [greeting, setGreeting] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const messages = [
    "Authenticating credentials...",
    "Securing connection...",
    "Loading your dashboard...",
    "Fetching your records...",
    "final_greeting"
  ];

  useEffect(() => {
    if (messageIndex < messages.length - 1) {
      // Switch to the next loading message every 700ms
      const timer = setTimeout(() => setMessageIndex(i => i + 1), 700);
      return () => clearTimeout(timer);
    } else {
      // Hold the final greeting for 1.5 seconds, then load the dashboard
      const timer = setTimeout(() => onComplete(), 1500);
      return () => clearTimeout(timer);
    }
  }, [messageIndex, messages.length, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        <h1 
          key={messageIndex} // Key forces the fade-in animation to run every time the text changes
          className="blur-reveal" 
          style={{ 
            fontSize: messageIndex === messages.length - 1 ? '2.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: messageIndex === messages.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)', 
            letterSpacing: '-0.02em', 
            textAlign: 'center', 
            animationDuration: '0.4s' 
          }}
        >
          {messageIndex === messages.length - 1 ? (
            <>{greeting}, <span style={{ color: 'var(--accent-color)' }}>{user.username}</span></>
          ) : (
            messages[messageIndex]
          )}
        </h1>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    </div>
  );
};

/**
 * Main Layout Routing Manager
 */
const NavigationGateway = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [showWelcome, setShowWelcome] = useState(true);

  // Reset the welcome screen state when a user logs out
  // This ensures the animation plays every time someone logs in
  useEffect(() => {
    if (!user) {
      setShowWelcome(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="logo" style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite' }}>
          Loading Zollid Leave Portal...
        </div>
      </div>
    );
  }

  // Gateway logic: check auth states and roles
  if (user) {
    if (showWelcome) {
      return <WelcomeScreen user={user} onComplete={() => setShowWelcome(false)} />;
    }

    if (user.role === 'manager') {
      return <ManagerDashboard />;
    }
    return <EmployeeDashboard />;
  }

  // Fallback to unauthenticated login/register views (with footer)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {currentView === 'register' ? (
          <Register onNavigate={setCurrentView} />
        ) : (
          <Login onNavigate={setCurrentView} />
        )}
      </div>
      <Footer />
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TetrisBackground />
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <div className={`theme-icon-wrapper ${theme}`}>
            {/* Sun icon */}
            <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            {/* Moon icon */}
            <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
        </button>
        <NavigationGateway />
      </div>
    </AuthProvider>
  );
}

export default App;
