import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Top Info section */}
        <div className="footer-brand-section">
          <h2 className="footer-title">Employee Leave Management System</h2>
          <p className="footer-description">
            A secure, scalable, and production-ready HR platform built with modern web technologies.
          </p>
          <div className="footer-tech-stack">
            <span>React</span>
            <span className="dot">•</span>
            <span>Node.js</span>
            <span className="dot">•</span>
            <span>Express.js</span>
            <span className="dot">•</span>
            <span>PostgreSQL (Supabase)</span>
            <span className="dot">•</span>
            <span>JWT</span>
            <span className="dot">•</span>
            <span>Swagger</span>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Contact & Location Grid */}
        <div className="footer-contact-grid">
          {/* Location Block */}
          <div className="contact-card location">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="contact-details">
              <h4>Corporate Office</h4>
              <p>704, 2nd Cross Rd, HRBR Layout 1st Block,</p>
              <p>Subbaiahnapalya, Banaswadi, Bengaluru,</p>
              <p>Karnataka, 560043</p>
            </div>
          </div>

          {/* Contact Methods Block */}
          <div className="contact-card contact-info">
            <div className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="contact-details">
              <h4>Contact Details</h4>
              <p className="contact-interactive">
                <a href="tel:+919746333383" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>+91 9746 333 383</a>
              </p>
              <p className="contact-interactive">
                <a href="mailto:hello@zollid.in">hello@zollid.in</a>
              </p>
              <p className="contact-interactive">
                <a href="https://www.zollid.in" target="_blank" rel="noopener noreferrer">www.zollid.in</a>
              </p>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Security checklist section */}
        <div className="footer-security-section">
          <div className="security-header">
            <span className="security-icon">🛡️</span>
            <h3>Security Architecture</h3>
          </div>
          <p className="security-subtitle">Designed following OWASP Top 10:2025 security best practices.</p>
          <div className="security-grid">
            <div className="security-item">
              <span className="check-mark">✓</span> JWT Authentication
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Role-Based Access Control (RBAC)
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> bcrypt Password Hashing
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Input Validation
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> SQL Injection Protection
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Secure File Upload Validation
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> HTTP Security Headers
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Rate Limiting
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Centralized Error Handling
            </div>
            <div className="security-item">
              <span className="check-mark">✓</span> Audit Logging
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Bottom meta links section */}
        <div className="footer-bottom-section">
          <div className="footer-meta-top">
            <span className="footer-version">Version 1.0.0</span>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <span className="dot">•</span>
              <a href="#terms">Terms of Service</a>
              <span className="dot">•</span>
              <a href="/api-docs" target="_blank" rel="noopener noreferrer">API Documentation</a>
              <span className="dot">•</span>
              <a href="#support">Support</a>
            </div>
          </div>
          <div className="footer-meta-bottom">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Employee Leave Management System. All Rights Reserved.
            </p>
            <p className="footer-heart">
              Built with <span className="heart">❤️</span> for secure and scalable enterprise applications.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
