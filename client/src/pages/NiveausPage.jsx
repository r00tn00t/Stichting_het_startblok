import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function NiveausPage() {
  const [niveaus, setNiveaus] = useState([]);
  const [nieuw, setNieuw] = useState('');
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  function laad() {
    api('/niveaus').then(setNiveaus).catch((e) => setFout(e.message));
  }
  useEffect(laad, []);

  async function voegToe(e) {
    e.preventDefault();
    setFout(''); setMelding('');
    try {
      await api('/niveaus', { method: 'POST', body: { naam: nieuw } });
      setNieuw('');
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function hernoem(n) {
    const naam = prompt('Nieuwe naam voor dit niveau:', n.naam);
    if (!naam || naam === n.naam) return;
    try { await api(`/niveaus/${n._id}`, { method: 'PUT', body: { naam } }); laad(); }
    catch (err) { setFout(err.message); }
  }

  // Verschuif een niveau omhoog/omlaag door de volgorde te wisselen.
  async function verschuif(i, richting) {
    const j = i + richting;
    if (j < 0 || j >= niveaus.length) return;
    const a = niveaus[i], b = niveaus[j];
    try {
      await Promise.all([
        api(`/niveaus/${a._id}`, { method: 'PUT', body: { volgorde: b.volgorde } }),
        api(`/niveaus/${b._id}`, { method: 'PUT', body: { volgorde: a.volgorde } }),
      ]);
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function verwijder(n) {
    if (!confirm(`Niveau "${n.naam}" verwijderen?`)) return;
    try { await api(`/niveaus/${n._id}`, { method: 'DELETE' }); laad(); }
    catch (err) { setFout(err.message); }
  }

  return (
    <div>
      <h1>Niveaus</h1>
      <p className="muted">De zwemniveaus (vaardigheden) die je bij een leerling kunt kiezen. Pas de lijst en volgorde naar wens aan.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <form className="card" onSubmit={voegToe}>
        <h2>Niveau toevoegen</h2>
        <div className="kopieer-rij">
          <input value={nieuw} onChange={(e) => setNieuw(e.target.value)} placeholder="bv. Schoolslag gevorderd" required style={{ flex: 1, minWidth: 200 }} />
          <button type="submit">Toevoegen</button>
        </div>
      </form>

      <div className="card">
        <h2>Huidige niveaus</h2>
        {niveaus.length === 0 && <p className="muted">Nog geen niveaus.</p>}
        {niveaus.map((n, i) => (
          <div key={n._id} className="niveau-rij">
            <span className="niveau-volg">{i + 1}.</span>
            <span className="niveau-naam">{n.naam}</span>
            <span className="niveau-acties">
              <button className="mini grijs" disabled={i === 0} onClick={() => verschuif(i, -1)}>↑</button>
              <button className="mini grijs" disabled={i === niveaus.length - 1} onClick={() => verschuif(i, 1)}>↓</button>
              <button className="mini grijs" onClick={() => hernoem(n)}>Hernoem</button>
              <button className="mini grijs" onClick={() => verwijder(n)}>Verwijder</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
