import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const rolLabel = {
  vrijwilliger: 'Vrijwilliger',
  hoofdtrainer: 'Hoofdtrainer',
  coordinator: 'Coördinator',
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
          <NavLink to="/leerlingen">Leerlingen</NavLink>
          <NavLink to="/kennisbank">Kennisbank</NavLink>
          {heeftRol('coordinator') && <NavLink to="/inschrijvingen">Inschrijvingen</NavLink>}
          {heeftRol('coordinator') && <NavLink to="/gebruikers">Gebruikers</NavLink>}
        </nav>
        <div className="user">
          <span>
            {user?.naam} · <em>{rolLabel[user?.role]}</em>
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
