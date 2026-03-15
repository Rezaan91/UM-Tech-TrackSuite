import { useState, useEffect, createContext, useContext, useCallback } from "react";

// ─── API Layer ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Mock API for demo (simulates backend responses in-browser)
const MOCK_DB = {
  users: {
    admin: { id: "user-001", password: "admin123", role: "admin", full_name: "IT Administrator", department: "IT" },
    jsmith: { id: "user-002", password: "pass123", role: "employee", full_name: "John Smith", department: "Engineering" },
    mjones: { id: "user-003", password: "pass123", role: "employee", full_name: "Mary Jones", department: "Finance" }
  },
  devices: [
    { id: "dev-001", device_name: "DELL-ENG-001", device_type: "Laptop", manufacturer: "Dell", cpu: "Intel Core i5-10th Gen", ram_gb: 8, storage_gb: 256, os_name: "Windows 10", os_version: "Windows 10 Pro 21H2", last_updated: "2022-06-15", installed_software: ["Microsoft Office", "Chrome", "Slack", "VS Code"], employee_name: "John Smith", department: "Engineering", submitted_by: "user-002", created_at: "2024-01-10T09:00:00" },
    { id: "dev-002", device_name: "HP-FIN-002", device_type: "Desktop", manufacturer: "HP", cpu: "Intel Core i3-8th Gen", ram_gb: 4, storage_gb: 128, os_name: "Windows 10", os_version: "Windows 10 Home 1903", last_updated: "2021-03-10", installed_software: ["Microsoft Office", "QuickBooks", "Chrome"], employee_name: "Mary Jones", department: "Finance", submitted_by: "user-003", created_at: "2024-01-11T10:30:00" },
    { id: "dev-003", device_name: "MAC-MKT-003", device_type: "Laptop", manufacturer: "Apple", cpu: "Apple M2", ram_gb: 16, storage_gb: 512, os_name: "macOS", os_version: "macOS Ventura 13.5", last_updated: "2024-01-05", installed_software: ["Microsoft Office", "Figma", "Chrome", "Slack", "CrowdStrike"], employee_name: "Alex Chen", department: "Marketing", submitted_by: "user-001", created_at: "2024-01-12T08:15:00" },
    { id: "dev-004", device_name: "LENOVO-IT-004", device_type: "Laptop", manufacturer: "Lenovo", cpu: "Intel Core i7-12th Gen", ram_gb: 32, storage_gb: 1000, os_name: "Windows 11", os_version: "Windows 11 Pro 23H2", last_updated: "2024-02-20", installed_software: ["Microsoft Office", "Chrome", "CrowdStrike", "GlobalProtect", "Acronis"], employee_name: "IT Admin", department: "IT", submitted_by: "user-001", created_at: "2024-01-15T11:00:00" },
    { id: "dev-005", device_name: "DELL-HR-005", device_type: "Desktop", manufacturer: "Dell", cpu: "Intel Core i5-6th Gen", ram_gb: 8, storage_gb: 500, os_name: "Windows 7", os_version: "Windows 7 SP1", last_updated: "2020-11-01", installed_software: ["Microsoft Office 2010", "Internet Explorer"], employee_name: "Robert Davis", department: "HR", submitted_by: "user-001", created_at: "2024-01-16T14:00:00" }
  ]
};

function analyzeDevice(device) {
  const recs = [];
  let risk = 0;
  if (device.ram_gb < 8) { recs.push({ category: "Hardware", severity: "critical", issue: `RAM is ${device.ram_gb}GB — below minimum`, action: "Upgrade RAM to at least 16GB", priority: 1 }); risk += 35; }
  else if (device.ram_gb < 16) { recs.push({ category: "Hardware", severity: "warning", issue: `RAM is ${device.ram_gb}GB — limited`, action: "Consider upgrading to 16GB", priority: 2 }); risk += 15; }
  if (device.storage_gb < 128) { recs.push({ category: "Hardware", severity: "critical", issue: `Storage is ${device.storage_gb}GB — critically low`, action: "Upgrade to at least 256GB SSD", priority: 1 }); risk += 30; }
  else if (device.storage_gb < 256) { recs.push({ category: "Hardware", severity: "warning", issue: `Storage is ${device.storage_gb}GB — may run low`, action: "Consider upgrading to 512GB SSD", priority: 2 }); risk += 10; }
  const osLower = (device.os_name + device.os_version).toLowerCase();
  if (osLower.includes("windows 7") || osLower.includes("windows 8")) { recs.push({ category: "Operating System", severity: "critical", issue: "Running end-of-life Windows — severe security risk", action: "Immediately upgrade to Windows 11", priority: 1 }); risk += 50; }
  else if (osLower.includes("windows 10")) { recs.push({ category: "Operating System", severity: "warning", issue: "Windows 10 end of support Oct 2025", action: "Upgrade to Windows 11", priority: 1 }); risk += 25; }
  try {
    const yearsOld = new Date().getFullYear() - parseInt(device.last_updated.substring(0, 4));
    if (yearsOld >= 2) { recs.push({ category: "Software Updates", severity: "critical", issue: `Not updated since ${device.last_updated} (${yearsOld}yr ago)`, action: "Run all pending system updates immediately", priority: 1 }); risk += 30; }
    else if (yearsOld >= 1) { recs.push({ category: "Software Updates", severity: "warning", issue: "System update over 1 year old", action: "Schedule updates within 30 days", priority: 2 }); risk += 15; }
  } catch {}
  const sw = (device.installed_software || []).join(" ").toLowerCase();
  const antivirusTools = ["norton", "mcafee", "defender", "kaspersky", "avast", "bitdefender", "crowdstrike", "eset"];
  if (!antivirusTools.some(t => sw.includes(t))) { recs.push({ category: "Security", severity: "critical", issue: "No antivirus software detected", action: "Install enterprise antivirus solution", priority: 1 }); risk += 20; }
  const vpnTools = ["cisco vpn", "globalprotect", "nordvpn", "expressvpn", "openvpn", "fortinet"];
  if (!vpnTools.some(t => sw.includes(t))) { recs.push({ category: "Security", severity: "warning", issue: "No VPN client detected", action: "Install corporate VPN client", priority: 2 }); risk += 10; }
  risk = Math.min(risk, 100);
  const health = risk >= 60 ? "critical" : risk >= 30 ? "warning" : "healthy";
  return { health_status: health, risk_score: risk, recommendations: recs.sort((a, b) => a.priority - b.priority) };
}

const mockApi = {
  login: async (username, password) => {
    await new Promise(r => setTimeout(r, 600));
    const user = MOCK_DB.users[username];
    if (!user || user.password !== password) throw new Error("Invalid credentials");
    return { token: "mock-jwt-" + user.id, user: { id: user.id, username, role: user.role, full_name: user.full_name, department: user.department } };
  },
  getDevices: async (userId, role) => {
    await new Promise(r => setTimeout(r, 400));
    let devices = [...MOCK_DB.devices];
    if (role !== "admin") devices = devices.filter(d => d.submitted_by === userId);
    return devices.map(d => { const a = analyzeDevice(d); return { ...d, ...a, recommendation_count: a.recommendations.length }; });
  },
  getDevice: async (id) => {
    await new Promise(r => setTimeout(r, 300));
    const d = MOCK_DB.devices.find(x => x.id === id);
    if (!d) throw new Error("Device not found");
    return { ...d, ...analyzeDevice(d) };
  },
  createDevice: async (data, userId) => {
    await new Promise(r => setTimeout(r, 700));
    const newDevice = { ...data, id: "dev-" + Date.now(), submitted_by: userId, created_at: new Date().toISOString() };
    MOCK_DB.devices.push(newDevice);
    return { message: "Device registered", device_id: newDevice.id };
  },
  deleteDevice: async (id) => {
    await new Promise(r => setTimeout(r, 400));
    const idx = MOCK_DB.devices.findIndex(d => d.id === id);
    if (idx > -1) MOCK_DB.devices.splice(idx, 1);
    return { message: "Device deleted" };
  },
  getStats: async () => {
    await new Promise(r => setTimeout(r, 300));
    const devices = MOCK_DB.devices;
    const stats = { total_devices: devices.length, critical: 0, warning: 0, healthy: 0 };
    devices.forEach(d => { const { health_status } = analyzeDevice(d); stats[health_status]++; });
    stats.compliance_rate = Math.round((stats.healthy / stats.total_devices) * 100);
    return stats;
  }
};

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0e17;
    --surface: #111827;
    --surface2: #1a2235;
    --border: #1e2d45;
    --border2: #2a3f5f;
    --text: #e2e8f0;
    --muted: #64748b;
    --accent: #00d4ff;
    --accent2: #0099cc;
    --green: #10b981;
    --yellow: #f59e0b;
    --red: #ef4444;
    --purple: #8b5cf6;
    --font: 'IBM Plex Sans', sans-serif;
    --mono: 'IBM Plex Mono', monospace;
  }
  body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }
  .app { display: flex; min-height: 100vh; }
  
  /* Sidebar */
  .sidebar { width: 240px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; }
  .sidebar-logo { padding: 24px 20px; border-bottom: 1px solid var(--border); }
  .logo-text { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; }
  .logo-sub { font-size: 11px; color: var(--muted); margin-top: 2px; letter-spacing: 1px; }
  .sidebar-nav { flex: 1; padding: 16px 0; overflow-y: auto; }
  .nav-section { padding: 8px 20px 4px; font-size: 10px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; font-size: 13px; color: var(--muted); transition: all 0.15s; border-left: 2px solid transparent; }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); background: rgba(0,212,255,0.07); border-left-color: var(--accent); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); }
  .user-info { font-size: 12px; color: var(--muted); }
  .user-name { color: var(--text); font-weight: 500; font-size: 13px; }
  .user-role { font-size: 10px; font-family: var(--mono); color: var(--accent); text-transform: uppercase; letter-spacing: 1px; }
  .btn-logout { margin-top: 10px; width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border); color: var(--muted); cursor: pointer; font-size: 12px; border-radius: 4px; transition: all 0.15s; font-family: var(--font); }
  .btn-logout:hover { border-color: var(--red); color: var(--red); }

  /* Main */
  .main { margin-left: 240px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .topbar { padding: 16px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface); }
  .page-title { font-size: 20px; font-weight: 600; }
  .page-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .topbar-actions { display: flex; gap: 10px; }
  .content { padding: 32px; flex: 1; }

  /* Buttons */
  .btn { padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; font-family: var(--font); display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: var(--accent2); }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-ghost:hover { border-color: var(--border2); color: var(--text); }
  .btn-danger { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-danger:hover { border-color: var(--red); color: var(--red); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Cards */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
  .card-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .card-title { font-size: 14px; font-weight: 600; }
  .card-body { padding: 24px; }

  /* Stat Cards */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px 24px; }
  .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .stat-value { font-size: 36px; font-weight: 700; font-family: var(--mono); line-height: 1; }
  .stat-sub { font-size: 11px; color: var(--muted); margin-top: 6px; }
  .stat-accent { color: var(--accent); }
  .stat-red { color: var(--red); }
  .stat-yellow { color: var(--yellow); }
  .stat-green { color: var(--green); }

  /* Table */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 14px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }
  .device-name { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: var(--mono); }
  .chip-critical { background: rgba(239,68,68,0.12); color: var(--red); border: 1px solid rgba(239,68,68,0.25); }
  .chip-warning { background: rgba(245,158,11,0.12); color: var(--yellow); border: 1px solid rgba(245,158,11,0.25); }
  .chip-healthy { background: rgba(16,185,129,0.12); color: var(--green); border: 1px solid rgba(16,185,129,0.25); }
  .chip-info { background: rgba(0,212,255,0.1); color: var(--accent); border: 1px solid rgba(0,212,255,0.2); }

  /* Score bar */
  .risk-bar { width: 80px; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .risk-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
  .risk-fill-critical { background: var(--red); }
  .risk-fill-warning { background: var(--yellow); }
  .risk-fill-healthy { background: var(--green); }

  /* Login */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); position: relative; overflow: hidden; }
  .login-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%); }
  .login-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 50px 50px; opacity: 0.3; }
  .login-card { position: relative; width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 40px; }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo-icon { font-size: 40px; margin-bottom: 8px; }
  .login-title { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--accent); letter-spacing: 3px; text-transform: uppercase; }
  .login-subtitle { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.5px; }
  .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; font-family: var(--font); transition: border-color 0.15s; outline: none; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .login-hint { margin-top: 20px; padding: 12px; background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.15); border-radius: 6px; font-size: 11px; color: var(--muted); font-family: var(--mono); }
  .login-hint span { color: var(--accent); }
  .error-msg { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: var(--red); margin-bottom: 16px; }

  /* Device detail */
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .spec-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .spec-row:last-child { border-bottom: none; }
  .spec-label { color: var(--muted); }
  .spec-value { font-family: var(--mono); font-size: 12px; }
  .rec-item { padding: 14px; border-radius: 6px; margin-bottom: 10px; border: 1px solid; }
  .rec-critical { background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.2); }
  .rec-warning { background: rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.2); }
  .rec-issue { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
  .rec-action { font-size: 12px; color: var(--muted); }
  .rec-cat { font-size: 10px; font-family: var(--mono); margin-bottom: 6px; }
  .rec-cat-critical { color: var(--red); }
  .rec-cat-warning { color: var(--yellow); }
  .software-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .sw-tag { padding: 4px 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; font-family: var(--mono); }
  .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; font-family: var(--mono); }
  .score-num { font-size: 28px; font-weight: 700; }
  .score-label { font-size: 10px; color: var(--muted); letter-spacing: 1px; }

  /* Form page */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-full { grid-column: 1 / -1; }
  select.form-input { cursor: pointer; }

  /* Empty state */
  .empty-state { text-align: center; padding: 60px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-text { font-size: 14px; }

  /* Loading */
  .loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: var(--muted); gap: 10px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }

  /* Pulse animation */
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .pulse { animation: pulse 2s infinite; }

  /* AI badge */
  .ai-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); border-radius: 20px; font-size: 11px; color: var(--purple); font-family: var(--mono); }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }

  /* Donut-like ring */
  .health-ring { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; font-family: var(--mono); border: 4px solid; }
  .health-ring-critical { border-color: var(--red); color: var(--red); background: rgba(239,68,68,0.08); }
  .health-ring-warning { border-color: var(--yellow); color: var(--yellow); background: rgba(245,158,11,0.08); }
  .health-ring-healthy { border-color: var(--green); color: var(--green); background: rgba(16,185,129,0.08); }

  /* Back button */
  .back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); cursor: pointer; margin-bottom: 20px; background: none; border: none; font-family: var(--font); transition: color 0.15s; }
  .back-btn:hover { color: var(--accent); }

  /* Tags input */
  .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; min-height: 44px; }
  .tags-wrap:focus-within { border-color: var(--accent); }
  .tag-item { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: var(--border); border-radius: 4px; font-size: 12px; }
  .tag-remove { cursor: pointer; opacity: 0.6; font-size: 14px; line-height: 1; }
  .tag-remove:hover { opacity: 1; }
  .tag-input { border: none; background: transparent; outline: none; font-size: 13px; color: var(--text); font-family: var(--font); min-width: 120px; flex: 1; }
  .tag-input::placeholder { color: var(--muted); }

  /* Notification */
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .notification { position: fixed; bottom: 24px; right: 24px; padding: 14px 20px; border-radius: 8px; font-size: 13px; z-index: 999; animation: slideIn 0.3s ease; }
  .notification-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: var(--green); }
  .notification-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: var(--red); }
`;

// ─── Components ───────────────────────────────────────────────────────────────

function Notification({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className={`notification notification-${type}`}>{type === "success" ? "✓ " : "✗ "}{msg}</div>;
}

function HealthChip({ status }) {
  const labels = { critical: "⚠ Critical", warning: "△ Warning", healthy: "✓ Healthy" };
  return <span className={`chip chip-${status}`}>{labels[status]}</span>;
}

function RiskBar({ score, status }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="risk-bar"><div className={`risk-fill risk-fill-${status}`} style={{ width: score + "%" }} /></div>
      <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>{score}</span>
    </div>
  );
}

function Spinner() { return <div className="loading"><div className="spinner" /><span>Loading...</span></div>; }

// ─── Pages ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const result = await mockApi.login(username, password);
      onLogin(result);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />
      <div className="login-grid" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🖥️</div>
          <div className="login-title">TrackSuite</div>
          <div className="login-subtitle">UM IT Asset Monitoring Platform</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin / jsmith / mjones" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Authenticating..." : "Sign In →"}
        </button>
        <div className="login-hint">
          <div>Demo accounts:</div>
          <div><span>admin</span> / admin123 — Full admin access</div>
          <div><span>jsmith</span> / pass123 — Employee view</div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    mockApi.getStats().then(setStats);
    mockApi.getDevices(user.id, user.role).then(d => setDevices(d.slice(0, 5)));
  }, []);

  if (!stats) return <Spinner />;

  const criticalDevices = devices.filter(d => d.health_status === "critical");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span className="ai-badge">✦ AI Analysis Active</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Automated upgrade recommendations powered by rule-based engine</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value stat-accent">{stats.total_devices}</div>
          <div className="stat-sub">Registered in system</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical</div>
          <div className="stat-value stat-red">{stats.critical}</div>
          <div className="stat-sub">Require immediate action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Warning</div>
          <div className="stat-value stat-yellow">{stats.warning}</div>
          <div className="stat-sub">Need attention soon</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Compliance Rate</div>
          <div className="stat-value stat-green">{stats.compliance_rate}%</div>
          <div className="stat-sub">{stats.healthy} healthy devices</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Devices</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("devices")}>View All →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Device</th><th>Department</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} style={{ cursor: "pointer" }}>
                    <td><div className="device-name">{d.device_name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{d.manufacturer} • {d.device_type}</div></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.department}</td>
                    <td><HealthChip status={d.health_status} /></td>
                    <td><RiskBar score={d.risk_score} status={d.health_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🔴 Critical Alerts</span>
          </div>
          <div className="card-body">
            {criticalDevices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: 13 }}>✓ No critical devices for your account</div>
            ) : criticalDevices.map(d => (
              <div key={d.id} style={{ padding: "12px", marginBottom: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="device-name">{d.device_name}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--red)" }}>Risk: {d.risk_score}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{d.recommendation_count} recommendation{d.recommendation_count !== 1 ? "s" : ""} pending • {d.employee_name}</div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: "12px", background: "var(--surface2)", borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Health Distribution</div>
              {[["Critical", stats.critical, "var(--red)"], ["Warning", stats.warning, "var(--yellow)"], ["Healthy", stats.healthy, "var(--green)"]].map(([label, count, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / stats.total_devices * 100)}%`, background: color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--muted)", width: 40, textAlign: "right" }}>{count} / {stats.total_devices}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceList({ setPage, setSelectedDevice }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notify, setNotify] = useState(null);
  const { user } = useAuth();

  const load = useCallback(() => {
    setLoading(true);
    mockApi.getDevices(user.id, user.role).then(d => { setDevices(d); setLoading(false); });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = devices.filter(d => {
    const matchFilter = filter === "all" || d.health_status === filter;
    const matchSearch = !search || d.device_name.toLowerCase().includes(search.toLowerCase()) || d.employee_name.toLowerCase().includes(search.toLowerCase()) || d.department.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await mockApi.deleteDevice(id);
    setNotify({ msg: `${name} deleted`, type: "success" });
    load();
  };

  return (
    <div>
      {notify && <Notification {...notify} onClose={() => setNotify(null)} />}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="🔍 Search devices, users, departments..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "critical", "warning", "healthy"].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)} style={{ textTransform: "capitalize" }}>{f === "all" ? "All" : f}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPage("register")}>+ Register Device</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Asset Inventory</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} device{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💻</div><div className="empty-text">No devices found</div></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Device</th><th>Specs</th><th>OS</th><th>Department</th><th>Last Updated</th><th>Status</th><th>Risk Score</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="device-name">{d.device_name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{d.manufacturer} {d.device_type}</div>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>
                        {d.ram_gb}GB RAM · {d.storage_gb}GB
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.os_name}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.department}</td>
                      <td style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>{d.last_updated}</td>
                      <td><HealthChip status={d.health_status} /></td>
                      <td><RiskBar score={d.risk_score} status={d.health_status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedDevice(d.id); setPage("device-detail"); }}>View</button>
                          {user.role === "admin" && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id, d.device_name)}>Del</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceDetail({ deviceId, setPage }) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getDevice(deviceId).then(d => { setDevice(d); setLoading(false); });
  }, [deviceId]);

  if (loading) return <Spinner />;
  if (!device) return <div>Device not found</div>;

  const scoreColor = device.health_status === "critical" ? "var(--red)" : device.health_status === "warning" ? "var(--yellow)" : "var(--green)";

  return (
    <div>
      <button className="back-btn" onClick={() => setPage("devices")}>← Back to Devices</button>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontFamily: "var(--mono)", fontSize: 22, color: "var(--accent)" }}>{device.device_name}</h2>
            <HealthChip status={device.health_status} />
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{device.employee_name} · {device.department} · Registered {device.created_at?.substring(0, 10)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className={`health-ring health-ring-${device.health_status}`}>{device.risk_score}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Risk Score</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">⚙️ Hardware Specs</span></div>
          <div className="card-body">
            {[
              ["Device Type", device.device_type],
              ["Manufacturer", device.manufacturer],
              ["CPU", device.cpu],
              ["RAM", `${device.ram_gb} GB`],
              ["Storage", `${device.storage_gb} GB`],
            ].map(([label, value]) => (
              <div className="spec-row" key={label}>
                <span className="spec-label">{label}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🖥️ System Info</span></div>
          <div className="card-body">
            {[
              ["OS", device.os_name],
              ["OS Version", device.os_version],
              ["Last Updated", device.last_updated],
              ["Employee", device.employee_name],
              ["Department", device.department],
            ].map(([label, value]) => (
              <div className="spec-row" key={label}>
                <span className="spec-label">{label}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">📦 Installed Software</span></div>
        <div className="card-body">
          <div className="software-tags">
            {(device.installed_software || []).map(sw => <span className="sw-tag" key={sw}>{sw}</span>)}
            {device.installed_software?.length === 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>No software recorded</span>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">🤖 AI Upgrade Recommendations</span>
          <span className="ai-badge">✦ Automated Analysis</span>
        </div>
        <div className="card-body">
          {device.recommendations?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--green)", fontSize: 14 }}>✓ No recommendations — this device meets all standards!</div>
          ) : device.recommendations?.map((rec, i) => (
            <div key={i} className={`rec-item rec-${rec.severity}`}>
              <div className={`rec-cat rec-cat-${rec.severity}`}>{rec.category.toUpperCase()} · {rec.severity.toUpperCase()}</div>
              <div className="rec-issue">{rec.issue}</div>
              <div className="rec-action">→ {rec.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterDevice({ setPage }) {
  const { user } = useAuth();
  const [notify, setNotify] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    device_name: "", device_type: "Laptop", manufacturer: "", cpu: "",
    ram_gb: 8, storage_gb: 256, os_name: "Windows 11", os_version: "",
    last_updated: new Date().toISOString().substring(0, 10),
    installed_software: [], employee_name: user.full_name, department: user.department
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = (val) => {
    const clean = val.trim();
    if (clean && !form.installed_software.includes(clean)) {
      set("installed_software", [...form.installed_software, clean]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => set("installed_software", form.installed_software.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!form.device_name || !form.manufacturer || !form.cpu || !form.os_version) {
      setNotify({ msg: "Please fill all required fields", type: "error" }); return;
    }
    setLoading(true);
    try {
      await mockApi.createDevice({ ...form, ram_gb: parseInt(form.ram_gb), storage_gb: parseInt(form.storage_gb) }, user.id);
      setNotify({ msg: "Device registered successfully!", type: "success" });
      setTimeout(() => setPage("devices"), 1500);
    } catch (e) {
      setNotify({ msg: e.message, type: "error" });
    } finally { setLoading(false); }
  };

  return (
    <div>
      {notify && <Notification {...notify} onClose={() => setNotify(null)} />}
      <button className="back-btn" onClick={() => setPage("devices")}>← Back to Devices</button>
      <div className="card">
        <div className="card-header"><span className="card-title">Register New Device</span></div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Device Name *</label>
              <input className="form-input" value={form.device_name} onChange={e => set("device_name", e.target.value)} placeholder="e.g. DELL-ENG-007" />
            </div>
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select className="form-input" value={form.device_type} onChange={e => set("device_type", e.target.value)}>
                {["Laptop", "Desktop", "Workstation", "Server", "Tablet"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturer *</label>
              <input className="form-input" value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="Dell, HP, Apple, Lenovo..." />
            </div>
            <div className="form-group">
              <label className="form-label">CPU *</label>
              <input className="form-input" value={form.cpu} onChange={e => set("cpu", e.target.value)} placeholder="Intel Core i7-12th Gen" />
            </div>
            <div className="form-group">
              <label className="form-label">RAM (GB)</label>
              <select className="form-input" value={form.ram_gb} onChange={e => set("ram_gb", e.target.value)}>
                {[2, 4, 8, 16, 32, 64].map(v => <option key={v} value={v}>{v} GB</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Storage (GB)</label>
              <select className="form-input" value={form.storage_gb} onChange={e => set("storage_gb", e.target.value)}>
                {[64, 128, 256, 512, 1000, 2000].map(v => <option key={v} value={v}>{v >= 1000 ? v / 1000 + " TB" : v + " GB"}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Operating System</label>
              <select className="form-input" value={form.os_name} onChange={e => set("os_name", e.target.value)}>
                {["Windows 11", "Windows 10", "Windows 7", "macOS", "Ubuntu", "Fedora", "Other"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">OS Version *</label>
              <input className="form-input" value={form.os_version} onChange={e => set("os_version", e.target.value)} placeholder="e.g. Windows 11 Pro 23H2" />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Name</label>
              <input className="form-input" value={form.employee_name} onChange={e => set("employee_name", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => set("department", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last System Update</label>
              <input className="form-input" type="date" value={form.last_updated} onChange={e => set("last_updated", e.target.value)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Installed Software (type and press Enter)</label>
              <div className="tags-wrap">
                {form.installed_software.map(tag => (
                  <span className="tag-item" key={tag}>{tag}<span className="tag-remove" onClick={() => removeTag(tag)}>×</span></span>
                ))}
                <input className="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="Chrome, Slack, Office 365..." />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Registering..." : "Register Device"}</button>
            <button className="btn btn-ghost" onClick={() => setPage("devices")}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const { user } = useAuth();

  useEffect(() => { mockApi.getDevices(user.id, user.role).then(setDevices); }, []);

  const deptStats = devices.reduce((acc, d) => {
    if (!acc[d.department]) acc[d.department] = { total: 0, critical: 0, warning: 0, healthy: 0 };
    acc[d.department].total++;
    acc[d.department][d.health_status]++;
    return acc;
  }, {});

  const osStats = devices.reduce((acc, d) => {
    const os = d.os_name;
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Department Health</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Department</th><th>Total</th><th>Critical</th><th>Warning</th><th>Healthy</th></tr></thead>
              <tbody>
                {Object.entries(deptStats).map(([dept, s]) => (
                  <tr key={dept}>
                    <td style={{ fontWeight: 500 }}>{dept}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{s.total}</td>
                    <td><span style={{ color: "var(--red)", fontFamily: "var(--mono)", fontSize: 13 }}>{s.critical || 0}</span></td>
                    <td><span style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontSize: 13 }}>{s.warning || 0}</span></td>
                    <td><span style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: 13 }}>{s.healthy || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🖥️ OS Distribution</span></div>
          <div className="card-body">
            {Object.entries(osStats).map(([os, count]) => {
              const isOld = os.includes("7") || os.includes("8") || os.includes("10");
              return (
                <div key={os} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {os}
                      {isOld && <span className="chip chip-warning" style={{ fontSize: 10 }}>Legacy</span>}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12 }}>{count} device{count > 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / devices.length * 100)}%`, background: isOld ? "var(--yellow)" : "var(--green)", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">🚨 All Critical Devices</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Device</th><th>Employee</th><th>Department</th><th>OS</th><th>RAM</th><th>Risk</th><th>Issues</th></tr></thead>
            <tbody>
              {devices.filter(d => d.health_status === "critical").map(d => (
                <tr key={d.id}>
                  <td className="device-name">{d.device_name}</td>
                  <td style={{ fontSize: 12 }}>{d.employee_name}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.department}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.os_name}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{d.ram_gb}GB</td>
                  <td><RiskBar score={d.risk_score} status={d.health_status} /></td>
                  <td><span className="chip chip-critical">{d.recommendation_count} issues</span></td>
                </tr>
              ))}
              {devices.filter(d => d.health_status === "critical").length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--green)", padding: "24px" }}>✓ No critical devices!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, user, onLogout }) {
  const adminNav = [
    { key: "dashboard", icon: "◈", label: "Dashboard" },
    { key: "devices", icon: "▦", label: "All Devices" },
    { key: "register", icon: "+", label: "Register Device" },
    { key: "admin", icon: "⚡", label: "Admin Panel" },
  ];
  const empNav = [
    { key: "dashboard", icon: "◈", label: "Dashboard" },
    { key: "devices", icon: "▦", label: "My Devices" },
    { key: "register", icon: "+", label: "Register Device" },
  ];
  const nav = user.role === "admin" ? adminNav : empNav;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: 20, marginBottom: 4 }}>🖥️</div>
        <div className="logo-text">TrackSuite</div>
        <div className="logo-sub">IT Asset Monitor</div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section">Navigation</div>
        {nav.map(item => (
          <div key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-name">{user.full_name}</div>
        <div className="user-role">{user.role}</div>
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

const PAGE_TITLES = {
  dashboard: ["Dashboard", "Overview of your IT asset health"],
  devices: ["Device Inventory", "Manage and monitor registered devices"],
  register: ["Register Device", "Add a new device to the system"],
  "device-detail": ["Device Details", "Full specs and upgrade recommendations"],
  admin: ["Admin Panel", "System-wide analytics and management"]
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleLogin = (result) => setAuth(result);
  const handleLogout = () => { setAuth(null); setPage("dashboard"); };

  if (!auth) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={handleLogin} />
    </>
  );

  const [title, sub] = PAGE_TITLES[page] || ["", ""];

  return (
    <AuthCtx.Provider value={{ user: auth.user, token: auth.token }}>
      <style>{css}</style>
      <div className="app">
        <Sidebar page={page} setPage={(p) => { setPage(p); setSelectedDevice(null); }} user={auth.user} onLogout={handleLogout} />
        <div className="main">
          <div className="topbar">
            <div>
              <div className="page-title">{title}</div>
              <div className="page-sub">{sub}</div>
            </div>
            <div className="topbar-actions">
              <span className="chip chip-info">🟢 System Online</span>
              {auth.user.role === "admin" && <span className="chip chip-info">Admin</span>}
            </div>
          </div>
          <div className="content">
            {page === "dashboard" && <Dashboard setPage={setPage} />}
            {page === "devices" && <DeviceList setPage={setPage} setSelectedDevice={setSelectedDevice} />}
            {page === "register" && <RegisterDevice setPage={setPage} />}
            {page === "device-detail" && <DeviceDetail deviceId={selectedDevice} setPage={setPage} />}
            {page === "admin" && auth.user.role === "admin" && <AdminPanel />}
          </div>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
