import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      padding: '1.5rem', 
      textAlign: 'center', 
      borderTop: '1px solid var(--border-color)', 
      marginTop: 'auto', 
      background: 'transparent'
    }}>
      <p style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-muted)', 
        margin: 0,
        fontWeight: '500'
      }}>
        &copy; {new Date().getFullYear()} Zollid Leave Portal. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
