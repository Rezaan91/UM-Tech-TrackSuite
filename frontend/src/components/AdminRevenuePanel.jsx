import React from 'react';

const formatMoney = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);

const AdminRevenuePanel = ({ revenueData }) => {
  if (!revenueData) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admin</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Revenue Dashboard</h3>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">MRR</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(revenueData.mrrCents, revenueData.currency)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Active Subscriptions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{revenueData.activeSubscriptions || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Tracked Plans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{revenueData.planDistribution?.length || 0}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {(revenueData.planDistribution || []).map((item) => (
              <tr key={item.plan}>
                <td className="px-4 py-3 text-sm text-slate-700">{item.plan}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminRevenuePanel;
