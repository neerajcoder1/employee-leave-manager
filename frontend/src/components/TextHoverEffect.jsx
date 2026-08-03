import React, { useRef, useState } from 'react';

/**
 * TextHoverEffect Component
 * Renders an SVG spotlight text mask that reveals colorful gradients on mouse hover
 */
const TextHoverEffect = ({ text = "WELCOME", strokeWidth = 0.5, opacity = 0.75 }) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Scale standard mouse coordinates inside the SVG viewBox mapping
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x, y });
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 22"
      className="text-hover-effect-svg"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Reset spotlight to center
        setCursor({ x: 50, y: 50 });
      }}
      style={{
        width: '100%',
        height: 'auto',
        userSelect: 'none',
        cursor: 'default'
      }}
    >
      <defs>
        {/* Emerald to Purple glowing gradient for revealed text */}
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00C16A" />
          <stop offset="50%" stopColor="#8A2BE2" />
          <stop offset="100%" stopColor="#00C16A" />
        </linearGradient>

        {/* Dynamic radial gradient mask following cursor */}
        <radialGradient
          id="spotlightMask"
          cx={`${cursor.x}%`}
          cy={`${cursor.y}%`}
          r={isHovered ? "28%" : "0%"}
          gradientUnits="userSpaceOnUse"
          style={{
            transition: 'r 0.3s ease'
          }}
        >
          <stop offset="0%" stopColor="white" stopOpacity={opacity} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100"
            height="22"
            fill="url(#spotlightMask)"
          />
        </mask>
      </defs>

      {/* Dark/Light theme styled background strokes */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        stroke="var(--text-muted)"
        strokeWidth={strokeWidth}
        fill="transparent"
        style={{
          fontFamily: '"Outfit", "Inter", sans-serif',
          fontWeight: '900',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          transition: 'stroke 0.3s ease',
          opacity: 0.5
        }}
      >
        {text}
      </text>

      {/* Spotlight revealed text fill layer */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--hero-hover-text)"
        mask="url(#textMask)"
        style={{
          fontFamily: '"Outfit", "Inter", sans-serif',
          fontWeight: '900',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          pointerEvents: 'none'
        }}
      >
        {text}
      </text>
    </svg>
  );
};

export default TextHoverEffect;
