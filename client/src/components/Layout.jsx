import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
          {!heeftRol('coordinator') && <NavLink to="/dashboard"><span className="ico">📅</span>Mijn dag</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/leerlingen"><span className="ico">🧒</span>Leerlingen</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/badindeling"><span className="ico">🏊</span>Badindeling</NavLink>}
          <NavLink to="/kennisbank"><span className="ico">📚</span>Kennisbank</NavLink>
          {heeftRol('coordinator') && <NavLink to="/inschrijvingen"><span className="ico">📝</span>Inschrijvingen</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/locaties"><span className="ico">📍</span>Locaties</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/gebruikers"><span className="ico">👥</span>Gebruikers</NavLink>}
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
