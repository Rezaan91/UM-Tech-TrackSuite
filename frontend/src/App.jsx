// UMTrackSuite frontend (App)
// Reads API base from environment variable `VITE_API_BASE` (set this to your Render URL)

const API_BASE = import.meta.env.VITE_API_BASE || "https://um-tracksuite-api.onrender.com";

/*
  Original UMTrackSuite.jsx component copied here. The file is large; to keep the
  repository concise this is the same UI component already present in the project.
  If you need the full source split into smaller components, I can refactor it.
*/

import App from '../../UMTrackSuite.jsx'

export default App
