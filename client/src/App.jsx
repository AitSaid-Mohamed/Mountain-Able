import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import VillagesPage from './pages/VillagesPage.jsx';
import VillageDetailPage from './pages/VillageDetailPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginRoute from './pages/LoginRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/** Public route tree. Dashboards are added in a later milestone. */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="villages" element={<VillagesPage />} />
        <Route path="villages/:slug" element={<VillageDetailPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="login" element={<LoginRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
