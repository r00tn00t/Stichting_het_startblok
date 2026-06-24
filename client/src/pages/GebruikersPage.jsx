import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const ROLLEN = [
  { value: 'vrijwilliger', label: 'Vrijwilliger (lezen)' },
  { value: 'hoofdtrainer', label: 'Hoofdtrainer (lezen + schrijven)' },
  { value: 'coordinator', label: 'Coördinator (volledig beheer)' },
];

const leegFormulier = { naam: '', email: '', wachtwoord: '', role: 'vrijwilliger' };

export default function GebruikersPage() {
  const [gebruikers, setGebruikers] = useState([]);
  const [form, setForm] = useState(leegFormulier);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  function laad() {
    api('/users').then(setGebruikers).catch((e) => setFout(e.message));
  }
  useEffect(laad, []);

  const set = (veld) => (e) => setForm({ ...form, [veld]: e.target.value });

  async function maakAan(e) {
    e.preventDefault();
    setFout('');
    setMelding('');
    try {
      await api('/users', { method: 'POST', body: form });
      setMelding(`Gebruiker ${form.naam} aangemaakt.`);
      setForm(leegFormulier);
      laad();
    } catch (err) {
      setFout(err.message);
    }
  }

  async function wijzigRol(id, role) {
    try {
      await api(`/users/${id}`, { method: 'PUT', body: { role } });
      laad();
    } catch (err) {
      setFout(err.message);
    }
  }

  async function wisselActief(g) {
    try {
      await api(`/users/${g._id}`, { method: 'PUT', body: { actief: !g.actief } });
      laad();
    } catch (err) {
      setFout(err.message);
    }
  }

  return (
    <div>
      <h1>Gebruikersbeheer</h1>
      <p className="muted">Alleen de coördinator beheert gebruikers. Nieuwe accounts worden hier aangemaakt (geen zelfregistratie).</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <div className="card">
        <h2>Nieuwe gebruiker</h2>
        <form onSubmit={maakAan}>
          <div className="form-grid">
            <label>Naam<input value={form.naam} onChange={set('naam')} required /></label>
            <label>E-mail<input type="email" value={form.email} onChange={set('email')} required /></label>
            <label>Tijdelijk wachtwoord<input type="text" value={form.wachtwoord} onChange={set('wachtwoord')} required /></label>
            <label>
              Rol
              <select value={form.role} onChange={set('role')}>
                {ROLLEN.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
          </div>
          <button type="submit">Gebruiker aanmaken</button>
        </form>
      </div>

      <div className="card">
        <h2>Bestaande gebruikers</h2>
        <table className="tabel">
          <thead>
            <tr><th>Naam</th><th>E-mail</th><th>Rol</th><th>Status</th></tr>
          </thead>
          <tbody>
            {gebruikers.map((g) => (
              <tr key={g._id} className={g.actief ? '' : 'inactief'}>
                <td>{g.naam}</td>
                <td className="muted">{g.email}</td>
                <td>
                  <select value={g.role} onChange={(e) => wijzigRol(g._id, e.target.value)}>
                    {ROLLEN.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td>
                  <button className="mini grijs" onClick={() => wisselActief(g)}>
                    {g.actief ? 'Actief — deactiveren' : 'Inactief — heractiveren'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
