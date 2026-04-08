import React, { useState, useEffect } from 'react';
import AddAssetForm from '../components/AddAssetForm';
import AssetTable from '../components/AssetTable';

const AssetManager = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      } else {
        console.error('Failed to fetch assets');
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssetAdded = (newAsset) => {
    setAssets([...assets, newAsset]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TrackSuite Asset Manager</h1>
          <p className="mt-2 text-sm text-gray-600">Manage and track your organization's assets efficiently.</p>
        </header>

        <AddAssetForm onAssetAdded={handleAssetAdded} />
        
        {loading ? (
          <div className="text-center py-10">Loading assets...</div>
        ) : (
          <AssetTable assets={assets} />
        )}
      </div>
    </div>
  );
};

export default AssetManager;
