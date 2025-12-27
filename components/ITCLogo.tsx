
import React from 'react';

interface Props {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

const ITCLogo: React.FC<Props> = ({ className = "w-12 h-12", variant = 'color' }) => {
  const getColors = () => {
    switch (variant) {
      case 'light':
        return '#FFFFFF';
      case 'dark':
        return '#0F172A'; // Slate 900
      case 'color':
        return '#002a5c'; // Official ITC Blue
      default:
        return '#002a5c';
    }
  };

  const mainColor = getColors();

  return (
    <svg 
      viewBox="0 0 400 320" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill={mainColor}>
        {/* Left Wing of the Triangle Mark */}
        <path d="M194 54L85 218H165L194 135V54Z" />
        
        {/* Right Wing of the Triangle Mark */}
        <path d="M206 54L315 218H235L206 135V54Z" />
        
        {/* "ITC" Stylized Wordmark */}
        <text 
          x="200" 
          y="214" 
          textAnchor="middle" 
          style={{ 
            fontSize: '68px', 
            fontWeight: 900, 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            letterSpacing: '-0.02em'
          }}
        >
          ITC
        </text>
        
        {/* Base Bar */}
        <rect x="115" y="222" width="170" height="10" rx="1" />
        
        {/* "ITC Limited" Serif Text */}
        <text 
          x="200" 
          y="275" 
          textAnchor="middle" 
          style={{ 
            fontSize: '38px', 
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.01em'
          }}
        >
          ITC Limited
        </text>
      </g>
    </svg>
  );
};

export default ITCLogo;
