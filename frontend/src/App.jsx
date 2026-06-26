import React, { useState, useEffect } from 'react';
import './App.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  { icon: '🔗', title: 'Shareable client link', desc: 'Each client gets their own private URL. No app download, no password, no friction — they just open it and act.' },
  { icon: '📂', title: 'File request & delivery', desc: 'Request files from clients or deliver your work — all through the portal. Version history included.' },
  { icon: '✅', title: 'Approval workflow', desc: 'Clients approve or request changes with one click. No more email chains debating "which version."' },
  { icon: '💳', title: 'Payments built in', desc: 'Invoice and collect payments through the portal. Stripe-powered, instant payout. Optional 1% platform fee.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever — up to 3 active portals',
    featured: false,
    badge: null,
    features: [
      '3 active client portals',
      'File upload & delivery',
      'Approval requests',
      'Email notifications',
    ],
  },
  {
    name: 'Pro',
    price: '£19',
    period: 'Per month — unlimited portals + custom branding',
    featured: true,
    badge: 'Most popular',
    features: [
      'Unlimited client portals',
      'Custom branding (logo, colors, domain)',
      'Payment collection (Stripe)',
      'Priority support',
    ],
  },
];

const PROJECTS = [
  { initials: 'SN', name: 'Studio Nova', meta: 'Brand identity · 3 files waiting', status: 'Needs files', bg: '#EFF4FF', color: '#2563EB', statusClass: 'status-waiting' },
  { initials: 'PR', name: 'Peak Roasters', meta: 'Website redesign · Awaiting your review', status: 'Review ready', bg: '#F0FDF4', color: '#16A34A', statusClass: 'status-review' },
  { initials: 'CM', name: 'Clara Mendez', meta: 'Social content · Approved, awaiting payment', status: 'Payment due', bg: '#FEF3C7', color: '#92400E', statusClass: 'status-waiting' },
  { initials: 'OL', name: 'Orbit Labs', meta: 'UI audit · Delivered & paid', status: 'Complete ✓', bg: '#F0FDF4', color: '#16A34A', statusClass: 'status-done' },
];

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const handleCreatePortal = (e) => {
    e.preventDefault();
    setModalOpen(false);
    showToast('Portal created! Check your email for the link.');
  };

  const copyLink = (slug) => {
    const link = 'https://clientdrop.io/p/' + slug;
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied to clipboard!');
    });
  };

  const closeModal = (e) => {
    if (e.target === e.currentTarget) {
      setModalOpen(false);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Client<span>Drop</span></div>
        <div className="nav-right">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">{link.label}</a>
          ))}
          <button className="btn-nav" onClick={() => setModalOpen(true)}>Start free →</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">🔥 Trending in 2026 · Freelancer Tools</div>
        <h1>Stop chasing clients.<br />Give them a <em>portal</em>.</h1>
        <p className="hero-sub">
          ClientDrop creates a branded, private link for each client — they upload files, approve work, and pay, all in one place. You stop following up forever.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => setModalOpen(true)}>Create your first portal — free</button>
          <button className="btn-ghost" onClick={() => document.getElementById('demo-section').scrollIntoView({ behavior: 'smooth' })}>
            See live demo ↓
          </button>
        </div>
        <p className="hero-proof">No credit card · <strong>60 seconds</strong> to your first client portal · Cancel anytime</p>
      </section>

      {/* Browser Mockup */}
      <div className="mockup-wrap" id="demo-section">
        <div className="browser">
          <div className="browser-bar">
            <div className="dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <div className="url-bar">clientdrop.io/dashboard</div>
          </div>
          <div className="dashboard">
            <div className="dash-header">
              <div className="dash-title">Your Projects</div>
              <button className="btn-sm" onClick={() => setModalOpen(true)}>+ Add Client</button>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Active clients</div>
                <div className="stat-value">{PROJECTS.length}</div>
                <div className="stat-change">↑ 2 this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pending approvals</div>
                <div className="stat-value">2</div>
                <div className="stat-change" style={{color: 'var(--signal)'}}>Need action</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Paid this month</div>
                <div className="stat-value">$6.2k</div>
                <div className="stat-change">↑ 18% vs last</div>
              </div>
            </div>
            <div className="projects-label">Client portals</div>
            <div className="project-list">
              {PROJECTS.map((p) => (
                <div key={p.name} className="project-row" onClick={() => copyLink(p.name.toLowerCase().replace(/\s+/g, '-'))}>
                  <div className="project-avatar" style={{ background: p.bg, color: p.color }}>{p.initials}</div>
                  <div className="project-info">
                    <div className="project-name">{p.name}</div>
                    <div className="project-meta">{p.meta}</div>
                  </div>
                  <span className={`project-status ${p.statusClass}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="section-header">
            <div className="section-eyebrow">How it works</div>
            <div className="section-title">Three steps. No manual.</div>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="step-num">1</div>
              <div className="step-title">Create a portal</div>
              <div className="step-desc">Name your project, add your client's email, set what you need from them. Done in under a minute.</div>
            </div>
            <div className="how-step">
              <div className="step-num">2</div>
              <div className="step-title">Send one link</div>
              <div className="step-desc">Your client gets a clean, branded page — no login required. They upload, approve, and pay without bothering you.</div>
            </div>
            <div className="how-step">
              <div className="step-num">3</div>
              <div className="step-title">Get notified</div>
              <div className="step-desc">You get an instant ping when something's ready. No inbox-checking, no "just following up" emails ever again.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-header">
          <div className="section-eyebrow">Everything included</div>
          <div className="section-title">Built for freelancers<br />who hate admin work</div>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="section-header">
          <div className="section-eyebrow">Simple pricing</div>
          <div className="section-title">Start free. Upgrade when you grow.</div>
        </div>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`price-card ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="price-badge">{plan.badge}</div>}
              <div className="price-plan">{plan.name}</div>
              <div className="price-amount">{plan.price}</div>
              <div className="price-period">{plan.period}</div>
              <ul className="price-features">
                {plan.features.map((f) => (
                  <li key={f}><span className="check">✓</span> {f}</li>
                ))}
              </ul>
              <button className={`btn-primary price-cta ${!plan.featured ? 'btn-outline' : ''}`} onClick={() => setModalOpen(true)}>
                {plan.name === 'Pro' ? 'Start 14-day trial' : 'Get started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="logo">Client<span>Drop</span></div>
        <div>© 2026 ClientDrop. Built for freelancers, by freelancers.</div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Create your first portal</div>
            <div className="modal-sub">Enter your details and your first client portal link will be ready in seconds.</div>
            <form onSubmit={handleCreatePortal}>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input className="form-input" type="text" placeholder="e.g. Alex Rivera" required />
              </div>
              <div className="form-group">
                <label className="form-label">Your email</label>
                <input className="form-input" type="email" placeholder="alex@studio.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Client name</label>
                <input className="form-input" type="text" placeholder="e.g. Studio Nova" required />
              </div>
              <div className="form-group">
                <label className="form-label">Project name</label>
                <input className="form-input" type="text" placeholder="e.g. Brand Identity" required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create portal →</button>
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