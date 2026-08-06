import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import TextHoverEffect from "../components/TextHoverEffect";
import ThemeToggle from "../components/ThemeToggle";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  CheckCircle, Users, History, FileText, XCircle, Clock, Calendar, ShieldAlert 
} from 'lucide-react';

// Confetti Animation Engine (Dependency-Free Canvas implementation)
const fireConfetti = (type) => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors =
    type === "Approved"
      ? ["#7c3aed", "#a78bfa", "#10b981", "#34d399", "#60a5fa"] // Success violet & green
      : ["#ef4444", "#f87171", "#f59e0b", "#fbbf24", "#f43f5e"]; // Danger & warning reds

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
      opacity: 1,
    });
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach((p) => {
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
        ctx.rotate((p.rotation * Math.PI) / 180);
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
    <header
      className="navbar skeleton-pulse"
      style={{ height: "64px", marginBottom: "2rem" }}
    ></header>
    <div className="metrics-row">
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "90px" }}
      ></div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "90px" }}
      ></div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "90px" }}
      ></div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "90px" }}
      ></div>
    </div>
    <div
      className="card-panel skeleton-pulse"
      style={{ height: "400px" }}
    ></div>
  </div>
);

const popSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
popSound.preload = 'auto';

const ManagerDashboard = () => {
  const { token, logout, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const pendingCountRef = React.useRef(-1);
  const pollerRef = React.useRef(null);

  // Filters, Searches & Sorts States
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeSortBy, setEmployeeSortBy] = useState("username"); // 'username', 'newest', 'annual'
  const [viewEmployeeProfile, setViewEmployeeProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Decision Modal State (Approve/Reject Confirmation overlay)
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionType, setDecisionType] = useState(""); // 'Approved' or 'Rejected'
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingLeaveId, setDeletingLeaveId] = useState(null);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [modalError, setModalError] = useState("");

  // Document Viewer Modal State
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle', 'downloading', 'success', 'error'
  const [downloadProgress, setDownloadProgress] = useState(0);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch All Leaves
      const leavesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/manager/leaves`,
        { headers },
      );
      const leavesData = await leavesRes.json();

      // Fetch All Employees
      const employeesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/manager/employees`,
        { headers },
      );
      const employeesData = await employeesRes.json();

      if (leavesData.success) {
        setLeaves(leavesData.data);
        
        const pendingLeaves = leavesData.data.filter(l => l.status === 'Pending');
        const currentPending = pendingLeaves.length;
        
        if (pendingCountRef.current === -1) {
          // Initial load: populate notifications with all currently pending leaves
          const initialNotifs = pendingLeaves.map(l => ({ 
            message: `Pending request from ${l.username || 'Employee'}` 
          }));
          setNotifications(initialNotifs.slice(0, 20));
        } else if (currentPending > pendingCountRef.current) {
          // Play sound
          popSound.currentTime = 0;
          popSound.play().catch(e => console.log('Audio playback prevented by browser:', e));
          
          // Add notifications
          const newCount = currentPending - pendingCountRef.current;
          const newNotifs = Array(newCount).fill({ message: "New leave request submitted" });
          setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
          
          // Show popup alert
          addToast("success", "New Request", `${newCount} new leave request${newCount > 1 ? 's' : ''} submitted.`);
        }
        pendingCountRef.current = currentPending;
      }
      if (employeesData.success) {
        setEmployees(employeesData.data);
      }
    } catch (err) {
      console.error("Error fetching manager dashboard data:", err);
      addToast(
        "error",
        "Sync Failure",
        "Failed to retrieve leave requests or employee lists.",
      );
    } finally {
      setLoading(false);
    }
  };

  const checkNewRequests = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const leavesRes = await fetch(`${import.meta.env.VITE_API_URL}/manager/leaves`, { headers });
      const leavesData = await leavesRes.json();

      if (leavesData.success) {
        const pendingLeaves = leavesData.data.filter(l => l.status === 'Pending');
        const currentPending = pendingLeaves.length;

        if (currentPending > pendingCountRef.current) {
          popSound.currentTime = 0;
          popSound.play().catch(e => console.log('Audio playback prevented by browser:', e));
          
          const newCount = currentPending - pendingCountRef.current;
          const newNotifs = Array(newCount).fill({ message: "New leave request submitted" });
          setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
          
          addToast("success", "New Request", `${newCount} new leave request${newCount > 1 ? 's' : ''} submitted.`);
        }
        pendingCountRef.current = currentPending;

        // Only update state if data changed (avoid UI flashing/re-rendering)
        setLeaves(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(leavesData.data)) {
            return leavesData.data;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Background poll error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 5 seconds for real-time notifications
    pollerRef.current = setInterval(() => {
      checkNewRequests();
    }, 5000);

    return () => clearInterval(pollerRef.current);
  }, [token]);

  // Open decision remarks confirmation modal
  const openDecisionModal = (leave, type) => {
    setSelectedLeave(leave);
    setDecisionType(type);
    setRemarks("");
    setModalError("");
  };

  // Submit Approval/Rejection status change
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/manager/leaves/${selectedLeave.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: decisionType,
            managerRemarks: remarks.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update leave request status.",
        );
      }

      addToast(
        decisionType === "Approved" ? "success" : "info",
        "Request Processed",
        `Leave request has been successfully ${decisionType.toLowerCase()}.`,
      );

      // Fire the confetti animation!
      fireConfetti(decisionType);

      // Reset Modal States
      setSelectedLeave(null);
      setDecisionType("");
      setRemarks("");

      fetchData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Leave Request
  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;
    
    setModalError("");
    setSubmitting(true);
    const id = leaveToDelete.id;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/manager/leaves/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete leave request.");
      }

      setLeaveToDelete(null);
      setDeletingLeaveId(id);

      // Animate out by setting a brief timeout before removing from state
      setTimeout(() => {
        setLeaves((prev) => prev.filter((l) => l.id !== id));
        setDeletingLeaveId(null);
        addToast("success", "Deleted", "Leave request has been permanently deleted.");
      }, 400); // 400ms for CSS fade-out animation

    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Custom Download Handler with 3D Animation & Blob fetching
  const handleDownloadDocument = async (docPath) => {
    setDownloadState('downloading');
    setDownloadProgress(0);

    // Simulate progress for the "3D animation" effect
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 150);

    try {
      const response = await fetch(getDocumentUrl(docPath, true), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloadState('success');

      // Trigger actual download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      let filename = "document";
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]+)"/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      } else {
        const pathParts = docPath.split('/');
        filename = pathParts[pathParts.length - 1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Show success toast
      addToast("success", "Download Complete", "The document has been successfully downloaded.");

      // Close modal after a short delay (Redirects to dashboard view)
      setTimeout(() => {
        setDownloadState('idle');
        setPreviewDocument(null);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setDownloadState('error');
      addToast("error", "Download Failed", "Failed to download the document.");
      setTimeout(() => setDownloadState('idle'), 2000);
    }
  };

  // Helper for Mock Department generation (makes directory look like a real SaaS product)
  const getMockDepartment = (username, index) => {
    const depts = [
      "Engineering",
      "Product Management",
      "Design",
      "QA",
      "Marketing",
      "Customer Support",
    ];
    return depts[index % depts.length];
  };

  // Helper for Mock Job Title generation
  const getMockTitle = (username, index) => {
    const titles = [
      "Software Engineer",
      "Product Designer",
      "QA Automation Engineer",
      "Specialist",
      "Technical Lead",
      "Product Manager",
    ];
    return titles[index % titles.length];
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  const getDocumentUrl = (path, download = false) => {
    if (!path) return "";
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}?token=${token}${download ? '&download=1' : ''}`;
  };

  // Render Document Preview Modal Content
  const renderPreviewContent = (docPath) => {
    const ext = docPath.substring(docPath.lastIndexOf(".")).toLowerCase();
    const fullPath = getDocumentUrl(docPath);

    if (ext === ".pdf") {
      return (
        <iframe
          src={fullPath}
          className="doc-preview-iframe"
          title="PDF Preview"
        ></iframe>
      );
    } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      return (
        <img
          src={fullPath}
          className="doc-preview-img"
          alt="Document Preview"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      );
    } else {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-secondary)" }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <div>
            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
              Word Document Preview Unsupported
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              You can download this file directly using the button below.
            </div>
          </div>
        </div>
      );
    }
  };

  // Metrics computation for summary cards
  const pendingRequestsCount = leaves.filter(
    (l) => l.status === "Pending",
  ).length;
  const approvedCount = leaves.filter((l) => l.status === "Approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "Rejected").length;
  const totalEmployeesCount = employees.length;

  // Filter & Search leave applications
  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leave_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter & Search employee directory
  const filteredEmployees = employees
    .filter((e) =>
      e.username.toLowerCase().includes(employeeSearchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (employeeSortBy === "username")
        return a.username.localeCompare(b.username);
      if (employeeSortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (employeeSortBy === "annual") return b.annual_leave - a.annual_leave;
      return 0;
    });

  const totalPages =
    Math.ceil(filteredLeaves.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentLeavesRows = filteredLeaves.slice(
    indexOfFirstRow,
    indexOfLastRow,
  );
  const currentEmployeesRows = filteredEmployees.slice(
    indexOfFirstRow,
    indexOfLastRow,
  );

  // Sync page state on filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    employeeSearchQuery,
    statusFilter,
    employeeSortBy,
  ]);

  // --- DERIVED SAAS DATA (Activity & Analytics) ---
  const recentActivity = useMemo(() => {
    return [...leaves]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [leaves]);

  const leaveTypeDistribution = useMemo(() => {
    const counts = { 'Annual Leave': 0, 'Sick Leave': 0, 'Maternity Leave': 0 };
    leaves.forEach(l => {
      if (counts[l.leave_type] !== undefined) counts[l.leave_type]++;
    });
    return [
      { name: 'Annual', value: counts['Annual Leave'] || 0, color: 'var(--accent-color)' },
      { name: 'Sick', value: counts['Sick Leave'] || 0, color: 'var(--warning-color)' },
      { name: 'Maternity', value: counts['Maternity Leave'] || 0, color: 'var(--danger-color)' },
    ].filter(i => i.value > 0);
  }, [leaves]);

  const approvalRatio = useMemo(() => {
    return [
      { name: 'Approved', value: approvedCount, color: 'var(--success-color)' },
      { name: 'Rejected', value: rejectedCount, color: 'var(--danger-color)' }
    ];
  }, [approvedCount, rejectedCount]);

  const monthlyTrend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend = {};
    leaves.forEach(l => {
      const d = new Date(l.created_at);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (!trend[key]) trend[key] = { name: key, Requests: 0 };
      trend[key].Requests++;
    });
    return Object.values(trend).slice(-6); // Last 6 months
  }, [leaves]);
  // ------------------------------------------------

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
          <div className="logo" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img
              src="/zollid-logo.png"
              alt="Zollid Logo"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <ThemeToggle className="theme-toggle-inline" />
          {/* Notification bell dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-color)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger-color)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div className="mobile-notification-backdrop" onClick={() => setShowNotifications(false)}></div>
                <div className="notification-dropdown">
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0' }} aria-label="Close Notifications">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      </button>
                      <span>Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No new notifications</div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => setIsProfileModalOpen(true)}
            title="View Profile"
            className="navbar-profile-trigger"
          >
            <span
              className="avatar-initials"
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent-hover)",
                border: "1px solid var(--accent-color)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              AD
            </span>
            <div
              className="navbar-profile-text"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                lineHeight: 1.2,
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  transition: "color 0.2s ease",
                }}
              >
                Admin Manager
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SaaS Hero Section */}
      <section className="hero-grid" style={{ marginBottom: "2.5rem" }}>
        <div className="card-panel blur-reveal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2 className="saas-heading welcome-animation">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},<br />
              Admin Manager
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 193, 106, 0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '600' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', animation: 'pulseScale 2s infinite' }}></div>
              Backend Connected
            </div>
          </div>
          <p className="saas-subtitle">
            Manage employee leave requests, monitor team activity and track organizational leave statistics.
          </p>
        </div>

        <div className="card-panel blur-reveal" style={{ animationDelay: '100ms', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', fontWeight: '600' }}>
            Today's Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Pending Requests</span>
              <span style={{ fontWeight: '600', color: 'var(--warning-color)' }}>{pendingRequestsCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Approved Today</span>
              <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{recentActivity.filter(a => a.status === 'Approved' && new Date(a.updated_at).toDateString() === new Date().toDateString()).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Total Employees</span>
              <span style={{ fontWeight: '600', color: 'var(--accent-color)' }}>{totalEmployeesCount}</span>
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-grid blur-reveal" style={{ animationDelay: '150ms' }}>
          <button className="action-btn hover-scale" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>
            <CheckCircle size={18} color="var(--success-color)" /> Approve Requests
          </button>
          <button className="action-btn hover-scale" onClick={() => window.print()}>
            <FileText size={18} color="var(--warning-color)" /> Generate Report
          </button>
          <button className="action-btn hover-scale" onClick={() => { setStatusFilter('Approved'); window.scrollTo(0, document.body.scrollHeight); }}>
            <History size={18} color="var(--text-secondary)" /> View Leave History
          </button>
        </div>
      </section>

      {/* Enhanced KPI Cards */}
      <section className="metrics-row blur-reveal" style={{ animationDelay: '200ms', marginBottom: '2.5rem' }}>
        <div className="card-panel metric-mini-card hover-glow" style={{ borderLeft: "3px solid var(--warning-color)", position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-mini-title">Pending Requests</div>
              <div className="metric-mini-value" style={{ color: "var(--warning-color)" }}>{pendingRequestsCount}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255, 171, 0, 0.1)', borderRadius: '8px' }}>
              <Clock size={20} color="var(--warning-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Needs manager approval</div>
        </div>

        <div className="card-panel metric-mini-card hover-glow" style={{ borderLeft: "3px solid var(--success-color)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-mini-title">Approved Leaves</div>
              <div className="metric-mini-value" style={{ color: "var(--success-color)" }}>{approvedCount}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(0, 193, 106, 0.1)', borderRadius: '8px' }}>
              <CheckCircle size={20} color="var(--success-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total approved</div>
        </div>

        <div className="card-panel metric-mini-card hover-glow" style={{ borderLeft: "3px solid var(--danger-color)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-mini-title">Rejected Leaves</div>
              <div className="metric-mini-value" style={{ color: "var(--danger-color)" }}>{rejectedCount}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255, 71, 87, 0.1)', borderRadius: '8px' }}>
              <XCircle size={20} color="var(--danger-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total rejected</div>
        </div>

        <div className="card-panel metric-mini-card hover-glow" style={{ borderLeft: "3px solid var(--accent-color)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-mini-title">Employees</div>
              <div className="metric-mini-value" style={{ color: "var(--accent-hover)" }}>{totalEmployeesCount}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <Users size={20} color="var(--accent-color)" />
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active employees</div>
        </div>
      </section>

      {/* Main Dashboard Grid (Analytics + Activity) */}
      <div className="dashboard-main-grid blur-reveal" style={{ animationDelay: '250ms', marginBottom: '2.5rem' }}>
        
        {/* Left Column: Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <h3 className="section-title">Monthly Leave Requests</h3>
            {monthlyTrend.length > 0 ? (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--border-color)', opacity: 0.4 }}
                    />
                    <Bar dataKey="Requests" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <Calendar size={40} />
                <h4>No Trend Data</h4>
                <p>Not enough leave history to generate monthly trends.</p>
              </div>
            )}
          </div>

          <div className="analytics-grid">
            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <h3 className="section-title" style={{ fontSize: '1rem' }}>Approval vs Rejection</h3>
              {approvedCount > 0 || rejectedCount > 0 ? (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={approvalRatio} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {approvalRatio.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-color)' }}></div> Approved</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger-color)' }}></div> Rejected</div>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                  <ShieldAlert size={32} />
                  <h4 style={{ fontSize: '0.9rem' }}>No Data</h4>
                </div>
              )}
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <h3 className="section-title" style={{ fontSize: '1rem' }}>Leave Types</h3>
              {leaveTypeDistribution.length > 0 ? (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={leaveTypeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                        {leaveTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                  <ShieldAlert size={32} />
                  <h4 style={{ fontSize: '0.9rem' }}>No Data</h4>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Recent Activity */}
        <div className="card-panel" style={{ padding: '1.5rem', height: '100%' }}>
          <h3 className="section-title">Recent Activity</h3>
          
          {recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentActivity.map((activity, index) => {
                const actionColors = {
                  'Pending': 'var(--warning-color)',
                  'Approved': 'var(--success-color)',
                  'Rejected': 'var(--danger-color)',
                };
                const color = actionColors[activity.status] || 'var(--text-secondary)';
                
                let text = '';
                if (activity.status === 'Pending') text = `${activity.username} submitted a leave request`;
                else if (activity.status === 'Approved') text = `Manager approved ${activity.username}'s request`;
                else text = `Manager rejected ${activity.username}'s request`;

                return (
                  <div key={activity.id || index} className="activity-item hover-scale">
                    <div className="activity-avatar" style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid ${color}`, color: color }}>
                      {activity.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{text}</div>
                      <div className="activity-time">{new Date(activity.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              
              <button 
                className="action-btn" 
                style={{ marginTop: '1rem', background: 'transparent', border: '1px dashed var(--border-color)' }}
                onClick={() => window.scrollTo(0, document.body.scrollHeight)}
              >
                View All Requests
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle size={40} color="var(--success-color)" style={{ opacity: 0.5 }} />
              <h4>All Caught Up</h4>
              <p>There is no recent activity in the system right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {/* Leave applications review panel */}
      <section className="card-panel" style={{ padding: "2rem" }}>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
            Review Leave Applications
          </h2>

          {/* Search, filters, and tables header row */}
          <div className="table-filters-row">
            <div className="filters-group">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  className={`btn-filter-tab ${statusFilter === status ? "active" : ""}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="search-input-wrapper" style={{ minWidth: "280px" }}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
            <div
              className="empty-state"
              style={{
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
                padding: "3.5rem 1rem",
              }}
            >
              <div className="empty-state-icon">📥</div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                No leave requests found
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  maxWidth: "320px",
                  margin: "0.25rem auto",
                }}
              >
                There are no leave applications matching your filter criteria in
                the system.
              </p>
            </div>
          ) : (
            <>
              <div
                className="table-responsive"
                style={{ maxHeight: "550px", overflowY: "auto" }}
              >
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
                      const duration =
                        Math.round(
                          (new Date(leave.end_date) -
                            new Date(leave.start_date)) /
                            (1000 * 60 * 60 * 24),
                        ) + 1;
                      return (
                        <tr key={leave.id} className={deletingLeaveId === leave.id ? 'deleting-row' : ''}>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                              }}
                            >
                              <span
                                className="avatar-initials"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {getInitials(leave.username)}
                              </span>
                              <span style={{ fontWeight: "600" }}>
                                {leave.username}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: "500" }}>
                            {leave.leave_type}
                          </td>
                          <td>
                            {new Date(leave.start_date).toLocaleDateString('en-IN')} –{" "}
                            {new Date(leave.end_date).toLocaleDateString('en-IN')}
                          </td>
                          <td>
                            {duration} {duration === 1 ? "day" : "days"}
                          </td>
                          <td
                            style={{
                              maxWidth: "180px",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                            title={leave.reason}
                          >
                            {leave.reason}
                          </td>
                          <td>
                            {leave.document_path ? (
                              <button
                                type="button"
                                className="auth-link"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.85rem",
                                }}
                                onClick={() =>
                                  setPreviewDocument(leave.document_path)
                                }
                              >
                                📎 Preview
                              </button>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                None
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge badge-${leave.status.toLowerCase()}`}
                            >
                              {leave.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                              {leave.status === "Pending" ? (
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      padding: "0.35rem 0.75rem",
                                      borderColor: "var(--success-border)",
                                      color: "var(--success-color)",
                                    }}
                                    onClick={() =>
                                      openDecisionModal(leave, "Approved")
                                    }
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      padding: "0.35rem 0.75rem",
                                      borderColor: "var(--danger-border)",
                                      color: "var(--danger-color)",
                                    }}
                                    onClick={() =>
                                      openDecisionModal(leave, "Rejected")
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "var(--text-secondary)",
                                    fontSize: "0.85rem",
                                    fontStyle: "italic",
                                    maxWidth: "140px",
                                    display: "block",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={leave.manager_remarks}
                                >
                                  {leave.manager_remarks || "No remarks."}
                                </span>
                              )}

                              {/* Animated Delete Button */}
                              <button
                                onClick={() => setLeaveToDelete(leave)}
                                disabled={deletingLeaveId === leave.id}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: deletingLeaveId === leave.id ? "wait" : "pointer",
                                  color: "var(--danger-color)",
                                  opacity: deletingLeaveId === leave.id ? 0.5 : 0.8,
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "0.25rem",
                                }}
                                onMouseEnter={(e) => {
                                  if (deletingLeaveId !== leave.id) {
                                    e.currentTarget.style.opacity = "1";
                                    e.currentTarget.style.transform = "scale(1.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (deletingLeaveId !== leave.id) {
                                    e.currentTarget.style.opacity = "0.8";
                                    e.currentTarget.style.transform = "scale(1)";
                                  }
                                }}
                                title="Delete Record"
                              >
                                {deletingLeaveId === leave.id ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="spinning-icon" style={{ animation: "spin 1s linear infinite" }}>
                                    <line x1="12" y1="2" x2="12" y2="6"></line>
                                    <line x1="12" y1="18" x2="12" y2="22"></line>
                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                    <line x1="2" y1="12" x2="6" y2="12"></line>
                                    <line x1="18" y1="12" x2="22" y2="12"></line>
                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                )}
                              </button>
                            </div>
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
                  Showing{" "}
                  <strong>
                    {indexOfFirstRow + 1}-
                    {Math.min(indexOfLastRow, filteredLeaves.length)}
                  </strong>{" "}
                  of <strong>{filteredLeaves.length}</strong>
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

      {/* Delete Leave Confirmation Modal */}
      {leaveToDelete && (
        <div className="modal-overlay" onClick={() => setLeaveToDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "400px", textAlign: "center", padding: "2rem 1.5rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "1rem", color: "var(--danger-color)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.25rem" }}>Delete Leave Request?</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete <strong>{leaveToDelete.username}</strong>'s {leaveToDelete.leave_type} request? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setLeaveToDelete(null)}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmDeleteLeave}
                disabled={submitting}
                style={{ flex: 1, backgroundColor: "var(--danger-color)", borderColor: "var(--danger-border)" }}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Remarks Modal Overlay */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Decision</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedLeave(null)}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.015)",
                padding: "1rem",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: "0.25rem" }}>
                Employee: <strong>{selectedLeave.username}</strong>
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                Category: <strong>{selectedLeave.leave_type} Leave</strong>
              </div>
              <div>
                Dates:{" "}
                <strong>
                  {new Date(selectedLeave.start_date).toLocaleDateString('en-IN')} to{" "}
                  {new Date(selectedLeave.end_date).toLocaleDateString('en-IN')}
                </strong>
              </div>
            </div>

            {modalError && (
              <div
                className="toast error"
                style={{
                  minWidth: "auto",
                  marginBottom: "1.25rem",
                  padding: "0.75rem 1rem",
                  animation: "none",
                }}
              >
                <div className="toast-content">
                  <div className="toast-message" style={{ fontSize: "0.8rem" }}>
                    {modalError}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleDecisionSubmit}>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Review Comment / Remarks</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={
                    decisionType === "Approved"
                      ? "Enter approval comments (optional)..."
                      : "Reason for rejection (required)..."
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  maxLength={500}
                  required={decisionType === "Rejected"}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
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
                  className={`btn ${decisionType === "Approved" ? "btn-primary" : "btn-danger"}`}
                  disabled={submitting}
                  style={
                    decisionType === "Approved"
                      ? {
                          background: "var(--text-primary)",
                          color: "var(--bg-app)",
                          gap: "0.5rem",
                        }
                      : { gap: "0.5rem" }
                  }
                >
                  {submitting && <span className="spinner"></span>}
                  {submitting ? "Processing..." : `Confirm ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Document Previewer Modal */}
      {previewDocument && (
        <div className="modal-overlay" onClick={() => setPreviewDocument(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "640px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Document Preview</h2>
              <button
                className="modal-close"
                onClick={() => setPreviewDocument(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ height: "60vh", padding: 0, position: "relative" }}>
              {renderPreviewContent(previewDocument)}
              
              {/* 3D Download Overlay */}
              {downloadState !== 'idle' && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  borderRadius: '8px'
                }}>
                  {downloadState === 'downloading' && (
                    <div style={{ width: '80%', maxWidth: '400px', textAlign: 'center' }}>
                      <h3 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Downloading Document...</h3>
                      <div className="progress-3d-container">
                        <div className="progress-3d-bar" style={{ width: `${downloadProgress}%` }}></div>
                      </div>
                      <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{downloadProgress}%</p>
                    </div>
                  )}
                  
                  {downloadState === 'success' && (
                    <div className="card-panel success-pop-in" style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--success-color)' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Successfully Downloaded!</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Returning to dashboard...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="modal-footer"
              style={{ padding: "1rem 1.5rem", background: "var(--bg-card)" }}
            >
              <div style={{ display: "flex", gap: "1rem", width: "100%", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDocument)}
                  disabled={downloadState !== 'idle'}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🖨️</span> Download Document
                </button>
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
        </div>
      )}

      {/* Profile Details Modal */}
      {isProfileModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Manager Profile</h2>
              <button
                className="modal-close"
                onClick={() => setIsProfileModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1.25rem",
                padding: "1rem 0",
              }}
            >
              <div
                className="avatar-initials"
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "2rem",
                  background: "var(--accent-glow)",
                  color: "var(--accent-hover)",
                  border: "2px solid var(--accent-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
              >
                AD
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                    marginTop: 0,
                  }}
                >
                  Admin Manager
                </h3>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.75rem",
                    background: "rgba(0,193,106,0.1)",
                    color: "var(--success-color)",
                    border: "1px solid rgba(0,193,106,0.2)",
                  }}
                >
                  Manager Portal Access
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  borderTop: "1px solid var(--border-color)",
                  borderBottom: "1px solid var(--border-color)",
                  padding: "1rem 0",
                  margin: "0.5rem 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Login Email:
                  </span>
                  <span
                    style={{ color: "var(--text-primary)", fontWeight: "500" }}
                  >
                    manager@gcu.in
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Role Privilege:
                  </span>
                  <span
                    style={{ color: "var(--accent-hover)", fontWeight: "600" }}
                  >
                    System Administrator
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Security Level:
                  </span>
                  <span
                    style={{ color: "var(--success-color)", fontWeight: "600" }}
                  >
                    🛡️ OWASP Hardened
                  </span>
                </div>
              </div>

              <div style={{ width: "100%", textAlign: "left" }}>
                <h4
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "var(--text-primary)",
                    marginTop: 0,
                  }}
                >
                  Portal Statistics
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: "500" }}>
                      Managed Employees
                    </span>
                    <span
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      {totalEmployeesCount} members
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: "500" }}>
                      Total Reviews Decided
                    </span>
                    <span
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      {approvedCount + rejectedCount} applications
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={logout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Profile Modal */}
      {viewEmployeeProfile && (
        <div className="modal-overlay" onClick={() => setViewEmployeeProfile(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              border: "1px solid var(--success-color)",
              boxShadow: "0 0 30px hsla(142.1, 70.6%, 45.3%, 0.2)",
            }}
          >
            <div className="modal-header">
              <h2>Employee Profile</h2>
              <button
                className="modal-close"
                onClick={() => setViewEmployeeProfile(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center", padding: "1rem" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "hsla(142.1, 70.6%, 45.3%, 0.15)",
                color: "var(--success-color)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem", fontWeight: "700", margin: "0 auto",
                border: "2px solid var(--success-color)"
              }}>
                {getInitials(viewEmployeeProfile.username)}
              </div>
              
              <h3 style={{ fontSize: "1.5rem", margin: "0", color: "var(--text-primary)" }}>
                {viewEmployeeProfile.username}
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "var(--bg-app)", padding: "1rem", borderRadius: "8px", textAlign: "left", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Email</span>
                  <span style={{ fontWeight: "500", fontSize: "0.85rem" }}>{viewEmployeeProfile.username.toLowerCase()}@gcu.in</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Job Title</span>
                  <span style={{ fontWeight: "500", fontSize: "0.85rem" }}>{getMockTitle(viewEmployeeProfile.username, viewEmployeeProfile._index)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Department</span>
                  <span style={{ fontWeight: "500", fontSize: "0.85rem" }}>{getMockDepartment(viewEmployeeProfile.username, viewEmployeeProfile._index)}</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <div style={{ flex: 1, background: "hsla(263.4, 70%, 60%, 0.1)", border: "1px solid hsla(263.4, 70%, 60%, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "hsl(263.4, 70%, 60%)" }}>{viewEmployeeProfile.annual_leave}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Annual Days</div>
                </div>
                <div style={{ flex: 1, background: "hsla(142.1, 70.6%, 48%, 0.1)", border: "1px solid hsla(142.1, 70.6%, 48%, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--success-color)" }}>{viewEmployeeProfile.sick_leave}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sick Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
