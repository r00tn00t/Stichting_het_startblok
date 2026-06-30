import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LeerlingenPage from './pages/LeerlingenPage.jsx';
import LeerlingDetailPage from './pages/LeerlingDetailPage.jsx';
import LeerlingFormPage from './pages/LeerlingFormPage.jsx';
import KennisbankPage from './pages/KennisbankPage.jsx';
import GebruikersPage from './pages/GebruikersPage.jsx';
import InschrijvingPage from './pages/InschrijvingPage.jsx';
import ActiviteitInschrijvingPage from './pages/ActiviteitInschrijvingPage.jsx';
import VrijwilligerRegistratiePage from './pages/VrijwilligerRegistratiePage.jsx';
import InschrijvingenBeheerPage from './pages/InschrijvingenBeheerPage.jsx';
import LocatiesPage from './pages/LocatiesPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
import AanwezigheidPage from './pages/AanwezigheidPage.jsx';
import BeheerPage from './pages/BeheerPage.jsx';
import NiveausPage from './pages/NiveausPage.jsx';
import VakantiesPage from './pages/VakantiesPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import AfsprakenPage from './pages/AfsprakenPage.jsx';
import BadindelingPage from './pages/BadindelingPage.jsx';
import VrijwilligerDashboard from './pages/VrijwilligerDashboard.jsx';

// Beschermt routes: stuurt naar /login als er geen sessie is.
function Beveiligd({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Laden…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Vereist minimaal een bepaalde rol; anders terug naar de leerlingenlijst.
function RolVereist({ minRol, children }) {
  const { heeftRol } = useAuth();
  if (!heeftRol(minRol)) return <Navigate to="/" replace />;
  return children;
}

// Startpagina per rol: vrijwilliger → dashboard, coördinator/directie → leerlingen.
function StartRedirect() {
  const { user } = useAuth();
  const doel = user?.role === 'vrijwilliger' ? '/dashboard' : '/leerlingen';
  return <Navigate to={doel} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Publieke pagina's — geen login vereist */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inschrijven" element={<InschrijvingPage />} />
      <Route path="/inschrijven-activiteit" element={<ActiviteitInschrijvingPage />} />
      <Route path="/aanmelden-vrijwilliger" element={<VrijwilligerRegistratiePage />} />
      <Route
        path="/"
        element={
          <Beveiligd>
            <Layout />
          </Beveiligd>
        }
      >
        <Route index element={<StartRedirect />} />
        <Route path="dashboard" element={<VrijwilligerDashboard />} />
        <Route path="leerlingen" element={<LeerlingenPage />} />
        <Route
          path="leerlingen/nieuw"
          element={<RolVereist minRol="coordinator"><LeerlingFormPage /></RolVereist>}
        />
        <Route path="leerlingen/:id" element={<LeerlingDetailPage />} />
        <Route
          path="leerlingen/:id/bewerken"
          element={<RolVereist minRol="coordinator"><LeerlingFormPage /></RolVereist>}
        />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="kennisbank" element={<KennisbankPage />} />
        <Route
          path="badindeling"
          element={<RolVereist minRol="coordinator"><BadindelingPage /></RolVereist>}
        />
        <Route
          path="locaties"
          element={<RolVereist minRol="coordinator"><LocatiesPage /></RolVereist>}
        />
        <Route
          path="templates"
          element={<RolVereist minRol="coordinator"><TemplatesPage /></RolVereist>}
        />
        <Route
          path="aanwezigheid"
          element={<RolVereist minRol="coordinator"><AanwezigheidPage /></RolVereist>}
        />
        <Route
          path="beheer"
          element={<RolVereist minRol="coordinator"><BeheerPage /></RolVereist>}
        />
        <Route
          path="niveaus"
          element={<RolVereist minRol="coordinator"><NiveausPage /></RolVereist>}
        />
        <Route
          path="vakanties"
          element={<RolVereist minRol="coordinator"><VakantiesPage /></RolVereist>}
        />
        <Route
          path="afspraken"
          element={<RolVereist minRol="directie"><AfsprakenPage /></RolVereist>}
        />
        <Route
          path="gebruikers"
          element={<RolVereist minRol="coordinator"><GebruikersPage /></RolVereist>}
        />
        <Route
          path="inschrijvingen"
          element={<RolVereist minRol="coordinator"><InschrijvingenBeheerPage /></RolVereist>}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
