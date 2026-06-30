import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const leeg = { titel: '', datum: '', tijd: '', locatie: '', omschrijving: '' };

export default function AfsprakenPage() {
  const [afspraken, setAfspraken] = useState([]);
  const [locaties, setLocaties] = useState([]);
  const [form, setForm] = useState(leeg);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  function laad() {
    api('/afspraken').then(setAfspraken).catch((e) => setFout(e.message));
  }
  useEffect(() => {
    laad();
    api('/locaties').then(setLocaties).catch(() => {});
  }, []);

  const set = (v) => (e) => setForm({ ...form, [v]: e.target.value });
  const datum = (d) => new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  async function voegToe(e) {
    e.preventDefault();
    setFout(''); setMelding('');
    try {
      await api('/afspraken', { method: 'POST', body: form });
      setForm(leeg);
      setMelding('Afspraak toegevoegd.');
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function verwijder(id) {
    if (!confirm('Deze afspraak verwijderen?')) return;
    try { await api(`/afspraken/${id}`, { method: 'DELETE' }); laad(); }
    catch (err) { setFout(err.message); }
  }

  const nu = new Date().setHours(0, 0, 0, 0);
  const komend = afspraken.filter((a) => new Date(a.datum).getTime() >= nu);
  const verlopen = afspraken.filter((a) => new Date(a.datum).getTime() < nu);

  return (
    <div>
      <h1>Afspraken</h1>
      <p className="muted">Losse agenda-afspraken (bv. diplomazwemmen, vergadering, uitje). Alleen directie beheert deze.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <form className="card" onSubmit={voegToe}>
        <h2>Afspraak toevoegen</h2>
        <div className="form-grid">
          <label>Titel<input value={form.titel} onChange={set('titel')} required placeholder="bv. Diplomazwemmen" /></label>
          <label>Datum<input type="date" value={form.datum} onChange={set('datum')} required /></label>
          <label>Tijd<input value={form.tijd} onChange={set('tijd')} placeholder="bv. 14:00-15:00" /></label>
          <label>Locatie (optioneel)
            <select value={form.locatie} onChange={set('locatie')}>
              <option value="">— geen —</option>
              {locaties.map((l) => <option key={l._id} value={l._id}>{l.naam} ({l.plaats})</option>)}
            </select>
          </label>
        </div>
        <label className="vol">Omschrijving<textarea value={form.omschrijving} onChange={set('omschrijving')} rows={2} /></label>
        <button type="submit">Toevoegen</button>
      </form>

      <div className="card">
        <h2>Komende afspraken</h2>
        {komend.length === 0 && <p className="muted">Geen komende afspraken.</p>}
        {komend.map((a) => (
          <div key={a._id} className="niveau-rij">
            <span className="niveau-naam">{a.titel}</span>
            <span className="muted">{datum(a.datum)}{a.tijd ? ` · ${a.tijd}` : ''}{a.locatie?.naam ? ` · ${a.locatie.naam}` : ''}</span>
            <span className="niveau-acties"><button className="mini grijs" onClick={() => verwijder(a._id)}>Verwijder</button></span>
          </div>
        ))}
      </div>

      {verlopen.length > 0 && (
        <div className="card">
          <h2>Verlopen</h2>
          {verlopen.map((a) => (
            <div key={a._id} className="niveau-rij" style={{ opacity: 0.6 }}>
              <span className="niveau-naam">{a.titel}</span>
              <span className="muted">{datum(a.datum)}</span>
              <span className="niveau-acties"><button className="mini grijs" onClick={() => verwijder(a._id)}>Verwijder</button></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
