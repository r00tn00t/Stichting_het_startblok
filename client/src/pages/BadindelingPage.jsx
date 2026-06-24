import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { exporteerNaarPng, exporteerNaarPdf } from '../utils/exportImage.js';

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

// Weekdag-naam (zoals in het Activiteit-model) voor een ISO-datum.
const WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
function weekdagVan(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : WEEKDAGEN[d.getDay()];
}
// ISO-datum n dagen eerder.
function datumMinusDagen(iso, dagen) {
  const d = new Date(iso);
  d.setDate(d.getDate() - dagen);
  return d.toISOString().slice(0, 10);
}

const STATUSSEN = ['aanwezig', 'nieuw', 'oproep', 'afwezig', 'verplaatst', 'taxi'];
const NIVEAUS = ['', 'A', 'B', 'C'];

const nieuweZone = () => ({ naam: 'ondiep', vrijwilliger: '', kinderen: [] });
const nieuwBlok = () => ({ label: 'Nieuw tijdsblok', zones: [nieuweZone()] });

// Normaliseer een (gepopuleerde) indeling uit de API naar bewerkbare vorm.
function normaliseerBlokken(indeling) {
  return (indeling?.blokken || []).map((b) => ({
    label: b.label,
    zones: (b.zones || []).map((z) => ({
      naam: z.naam,
      vrijwilliger: z.vrijwilliger?._id || z.vrijwilliger || '',
      kinderen: (z.kinderen || []).map((k) => ({
        leerling: k.leerling?._id || k.leerling,
        status: k.status || 'aanwezig',
        niveau: k.niveau || '',
      })),
    })),
  }));
}

export default function BadindelingPage() {
  const [activiteiten, setActiviteiten] = useState([]);
  const [activiteitId, setActiviteitId] = useState('');
  const [datum, setDatum] = useState(vandaagISO());

  const [leerlingen, setLeerlingen] = useState([]);
  const [vrijwilligers, setVrijwilligers] = useState([]);

  const [blokken, setBlokken] = useState([]);
  const [notities, setNotities] = useState('');
  const [kopieerDatum, setKopieerDatum] = useState(datumMinusDagen(vandaagISO(), 7));
  const [templates, setTemplates] = useState([]);
  const [templateKeuze, setTemplateKeuze] = useState('');

  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');
  const roosterRef = useRef(null);

  const leerlingNaam = (id) => leerlingen.find((l) => l._id === id)?.naam || '?';
  const activiteitNaam = activiteiten.find((a) => a._id === activiteitId);

  useEffect(() => {
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
    api('/templates').then(setTemplates).catch(() => {});
  }, []);

  // Templates van de locatie van de gekozen activiteit.
  const locatieId = activiteitNaam?.locatie?._id || activiteitNaam?.locatie;
  const locatieTemplates = templates.filter((t) => (t.locatie?._id || t.locatie) === locatieId);

  // Zet een template (blokken met zone-namen) om naar bewerkbare badindeling-blokken.
  function templateNaarBlokken(template) {
    return (template.blokken || []).map((b) => ({
      label: b.label,
      zones: (b.zones || []).map((naam) => ({ naam, vrijwilliger: '', kinderen: [] })),
    }));
  }
  function pasTemplateToe(templateId) {
    const t = templates.find((x) => x._id === templateId);
    if (!t) return;
    setBlokken(templateNaarBlokken(t));
    setMelding(`Template "${t.naam}" toegepast. Deel in en sla op.`);
  }

  // Activiteit voorselecteren op basis van de weekdag van de datum (alleen als
  // er nog niets gekozen is, zodat we een handmatige keuze niet overschrijven).
  useEffect(() => {
    if (activiteitId || activiteiten.length === 0) return;
    const wd = weekdagVan(datum);
    const match = activiteiten.find((a) => a.weekdag === wd);
    if (match) setActiviteitId(match._id);
  }, [datum, activiteiten, activiteitId]);

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

  // Bestaande indeling laden. Is er nog geen indeling én bestaat er een template
  // voor deze locatie, dan die als startpunt voorvullen.
  useEffect(() => {
    if (!activiteitId || !datum) return;
    setMelding('');
    api(`/badindelingen?activiteit=${activiteitId}&datum=${datum}`)
      .then(({ indeling }) => {
        if (indeling && (indeling.blokken || []).length > 0) {
          setBlokken(normaliseerBlokken(indeling));
          setNotities(indeling.notities || '');
          return;
        }
        // Leeg: probeer voor te vullen vanuit een template van deze locatie.
        const t = locatieTemplates[0];
        if (t) {
          setBlokken(templateNaarBlokken(t));
          setNotities('');
          setMelding(`Voorgevuld met template "${t.naam}". Deel in en sla op.`);
        } else {
          setBlokken([]);
          setNotities('');
        }
      })
      .catch((e) => setFout(e.message));
    // locatieTemplates verandert mee met templates+activiteit; bewust niet als dep
    // om te voorkomen dat een handmatige bewerking wordt overschreven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activiteitId, datum, templates]);

  // --- Mutaties ---
  const muteer = (fn) => setBlokken((prev) => fn(structuredClone(prev)));

  const addBlok = () => muteer((b) => [...b, nieuwBlok()]);
  const setBlokLabel = (bi, val) => muteer((b) => { b[bi].label = val; return b; });
  const removeBlok = (bi) => muteer((b) => b.filter((_, i) => i !== bi));

  const addZone = (bi) => muteer((b) => { b[bi].zones.push(nieuweZone()); return b; });
  const setZone = (bi, zi, veld, val) => muteer((b) => { b[bi].zones[zi][veld] = val; return b; });
  const removeZone = (bi, zi) => muteer((b) => { b[bi].zones = b[bi].zones.filter((_, i) => i !== zi); return b; });

  const setKind = (bi, zi, ki, veld, val) => muteer((b) => { b[bi].zones[zi].kinderen[ki][veld] = val; return b; });
  const removeKind = (bi, zi, ki) => muteer((b) => { b[bi].zones[zi].kinderen = b[bi].zones[zi].kinderen.filter((_, i) => i !== ki); return b; });

  // Welk tijdsblok is open om te bewerken (accordion). Default: het eerste.
  const [openBlok, setOpenBlok] = useState(0);

  // Leerling-id's die in een bepaald blok al ingedeeld zijn.
  function ingedeeldInBlok(bi) {
    const set = new Set();
    (blokken[bi]?.zones || []).forEach((z) => z.kinderen.forEach((k) => set.add(k.leerling)));
    return set;
  }
  // 'Nog in te delen' voor het open blok: kinderen die in DIT blok nog nergens staan.
  // (Een kind kan in meerdere blokken zwemmen, dus dit is per blok.)
  const ingedeeldHier = ingedeeldInBlok(openBlok);
  const nogIndelen = leerlingen.filter((l) => !ingedeeldHier.has(l._id));

  // Plaats een leerling in een zone. Haalt 'm eerst uit andere zones BINNEN
  // hetzelfde blok (slepen tussen zones), maar laat 'm in andere blokken staan.
  function plaatsInZone(leerlingId, bi, zi) {
    muteer((b) => {
      if (!b[bi]?.zones[zi]) return b;
      let bestaand = null;
      for (const zone of b[bi].zones) {
        const idx = zone.kinderen.findIndex((k) => k.leerling === leerlingId);
        if (idx !== -1) { bestaand = zone.kinderen[idx]; zone.kinderen.splice(idx, 1); }
      }
      b[bi].zones[zi].kinderen.push(bestaand || { leerling: leerlingId, status: 'aanwezig', niveau: '' });
      return b;
    });
  }

  // --- Drag & drop (HTML5) ---
  const [sleept, setSleept] = useState(null);
  function onDragStart(e, leerlingId) {
    setSleept(leerlingId);
    e.dataTransfer.setData('text/plain', leerlingId);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDropZone(e, bi, zi) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || sleept;
    if (id) plaatsInZone(id, bi, zi);
    setSleept(null);
  }
  function onDropLijst(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || sleept;
    // Terug naar 'nog indelen' = uit de zones van het OPEN blok halen.
    if (id) muteer((b) => {
      for (const zone of b[openBlok]?.zones || []) {
        zone.kinderen = zone.kinderen.filter((k) => k.leerling !== id);
      }
      return b;
    });
    setSleept(null);
  }

  async function opslaan() {
    setFout(''); setMelding('');
    try {
      await api('/badindelingen', { method: 'PUT', body: { activiteit: activiteitId, datum, blokken, notities } });
      setMelding('Badindeling opgeslagen.');
    } catch (e) { setFout(e.message); }
  }

  // Indeling van een eerdere datum (zelfde activiteit) overnemen als startpunt.
  async function kopieerVan(bronDatum) {
    setFout(''); setMelding('');
    try {
      const { indeling } = await api(`/badindelingen?activiteit=${activiteitId}&datum=${bronDatum}`);
      if (!indeling || (indeling.blokken || []).length === 0) {
        setFout(`Geen indeling gevonden op ${bronDatum}.`);
        return;
      }
      setBlokken(normaliseerBlokken(indeling));
      setNotities(indeling.notities || '');
      setMelding(`Indeling van ${bronDatum} overgenomen. Controleer en sla op.`);
    } catch (e) { setFout(e.message); }
  }

  // Tijdens export tijdelijk álle blokken tonen (niet alleen het open blok).
  const [exportAlles, setExportAlles] = useState(false);
  async function exporteer(formaat) {
    setFout('');
    setExportAlles(true);
    // Wacht één frame zodat de DOM alle blokken heeft gerenderd.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const naam = `badindeling-${activiteitNaam?.naam || ''}-${datum}`.replace(/[^a-z0-9-]+/gi, '_');
      if (formaat === 'pdf') await exporteerNaarPdf(roosterRef.current, naam);
      else await exporteerNaarPng(roosterRef.current, naam);
    } catch (e) {
      setFout('Export mislukt: ' + e.message);
    } finally {
      setExportAlles(false);
    }
  }

  return (
    <div>
      <div className="kop-rij">
        <h1>Badindeling</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {blokken.length > 0 && <button className="grijs" onClick={() => exporteer('png')}>📷 Afbeelding</button>}
          {blokken.length > 0 && <button className="grijs" onClick={() => exporteer('pdf')}>📄 PDF</button>}
          {activiteitId && <button onClick={opslaan}>Opslaan</button>}
        </div>
      </div>
      <p className="muted">Kies activiteit en datum, voeg tijdsblokken en zones toe en sleep kinderen vanuit de lijst naar een zone. Exporteer om te delen in de groepsapp.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <div className="card">
        <div className="form-grid">
          <label>Datum<input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
          <label>Activiteit
            <select value={activiteitId} onChange={(e) => setActiviteitId(e.target.value)}>
              <option value="">— kies —</option>
              {activiteiten.map((a) => (
                <option key={a._id} value={a._id}>{a.naam}{a.locatie?.naam ? ` — ${a.locatie.naam}` : ''}</option>
              ))}
            </select>
          </label>
        </div>
        {activiteitId && (
          <>
            <div className="kopieer-rij">
              <button className="mini grijs" onClick={() => kopieerVan(datumMinusDagen(datum, 7))}>↩ Kopieer vorige week</button>
              <span className="muted">of van datum:</span>
              <input type="date" value={kopieerDatum} onChange={(e) => setKopieerDatum(e.target.value)} />
              <button className="mini grijs" onClick={() => kopieerVan(kopieerDatum)}>Kopieer</button>
            </div>
            <div className="kopieer-rij">
              <span className="muted">Template:</span>
              <select value={templateKeuze} onChange={(e) => { setTemplateKeuze(e.target.value); if (e.target.value) pasTemplateToe(e.target.value); }}>
                <option value="">— kies een template —</option>
                {locatieTemplates.map((t) => <option key={t._id} value={t._id}>{t.naam}</option>)}
              </select>
              {locatieTemplates.length === 0 && <span className="muted">(nog geen template voor deze locatie — maak er een onder “Sjablonen”)</span>}
            </div>
          </>
        )}
      </div>

      {activiteitId && (
        <div className="badindeling-werkblad">
          {/* Linkerkolom: nog in te delen leerlingen (sleepbron + drop-doel). */}
          <div className="indeel-lijst noprint" onDragOver={(e) => e.preventDefault()} onDrop={onDropLijst}>
            <h3>Nog in te delen ({nogIndelen.length})</h3>
            <p className="muted" style={{ marginTop: -4, fontSize: 12 }}>
              voor blok: <strong>{blokken[openBlok]?.label || '—'}</strong>
            </p>
            {nogIndelen.map((l) => (
              <div key={l._id} className="sleep-kind" draggable onDragStart={(e) => onDragStart(e, l._id)}>
                {l.naam}
              </div>
            ))}
            {nogIndelen.length === 0 && <p className="muted">Iedereen is ingedeeld in dit blok.</p>}
            <p className="muted hint">Sleep een kind naar een zone. Sleep terug hierheen om uit dit blok te halen.</p>
          </div>

          {/* Rechterkolom: het rooster (geëxporteerd naar PNG/PDF). */}
          <div className="badindeling-rooster">
            <div ref={roosterRef} className="rooster-export">
              <div className="rooster-titel">
                {activiteitNaam?.naam}{activiteitNaam?.locatie?.naam ? ` — ${activiteitNaam.locatie.naam}` : ''}
                <span> · {new Date(datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              {blokken.map((blok, bi) => {
                const open = exportAlles || openBlok === bi;
                const aantalKinderen = blok.zones.reduce((n, z) => n + z.kinderen.length, 0);
                return (
                <div key={bi} className={`blok ${open ? 'blok-open' : 'blok-dicht'}`}>
                  <div className="blok-kop">
                    <button type="button" className="blok-toggle noprint" onClick={() => setOpenBlok(open && !exportAlles ? -1 : bi)}>
                      {open ? '▾' : '▸'}
                    </button>
                    <input className="blok-label" value={blok.label} placeholder="bv. 19.00-19.30"
                      onChange={(e) => setBlokLabel(bi, e.target.value)} onFocus={() => setOpenBlok(bi)} />
                    <span className="blok-telling noprint">{aantalKinderen} kind{aantalKinderen === 1 ? '' : 'eren'}</span>
                    {open && <button className="mini grijs noprint" onClick={() => addZone(bi)}>+ zone</button>}
                    {open && <button className="mini grijs noprint" onClick={() => removeBlok(bi)}>blok ✕</button>}
                  </div>
                  {open && (
                  <div className="zones">
                    {blok.zones.map((zone, zi) => (
                      <div key={zi} className="zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropZone(e, bi, zi)}>
                        <input className="zone-naam" value={zone.naam} placeholder="zone/baan"
                          onChange={(e) => setZone(bi, zi, 'naam', e.target.value)} />
                        <select className="zone-vrijwilliger" value={zone.vrijwilliger}
                          onChange={(e) => setZone(bi, zi, 'vrijwilliger', e.target.value)}>
                          <option value="">— vrijwilliger —</option>
                          {vrijwilligers.map((v) => <option key={v._id} value={v._id}>{v.naam}</option>)}
                        </select>

                        <ul className="zone-kinderen">
                          {zone.kinderen.map((k, ki) => (
                            <li key={ki} className={`kind status-kind-${k.status}`}
                              draggable onDragStart={(e) => onDragStart(e, k.leerling)}>
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
                          {zone.kinderen.length === 0 && <li className="zone-leeg noprint">sleep hier een kind</li>}
                        </ul>
                        <button className="mini grijs noprint zone-verwijder" onClick={() => removeZone(bi, zi)}>zone ✕</button>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
                );
              })}

              {notities && <div className="rooster-notities"><strong>Notities:</strong> {notities}</div>}
              <div className="rooster-legenda">Legenda: nieuw = groen · oproep = geel · afwezig/verplaatst = grijs · taxi = oranje · (A/B/C) = diplomaniveau</div>
            </div>

            <div className="noprint" style={{ marginTop: 12 }}>
              <button className="grijs" onClick={addBlok}>+ Tijdsblok toevoegen</button>
            </div>
            <div className="card noprint" style={{ marginTop: 12 }}>
              <label>Notities (bv. taxi, afwezig, oproep)
                <textarea value={notities} onChange={(e) => setNotities(e.target.value)} rows={2} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
