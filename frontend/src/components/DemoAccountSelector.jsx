import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Crown, User } from 'lucide-react';
import { demoAccounts } from '../constants/demoAccounts';

const iconMap = {
  Crown: Crown,
  User: User
};

const DemoAccountSelector = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < demoAccounts.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : demoAccounts.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < demoAccounts.length) {
          handleSelect(demoAccounts[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (account) => {
    onSelect(account);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="demo-account-container" style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="demo-account-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        Demo Account
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="demo-account-dropdown-container"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="listbox"
          >
            <div className="demo-account-header">
              <h3>Select Demo Account</h3>
              <p>Explore different roles without typing credentials.</p>
            </div>
            
            <div className="demo-account-list">
              {demoAccounts.map((account, index) => {
                const IconComponent = iconMap[account.icon] || User;
                const isSelected = activeIndex === index;

                return (
                  <button
                    key={account.id}
                    type="button"
                    className="demo-account-card"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(account)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="demo-icon-wrapper">
                      <IconComponent size={20} />
                    </div>
                    <div className="demo-card-content">
                      <div className="demo-card-title-row">
                        <span className="demo-card-name">{account.displayName}</span>
                        <span className={`demo-card-badge ${account.role.toLowerCase()}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="demo-card-desc">{account.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemoAccountSelector;
