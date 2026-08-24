import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes as Switch, Route as RouteComp } from 'react-router-dom';
import App from './App.tsx';
import { CarDetailPage } from './pages/CarDetailPage.tsx';
import { ItemDetailPage } from './pages/ItemDetailPage.tsx';
import { ComparePage } from './pages/ComparePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import './index.css';

// PWA service worker is automatically injected by vite-plugin-pwa

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Switch>
        <RouteComp path="/" element={<App />} />
        <RouteComp path="/car/:carId" element={<CarDetailPage />} />
        <RouteComp path="/item/:presetId" element={<ItemDetailPage />} />
        <RouteComp path="/compare/:car1Id/:car2Id" element={<ComparePage />} />
        <RouteComp path="/admin-dashboard" element={<AdminPage />} />
        <RouteComp path="/profile" element={<ProfilePage />} />
      </Switch>
    </Router>
  </StrictMode>
);
