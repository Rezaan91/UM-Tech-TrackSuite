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
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Logo Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center"
        style={{
          backgroundImage: 'url("/logo.png")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          zIndex: 0
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-8 text-center">
          <img src="/logo.png" alt="UM-Tech-TrackSuite Logo" className="h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">UM-Tech-TrackSuite</h1>
          <p className="mt-2 text-lg text-gray-600">Manage and track your organization's assets efficiently.</p>
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
