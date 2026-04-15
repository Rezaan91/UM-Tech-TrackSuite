import React from 'react';

const statusStyles = {
  Active: 'bg-emerald-100 text-emerald-800',
  Maintenance: 'bg-amber-100 text-amber-800',
  Inactive: 'bg-slate-200 text-slate-700',
  Retired: 'bg-rose-100 text-rose-800',
};

const AssetTable = ({ assets, deletingId, onDelete }) => {
  if (!assets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16" strokeLinecap="round" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900">No assets yet. Add your first asset.</h3>
        <p className="mt-1 text-sm text-slate-600">Assets will appear here once your team starts adding records.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">Asset List</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Asset Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Asset Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Purchase Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {assets.map((asset) => (
              <tr key={asset.id} className="transition hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{asset.asset_name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{asset.asset_tag}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{asset.category}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{asset.location}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyles[asset.status] || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{asset.purchase_date}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(asset)}
                    disabled={deletingId === asset.id}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === asset.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;
