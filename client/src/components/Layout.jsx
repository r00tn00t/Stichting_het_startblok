import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

// Pagina's die de volle schermbreedte gebruiken (breed rooster e.d.).
const BREDE_PADEN = ['/badindeling']; // ook subpaden
const BREDE_PADEN_EXACT = ['/leerlingen']; // alleen de lijst, niet detail/bewerken

const rolLabel = {
  vrijwilliger: 'Vrijwilliger',
  coordinator: 'Coördinator',
  directie: 'Directie',
};

export default function Layout() {
  const { user, logout, heeftRol } = useAuth();
  const { pathname } = useLocation();
  const breed = BREDE_PADEN.some((p) => pathname.startsWith(p)) || BREDE_PADEN_EXACT.includes(pathname);
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <img
            src="/startblok-logo.png"
            alt="Het Startblok"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          ZwemStart
        </span>
        <nav>
          {!heeftRol('coordinator') && <NavLink to="/dashboard"><Icon naam="kalender" />Mijn dag</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/leerlingen"><Icon naam="kind" />Leerlingen</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/badindeling"><Icon naam="water" />Badindeling</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/aanwezigheid"><Icon naam="check" />Aanwezigheid</NavLink>}
          <NavLink to="/agenda"><Icon naam="kalender" />Agenda</NavLink>
          <NavLink to="/kennisbank"><Icon naam="boek" />Kennisbank</NavLink>
          {heeftRol('coordinator') && <NavLink to="/beheer"><Icon naam="instellingen" />Beheer</NavLink>}
        </nav>
        <div className="user">
          <span className="user-info">
            <span className="user-naam">{user?.naam}</span>
            <span className="user-rol">{rolLabel[user?.role]}</span>
          </span>
          <button onClick={logout}>Uitloggen</button>
        </div>
      </header>
      <main className={breed ? 'content content-breed' : 'content'}>
        <Outlet />
      </main>
    </div>
  );
}
