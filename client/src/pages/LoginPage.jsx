import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  if (user) navigate('/', { replace: true });

  async function onSubmit(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      await login(email, wachtwoord);
      navigate('/', { replace: true });
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <img
          src="/startblok-logo.png"
          alt="Het Startblok"
          style={{ maxHeight: 64, marginBottom: 8 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1>ZwemStart</h1>
        <p className="muted">Stichting Het Startblok</p>
        {fout && <div className="alert">{fout}</div>}
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Wachtwoord
          <input type="password" value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} required />
        </label>
        <button type="submit" disabled={bezig}>
          {bezig ? 'Bezig…' : 'Inloggen'}
        </button>
        <div className="login-links">
          <Link to="/inschrijven">Kind inschrijven voor zwemles</Link>
          <Link to="/inschrijven-activiteit">Inschrijven overige activiteiten</Link>
          <Link to="/aanmelden-vrijwilliger">Aanmelden als vrijwilliger</Link>
        </div>
      </form>
    </div>
  );
}
