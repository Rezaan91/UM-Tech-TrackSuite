import React, { useState, useEffect } from 'react';
import AddAssetForm from '../components/AddAssetForm';
import AssetTable from '../components/AssetTable';
import ToastContainer from '../components/ToastContainer';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import BillingPanel from '../components/BillingPanel';
import AdminRevenuePanel from '../components/AdminRevenuePanel';
import { apiFetch } from '../lib/api';

const AssetManager = ({ currentUser, onLogout }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  const user = currentUser || { name: 'Demo Admin', role: 'ADMIN', companyId: 'demo-company' };

  const addToast = (message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchAssets = async () => {
    setLoading(true);

    try {
      const data = await apiFetch('/api/assets');
      setAssets(data);
    } catch (error) {
      addToast(error.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingData = async () => {
    try {
      const data = await apiFetch('/api/billing/summary');
      setBillingData(data);
    } catch (error) {
      addToast(error.message || 'Unable to load billing', 'error');
    }
  };

  const fetchRevenueData = async () => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes((user.role || '').toUpperCase())) {
      return;
    }

    try {
      const data = await apiFetch('/api/admin/revenue');
      setRevenueData(data);
    } catch (error) {
      addToast(error.message || 'Unable to load revenue dashboard', 'error');
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchBillingData();
    fetchRevenueData();
  }, []);

  const handleAssetAdded = (newAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    addToast('Asset added successfully', 'success');
  };

  const openDeleteModal = (asset) => {
    setDeleteTarget(asset);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget.id);

    try {
      await apiFetch(`/api/assets/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      setAssets((prev) => prev.filter((asset) => asset.id !== deleteTarget.id));
      addToast('Asset deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (error) {
      addToast(error.message || 'Something went wrong', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      asset.asset_name.toLowerCase().includes(search) ||
      asset.asset_tag.toLowerCase().includes(search) ||
      asset.category.toLowerCase().includes(search) ||
      asset.location.toLowerCase().includes(search) ||
      asset.status.toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assets.length,
    active: assets.filter((asset) => asset.status === 'Active').length,
    maintenance: assets.filter((asset) => asset.status === 'Maintenance').length,
    retired: assets.filter((asset) => asset.status === 'Retired').length,
  };

  const goToDashboard = () => {
    const dashboard = document.getElementById('dashboard-content');
    dashboard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const SidebarNav = () => (
    <nav className="space-y-2">
      <a href="#" className="block rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
        Dashboard
      </a>
      <a href="#dashboard-content" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
        Assets
      </a>
      <a href="#billing-content" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
        Billing
      </a>
      {['ADMIN', 'SUPER_ADMIN'].includes((user.role || '').toUpperCase()) && (
        <a href="#revenue-content" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
          Revenue
        </a>
      )}
    </nav>
  );

  const StatCard = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white p-6 transition lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">TrackSuite</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Asset Manager</h2>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="mt-8">
          <SidebarNav />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="text-base font-semibold text-slate-900 sm:text-lg">TrackSuite</h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                    return;
                  }

                  addToast('Signed out', 'info');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b border-slate-200 bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.15),transparent_45%)]" />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Operations dashboard</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">TrackSuite Asset Manager</h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Manage and track company assets with ease using a clean, focused workspace designed for daily operations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={goToDashboard}
                >
                  Get Started
                </button>
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Demo login: demo@tracksuite.com / 123456
                </p>
              </div>
            </div>
          </section>

          <section id="dashboard-content" className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total Assets" value={stats.total} />
                  <StatCard label="Active" value={stats.active} />
                  <StatCard label="Maintenance" value={stats.maintenance} />
                  <StatCard label="Retired" value={stats.retired} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700">Search assets</label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, tag, category, location, or status"
                        className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                    <div className="w-full md:w-64">
                      <label className="text-sm font-medium text-slate-700">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="All">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                  </div>
                </div>

                <AddAssetForm onAssetAdded={handleAssetAdded} onError={(message) => addToast(message, 'error')} />

                <AssetTable assets={filteredAssets} deletingId={deletingId} onDelete={openDeleteModal} />

                <BillingPanel
                  billingData={billingData}
                  onRefresh={fetchBillingData}
                  onToast={(message, type) => addToast(message, type)}
                />

                {['ADMIN', 'SUPER_ADMIN'].includes((user.role || '').toUpperCase()) && (
                  <div id="revenue-content">
                    <AdminRevenuePanel revenueData={revenueData} />
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={Boolean(deletingId)}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AssetManager;
