import { BrowserRouter, Routes, Route } from 'react-router';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { SignInPage } from '@/pages/SignInPage';
import { BerandaPage } from '@/pages/BerandaPage';
import { AjuanPage } from '@/pages/AjuanPage';
import { DiajukanPage } from '@/pages/DiajukanPage';
import { VerifikasiPage } from '@/pages/VerifikasiPage';
import { PanduanPage } from '@/pages/PanduanPage';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { SubmissionDetailPage } from '@/pages/SubmissionDetailPage';
import { AdminFormsPage } from '@/pages/AdminFormsPage';

/**
 * Application router configuration.
 *
 * Public routes: /, /signin, /panduan
 * Protected routes: /dashboard/*, requires authentication
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/panduan" element={<PanduanPage />} />

        {/* Protected Routes — wrapped in AppLayout (sidebar + topbar) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BerandaPage />} />
          <Route path="ajuan" element={<AjuanPage />} />
          <Route path="diajukan" element={<DiajukanPage />} />
          <Route path="verifikasi" element={<VerifikasiPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="submission/:id" element={<SubmissionDetailPage />} />
          <Route path="admin-forms" element={<AdminFormsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
