import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './ClientPortal.css';

const API = window.location.origin;

const STATUS_META = {
  'needs-files': { label: 'Awaiting your files', color: '#92400E', bg: '#FEF3C7', step: 1 },
  'has-files': { label: 'Files uploaded', color: '#2563EB', bg: '#EFF4FF', step: 2 },
  'review': { label: 'Under review', color: '#2563EB', bg: '#EFF4FF', step: 3 },
  'changes': { label: 'Changes requested', color: '#92400E', bg: '#FEF3C7', step: 2 },
  'approved': { label: 'Approved ✓', color: '#16A34A', bg: '#F0FDF4', step: 4 },
  'payment-due': { label: 'Payment due', color: '#92400E', bg: '#FEF3C7', step: 4 },
  'complete': { label: 'Complete ✓', color: '#16A34A', bg: '#F0FDF4', step: 5 },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  return '📎';
}

export default function ClientPortal() {
  const { slug } = useParams();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  }, []);

  const fetchPortal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/portals/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Portal not found');
        throw new Error('Failed to load portal');
      }
      const data = await res.json();
      setPortal(data.portal);
      setNotes(data.portal.notes || '');
      setFiles(data.portal.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPortal();
  }, [fetchPortal]);

  const uploadFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (const f of fileList) formData.append('files', f);

    try {
      const res = await fetch(`${API}/api/portals/${slug}/files`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFiles(prev => [...prev, ...data.files]);
      showToast(`${data.files.length} file${data.files.length > 1 ? 's' : ''} uploaded!`);
      fetchPortal(); // Refresh portal for status update
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }, [slug, showToast, fetchPortal]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleSubmitForReview = async () => {
    if (files.length === 0) {
      showToast('Please upload at least one file first');
      return;
    }
    try {
      const res = await fetch(`${API}/api/portals/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'review', notes }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      const data = await res.json();
      setPortal(data.portal);
      showToast('Files submitted for review!');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`${API}/api/portals/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', notes }),
      });
      const data = await res.json();
      setPortal(data.portal);
      showToast('Approved! Moving to payment...');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleRequestChanges = async () => {
    try {
      const res = await fetch(`${API}/api/portals/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'changes', notes }),
      });
      const data = await res.json();
      setPortal(data.portal);
      showToast('Changes requested');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handlePayNow = () => {
    showToast('💳 Payment integration coming soon!');
  };

  // === LOADING ===
  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-loading">
          <div className="dash-spinner"></div>
          <p>Loading portal...</p>
        </div>
      </div>
    );
  }

  // === ERROR ===
  if (error) {
    return (
      <div className="portal-page">
        <div className="portal-error">
          <div className="portal-error-icon">🔗</div>
          <h2>Portal not found</h2>
          <p>{error}</p>
          <p className="portal-error-sub">Check the link or ask your freelancer for a new one.</p>
          <a href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
            Create your own free portal →
          </a>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[portal.status] || STATUS_META['needs-files'];
  const canSubmit = ['needs-files', 'has-files', 'changes'].includes(portal.status);
  const canReview = portal.status === 'review';
  const canPay = portal.status === 'approved';

  return (
    <div className="portal-page">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <a href="/" className="portal-logo">Client<span>Drop</span></a>
          <div className="portal-header-right">
            <span className="portal-status-badge" style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="portal-main">
        <div className="portal-card">
          {/* Project Info */}
          <div className="portal-project">
            <div className="portal-project-avatar" style={{ background: portal.avatarBg || '#EFF4FF', color: portal.avatarColor || '#2563EB' }}>
              {portal.initials}
            </div>
            <div>
              <h1 className="portal-project-name">{portal.projectName}</h1>
              <p className="portal-client-name">for {portal.clientName}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="portal-steps">
            {['Send files', 'Review', 'Approve', 'Payment'].map((step, i) => {
              const stepNum = i + 1;
              const isActive = meta.step >= stepNum;
              const isCurrent = meta.step === stepNum;
              return (
                <div key={step} className={`portal-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="portal-step-circle">{isActive && stepNum < meta.step ? '✓' : stepNum}</div>
                  <span className="portal-step-label">{step}</span>
                </div>
              );
            })}
          </div>

          {/* Drag & Drop Upload */}
          <div
            ref={dropZoneRef}
            className={`portal-upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <div className="portal-upload-progress">
                <div className="dash-spinner"></div>
                <p>Uploading files...</p>
              </div>
            ) : (
              <>
                <div className="portal-upload-icon">📁</div>
                <p className="portal-upload-title">Drop files here or click to browse</p>
                <p className="portal-upload-sub">Images, PDFs, ZIPs, documents — up to 50MB each</p>
              </>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="portal-files">
              <h3 className="portal-files-title">Uploaded files ({files.length})</h3>
              <div className="portal-files-list">
                {files.map((f, i) => (
                  <div key={i} className="portal-file-row">
                    <span className="portal-file-icon">{getFileIcon(f.type)}</span>
                    <div className="portal-file-info">
                      <div className="portal-file-name">{f.name}</div>
                      <div className="portal-file-meta">{formatFileSize(f.size)}</div>
                    </div>
                    <a href={f.path} target="_blank" rel="noopener noreferrer" className="portal-file-download" onClick={(e) => e.stopPropagation()}>
                      ↓
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes / Message */}
          <div className="portal-notes">
            <label className="portal-notes-label">Message for your freelancer</label>
            <textarea
              className="portal-notes-input"
              placeholder="Add a note about your files, feedback, or anything else..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="portal-actions">
            {canSubmit && (
              <button className="btn-primary portal-btn" onClick={handleSubmitForReview} disabled={files.length === 0}>
                {files.length > 0 ? 'Submit for review →' : 'Upload files first'}
              </button>
            )}
            {canReview && (
              <div className="portal-actions-row">
                <button className="btn-ghost portal-btn" onClick={handleRequestChanges}>
                  Request changes
                </button>
                <button className="btn-primary portal-btn" onClick={handleApprove}>
                  Approve ✓
                </button>
              </div>
            )}
            {canPay && (
              <button className="btn-primary portal-btn portal-pay-btn" onClick={handlePayNow}>
                💳 Pay now
              </button>
            )}
            {(portal.status === 'complete' || portal.status === 'payment-due') && (
              <div className="portal-complete-msg">
                {portal.status === 'complete' ? '🎉 This project is complete!' : '⏳ Awaiting payment'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <div className="portal-footer-inner">
          <span>Powered by ClientDrop</span>
          <a href="/" className="portal-footer-cta">Get your own free portal →</a>
        </div>
      </footer>

      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.message}</div>
    </div>
  );
}