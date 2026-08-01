import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    title: 'How do I log in or register?',
    content: 'You can register a new Employee account using the "Register here" link. Manager credentials are provided in a secure document that only authorized personnel can access.'
  },
  {
    title: 'How many leaves am I allocated?',
    content: 'Each employee starts with 15 days of Annual Leave and 10 days of Sick Leave. Balances are deducted automatically upon approval.'
  },
  {
    title: 'Can I upload supporting documents?',
    content: 'Yes! When submitting a leave request, you can drag and drop or upload PDF, Word documents, or images (up to 5MB) as proof.'
  },
  {
    title: 'Who processes my leave applications?',
    content: 'The Manager reviews all incoming requests, enters custom decision remarks, and approves or rejects requests in real-time.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container blur-reveal" style={{ animationDelay: '400ms' }}>
      <h3 className="faq-title">Frequently Asked Questions</h3>
      <div>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="accordion-item">
              <button 
                type="button" 
                className="accordion-btn"
                onClick={() => toggleIndex(index)}
              >
                <span>{item.title}</span>
                <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div className={`accordion-panel ${isOpen ? 'open' : ''}`}>
                <div style={{ paddingRight: '1rem' }}>{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQ;
