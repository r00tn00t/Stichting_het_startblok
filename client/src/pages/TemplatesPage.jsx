import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Een blok in de template-editor: label + lijst zone-namen.
const nieuwBlok = () => ({ label: '', zones: ['ondiep'] });
const leegFormulier = () => ({ naam: '', locatie: '', blokken: [nieuwBlok()] });

export default function TemplatesPage() {
  const [locaties, setLocaties] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(leegFormulier());
  const [bewerkId, setBewerkId] = useState(null); // null = nieuw
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  function laad() {
    api('/locaties').then(setLocaties).catch((e) => setFout(e.message));
    api('/templates').then(setTemplates).catch((e) => setFout(e.message));
  }
  useEffect(laad, []);

  const muteer = (fn) => setForm((f) => { const k = structuredClone(f); fn(k); return k; });

  const addBlok = () => muteer((f) => f.blokken.push(nieuwBlok()));
  const setBlokLabel = (bi, val) => muteer((f) => { f.blokken[bi].label = val; });
  const removeBlok = (bi) => muteer((f) => { f.blokken.splice(bi, 1); });
  const addZone = (bi) => muteer((f) => { f.blokken[bi].zones.push(''); });
  const setZone = (bi, zi, val) => muteer((f) => { f.blokken[bi].zones[zi] = val; });
  const removeZone = (bi, zi) => muteer((f) => { f.blokken[bi].zones.splice(zi, 1); });

  function reset() { setForm(leegFormulier()); setBewerkId(null); }

  function bewerk(t) {
    setBewerkId(t._id);
    setForm({
      naam: t.naam,
      locatie: t.locatie?._id || t.locatie,
      blokken: (t.blokken || []).map((b) => ({ label: b.label, zones: [...(b.zones || [])] })),
    });
    window.scrollTo(0, 0);
  }

  async function opslaan(e) {
    e.preventDefault();
    setFout(''); setMelding('');
    try {
      if (bewerkId) {
        await api(`/templates/${bewerkId}`, { method: 'PUT', body: { naam: form.naam, blokken: form.blokken } });
        setMelding('Template bijgewerkt.');
      } else {
        await api('/templates', { method: 'POST', body: form });
        setMelding('Template aangemaakt.');
      }
      reset();
      laad();
    } catch (err) { setFout(err.message); }
  }

  async function verwijder(id) {
    if (!confirm('Deze template verwijderen?')) return;
    try {
      await api(`/templates/${id}`, { method: 'DELETE' });
      if (bewerkId === id) reset();
      laad();
    } catch (err) { setFout(err.message); }
  }

  return (
    <div>
      <h1>Badindeling-templates</h1>
      <p className="muted">Maak een vaste structuur (tijdsblokken + zones) die je per week op een datum kunt toepassen, zodat je niet steeds alles opnieuw hoeft in te vullen.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <form className="card" onSubmit={opslaan}>
        <h2>{bewerkId ? 'Template bewerken' : 'Nieuwe template'}</h2>
        <div className="form-grid">
          <label>Naam<input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} required placeholder="bv. Standaard maandag" /></label>
          <label>Locatie
            <select value={form.locatie} onChange={(e) => setForm({ ...form, locatie: e.target.value })} required disabled={!!bewerkId}>
              <option value="">— kies —</option>
              {locaties.map((l) => <option key={l._id} value={l._id}>{l.naam} ({l.plaats})</option>)}
            </select>
          </label>
        </div>

        {form.blokken.map((blok, bi) => (
          <div key={bi} className="template-blok">
            <div className="template-blok-kop">
              <input value={blok.label} onChange={(e) => setBlokLabel(bi, e.target.value)} placeholder="Tijdsblok, bv. 19.00-19.30" />
              <button type="button" className="mini grijs" onClick={() => removeBlok(bi)}>blok ✕</button>
            </div>
            <div className="template-zones">
              {blok.zones.map((zone, zi) => (
                <span key={zi} className="template-zone">
                  <input value={zone} onChange={(e) => setZone(bi, zi, e.target.value)} placeholder="zone/baan" />
                  <button type="button" className="mini grijs" onClick={() => removeZone(bi, zi)}>✕</button>
                </span>
              ))}
              <button type="button" className="mini grijs" onClick={() => addZone(bi)}>+ zone</button>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <button type="button" className="grijs" onClick={addBlok}>+ Tijdsblok</button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit">{bewerkId ? 'Wijzigingen opslaan' : 'Template aanmaken'}</button>
          {bewerkId && <button type="button" className="grijs" onClick={reset}>Annuleren</button>}
        </div>
      </form>

      <div className="card">
        <h2>Bestaande templates</h2>
        {templates.length === 0 && <p className="muted">Nog geen templates.</p>}
        {templates.map((t) => (
          <div key={t._id} className="template-rij">
            <div>
              <strong>{t.naam}</strong> <span className="muted">— {t.locatie?.naam}</span>
              <div className="muted">{(t.blokken || []).map((b) => `${b.label} (${(b.zones || []).join(', ')})`).join(' · ') || 'geen blokken'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="mini grijs" onClick={() => bewerk(t)}>Bewerken</button>
              <button className="mini grijs" onClick={() => verwijder(t._id)}>Verwijderen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
