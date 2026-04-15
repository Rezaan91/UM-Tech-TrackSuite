import React, { useState } from 'react';
import { apiFetch } from '../lib/api';

const initialFormState = {
  asset_name: '',
  asset_tag: '',
  category: '',
  location: '',
  status: 'Active',
  purchase_date: '',
};

const requiredFields = ['asset_name', 'asset_tag', 'category', 'location', 'purchase_date'];

const AddAssetForm = ({ onAssetAdded, onError }) => {
  const [formData, setFormData] = useState({
    ...initialFormState,
  });
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = {
    asset_name: formData.asset_name.trim() ? '' : 'Asset name is required',
    asset_tag: formData.asset_tag.trim() ? '' : 'Asset tag is required',
    category: formData.category.trim() ? '' : 'Category is required',
    location: formData.location.trim() ? '' : 'Location is required',
    purchase_date: formData.purchase_date ? '' : 'Purchase date is required',
  };

  const isFormValid = requiredFields.every((field) => !errors[field]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setTouched({
        asset_name: true,
        asset_tag: true,
        category: true,
        location: true,
        purchase_date: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newAsset = await apiFetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      onAssetAdded(newAsset);
      setFormData({ ...initialFormState });
      setTouched({});
    } catch (error) {
      onError?.(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';

  const errorInputClasses =
    'mt-1 block w-full rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add New Asset</h2>
      <p className="mt-1 text-sm text-slate-600">Create a new asset entry with essential operational details.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Asset Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="asset_name"
            value={formData.asset_name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={touched.asset_name && errors.asset_name ? errorInputClasses : inputClasses}
          />
          {touched.asset_name && errors.asset_name && (
            <p className="mt-1 text-xs text-rose-600">{errors.asset_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Asset Tag <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="asset_tag"
            value={formData.asset_tag}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={touched.asset_tag && errors.asset_tag ? errorInputClasses : inputClasses}
          />
          {touched.asset_tag && errors.asset_tag && (
            <p className="mt-1 text-xs text-rose-600">{errors.asset_tag}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Category <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={touched.category && errors.category ? errorInputClasses : inputClasses}
          />
          {touched.category && errors.category && (
            <p className="mt-1 text-xs text-rose-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={touched.location && errors.location ? errorInputClasses : inputClasses}
          />
          {touched.location && errors.location && (
            <p className="mt-1 text-xs text-rose-600">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Purchase Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={touched.purchase_date && errors.purchase_date ? errorInputClasses : inputClasses}
          />
          {touched.purchase_date && errors.purchase_date && (
            <p className="mt-1 text-xs text-rose-600">{errors.purchase_date}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Adding Asset...' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAssetForm;
