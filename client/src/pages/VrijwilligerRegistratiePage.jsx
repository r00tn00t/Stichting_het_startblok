import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const leeg = { achternaam: '', email: '', telefoon: '', wachtwoord: '' };

export default function VrijwilligerRegistratiePage() {
  const [form, setForm] = useState(leeg);
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);
  const [bezig, setBezig] = useState(false);

  const set = (v) => (e) => setForm({ ...form, [v]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      await api('/registratie/vrijwilliger', { method: 'POST', body: form });
      setGelukt(true);
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  }

  if (gelukt) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <h1>Gelukt! 🎉</h1>
          <p>Je account is aangemaakt. Je kunt nu inloggen.</p>
          <Link to="/login" className="knop-link">Naar inloggen</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <img src="/startblok-logo.png" alt="Het Startblok" style={{ maxHeight: 56, marginBottom: 8 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <h1>Vrijwilliger worden</h1>
        <p className="muted">Maak een account aan om mee te helpen bij de zwemlessen.</p>
        {fout && <div className="alert">{fout}</div>}
        <label>Achternaam *<input value={form.achternaam} onChange={set('achternaam')} required /></label>
        <label>E-mail *<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Telefoonnummer<input value={form.telefoon} onChange={set('telefoon')} /></label>
        <label>Wachtwoord * (min. 8 tekens)<input type="password" value={form.wachtwoord} onChange={set('wachtwoord')} minLength={8} required /></label>
        <button type="submit" disabled={bezig}>{bezig ? 'Bezig…' : 'Account aanmaken'}</button>
        <p className="muted" style={{ marginTop: 12 }}>Al een account? <Link to="/login">Inloggen</Link></p>
      </form>
    </div>
  );
}
