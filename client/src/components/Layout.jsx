import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

const rolLabel = {
  vrijwilliger: 'Vrijwilliger',
  coordinator: 'Coördinator',
  directie: 'Directie',
};

export default function Layout() {
  const { user, logout, heeftRol } = useAuth();
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
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
