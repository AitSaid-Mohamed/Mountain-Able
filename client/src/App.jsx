import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import RequireRole from './components/RequireRole.jsx';
import Container from './components/layout/Container.jsx';

import HomePage from './pages/HomePage.jsx';
import VillagesPage from './pages/VillagesPage.jsx';
import VillageDetailPage from './pages/VillageDetailPage.jsx';
import RoutePlannerPage from './pages/RoutePlannerPage.jsx';
import PlanJourneyPage from './pages/PlanJourneyPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginRoute from './pages/LoginRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/dashboard/ProfilePage.jsx';

// Tourist "My space"
import MyLayout from './pages/my/MyLayout.jsx';
import MyOverview from './pages/my/MyOverview.jsx';
import MyJourney from './pages/my/MyJourney.jsx';
import MySaved from './pages/my/MySaved.jsx';
import MyRoutes from './pages/my/MyRoutes.jsx';
import MyReviews from './pages/my/MyReviews.jsx';

// Officer
import OfficerOverview from './pages/dashboard/officer/OfficerOverview.jsx';
import OfficerVillages from './pages/dashboard/officer/OfficerVillages.jsx';
import VillageEditor from './pages/dashboard/officer/VillageEditor.jsx';
import OfficerAttractions from './pages/dashboard/officer/OfficerAttractions.jsx';
import OfficerEvents from './pages/dashboard/officer/OfficerEvents.jsx';
import OfficerFeedback from './pages/dashboard/officer/OfficerFeedback.jsx';

// Admin
import AdminOverview from './pages/dashboard/admin/AdminOverview.jsx';
import AdminVillages from './pages/dashboard/admin/AdminVillages.jsx';
import AdminMunicipalities from './pages/dashboard/admin/AdminMunicipalities.jsx';
import AdminUsers from './pages/dashboard/admin/AdminUsers.jsx';
import AdminOfficerRequests from './pages/dashboard/admin/AdminOfficerRequests.jsx';
import AdminModeration from './pages/dashboard/admin/AdminModeration.jsx';
import AdminCategories from './pages/dashboard/admin/AdminCategories.jsx';

// Authority
import AuthorityOverview from './pages/dashboard/authority/AuthorityOverview.jsx';
import AuthorityRegions from './pages/dashboard/authority/AuthorityRegions.jsx';
import AuthorityTopVillages from './pages/dashboard/authority/AuthorityTopVillages.jsx';
import AuthoritySatisfaction from './pages/dashboard/authority/AuthoritySatisfaction.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="villages" element={<VillagesPage />} />
        <Route path="villages/:slug" element={<VillageDetailPage />} />
        <Route path="villages/:slug/route" element={<RoutePlannerPage />} />
        <Route path="plan" element={<PlanJourneyPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="login" element={<LoginRoute />} />

        {/* Shared account profile — every authenticated role, public chrome */}
        <Route
          path="profile"
          element={
            <RequireRole roles={['tourist', 'officer', 'admin', 'authority']}>
              <Container className="py-10"><ProfilePage /></Container>
            </RequireRole>
          }
        />

        {/* Tourist "My space" — inside the public layout, tourist-only */}
        <Route path="my" element={<RequireRole roles={['tourist']}><MyLayout /></RequireRole>}>
          <Route index element={<MyOverview />} />
          <Route path="visited" element={<MyJourney />} />
          <Route path="favorites" element={<MySaved />} />
          <Route path="routes" element={<MyRoutes />} />
          <Route path="reviews" element={<MyReviews />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Officer dashboard */}
      <Route
        path="dashboard"
        element={<RequireRole roles={['officer']}><DashboardLayout role="officer" /></RequireRole>}
      >
        <Route index element={<OfficerOverview />} />
        <Route path="villages" element={<OfficerVillages />} />
        <Route path="villages/new" element={<VillageEditor />} />
        <Route path="villages/:id/edit" element={<VillageEditor />} />
        <Route path="attractions" element={<OfficerAttractions />} />
        <Route path="events" element={<OfficerEvents />} />
        <Route path="feedback" element={<OfficerFeedback />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="admin"
        element={<RequireRole roles={['admin']}><DashboardLayout role="admin" /></RequireRole>}
      >
        <Route index element={<AdminOverview />} />
        <Route path="villages" element={<AdminVillages />} />
        <Route path="villages/new" element={<VillageEditor />} />
        <Route path="villages/:id/edit" element={<VillageEditor />} />
        <Route path="municipalities" element={<AdminMunicipalities />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="officer-requests" element={<AdminOfficerRequests />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Authority dashboard */}
      <Route
        path="authority"
        element={<RequireRole roles={['authority']}><DashboardLayout role="authority" /></RequireRole>}
      >
        <Route index element={<AuthorityOverview />} />
        <Route path="regions" element={<AuthorityRegions />} />
        <Route path="top-villages" element={<AuthorityTopVillages />} />
        <Route path="satisfaction" element={<AuthoritySatisfaction />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
