import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}
const WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const weekdagVan = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : WEEKDAGEN[d.getDay()]; };

const STATUSSEN = [
  { value: 'aanwezig', label: 'Aanwezig', klasse: 'aw-aanwezig' },
  { value: 'afgemeld', label: 'Afgemeld', klasse: 'aw-afgemeld' },
  { value: 'afwezig', label: 'Afwezig', klasse: 'aw-afwezig' },
];

export default function AanwezigheidPage() {
  const [activiteiten, setActiviteiten] = useState([]);
  const [activiteitId, setActiviteitId] = useState('');
  const [datum, setDatum] = useState(vandaagISO());

  // statussen: { leerlingId: 'aanwezig'|'afgemeld'|'afwezig' }
  const [statussen, setStatussen] = useState({});
  const [lijst, setLijst] = useState([]); // [{leerling, naam, niveau, status}]
  const [modus, setModus] = useState('lijst'); // 'lijst' | 'een'
  const [stap, setStap] = useState(0); // voor één-voor-één
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  useEffect(() => {
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
  }, []);

  // Voorselecteren op weekdag.
  useEffect(() => {
    if (activiteitId || activiteiten.length === 0) return;
    const m = activiteiten.find((a) => a.weekdag === weekdagVan(datum));
    if (m) setActiviteitId(m._id);
  }, [datum, activiteiten, activiteitId]);

  // Laden: leerlingen + bestaande status (default 'aanwezig' als nog niet geregistreerd).
  useEffect(() => {
    if (!activiteitId || !datum) return;
    setMelding(''); setStap(0);
    api(`/aanwezigheid?activiteit=${activiteitId}&datum=${datum}`)
      .then(({ lijst }) => {
        setLijst(lijst);
        const s = {};
        lijst.forEach((r) => { s[r.leerling] = r.status || 'aanwezig'; });
        setStatussen(s);
      })
      .catch((e) => setFout(e.message));
  }, [activiteitId, datum]);

  const setStatus = (leerlingId, status) => setStatussen((s) => ({ ...s, [leerlingId]: status }));

  const telling = STATUSSEN.reduce((acc, st) => {
    acc[st.value] = lijst.filter((r) => statussen[r.leerling] === st.value).length;
    return acc;
  }, {});

  async function opslaan() {
    setFout(''); setMelding('');
    try {
      const registraties = lijst.map((r) => ({ leerling: r.leerling, status: statussen[r.leerling] || 'aanwezig' }));
      await api('/aanwezigheid', { method: 'PUT', body: { activiteit: activiteitId, datum, registraties } });
      setMelding('Aanwezigheid opgeslagen.');
    } catch (e) { setFout(e.message); }
  }

  const huidig = lijst[stap];

  return (
    <div>
      <div className="kop-rij">
        <h1>Aanwezigheid</h1>
        {lijst.length > 0 && <button onClick={opslaan}>Opslaan</button>}
      </div>
      <p className="muted">Standaard staat iedereen op <strong>aanwezig</strong>; markeer alleen wie afgemeld of afwezig is. Vergeet niet op te slaan.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <div className="card">
        <div className="form-grid">
          <label>Datum<input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
          <label>Activiteit
            <select value={activiteitId} onChange={(e) => setActiviteitId(e.target.value)}>
              <option value="">— kies —</option>
              {activiteiten.map((a) => <option key={a._id} value={a._id}>{a.naam}{a.locatie?.naam ? ` — ${a.locatie.naam}` : ''}</option>)}
            </select>
          </label>
        </div>
      </div>

      {activiteitId && lijst.length === 0 && <p className="muted">Geen leerlingen gekoppeld aan deze activiteit.</p>}

      {lijst.length > 0 && (
        <>
          {/* Samenvatting */}
          <div className="aw-telling">
            <span className="aw-chip aw-aanwezig">Aanwezig: {telling.aanwezig}</span>
            <span className="aw-chip aw-afgemeld">Afgemeld: {telling.afgemeld}</span>
            <span className="aw-chip aw-afwezig">Afwezig: {telling.afwezig}</span>
            <span className="muted">van {lijst.length}</span>
          </div>

          <div className="tabs">
            <button className={modus === 'lijst' ? 'tab actief' : 'tab'} onClick={() => setModus('lijst')}>Snelle lijst</button>
            <button className={modus === 'een' ? 'tab actief' : 'tab'} onClick={() => { setModus('een'); setStap(0); }}>Eén voor één</button>
          </div>

          {modus === 'lijst' && (
            <div className="card">
              {lijst.map((r) => (
                <div key={r.leerling} className="aw-rij">
                  <span className="aw-naam">{r.naam}{r.niveau ? <span className="muted"> · {r.niveau}</span> : null}</span>
                  <span className="aw-knoppen">
                    {STATUSSEN.map((st) => (
                      <button
                        key={st.value}
                        className={`aw-btn ${st.klasse} ${statussen[r.leerling] === st.value ? 'aw-actief' : ''}`}
                        onClick={() => setStatus(r.leerling, st.value)}
                      >
                        {st.label}
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {modus === 'een' && huidig && (
            <div className="card aw-een">
              <p className="muted">Kind {stap + 1} van {lijst.length}</p>
              <h2 style={{ borderBottom: 'none' }}>{huidig.naam}</h2>
              {huidig.niveau && <p className="muted">{huidig.niveau}</p>}
              <div className="aw-een-knoppen">
                {STATUSSEN.map((st) => (
                  <button
                    key={st.value}
                    className={`aw-btn-groot ${st.klasse} ${statussen[huidig.leerling] === st.value ? 'aw-actief' : ''}`}
                    onClick={() => { setStatus(huidig.leerling, st.value); if (stap < lijst.length - 1) setStap(stap + 1); }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <div className="aw-nav">
                <button className="grijs" disabled={stap === 0} onClick={() => setStap(stap - 1)}>← Vorige</button>
                <button className="grijs" disabled={stap >= lijst.length - 1} onClick={() => setStap(stap + 1)}>Volgende →</button>
              </div>
              {stap >= lijst.length - 1 && <p className="muted" style={{ marginTop: 12 }}>Laatste kind — vergeet niet op te slaan.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
