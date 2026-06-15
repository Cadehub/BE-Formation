import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ScrollToTop } from './components/ScrollToTop';

// Use basic lazy imports or just import directly for now
import { Home } from './pages/Home';
import { FormationsList } from './pages/FormationsList';
import { FormationDetails } from './pages/FormationDetails';
import { BlogIndex } from './pages/BlogIndex';
import { BlogPost } from './pages/BlogPost';
import { AdminDashboard } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { AdminGuard } from './components/AdminGuard';
import { VerifyCertificate } from './pages/VerifyCertificate';

import { Payer } from './pages/Payer';
import { PayInscription } from './pages/PayInscription';
import { StudentLogin } from './pages/StudentLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentProfile } from './pages/StudentProfile';
import { FormationGraduates } from './pages/FormationGraduates';
import { StudentSettings } from './pages/StudentSettings';
import { StudentsDirectory } from './pages/StudentsDirectory';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col pt-12">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/formations" element={<FormationsList />} />
              <Route path="/formations/:slug" element={<FormationDetails />} />
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/etudiants/:student_id" element={<StudentProfile />} />
              <Route path="/formations/:slug/etudiants" element={<FormationGraduates />} />
              <Route path="/etudiants" element={<StudentsDirectory />} />
              <Route path="/student/settings" element={<StudentSettings />} />
              <Route path="/payer" element={<Payer />} />
              <Route path="/pay/:id" element={<PayInscription />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                }
              />
              <Route path="/verify/:certificate_id" element={<VerifyCertificate />} />
              <Route path="/verify" element={<VerifyCertificate />} />
            </Routes>
          </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </BrowserRouter>
  </HelmetProvider>
  );
}
