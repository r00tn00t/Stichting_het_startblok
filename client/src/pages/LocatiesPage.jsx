import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const WEEKDAGEN = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export default function LocatiesPage() {
  const { heeftRol } = useAuth();
  const isDirectie = heeftRol('directie');

  const [locaties, setLocaties] = useState([]);
  const [activiteiten, setActiviteiten] = useState([]);
  const [fout, setFout] = useState('');

  const [nieuweLocatie, setNieuweLocatie] = useState({ naam: '', plaats: '' });
  const [nieuweActiviteit, setNieuweActiviteit] = useState({ naam: '', locatie: '', weekdag: '', tijd: '', soort: 'zwemles' });

  function laad() {
    api('/locaties').then(setLocaties).catch((e) => setFout(e.message));
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
  }
  useEffect(laad, []);

  async function maakLocatie(e) {
    e.preventDefault();
    setFout('');
    try {
      await api('/locaties', { method: 'POST', body: nieuweLocatie });
      setNieuweLocatie({ naam: '', plaats: '' });
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function maakActiviteit(e) {
    e.preventDefault();
    setFout('');
    try {
      await api('/activiteiten', { method: 'POST', body: nieuweActiviteit });
      setNieuweActiviteit({ naam: '', locatie: '', weekdag: '', tijd: '', soort: 'zwemles' });
      laad();
    } catch (err) { setFout(err.message); }
  }

  const setLoc = (v) => (e) => setNieuweLocatie({ ...nieuweLocatie, [v]: e.target.value });
  const setAct = (v) => (e) => setNieuweActiviteit({ ...nieuweActiviteit, [v]: e.target.value });

  // Activiteiten gegroepeerd per locatie-id.
  const perLocatie = (locId) => activiteiten.filter((a) => (a.locatie?._id || a.locatie) === locId);

  return (
    <div>
      <h1>Locaties & activiteiten</h1>
      {fout && <div className="alert">{fout}</div>}

      {isDirectie && (
        <form className="card" onSubmit={maakLocatie}>
          <h2>Nieuwe locatie</h2>
          <div className="form-grid">
            <label>Naam<input value={nieuweLocatie.naam} onChange={setLoc('naam')} required placeholder="bv. Zwembad de Viergang" /></label>
            <label>Plaats<input value={nieuweLocatie.plaats} onChange={setLoc('plaats')} placeholder="bv. Pijnacker" /></label>
          </div>
          <button type="submit">Locatie toevoegen</button>
        </form>
      )}

      <form className="card" onSubmit={maakActiviteit}>
        <h2>Nieuwe activiteit</h2>
        <div className="form-grid">
          <label>Naam<input value={nieuweActiviteit.naam} onChange={setAct('naam')} required placeholder="bv. Zwemles - maandagavond" /></label>
          <label>Locatie
            <select value={nieuweActiviteit.locatie} onChange={setAct('locatie')} required>
              <option value="">— kies —</option>
              {locaties.map((l) => <option key={l._id} value={l._id}>{l.naam} ({l.plaats})</option>)}
            </select>
          </label>
          <label>Weekdag
            <select value={nieuweActiviteit.weekdag} onChange={setAct('weekdag')}>
              {WEEKDAGEN.map((d) => <option key={d} value={d}>{d || '—'}</option>)}
            </select>
          </label>
          <label>Tijd<input value={nieuweActiviteit.tijd} onChange={setAct('tijd')} placeholder="bv. 18:30-19:15" /></label>
          <label>Soort
            <select value={nieuweActiviteit.soort} onChange={setAct('soort')}>
              <option value="zwemles">Zwemles</option>
              <option value="activiteit">Activiteit</option>
            </select>
          </label>
        </div>
        <button type="submit">Activiteit toevoegen</button>
      </form>

      <div className="card">
        <h2>Overzicht</h2>
        {locaties.map((l) => (
          <div key={l._id} style={{ marginBottom: 16 }}>
            <h3>{l.naam} <span className="muted">— {l.plaats}</span></h3>
            <ul>
              {perLocatie(l._id).map((a) => (
                <li key={a._id}>{a.naam} {a.weekdag && `(${a.weekdag}${a.tijd ? ', ' + a.tijd : ''})`}</li>
              ))}
              {perLocatie(l._id).length === 0 && <li className="muted">Nog geen activiteiten.</li>}
            </ul>
          </div>
        ))}
        {locaties.length === 0 && <p className="muted">Nog geen locaties.</p>}
      </div>
    </div>
  );
}
