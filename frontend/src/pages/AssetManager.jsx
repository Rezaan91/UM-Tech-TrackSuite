import React, { useState, useEffect } from 'react';
import AddAssetForm from '../components/AddAssetForm';
import AssetTable from '../components/AssetTable';

const AssetManager = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredAssets = assets.filter((asset) => {
    const search = searchTerm.toLowerCase();
    return (
      asset.asset_name.toLowerCase().includes(search) ||
      asset.asset_tag.toLowerCase().includes(search) ||
      asset.category.toLowerCase().includes(search) ||
      asset.location.toLowerCase().includes(search) ||
      asset.status.toLowerCase().includes(search)
    );
  });

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
        
        <div className="mt-12 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Asset List</h2>
              <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 max-w-md">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">Loading assets...</div>
            ) : (
              <AssetTable assets={filteredAssets} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
