# TrackSuite Asset Manager (Vertical Slice)

This project implements a small, vertical slice of an Asset Management system, focusing on the core functionalities of adding and viewing assets. It demonstrates a full-stack application with a React frontend, Node.js/Express backend, and SQLite database, designed for simplicity and ease of deployment.

## Features

-   **Add Asset**: Users can add new assets with details such as name, tag, category, location, status, and purchase date.
-   **View Asset List**: Displays a table of all added assets, fetched from the backend API.

## Tech Stack

-   **Frontend**: React (Vite) with Tailwind CSS
-   **Backend**: Node.js with Express.js
-   **Database**: SQLite3

## Folder Structure

```
tracksuite-asset-manager/
├── backend/
│   ├── models/
│   │   └── db.js
│   ├── routes/
│   │   └── assets.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddAssetForm.jsx
│   │   │   └── AssetTable.jsx
│   │   ├── pages/
│   │   │   └── AssetManager.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Complete Backend Code

### `backend/models/db.js`

```javascript
const sqlite3 = require(\'sqlite3\').verbose();
const path = require(\'path\');

const dbPath = path.resolve(__dirname, \'../assets.db\');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(\'Error opening database:\', err.message);
  } else {
    console.log(\'Connected to the SQLite database.\');
    db.run(`CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_name TEXT NOT NULL,
      asset_tag TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      purchase_date TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error(\'Error creating table:\', err.message);
      }
    });
  }
});

module.exports = db;
```

### `backend/routes/assets.js`

```javascript
const express = require(\'express\');
const router = express.Router();
const db = require(\'../models/db\');

// GET /api/assets - View Asset List
router.get(\'/\', (req, res) => {
  const sql = \'SELECT * FROM assets\';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/assets - Add Asset
router.post(\'/\', (req, res) => {
  const { asset_name, asset_tag, category, location, status, purchase_date } = req.body;
  
  if (!asset_name || !asset_tag || !category || !location || !status || !purchase_date) {
    res.status(400).json({ error: \'Please provide all required fields\' });
    return;
  }

  const sql = \'INSERT INTO assets (asset_name, asset_tag, category, location, status, purchase_date) VALUES (?, ?, ?, ?, ?, ?)\';
  const params = [asset_name, asset_tag, category, location, status, purchase_date];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      asset_name,
      asset_tag,
      category,
      location,
      status,
      purchase_date
    });
  });
});

module.exports = router;
```

### `backend/server.js`

```javascript
const express = require(\'express\');
const cors = require(\'cors\');
const bodyParser = require(\'body-parser\');
const assetsRouter = require(\'./routes/assets\');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use(\'/api/assets\', assetsRouter);

// Health check
app.get(\'/health\', (req, res) => {
  res.json({ status: \'ok\' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### `backend/package.json`

```json
{
  "name": "tracksuite-backend",
  "version": "1.0.0",
  "description": "Backend for TrackSuite Asset Manager",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

## Complete Frontend Code

### `frontend/src/components/AddAssetForm.jsx`

```javascript
import React, { useState } from \'react\';

const AddAssetForm = ({ onAssetAdded }) => {
  const [formData, setFormData] = useState({
    asset_name: \'\',
    asset_tag: \'\',
    category: \'\',
    location: \'\',
    status: \'Active\',
    purchase_date: \'\'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets`, {
        method: \'POST\',
        headers: {
          \'Content-Type\': \'application/json\',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const newAsset = await response.json();
        onAssetAdded(newAsset);
        setFormData({
          asset_name: \'\',
          asset_tag: \'\',
          category: \'\',
          location: \'\',
          status: \'Active\',
          purchase_date: \'\'
        });
      } else {
        console.error(\'Failed to add asset\');
      }
    } catch (error) {
      console.error(\'Error adding asset:\', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Add New Asset</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Asset Name</label>
          <input
            type="text"
            name="asset_name"
            value={formData.asset_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
          <input
            type="text"
            name="asset_tag"
            value={formData.asset_tag}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Add Asset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAssetForm;
```

### `frontend/src/components/AssetTable.jsx`

```javascript
import React from \'react\';

const AssetTable = ({ assets }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold p-6 border-b">Asset List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No assets found.</td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.asset_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.asset_tag}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      asset.status === \'Active\' ? \'bg-green-100 text-green-800\' : 
                      asset.status === \'Maintenance\' ? \'bg-yellow-100 text-yellow-800\' : 
                      \'bg-red-100 text-red-800\'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;
```

### `frontend/src/pages/AssetManager.jsx`

```javascript
import React, { useState, useEffect } from \'react\';
import AddAssetForm from \'../components/AddAssetForm\';
import AssetTable from \'../components/AssetTable\';

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
        console.error(\'Failed to fetch assets\');
      }
    } catch (error) {
      console.error(\'Error fetching assets:\', error);
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
          <p className="mt-2 text-sm text-gray-600">Manage and track your organization\'s assets efficiently.</p>
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
```

### `frontend/src/App.jsx`

```javascript
import React from \'react\';
import AssetManager from \'./pages/AssetManager\';

function App() {
  return (
    <div className="App">
      <AssetManager />
    </div>
  );
}

export default App;
```

### `frontend/src/main.jsx`

```javascript
import React from \'react\';
import ReactDOM from \'react-dom/client\';
import App from \'./App\';
import \'./index.css\';

ReactDOM.createRoot(document.getElementById(\'root\')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\',
    \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, \'Courier New\',
    monospace;
}
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TrackSuite Asset Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend/vite.config.js`

```javascript
import { defineConfig } from \'vite\'
import react from \'@vitejs/plugin-react\'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### `frontend/tailwind.config.js`

```javascript
/** @type {import(\'tailwindcss\').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `frontend/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `frontend/package.json`

```json
{
  "name": "tracksuite-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.2.0"
  }
}
```

## Database Setup

The backend uses SQLite3. The `backend/models/db.js` file handles the database connection and automatically creates the `assets` table if it doesn't exist. The table schema is as follows:

```sql
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_name TEXT NOT NULL,
  asset_tag TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  purchase_date TEXT NOT NULL
)
```

## Deployment

### Backend (Render)

1.  **Create a new Web Service on Render**: Go to [Render Dashboard](https://dashboard.render.com/) and create a new Web Service.
2.  **Connect to your GitHub repository**: Link your repository containing the `tracksuite-asset-manager` project.
3.  **Configuration**: 
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Environment Variables**: Add `NODE_ENV=production` (optional, but good practice).
4.  **Deploy**: Render will automatically build and deploy your Node.js application. Note the provided `Live API URL`.

### Frontend (Vercel)

1.  **Create a new Project on Vercel**: Go to [Vercel Dashboard](https://vercel.com/dashboard) and create a new project.
2.  **Connect to your GitHub repository**: Link your repository containing the `tracksuite-asset-manager` project.
3.  **Configuration**: 
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Environment Variables**: Add `VITE_API_URL` and set its value to the `Live API URL` obtained from your Render backend deployment.
4.  **Deploy**: Vercel will automatically build and deploy your React application. Note the provided `Live frontend URL`.

## Local Development

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd tracksuite-asset-manager/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    # Or for development with hot-reloading:
    # npm run dev
    ```
    The API will be available at `http://localhost:5000`.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd tracksuite-asset-manager/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory and add your backend API URL:
    ```
    VITE_API_URL=http://localhost:5000
    ```
    (Replace `http://localhost:5000` with your Render API URL if you want to test against the deployed backend locally).
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).
