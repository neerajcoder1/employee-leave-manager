import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import TextHoverEffect from "../components/TextHoverEffect";
import LeaveBalanceCard from "../components/LeaveBalanceCard";
import AnimatedNumber from "../components/AnimatedNumber";
import ThemeToggle from "../components/ThemeToggle";

const popSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
);
popSound.preload = "auto";

// 2. Skeleton Loading Component for Dashboard
const DashboardSkeleton = () => (
  <div className="dashboard-container">
    <header
      className="navbar skeleton-pulse"
      style={{ height: "64px", marginBottom: "2rem" }}
    ></header>
    <div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "140px" }}
      ></div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "140px" }}
      ></div>
      <div
        className="card-panel skeleton-pulse"
        style={{ height: "140px" }}
      ></div>
    </div>
    <div className="skeleton-pulse" style={{ height: "400px" }}></div>
  </div>
);

const EmployeeDashboard = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filters, Sorting & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'duration', 'type'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formError, setFormError] = useState("");

  // Document Viewer Modal State
  const [previewDocument, setPreviewDocument] = useState(null); // URL or null
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [downloadState, setDownloadState] = useState("idle"); // 'idle', 'downloading', 'success', 'error'
  const [downloadProgress, setDownloadProgress] = useState(0);

  const pollerRef = useRef(null);

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
      const profileRes = await fetch(
        `${import.meta.env.VITE_API_URL}/employee/profile`,
        { headers },
      );
      const profileData = await profileRes.json();

      const leavesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/employee/leave`,
        { headers },
      );
      const leavesData = await leavesRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }
      if (leavesData.success) {
        setLeaves(leavesData.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      addToast(
        "error",
        "Sync Failure",
        "Failed to retrieve profile or history.",
      );
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
        headers,
      });
      const result = await res.json();

      if (result.success && result.data.length > 0) {
        let hasNewNotifications = false;
        result.data.forEach((notification) => {
          const type = notification.message.toLowerCase().includes("approved")
            ? "success"
            : notification.message.toLowerCase().includes("rejected")
              ? "error"
              : "info";
          addToast(type, "Leave Status Updated", notification.message);
          hasNewNotifications = true;

          fetch(
            `${import.meta.env.VITE_API_URL}/notifications/${notification.id}/read`,
            {
              method: "PATCH",
              headers,
            },
          ).catch((err) => console.error("Error marking read:", err));
        });

        setNotifications((prev) => [...result.data, ...prev].slice(0, 20)); // Keep last 20

        // Refresh dashboard balances and history dynamically when a notification is received
        if (hasNewNotifications) {
          // Play sound
          popSound.currentTime = 0;
          popSound
            .play()
            .catch((e) =>
              console.log("Audio playback prevented by browser:", e),
            );

          fetchData();
        }
      }
    } catch (err) {
      console.error("Error checking notifications:", err);
    }
  };

  useEffect(() => {
    fetchData();
    checkNotifications();

    pollerRef.current = setInterval(() => {
      checkNotifications();
    }, 10000);

    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [token]);

  // Handle Drag & Drop Upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg",
      ];
      const fileExt = droppedFile.name
        .substring(droppedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (allowedExtensions.includes(fileExt)) {
        setFile(droppedFile);
      } else {
        setFormError(
          "Invalid file type. Please upload a PDF, Word document, or image.",
        );
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError("");

    const finalReason =
      reasonCategory === "Other" ? reason.trim() : reasonCategory;

    if (!startDate || !endDate || !finalReason || (leaveType === "Sick" && !file)) {
      setFormError(
        "Please fill in all required fields. A supporting document is required for Sick Leave.",
      );
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("leaveType", leaveType);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("reason", finalReason);
      if (file) {
        formData.append("document", file);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employee/leave`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit leave request.");
      }

      addToast(
        "success",
        "Application Submitted",
        "Your leave request has been submitted.",
      );

      // Reset Form State
      setLeaveType("Annual");
      setStartDate("");
      setEndDate("");
      setReasonCategory("");
      setReason("");
      setFile(null);
      setIsModalOpen(false);

      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format file size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Custom Download Handler with 3D Animation & Blob fetching
  const handleDownloadDocument = async (docPath) => {
    setDownloadState("downloading");
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
      setDownloadState("success");

      // Trigger actual download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      let filename = "document";
      const disposition = response.headers.get("content-disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        const matches = /filename="([^"]+)"/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      } else {
        const pathParts = docPath.split("/");
        filename = pathParts[pathParts.length - 1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Show success toast
      addToast(
        "success",
        "Download Complete",
        "The document has been successfully downloaded.",
      );

      // Close modal after a short delay (Redirects to dashboard view)
      setTimeout(() => {
        setDownloadState("idle");
        setPreviewDocument(null);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setDownloadState("error");
      addToast("error", "Download Failed", "Failed to download the document.");
      setTimeout(() => setDownloadState("idle"), 2000);
    }
  };

  // Get User Initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  const getDocumentUrl = (path, download = false) => {
    if (!path) return "";
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}?token=${token}${download ? "&download=1" : ""}`;
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

  // Filter, Sort, Pagination computation
  const filteredLeaves = leaves
    .filter((l) => {
      const matchesSearch = l.leave_type
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ? true : l.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "type") return a.leave_type.localeCompare(b.leave_type);
      if (sortBy === "duration") {
        const durA =
          Math.round(
            (new Date(a.end_date) - new Date(a.start_date)) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        const durB =
          Math.round(
            (new Date(b.end_date) - new Date(b.start_date)) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        return durB - durA;
      }
      return 0;
    });

  // Pagination boundaries
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredLeaves.slice(indexOfFirstRow, indexOfLastRow);

  // Sync pagination boundaries when page size overflows
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredLeaves.length, totalPages, currentPage]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Calculate Used Balances
  const annualAvailable = profile?.balances?.annual ?? 0;
  const annualUsed = Math.max(15 - annualAvailable, 0);

  const sickAvailable = profile?.balances?.sick ?? 0;
  const sickUsed = Math.max(10 - sickAvailable, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

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
        <div
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <img
            src="/zollid-logo.png"
            alt="Zollid Logo"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <ThemeToggle className="theme-toggle-inline" />
          {/* Notification bell dropdown */}
          <div style={{ position: "relative" }}>
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "var(--danger-color)",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div
                  className="mobile-notification-backdrop"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="notification-dropdown">
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--border-color)",
                      fontWeight: "600",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => setShowNotifications(false)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: "0",
                        }}
                        aria-label="Close Notifications"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="19" y1="12" x2="5" y2="12"></line>
                          <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                      </button>
                      <span>Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-secondary)",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem 1rem",
                          textAlign: "center",
                          color: "var(--text-secondary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "0.75rem 1rem",
                            borderBottom: "1px solid var(--border-color)",
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                          }}
                        >
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
              borderLeft: "1px solid var(--border-color)",
              paddingLeft: "1.25rem",
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
              {getInitials(profile?.username)}
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
                {profile?.username}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-card blur-reveal" style={{ marginBottom: "0.5rem" }}>
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👋</span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{getGreeting()}</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '0.75rem' }}>
            Welcome back, <br/>
            <span style={{ color: 'var(--accent-color)' }}>{profile?.username || "Employee"}</span>
          </h1>
          <p className="hero-subtitle">
            Track your leave balance, submit leave requests, and monitor approval status.
          </p>
        </div>
        <div className="hero-stats">
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>
            Today's Summary
          </div>
          <div className="hero-stat-row">
            <span style={{ color: 'var(--text-secondary)' }}>Annual Leave Remaining</span>
            <span style={{ fontWeight: '600' }}>{annualAvailable} Days</span>
          </div>
          <div className="hero-stat-row">
            <span style={{ color: 'var(--text-secondary)' }}>Sick Leave Remaining</span>
            <span style={{ fontWeight: '600' }}>{sickAvailable} Days</span>
          </div>
          <div className="hero-stat-row">
            <span style={{ color: 'var(--text-secondary)' }}>Pending Requests</span>
            <span style={{ fontWeight: '600', color: 'var(--warning-color)' }}>
              {leaves.filter(l => l.status === 'Pending').length}
            </span>
          </div>
          <div style={{ margin: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}></div>
          <div className="hero-stat-row">
            <span style={{ color: 'var(--text-secondary)' }}>Current Date</span>
            <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>{todayStr}</span>
          </div>
          <div className="hero-stat-row">
            <span style={{ color: 'var(--text-secondary)' }}>System Status</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: '500' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)', display: 'inline-block' }}></span>
              Online
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="dashboard-layout-bento">
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Actions Row */}
          <div className="quick-actions-row">
            <div className="quick-action-btn" onClick={() => setIsModalOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <line x1="12" y1="14" x2="12" y2="18"></line>
                <line x1="10" y1="16" x2="14" y2="16"></line>
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Apply Leave</span>
            </div>
            <div className="quick-action-btn" onClick={() => { setShowHistory(true); window.scrollTo({ top: 800, behavior: 'smooth' }); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Leave History</span>
            </div>
            <div className="quick-action-btn" onClick={() => setIsProfileModalOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>My Profile</span>
            </div>
          </div>

          {/* Leave Balances Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="bento-card leave-balance-card-v2 annual">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Annual Leave</span>
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', margin: '0.5rem 0' }}>
                {annualAvailable} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Days Left</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill annual" style={{ width: `${(annualAvailable / 15) * 100}%` }}></div>
              </div>
              <div className="progress-meta">
                <span>{annualUsed} Days Used</span>
                <span>{Math.round((annualAvailable / 15) * 100)}% Remaining</span>
              </div>
            </div>

            <div className="bento-card leave-balance-card-v2 sick">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Sick Leave</span>
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', margin: '0.5rem 0' }}>
                {sickAvailable} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Days Left</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill sick" style={{ width: `${(sickAvailable / 10) * 100}%` }}></div>
              </div>
              <div className="progress-meta">
                <span>{sickUsed} Days Used</span>
                <span>{Math.round((sickAvailable / 10) * 100)}% Remaining</span>
              </div>
            </div>
          </div>

          {/* Leave History Table (Always visible but polished) */}
          <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="bento-card-title" style={{ margin: 0 }}>Leave History</h2>
              <div className="filters-group">
                {["All", "Pending", "Approved", "Rejected"].map((status) => (
                  <button
                    key={status}
                    className={`btn-filter-tab ${statusFilter === status ? "active" : ""}`}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filteredLeaves.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--border-color)', marginBottom: '1rem' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No leave requests found</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You're all caught up. No history to show.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead className="sticky-header">
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((leave) => (
                      <tr key={leave.id}>
                        <td style={{ fontWeight: "500" }}>{leave.leave_type}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {new Date(leave.start_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} – {new Date(leave.end_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                          <span className={`badge badge-${leave.status.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td>
                          {leave.document_path && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => setPreviewDocument(leave.document_path)}
                            >
                              Preview Doc
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {filteredLeaves.length > 0 && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredLeaves.length)} of {filteredLeaves.length}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Employee Information */}
          <div className="bento-card">
            <h2 className="bento-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Employee Information
            </h2>
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Employee ID</span>
                <span className="profile-detail-value">EMP-{profile?.id ? String(profile.id).replace(/\D/g, '').substring(0, 3).padStart(3, '0') : '101'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Department</span>
                <span className="profile-detail-value">{profile?.department || 'Engineering'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Role</span>
                <span className="profile-detail-value" style={{ textTransform: 'capitalize' }}>{profile?.role || 'Software Engineer'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Joining Date</span>
                <span className="profile-detail-value">12 Jan 2024</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bento-card">
            <h2 className="bento-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Recent Activity
            </h2>
            <div className="timeline-list">
              {leaves.length > 0 ? (
                // Use actual leave history if available to simulate activity
                leaves.slice(0, 3).map((leave, idx) => (
                  <div className={`timeline-item ${leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'info' : 'error'}`} key={idx}>
                    <div className="timeline-icon">
                      {leave.status === 'Approved' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : leave.status === 'Pending' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      )}
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-text">
                        {leave.leave_type} Leave {leave.status.toLowerCase()}
                      </span>
                      <span className="timeline-time">{new Date(leave.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                // Mock fallback
                <>
                  <div className="timeline-item success">
                    <div className="timeline-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <div className="timeline-content">
                      <span className="timeline-text">Profile setup completed</span>
                      <span className="timeline-time">System • 2 days ago</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div className="bento-card">
            <h2 className="bento-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Upcoming Holidays
            </h2>
            <div className="holiday-list">
              <div className="holiday-item">
                <div className="holiday-info">
                  <span className="holiday-name">Independence Day</span>
                  <span className="holiday-type">Public Holiday</span>
                </div>
                <span className="holiday-date">15 Aug</span>
              </div>
              <div className="holiday-item">
                <div className="holiday-info">
                  <span className="holiday-name">Ganesh Chaturthi</span>
                  <span className="holiday-type">Company Holiday</span>
                </div>
                <span className="holiday-date">07 Sep</span>
              </div>
              <div className="holiday-item">
                <div className="holiday-info">
                  <span className="holiday-name">Diwali</span>
                  <span className="holiday-type">Company Holiday</span>
                </div>
                <span className="holiday-date">31 Oct</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            {formError && (
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
                    {formError}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleApplyLeave}>
              <div className="form-group">
                <label className="form-label">Leave Category</label>
                <select
                  className="form-control"
                  value={leaveType}
                  onChange={(e) => {
                    setLeaveType(e.target.value);
                    setReasonCategory("");
                    setReason("");
                  }}
                >
                  <option value="Annual">Annual Leave (15 days)</option>
                  <option value="Sick">Sick Leave (10 days)</option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Request</label>
                <select
                  className="form-control"
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  style={{
                    marginBottom: reasonCategory === "Other" ? "1rem" : "0",
                  }}
                  required
                >
                  <option value="" disabled>
                    Select a reason...
                  </option>
                  {(leaveType === "Annual"
                    ? [
                        "Vacation / Holiday",
                        "Family Event / Wedding",
                        "Personal Errands",
                        "Religious Observance",
                        "Other",
                      ]
                    : [
                        "Personal Illness (Fever, Cold, etc.)",
                        "Doctor's Appointment",
                        "Medical Emergency",
                        "Family Member Illness",
                        "Other",
                      ]
                  ).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {reasonCategory === "Other" && (
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Please specify your reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    required
                  />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1.75rem" }}>
                <label className="form-label" style={{ display: "block" }}>
                  Supporting Document{" "}
                  {leaveType === "Sick" && (
                    <span style={{ color: "var(--danger-color)" }}>*</span>
                  )}
                </label>
                <div
                  className={`file-upload-zone ${isDragOver ? "dragover" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: "var(--text-muted)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                    Drag document here or click to browse
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.2rem",
                    }}
                  >
                    Supports PDF, Word, or images up to 5MB
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </div>

                {file && (
                  <div className="file-preview-card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "1.15rem" }}>📄</span>
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontWeight: "600",
                            maxWidth: "240px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatBytes(file.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger-color)",
                        cursor: "pointer",
                        fontSize: "1.15rem",
                      }}
                      onClick={() => setFile(null)}
                      title="Remove file"
                    >
                      &times;
                    </button>
                  </div>
                )}
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ gap: "0.5rem" }}
                >
                  {submitting && <span className="spinner"></span>}
                  {submitting ? "Submitting..." : "Submit Request"}
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

            <div
              className="modal-body"
              style={{ height: "60vh", padding: 0, position: "relative" }}
            >
              {renderPreviewContent(previewDocument)}

              {/* 3D Download Overlay */}
              {downloadState !== "idle" && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.85)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    borderRadius: "8px",
                  }}
                >
                  {downloadState === "downloading" && (
                    <div
                      style={{
                        width: "80%",
                        maxWidth: "400px",
                        textAlign: "center",
                      }}
                    >
                      <h3
                        style={{
                          marginBottom: "1rem",
                          color: "#fff",
                          fontSize: "1.2rem",
                          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        }}
                      >
                        Downloading Document...
                      </h3>
                      <div className="progress-3d-container">
                        <div
                          className="progress-3d-bar"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                      <p
                        style={{
                          marginTop: "0.75rem",
                          color: "var(--text-secondary)",
                          fontWeight: "600",
                        }}
                      >
                        {downloadProgress}%
                      </p>
                    </div>
                  )}

                  {downloadState === "success" && (
                    <div
                      className="card-panel success-pop-in"
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        background: "var(--bg-card)",
                        border: "1px solid var(--success-color)",
                      }}
                    >
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "var(--success-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 1rem auto",
                        }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          color: "var(--text-primary)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Successfully Downloaded!
                      </h3>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Returning to dashboard...
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                onClick={() => handleDownloadDocument(previewDocument)}
                disabled={downloadState !== "idle"}
                className="btn btn-primary btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>📥</span> Download Document
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
              <h2>My Profile</h2>
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
                {getInitials(profile?.username)}
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
                  {profile?.username}
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
                  Employee Portal Access
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
                    User Unique ID:
                  </span>
                  <code
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent-hover)",
                    }}
                  >
                    {profile?.id}
                  </code>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Joined Date:
                  </span>
                  <span
                    style={{ color: "var(--text-primary)", fontWeight: "500" }}
                  >
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          undefined,
                          { year: "numeric", month: "long", day: "numeric" },
                        )
                      : "N/A"}
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
                  Leave Entitlements
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
                      Annual Leave
                    </span>
                    <span
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      {annualAvailable} / 15 days
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
                      Sick Leave
                    </span>
                    <span
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      {sickAvailable} / 10 days
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
    </div>
  );
};

export default EmployeeDashboard;
