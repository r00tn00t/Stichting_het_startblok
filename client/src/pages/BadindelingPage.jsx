import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { exporteerNaarPng } from '../utils/exportImage.js';

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

const STATUSSEN = ['aanwezig', 'nieuw', 'oproep', 'afwezig', 'verplaatst', 'taxi'];
const NIVEAUS = ['', 'A', 'B', 'C'];

// Lege zone / blok-fabrieken.
const nieuweZone = () => ({ naam: 'ondiep', vrijwilliger: '', kinderen: [] });
const nieuwBlok = () => ({ label: '', zones: [nieuweZone()] });

export default function BadindelingPage() {
  const [activiteiten, setActiviteiten] = useState([]);
  const [activiteitId, setActiviteitId] = useState('');
  const [datum, setDatum] = useState(vandaagISO());

  const [leerlingen, setLeerlingen] = useState([]);     // kinderen van de activiteit
  const [vrijwilligers, setVrijwilligers] = useState([]); // vrijwilligers van de activiteit

  const [blokken, setBlokken] = useState([]);
  const [notities, setNotities] = useState('');

  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');
  const roosterRef = useRef(null);

  const leerlingNaam = (id) => leerlingen.find((l) => l._id === id)?.naam || '?';
  const activiteitNaam = activiteiten.find((a) => a._id === activiteitId);

  useEffect(() => {
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
  }, []);

  // Kinderen + vrijwilligers van de gekozen activiteit ophalen.
  useEffect(() => {
    if (!activiteitId) return;
    Promise.all([api('/leerlingen'), api('/users')])
      .then(([alle, users]) => {
        setLeerlingen(alle.filter((l) => (l.activiteiten || []).includes(activiteitId)));
        setVrijwilligers(users.filter((u) => u.role === 'vrijwilliger' && (u.activiteiten || []).includes(activiteitId)));
      })
      .catch((e) => setFout(e.message));
  }, [activiteitId]);

  // Bestaande indeling laden (en normaliseren naar bewerkbare vorm met id-strings).
  useEffect(() => {
    if (!activiteitId || !datum) return;
    setMelding('');
    api(`/badindelingen?activiteit=${activiteitId}&datum=${datum}`)
      .then(({ indeling }) => {
        if (!indeling) { setBlokken([]); setNotities(''); return; }
        setBlokken(
          (indeling.blokken || []).map((b) => ({
            label: b.label,
            zones: (b.zones || []).map((z) => ({
              naam: z.naam,
              vrijwilliger: z.vrijwilliger?._id || '',
              kinderen: (z.kinderen || []).map((k) => ({
                leerling: k.leerling?._id || k.leerling,
                status: k.status || 'aanwezig',
                niveau: k.niveau || '',
              })),
            })),
          }))
        );
        setNotities(indeling.notities || '');
      })
      .catch((e) => setFout(e.message));
  }, [activiteitId, datum]);

  // --- Blokken / zones muteren (immutable updates) ---
  const muteer = (fn) => setBlokken((prev) => fn(structuredClone(prev)));

  const addBlok = () => muteer((b) => [...b, { ...nieuwBlok(), label: 'Nieuw tijdsblok' }]);
  const setBlokLabel = (bi, val) => muteer((b) => { b[bi].label = val; return b; });
  const removeBlok = (bi) => muteer((b) => b.filter((_, i) => i !== bi));

  const addZone = (bi) => muteer((b) => { b[bi].zones.push(nieuweZone()); return b; });
  const setZone = (bi, zi, veld, val) => muteer((b) => { b[bi].zones[zi][veld] = val; return b; });
  const removeZone = (bi, zi) => muteer((b) => { b[bi].zones = b[bi].zones.filter((_, i) => i !== zi); return b; });

  const addKind = (bi, zi, leerlingId) => muteer((b) => {
    if (!leerlingId) return b;
    const z = b[bi].zones[zi];
    if (z.kinderen.some((k) => k.leerling === leerlingId)) return b;
    z.kinderen.push({ leerling: leerlingId, status: 'aanwezig', niveau: '' });
    return b;
  });
  const setKind = (bi, zi, ki, veld, val) => muteer((b) => { b[bi].zones[zi].kinderen[ki][veld] = val; return b; });
  const removeKind = (bi, zi, ki) => muteer((b) => { b[bi].zones[zi].kinderen = b[bi].zones[zi].kinderen.filter((_, i) => i !== ki); return b; });

  async function opslaan() {
    setFout(''); setMelding('');
    try {
      await api('/badindelingen', { method: 'PUT', body: { activiteit: activiteitId, datum, blokken, notities } });
      setMelding('Badindeling opgeslagen.');
    } catch (e) { setFout(e.message); }
  }

  async function exporteer() {
    setFout('');
    try {
      const naam = `badindeling-${activiteitNaam?.naam || ''}-${datum}`.replace(/[^a-z0-9-]+/gi, '_');
      await exporteerNaarPng(roosterRef.current, naam);
    } catch (e) {
      setFout('Export mislukt: ' + e.message);
    }
  }

  return (
    <div>
      <div className="kop-rij">
        <h1>Badindeling</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {blokken.length > 0 && <button className="grijs" onClick={exporteer}>📷 Exporteer als afbeelding</button>}
          {activiteitId && <button onClick={opslaan}>Opslaan</button>}
        </div>
      </div>
      <p className="muted">Kies activiteit en datum. Voeg tijdsblokken en zones (banen) toe en plaats kinderen bij een vrijwilliger. Exporteer als afbeelding om te delen in de groepsapp.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <div className="card">
        <div className="form-grid">
          <label>Activiteit
            <select value={activiteitId} onChange={(e) => setActiviteitId(e.target.value)}>
              <option value="">— kies —</option>
              {activiteiten.map((a) => (
                <option key={a._id} value={a._id}>{a.naam}{a.locatie?.naam ? ` — ${a.locatie.naam}` : ''}</option>
              ))}
            </select>
          </label>
          <label>Datum<input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
        </div>
      </div>

      {activiteitId && (
        <>
          {/* Het rooster dat geëxporteerd wordt naar PNG. */}
          <div ref={roosterRef} className="rooster-export">
            <div className="rooster-titel">
              {activiteitNaam?.naam}{activiteitNaam?.locatie?.naam ? ` — ${activiteitNaam.locatie.naam}` : ''}
              <span> · {new Date(datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            {blokken.map((blok, bi) => (
              <div key={bi} className="blok">
                <div className="blok-kop">
                  <input className="blok-label" value={blok.label} placeholder="bv. 19.00-19.30"
                    onChange={(e) => setBlokLabel(bi, e.target.value)} />
                  <button className="mini grijs noprint" onClick={() => addZone(bi)}>+ zone</button>
                  <button className="mini grijs noprint" onClick={() => removeBlok(bi)}>blok ✕</button>
                </div>
                <div className="zones">
                  {blok.zones.map((zone, zi) => (
                    <div key={zi} className="zone">
                      <input className="zone-naam" value={zone.naam} placeholder="zone/baan"
                        onChange={(e) => setZone(bi, zi, 'naam', e.target.value)} />
                      <select className="zone-vrijwilliger" value={zone.vrijwilliger}
                        onChange={(e) => setZone(bi, zi, 'vrijwilliger', e.target.value)}>
                        <option value="">— vrijwilliger —</option>
                        {vrijwilligers.map((v) => <option key={v._id} value={v._id}>{v.naam}</option>)}
                      </select>

                      <ul className="zone-kinderen">
                        {zone.kinderen.map((k, ki) => (
                          <li key={ki} className={`kind status-kind-${k.status}`}>
                            <span className="kind-naam">{leerlingNaam(k.leerling)}{k.niveau ? ` (${k.niveau})` : ''}</span>
                            <span className="noprint kind-ctrl">
                              <select value={k.status} onChange={(e) => setKind(bi, zi, ki, 'status', e.target.value)}>
                                {STATUSSEN.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={k.niveau} onChange={(e) => setKind(bi, zi, ki, 'niveau', e.target.value)}>
                                {NIVEAUS.map((n) => <option key={n} value={n}>{n || '–'}</option>)}
                              </select>
                              <button className="mini grijs" onClick={() => removeKind(bi, zi, ki)}>✕</button>
                            </span>
                          </li>
                        ))}
                      </ul>

                      <select className="noprint kind-toevoegen" value="" onChange={(e) => { addKind(bi, zi, e.target.value); e.target.value = ''; }}>
                        <option value="">+ kind toevoegen…</option>
                        {leerlingen.map((l) => <option key={l._id} value={l._id}>{l.naam}</option>)}
                      </select>
                      <button className="mini grijs noprint zone-verwijder" onClick={() => removeZone(bi, zi)}>zone ✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {notities && <div className="rooster-notities"><strong>Notities:</strong> {notities}</div>}
            <div className="rooster-legenda">Legenda: nieuw = groen · oproep = geel · afwezig/verplaatst = grijs · taxi = * · (A/B/C) = diplomaniveau</div>
          </div>

          <div className="noprint" style={{ marginTop: 12 }}>
            <button className="grijs" onClick={addBlok}>+ Tijdsblok toevoegen</button>
          </div>
          <div className="card noprint" style={{ marginTop: 12 }}>
            <label>Notities (bv. taxi, afwezig, oproep)
              <textarea value={notities} onChange={(e) => setNotities(e.target.value)} rows={2} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
