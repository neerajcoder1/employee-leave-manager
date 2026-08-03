import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import TextHoverEffect from "../components/TextHoverEffect";
import LeaveBalanceCard from "../components/LeaveBalanceCard";
import AnimatedNumber from "../components/AnimatedNumber";

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

    if (!startDate || !endDate || !finalReason || !file) {
      setFormError(
        "Please fill in all required fields and upload a supporting document.",
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
            gap: "0.5rem",
          }}
        >
          <img
            src="/zollid-logo.png"
            alt="Zollid Logo"
            style={{ height: '60px', width: '60px', objectFit: 'cover' }}
          />
          <span className="navbar-logo-text">Zollid</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Notification bell dropdown */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "none",
                border: "none",
                color:
                  notifications.length > 0
                    ? "var(--accent-color)"
                    : "var(--text-secondary)",
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
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {getInitials(profile?.username)}
            </span>
            <div
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
              <span
                className="badge"
                style={{
                  fontSize: "0.65rem",
                  padding: "1px 4px",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  marginTop: "2px",
                }}
              >
                Employee
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            style={{ marginLeft: "0.5rem" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Employee Welcome & Control Panel */}
      <section
        className="card-panel blur-reveal"
        style={{
          padding: "2.5rem 2rem",
          textAlign: "center",
          marginBottom: "1.5rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            margin: "1rem auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2
            className="welcome-animation"
            style={{
              marginBottom: "-0.5rem",
              fontSize: "1.2rem",
              fontWeight: "400",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Welcome Back,
          </h2>
          <TextHoverEffect
            text={(profile?.username || "EMPLOYEE").toUpperCase()}
            strokeWidth={0.5}
            opacity={0.75}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Apply Leave
          </button>
          <button
            className={`btn ${showHistory ? "btn-secondary" : "btn-primary"}`}
            onClick={() => setShowHistory(!showHistory)}
            style={{ gap: "0.5rem" }}
          >
            {showHistory ? "📁 Hide Leave History" : "📁 View Leave History"}
          </button>
        </div>
      </section>

      {/* Leave Balances Grid (Polished) */}
      <section className="grid-balances">
        <LeaveBalanceCard
          type="Annual"
          availableDays={annualAvailable}
          totalDays={15}
          usedDays={annualUsed}
        />
        <LeaveBalanceCard
          type="Sick"
          availableDays={sickAvailable}
          totalDays={10}
          usedDays={sickUsed}
        />
      </section>
      {showHistory && (
        <section className="card-panel" style={{ padding: "2rem" }}>
          <div
            className="section-title-wrapper"
            style={{ marginBottom: "2rem" }}
          >
            <h2 className="section-title">My Leave History</h2>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Apply Leave
            </button>
          </div>

          {/* Filters, search and sort row */}
          <div className="table-filters-row">
            <div className="filters-group">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  className={`btn-filter-tab ${statusFilter === status ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div className="search-input-wrapper">
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
                  placeholder="Search by leave type..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <select
                className="form-control"
                style={{ width: "auto", minWidth: "140px" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Longest Duration</option>
                <option value="type">Leave Type</option>
              </select>
            </div>
          </div>

          {filteredLeaves.length === 0 ? (
            /* High-Fidelity Empty State */
            <div
              className="empty-state"
              style={{
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
                margin: "1rem 0",
              }}
            >
              <div
                className="empty-state-icon"
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <line x1="8" y1="14" x2="16" y2="14"></line>
                  <line x1="8" y1="18" x2="12" y2="18"></line>
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                  color: "var(--text-primary)",
                }}
              >
                No leave requests found
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1.25rem",
                  maxWidth: "380px",
                  margin: "0.25rem auto 1.25rem auto",
                }}
              >
                Your filters might be too specific or you haven't applied for
                any leaves yet. Click below to submit a new application.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsModalOpen(true)}
              >
                Apply Leave
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((leave) => {
                      const duration =
                        Math.round(
                          (new Date(leave.end_date) -
                            new Date(leave.start_date)) /
                            (1000 * 60 * 60 * 24),
                        ) + 1;
                      return (
                        <tr key={leave.id}>
                          <td style={{ fontWeight: "600" }}>
                            {leave.leave_type}
                          </td>
                          <td>
                            {new Date(leave.start_date).toLocaleDateString(
                              "en-IN",
                            )}{" "}
                            –{" "}
                            {new Date(leave.end_date).toLocaleDateString(
                              "en-IN",
                            )}
                          </td>
                          <td>
                            {duration} {duration === 1 ? "day" : "days"}
                          </td>
                          <td
                            style={{
                              maxWidth: "240px",
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
                          <td
                            style={{
                              color: leave.manager_remarks
                                ? "var(--text-primary)"
                                : "var(--text-muted)",
                              fontSize: "0.85rem",
                              maxWidth: "180px",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                            title={leave.manager_remarks}
                          >
                            {leave.manager_remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
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
      )}

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
                  <span style={{ color: "var(--danger-color)" }}>*</span>
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

export default EmployeeDashboard;
