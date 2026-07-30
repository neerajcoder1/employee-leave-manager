import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import TextHoverEffect from '../components/TextHoverEffect';

// Confetti Animation Engine (Dependency-Free Canvas implementation)
const fireConfetti = (type) => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const colors = type === 'Approved' 
    ? ['#7c3aed', '#a78bfa', '#10b981', '#34d399', '#60a5fa']  // Success violet & green
    : ['#ef4444', '#f87171', '#f59e0b', '#fbbf24', '#f43f5e']; // Danger & warning reds

  const particles = [];
  const particleCount = 130;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width / 2,
      y: height + 10,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 15 - 12,
      radius: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // friction
      p.rotation += p.rotationSpeed;

      if (p.vy > 0) {
        p.opacity -= 0.015;
      }

      if (p.opacity > 0 && p.y < height && p.x > 0 && p.x < width) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(update);
    } else {
      canvas.remove();
    }
  }

  update();
};

// Skeleton Loading Component for Manager Dashboard
const ManagerSkeleton = () => (
  <div className="dashboard-container">
    <header className="navbar skeleton-pulse" style={{ height: '64px', marginBottom: '2rem' }}></header>
    <div className="metrics-row">
      <div className="card-panel skeleton-pulse" style={{ height: '90px' }}></div>
      <div className="card-panel skeleton-pulse" style={{ height: '90px' }}></div>
      <div className="card-panel skeleton-pulse" style={{ height: '90px' }}></div>
      <div className="card-panel skeleton-pulse" style={{ height: '90px' }}></div>
    </div>
    <div className="card-panel skeleton-pulse" style={{ height: '400px' }}></div>
  </div>
);

const ManagerDashboard = () => {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'employees'
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Filters, Searches & Sorts States
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeSortBy, setEmployeeSortBy] = useState('username'); // 'username', 'newest', 'annual'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Decision Modal State (Approve/Reject Confirmation overlay)
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionType, setDecisionType] = useState(''); // 'Approved' or 'Rejected'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Document Viewer Modal State
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch All Leaves
      const leavesRes = await fetch('/api/manager/leaves', { headers });
      const leavesData = await leavesRes.json();

      // Fetch All Employees
      const employeesRes = await fetch('/api/manager/employees', { headers });
      const employeesData = await employeesRes.json();

      if (leavesData.success) {
        setLeaves(leavesData.data);
      }
      if (employeesData.success) {
        setEmployees(employeesData.data);
      }
    } catch (err) {
      console.error('Error fetching manager dashboard data:', err);
      addToast('error', 'Sync Failure', 'Failed to retrieve leave requests or employee lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Open decision remarks confirmation modal
  const openDecisionModal = (leave, type) => {
    setSelectedLeave(leave);
    setDecisionType(type);
    setRemarks('');
    setModalError('');
  };

  // Submit Approval/Rejection status change
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/manager/leaves/${selectedLeave.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: decisionType,
          managerRemarks: remarks.trim()
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update leave request status.');
      }

      addToast(
        decisionType === 'Approved' ? 'success' : 'info', 
        'Request Processed', 
        `Leave request has been successfully ${decisionType.toLowerCase()}.`
      );

      // Fire the confetti animation!
      fireConfetti(decisionType);

      // Reset Modal States
      setSelectedLeave(null);
      setDecisionType('');
      setRemarks('');

      fetchData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Mock Department generation (makes directory look like a real SaaS product)
  const getMockDepartment = (username, index) => {
    const depts = ['Engineering', 'Product Management', 'Design', 'QA', 'Marketing', 'Customer Support'];
    return depts[index % depts.length];
  };

  // Helper for Mock Job Title generation
  const getMockTitle = (username, index) => {
    const titles = ['Software Engineer', 'Product Designer', 'QA Automation Engineer', 'Specialist', 'Technical Lead', 'Product Manager'];
    return titles[index % titles.length];
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  // Render Document Preview Modal Content
  const renderPreviewContent = (docPath) => {
    const ext = docPath.substring(docPath.lastIndexOf('.')).toLowerCase();
    const fullPath = `/${docPath}?token=${token}`;

    if (ext === '.pdf') {
      return <iframe src={fullPath} className="doc-preview-iframe" title="PDF Preview"></iframe>;
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      return <img src={fullPath} className="doc-preview-img" alt="Document Preview" />;
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Word Document Preview Unsupported</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You can download this file directly using the button below.</div>
          </div>
        </div>
      );
    }
  };

  // Metrics computation for summary cards
  const pendingRequestsCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;
  const totalEmployeesCount = employees.length;

  // Filter & Search leave applications
  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch = l.username.toLowerCase().includes(searchQuery.toLowerCase()) || l.leave_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter & Search employee directory
  const filteredEmployees = employees
    .filter((e) => e.username.toLowerCase().includes(employeeSearchQuery.toLowerCase()))
    .sort((a, b) => {
      if (employeeSortBy === 'username') return a.username.localeCompare(b.username);
      if (employeeSortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (employeeSortBy === 'annual') return b.annual_leave - a.annual_leave;
      return 0;
    });

  // Pagination boundaries
  const totalPages = Math.ceil((activeTab === 'requests' ? filteredLeaves : filteredEmployees).length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  
  const currentLeavesRows = filteredLeaves.slice(indexOfFirstRow, indexOfLastRow);
  const currentEmployeesRows = filteredEmployees.slice(indexOfFirstRow, indexOfLastRow);

  // Sync page state on filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, employeeSearchQuery, statusFilter, employeeSortBy]);

  if (loading) {
    return <ManagerSkeleton />;
  }

  return (
    <div className="dashboard-container">
      {/* Toast Mount */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            title={t.title}
            message={t.message}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* SaaS Navigation Header */}
      <header className="navbar">
        <div className="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Zollid Leave
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setIsProfileModalOpen(true)}
            title="View Profile"
            className="navbar-profile-trigger"
          >
            <span className="avatar-initials" style={{ background: 'var(--accent-glow)', color: 'var(--accent-hover)', border: '1px solid var(--accent-color)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>AD</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', transition: 'color 0.2s ease' }}>Admin Manager</span>
              <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', marginTop: '2px' }}>
                Manager
              </span>
            </div>
          </div>
          
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ marginLeft: '0.5rem' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Manager Welcome Banner */}
      <section className="card-panel blur-reveal" style={{ padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Hover below to reveal
        </span>
        <div style={{ maxWidth: '440px', margin: '0.5rem auto 1rem auto' }}>
          <TextHoverEffect text="MANAGER" strokeWidth={0.5} opacity={0.75} />
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.025em', marginTop: 0 }}>
          Welcome back, Admin! 👋
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', maxWidth: '600px', margin: '0.5rem auto 0.25rem auto', lineHeight: 1.5 }}>
          Security Hardened HR Control Portal. Manage active leave allocations, review pending requests, and track audit logs.
        </p>
      </section>

      {/* Summary metric cards (SaaS Dashboard layout) */}
      <section className="metrics-row">
        <div className="card-panel metric-mini-card" style={{ borderLeft: '3px solid var(--warning-color)' }}>
          <div className="metric-mini-title">Pending Requests</div>
          <div className="metric-mini-value" style={{ color: 'var(--warning-color)' }}>{pendingRequestsCount}</div>
        </div>

        <div className="card-panel metric-mini-card" style={{ borderLeft: '3px solid var(--success-color)' }}>
          <div className="metric-mini-title">Total Approved</div>
          <div className="metric-mini-value" style={{ color: 'var(--success-color)' }}>{approvedCount}</div>
        </div>

        <div className="card-panel metric-mini-card" style={{ borderLeft: '3px solid var(--danger-color)' }}>
          <div className="metric-mini-title">Total Rejected</div>
          <div className="metric-mini-value" style={{ color: 'var(--danger-color)' }}>{rejectedCount}</div>
        </div>

        <div className="card-panel metric-mini-card" style={{ borderLeft: '3px solid var(--accent-color)' }}>
          <div className="metric-mini-title">Total Employees</div>
          <div className="metric-mini-value" style={{ color: 'var(--accent-hover)' }}>{totalEmployeesCount}</div>
        </div>
      </section>

      {/* Tab select bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <button 
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('requests')}
        >
          📁 Review Applications ({pendingRequestsCount})
        </button>
        <button 
          className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('employees')}
        >
          👥 Employee Directory ({totalEmployeesCount})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'requests' ? (
        /* Leave applications review panel */
        <section className="card-panel" style={{ padding: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Review Leave Applications</h2>

          {/* Search, filters, and tables header row */}
          <div className="table-filters-row">
            <div className="filters-group">
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  className={`btn-filter-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="search-input-wrapper" style={{ minWidth: '280px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-control"
                placeholder="Search by employee or leave type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="empty-state" style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '3.5rem 1rem' }}>
              <div className="empty-state-icon">📥</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.25rem' }}>No leave requests found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0.25rem auto' }}>
                There are no leave applications matching your filter criteria in the system.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="custom-table sticky-header">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLeavesRows.map((leave) => {
                      const duration = Math.round((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={leave.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span className="avatar-initials" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>{getInitials(leave.username)}</span>
                              <span style={{ fontWeight: '600' }}>{leave.username}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: '500' }}>{leave.leave_type}</td>
                          <td>
                            {new Date(leave.start_date).toLocaleDateString()} – {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td>{duration} {duration === 1 ? 'day' : 'days'}</td>
                          <td style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={leave.reason}>
                            {leave.reason}
                          </td>
                          <td>
                            {leave.document_path ? (
                              <button
                                type="button"
                                className="auth-link"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                onClick={() => setPreviewDocument(leave.document_path)}
                              >
                                📎 Preview
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-${leave.status.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td>
                            {leave.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.75rem', borderColor: 'var(--success-border)', color: 'var(--success-color)' }}
                                  onClick={() => openDecisionModal(leave, 'Approved')}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.75rem', borderColor: 'var(--danger-border)', color: 'var(--danger-color)' }}
                                  onClick={() => openDecisionModal(leave, 'Rejected')}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', maxWidth: '140px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={leave.manager_remarks}>
                                {leave.manager_remarks || 'No remarks.'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <span>
                  Showing <strong>{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredLeaves.length)}</strong> of <strong>{filteredLeaves.length}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        /* Employee Directory panel with mock SaaS extensions */
        <section className="card-panel" style={{ padding: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Employee Directory</h2>

          {/* Search and Sort row */}
          <div className="table-filters-row" style={{ marginBottom: '1.5rem' }}>
            <div className="search-input-wrapper" style={{ minWidth: '320px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-control"
                placeholder="Search employees by name..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort by:</span>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '150px' }}
                value={employeeSortBy}
                onChange={(e) => setEmployeeSortBy(e.target.value)}
              >
                <option value="username">Alphabetical (A-Z)</option>
                <option value="newest">Join Date</option>
                <option value="annual">Remaining Annual</option>
              </select>
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="empty-state" style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '3.5rem 1rem' }}>
              <div className="empty-state-icon">👥</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.25rem' }}>No employees found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0.25rem auto' }}>
                There are no employee registrations in the system matching your search.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Job Title</th>
                      <th>Department</th>
                      <th>Annual Leave</th>
                      <th>Sick Leave</th>
                      <th>Maternity Leave</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployeesRows.map((emp, index) => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span className="avatar-initials" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>{getInitials(emp.username)}</span>
                              <span style={{ fontWeight: '600' }}>{emp.username}</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '34px', marginTop: '2px' }}>
                              {emp.username.toLowerCase()}@gcu.in
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{getMockTitle(emp.username, index)}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{getMockDepartment(emp.username, index)}</span>
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--accent-hover)' }}>{emp.annual_leave} days</td>
                        <td style={{ fontWeight: '600', color: 'var(--success-color)' }}>{emp.sick_leave} days</td>
                        <td style={{ fontWeight: '600', color: 'var(--warning-color)' }}>{emp.maternity_leave} days</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => addToast('info', 'Employee Detail', `Contact info: ${emp.username.toLowerCase()}@gcu.in | Job: ${getMockTitle(emp.username, index)}`)}
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <span>
                  Showing <strong>{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Confirmation & Remarks Modal Overlay */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Decision</h2>
              <button className="modal-close" onClick={() => setSelectedLeave(null)}>&times;</button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.015)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                Employee: <strong>{selectedLeave.username}</strong>
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                Category: <strong>{selectedLeave.leave_type} Leave</strong>
              </div>
              <div>
                Dates: <strong>{new Date(selectedLeave.start_date).toLocaleDateString()} to {new Date(selectedLeave.end_date).toLocaleDateString()}</strong>
              </div>
            </div>

            {modalError && (
              <div className="toast error" style={{ minWidth: 'auto', marginBottom: '1.25rem', padding: '0.75rem 1rem', animation: 'none' }}>
                <div className="toast-content">
                  <div className="toast-message" style={{ fontSize: '0.8rem' }}>{modalError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleDecisionSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Review Comment / Remarks</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder={decisionType === 'Approved' ? 'Enter approval comments (optional)...' : 'Reason for rejection (required)...'}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  maxLength={500}
                  required={decisionType === 'Rejected'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedLeave(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn ${decisionType === 'Approved' ? 'btn-primary' : 'btn-danger'}`}
                  disabled={submitting}
                  style={decisionType === 'Approved' ? { background: 'var(--text-primary)', color: 'var(--bg-app)', gap: '0.5rem' } : { gap: '0.5rem' }}
                >
                  {submitting && <span className="spinner"></span>}
                  {submitting ? 'Processing...' : `Confirm ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Document Previewer Modal */}
      {previewDocument && (
        <div className="modal-overlay" onClick={() => setPreviewDocument(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Document Preview</h2>
              <button className="modal-close" onClick={() => setPreviewDocument(null)}>&times;</button>
            </div>

            <div className="doc-preview-body">
              {renderPreviewContent(previewDocument)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <a 
                href={`/${previewDocument}?token=${token}`} 
                download
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none', color: 'var(--bg-app)' }}
              >
                📥 Download Document
              </a>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPreviewDocument(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manager Profile</h2>
              <button className="modal-close" onClick={() => setIsProfileModalOpen(false)}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', padding: '1rem 0' }}>
              <div 
                className="avatar-initials" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  fontSize: '2rem', 
                  background: 'var(--accent-glow)', 
                  color: 'var(--accent-hover)', 
                  border: '2px solid var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                AD
              </div>

              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem', marginTop: 0 }}>
                  Admin Manager
                </h3>
                <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'rgba(0,193,106,0.1)', color: 'var(--success-color)', border: '1px solid rgba(0,193,106,0.2)' }}>
                  Manager Portal Access
                </span>
              </div>

              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Login Email:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>manager@gcu.in</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Role Privilege:</span>
                  <span style={{ color: 'var(--accent-hover)', fontWeight: '600' }}>System Administrator</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Security Level:</span>
                  <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>🛡️ OWASP Hardened</span>
                </div>
              </div>

              <div style={{ width: '100%', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)', marginTop: 0 }}>Portal Statistics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: '500' }}>Managed Employees</span>
                    <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)' }}>{totalEmployeesCount} members</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: '500' }}>Total Reviews Decided</span>
                    <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)' }}>{approvedCount + rejectedCount} applications</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsProfileModalOpen(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
