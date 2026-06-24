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
  if (!heeftRol(minRol)) return <Navigate to="/leerlingen" replace />;
  return children;
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
        <Route index element={<Navigate to="/leerlingen" replace />} />
        <Route path="leerlingen" element={<LeerlingenPage />} />
        <Route
          path="leerlingen/nieuw"
          element={<RolVereist minRol="hoofdtrainer"><LeerlingFormPage /></RolVereist>}
        />
        <Route path="leerlingen/:id" element={<LeerlingDetailPage />} />
        <Route
          path="leerlingen/:id/bewerken"
          element={<RolVereist minRol="hoofdtrainer"><LeerlingFormPage /></RolVereist>}
        />
        <Route path="kennisbank" element={<KennisbankPage />} />
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
