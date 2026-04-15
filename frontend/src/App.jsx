import React, { useMemo, useState } from 'react';
import AssetManager from './pages/AssetManager';
import AuthHome from './pages/AuthHome';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('tracksuite-user');
    if (!savedUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(savedUser);
      return {
        ...parsed,
        id: parsed.id || `user-${(parsed.email || 'demo').replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
        companyId: parsed.companyId || 'demo-company',
        role: (parsed.role || 'ADMIN').toUpperCase(),
      };
    } catch {
      return null;
    }
  });

  const isAuthenticated = useMemo(() => Boolean(currentUser), [currentUser]);

  const handleAuthenticated = (user) => {
    const normalizedUser = {
      ...user,
      id: user.id || `user-${(user.email || 'demo').replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      companyId: user.companyId || 'demo-company',
      role: (user.role || 'ADMIN').toUpperCase(),
    };

    setCurrentUser(normalizedUser);
    localStorage.setItem('tracksuite-user', JSON.stringify(normalizedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tracksuite-user');
  };

  return (
    <div className="App page-enter">
      {isAuthenticated ? (
        <AssetManager currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthHome onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
}

export default App;
