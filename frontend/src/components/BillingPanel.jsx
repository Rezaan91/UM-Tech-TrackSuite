import React, { useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const formatMoney = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);

const BillingPanel = ({ billingData, onRefresh, onToast }) => {
  const [isBusy, setIsBusy] = useState(false);

  const subscription = billingData?.subscription || {
    plan: 'FREE',
    status: 'ACTIVE',
  };

  const invoices = billingData?.invoices || [];

  const nextRenewalText = useMemo(() => {
    if (!subscription.current_period_end) {
      return 'No billing period set';
    }

    const date = new Date(subscription.current_period_end);
    if (Number.isNaN(date.getTime())) {
      return 'No billing period set';
    }

    return date.toLocaleDateString();
  }, [subscription.current_period_end]);

  const redirectToCheckout = async (plan) => {
    setIsBusy(true);
    try {
      const data = await apiFetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      onToast?.(error.message || 'Unable to start checkout', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const openCustomerPortal = async () => {
    setIsBusy(true);
    try {
      const data = await apiFetch('/api/billing/customer-portal', {
        method: 'POST',
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      onToast?.(error.message || 'Unable to open billing portal', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section id="billing-content" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Billing</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Current Subscription</h3>
          <p className="mt-1 text-sm text-slate-600">Plan: {subscription.plan} | Status: {subscription.status}</p>
          <p className="mt-1 text-sm text-slate-600">Next renewal: {nextRenewalText}</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={openCustomerPortal}
          disabled={isBusy}
        >
          Manage Billing Portal
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => redirectToCheckout('PRO')}
          disabled={isBusy}
        >
          Upgrade to PRO
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => redirectToCheckout('ENTERPRISE')}
          disabled={isBusy}
        >
          Upgrade to ENTERPRISE
        </button>
      </div>

      <div className="mt-8">
        <h4 className="text-base font-semibold text-slate-900">Invoices</h4>
        {invoices.length ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id || invoice.stripe_invoice_id || index}>
                    <td className="px-4 py-3 text-sm text-slate-700">{invoice.stripe_invoice_id || `INV-${String(index + 1).padStart(3, '0')}`}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{invoice.status}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatMoney(invoice.amount, invoice.currency)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{new Date(invoice.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No invoices yet.</p>
        )}
      </div>
    </section>
  );
};

export default BillingPanel;
