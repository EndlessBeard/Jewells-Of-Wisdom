import React from 'react';
import './Logo.css';
// prefer the new provided logo; fall back to the original if present
import logoNew from '../assets/logo-new.png';
import logoOld from '../assets/logo.png';
const logoImg = logoNew || logoOld;

// Forward ref so parent components can measure the rendered logo element
const Logo = React.forwardRef(({ label = 'JW', style = {}, className = '' }, ref) => {
  return (
    <div className={`temp-logo ${className}`} style={style} aria-hidden="true" ref={ref}>
      {logoImg ? (
        <img src={logoImg} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div className="temp-logo-label">{label}</div>
      )}
    </div>
  );
});

export default Logo;
