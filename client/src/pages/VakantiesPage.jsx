import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const leeg = { naam: '', van: '', tot: '' };

export default function VakantiesPage() {
  const [vakanties, setVakanties] = useState([]);
  const [form, setForm] = useState(leeg);
  const [fout, setFout] = useState('');

  function laad() {
    api('/vakanties').then(setVakanties).catch((e) => setFout(e.message));
  }
  useEffect(laad, []);

  const set = (v) => (e) => setForm({ ...form, [v]: e.target.value });
  const datum = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  async function voegToe(e) {
    e.preventDefault();
    setFout('');
    try {
      await api('/vakanties', { method: 'POST', body: form });
      setForm(leeg);
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function verwijder(id) {
    if (!confirm('Deze vakantie verwijderen?')) return;
    try { await api(`/vakanties/${id}`, { method: 'DELETE' }); laad(); }
    catch (err) { setFout(err.message); }
  }

  return (
    <div>
      <h1>Vakanties & feestdagen</h1>
      <p className="muted">Op deze periodes vervallen de lessen; ze worden geblokkeerd in de badindeling-agenda.</p>
      {fout && <div className="alert">{fout}</div>}

      <form className="card" onSubmit={voegToe}>
        <h2>Vakantie toevoegen</h2>
        <div className="form-grid">
          <label>Naam<input value={form.naam} onChange={set('naam')} required placeholder="bv. Herfstvakantie" /></label>
          <label>Van<input type="date" value={form.van} onChange={set('van')} required /></label>
          <label>Tot en met<input type="date" value={form.tot} onChange={set('tot')} required /></label>
        </div>
        <button type="submit">Toevoegen</button>
      </form>

      <div className="card">
        <h2>Overzicht</h2>
        {vakanties.length === 0 && <p className="muted">Nog geen vakanties.</p>}
        {vakanties.map((v) => (
          <div key={v._id} className="niveau-rij">
            <span className="niveau-naam">{v.naam}</span>
            <span className="muted">{datum(v.van)} t/m {datum(v.tot)}</span>
            <span className="niveau-acties">
              <button className="mini grijs" onClick={() => verwijder(v._id)}>Verwijder</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
