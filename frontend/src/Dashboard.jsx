import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';

const API = window.location.origin;

const STATUS_CONFIG = {
  'active': { label: 'Active', className: 'status-active' },
  'needs-files': { label: 'Needs files', className: 'status-waiting' },
  'review': { label: 'Review ready', className: 'status-review' },
  'payment-due': { label: 'Payment due', className: 'status-waiting' },
  'complete': { label: 'Complete ✓', className: 'status-done' },
  'changes': { label: 'Changes requested', className: 'status-review' },
};

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    { bg: '#EFF4FF', color: '#2563EB' },
    { bg: '#F0FDF4', color: '#16A34A' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#F3E8FF', color: '#7C3AED' },
    { bg: '#FCE7F3', color: '#DB2777' },
    { bg: '#ECFEFF', color: '#0891B2' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Dashboard({ onLogout }) {
  const [portals, setPortals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [formData, setFormData] = useState({ clientName: '', projectName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const showToast = useCallback((msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, portalsRes] = await Promise.all([
        fetch(`${API}/api/stats`),
        fetch(`${API}/api/portals`),
      ]);

      if (!statsRes.ok || !portalsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const statsData = await statsRes.json();
      const portalsData = await portalsRes.json();

      setStats(statsData);
      setPortals(portalsData.portals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePortal = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.projectName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/portals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create portal');
      }

      const data = await res.json();
      setPortals(prev => [data.portal, ...prev]);
      setModalOpen(false);
      setFormData({ clientName: '', projectName: '' });
      showToast(`Portal created for ${data.portal.clientName}!`);
      fetchData(); // Refresh stats
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (slug) => {
    const link = `${API}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copied to clipboard!');
    } catch {
      showToast('Could not copy link');
    }
  };

  const closeModal = (e) => {
    if (e.target === e.currentTarget) {
      setModalOpen(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="dash-page">
        <div className="dash-error">
          <div className="dash-error-icon">⚠️</div>
          <h2>Could not load dashboard</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchData}>Try again</button>
        </div>
      </div>
    );
  }

  // === EMPTY STATE ===
  const isEmpty = portals.length === 0;

  return (
    <div className="dash-page">
      {/* Dashboard Nav */}
      <nav className="dash-nav">
        <div className="logo">Client<span>Drop</span></div>
        <div className="dash-nav-right">
          <span className="dash-nav-plan">Free Plan</span>
          <button className="btn-nav" onClick={onLogout}>Dashboard</button>
        </div>
      </nav>

      {/* Demo banner */}
      {showDemoBanner && (
        <div className="dash-banner">
          <span>🚀 This is a demo dashboard with sample data. Create a real portal to see how it works!</span>
          <button className="dash-banner-close" onClick={() => setShowDemoBanner(false)}>×</button>
        </div>
      )}

      <div className="dash-content">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">Your Projects</h1>
            <p className="dash-subtitle">{portals.length} portal{portals.length !== 1 ? 's' : ''} · {stats?.activeClients || 0} active</p>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Add Client
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Active clients</div>
              <div className="stat-value">{stats.activeClients}</div>
              <div className="stat-change">↑ 2 this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending approvals</div>
              <div className="stat-value">{stats.pendingApprovals}</div>
              <div className="stat-change" style={{color: 'var(--signal)'}}>
                {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} need action` : 'All clear'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Paid this month</div>
              <div className="stat-value">{stats.paidThisMonth}</div>
              <div className="stat-change">↑ 18% vs last</div>
            </div>
          </div>
        )}

        {/* Portal List */}
        <div className="dash-list-header">
          <span className="projects-label">Client portals</span>
        </div>

        {isEmpty ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">📋</div>
            <h3>No client portals yet</h3>
            <p>Create your first portal and send the link to your client. They'll be able to upload files, approve work, and pay — all without a login.</p>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Create your first portal</button>
          </div>
        ) : (
          <div className="project-list">
            {portals.map((p) => {
              const avatarColors = getAvatarColor(p.clientName);
              const initials = p.initials || getInitials(p.clientName);
              const statusConfig = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;

              return (
                <div key={p.id} className="project-row" onClick={() => copyLink(p.slug)}>
                  <div className="project-avatar" style={{ background: avatarColors.bg, color: avatarColors.color }}>
                    {initials}
                  </div>
                  <div className="project-info">
                    <div className="project-name">{p.clientName}</div>
                    <div className="project-meta">
                      {p.projectName} · {p.files > 0 ? `${p.files} files` : 'No files'} · Created {formatDate(p.createdAt)}
                    </div>
                  </div>
                  <span className={`project-status ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                  <span className="copy-icon" title="Copy link">🔗</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add a client</div>
            <div className="modal-sub">Create a new portal for your client. They'll get a private link.</div>
            <form onSubmit={handleCreatePortal}>
              <div className="form-group">
                <label className="form-label">Client name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Studio Nova"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Brand Identity"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create portal →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.message}</div>
    </div>
  );
}