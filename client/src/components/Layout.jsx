import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

// Pagina's die de volle schermbreedte gebruiken (breed rooster e.d.).
const BREDE_PADEN = ['/badindeling'];

const rolLabel = {
  vrijwilliger: 'Vrijwilliger',
  coordinator: 'Coördinator',
  directie: 'Directie',
};

export default function Layout() {
  const { user, logout, heeftRol } = useAuth();
  const { pathname } = useLocation();
  const breed = BREDE_PADEN.some((p) => pathname.startsWith(p));
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
          {heeftRol('coordinator') && <NavLink to="/templates"><Icon naam="sjabloon" />Sjablonen</NavLink>}
          <NavLink to="/kennisbank"><Icon naam="boek" />Kennisbank</NavLink>
          {heeftRol('coordinator') && <NavLink to="/inschrijvingen"><Icon naam="formulier" />Inschrijvingen</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/locaties"><Icon naam="locatie" />Locaties</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/gebruikers"><Icon naam="mensen" />Gebruikers</NavLink>}
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
