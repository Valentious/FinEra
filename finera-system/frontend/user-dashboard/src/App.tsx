/**
 * User Dashboard - Placeholder
 * Routes: /dashboard, /wallet, /credit, /transactions
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>FinEra User Dashboard</h1>
        <p>Placeholder - Connect to API Gateway</p>
        <Routes>
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/wallet" element={<div>Wallet</div>} />
          <Route path="/credit" element={<div>Credit</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
