import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';

const CATEGORIEEN = [
  'lichamelijk',
  'verstandelijk',
  'zintuiglijk',
  'gedrag-ontwikkeling',
  'meervoudig',
  'overig',
];
const URGENTIES = ['info', 'belangrijk', 'kritiek'];

const leegFormulier = {
  naam: '',
  geboortedatum: '',
  typeBeperking: '',
  beperkingCategorie: 'overig',
  communicatieTips: '',
  watWerktWel: '',
  watWerktNiet: '',
  niveau: '',
  niveauToelichting: '',
  locatie: '',
  activiteiten: [],
  contactNaam: '',
  contactTelefoon: '',
  medischeAandachtspunten: [],
};

export default function LeerlingFormPage() {
  const { id } = useParams(); // aanwezig = bewerken, anders = nieuw
  const navigate = useNavigate();
  const bewerken = Boolean(id);

  const [form, setForm] = useState(leegFormulier);
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);
  const [locaties, setLocaties] = useState([]);
  const [activiteiten, setActiviteiten] = useState([]);
  const [niveaus, setNiveaus] = useState([]); // namen van de DB-niveaus

  // Locaties + activiteiten + niveaus ophalen voor de keuzelijsten.
  useEffect(() => {
    api('/locaties').then(setLocaties).catch((e) => setFout(e.message));
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
    api('/niveaus').then((lijst) => setNiveaus(lijst.map((n) => n.naam))).catch(() => {});
  }, []);

  // Bij bewerken: bestaand dossier laden.
  useEffect(() => {
    if (!bewerken) return;
    api(`/leerlingen/${id}`)
      .then(({ leerling }) =>
        setForm({
          ...leegFormulier,
          ...leerling,
          locatie: leerling.locatie || '',
          activiteiten: leerling.activiteiten || [],
          geboortedatum: leerling.geboortedatum
            ? leerling.geboortedatum.slice(0, 10)
            : '',
        })
      )
      .catch((e) => setFout(e.message));
  }, [id, bewerken]);

  const set = (veld) => (e) => setForm({ ...form, [veld]: e.target.value });

  // Activiteiten van de gekozen locatie (voor de checkbox-lijst).
  const activiteitenVanLocatie = activiteiten.filter(
    (a) => (a.locatie?._id || a.locatie) === form.locatie
  );
  const toggleActiviteit = (actId) => (e) => {
    setForm({
      ...form,
      activiteiten: e.target.checked
        ? [...form.activiteiten, actId]
        : form.activiteiten.filter((x) => x !== actId),
    });
  };

  // --- Medische aandachtspunten (subdocumenten) ---
  function voegAandachtspuntToe() {
    setForm({
      ...form,
      medischeAandachtspunten: [
        ...form.medischeAandachtspunten,
        { titel: '', omschrijving: '', urgentie: 'info' },
      ],
    });
  }
  function wijzigAandachtspunt(i, veld, waarde) {
    const kopie = form.medischeAandachtspunten.map((a, idx) =>
      idx === i ? { ...a, [veld]: waarde } : a
    );
    setForm({ ...form, medischeAandachtspunten: kopie });
  }
  function verwijderAandachtspunt(i) {
    setForm({
      ...form,
      medischeAandachtspunten: form.medischeAandachtspunten.filter((_, idx) => idx !== i),
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    // Lege aandachtspunten (zonder titel) niet opslaan.
    const payload = {
      ...form,
      geboortedatum: form.geboortedatum || undefined,
      medischeAandachtspunten: form.medischeAandachtspunten.filter((a) => a.titel.trim()),
    };
    try {
      if (bewerken) {
        await api(`/leerlingen/${id}`, { method: 'PUT', body: payload });
        navigate(`/leerlingen/${id}`);
      } else {
        const nieuw = await api('/leerlingen', { method: 'POST', body: payload });
        navigate(`/leerlingen/${nieuw._id}`);
      }
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div>
      <Link to={bewerken ? `/leerlingen/${id}` : '/leerlingen'} className="terug">← Terug</Link>
      <h1>{bewerken ? 'Leerling bewerken' : 'Nieuwe leerling'}</h1>
      {fout && <div className="alert">{fout}</div>}

      <form onSubmit={onSubmit}>
        <div className="card">
          <h2>Profiel</h2>
          <div className="form-grid">
            <label>
              Naam *
              <input value={form.naam} onChange={set('naam')} required />
            </label>
            <label>
              Geboortedatum
              <input type="date" value={form.geboortedatum} onChange={set('geboortedatum')} />
            </label>
            <label>
              Type beperking
              <input value={form.typeBeperking} onChange={set('typeBeperking')} placeholder="bv. Autisme (ASS)" />
            </label>
            <label>
              Categorie
              <select value={form.beperkingCategorie} onChange={set('beperkingCategorie')}>
                {CATEGORIEEN.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Niveau
              <select value={form.niveau} onChange={set('niveau')}>
                <option value="">— kies niveau —</option>
                {niveaus.map((n) => <option key={n} value={n}>{n}</option>)}
                {/* Behoud een bestaand (oud) niveau dat niet in de lijst staat. */}
                {form.niveau && !niveaus.includes(form.niveau) && <option value={form.niveau}>{form.niveau}</option>}
              </select>
            </label>
          </div>
          <label className="vol">
            Toelichting bij niveau
            <input value={form.niveauToelichting} onChange={set('niveauToelichting')} placeholder="bv. lukt bijna zonder steun" />
          </label>

          <label className="vol">
            Communicatietips
            <textarea value={form.communicatieTips} onChange={set('communicatieTips')} rows={2} />
          </label>
          <div className="form-grid">
            <label>
              Wat werkt wel
              <textarea value={form.watWerktWel} onChange={set('watWerktWel')} rows={2} />
            </label>
            <label>
              Wat werkt niet
              <textarea value={form.watWerktNiet} onChange={set('watWerktNiet')} rows={2} />
            </label>
          </div>
        </div>

        <div className="card">
          <h2>Locatie & activiteiten</h2>
          <p className="muted">Bepaalt wie dit kind kan zien: de coördinator van de locatie en de vrijwilligers van de gekozen activiteit(en).</p>
          <label>
            Locatie
            <select
              value={form.locatie}
              onChange={(e) => setForm({ ...form, locatie: e.target.value, activiteiten: [] })}
            >
              <option value="">— geen —</option>
              {locaties.map((l) => <option key={l._id} value={l._id}>{l.naam} ({l.plaats})</option>)}
            </select>
          </label>
          {form.locatie && (
            <div style={{ marginTop: 12 }}>
              <strong>Activiteiten</strong>
              <div className="checkbox-lijst">
                {activiteitenVanLocatie.map((a) => (
                  <label key={a._id} className="checkbox-rij">
                    <input type="checkbox" checked={form.activiteiten.includes(a._id)} onChange={toggleActiviteit(a._id)} />
                    {a.naam}{a.weekdag ? ` (${a.weekdag})` : ''}
                  </label>
                ))}
                {activiteitenVanLocatie.length === 0 && <span className="muted">Geen activiteiten op deze locatie.</span>}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Medische aandachtspunten</h2>
          {form.medischeAandachtspunten.map((a, i) => (
            <div key={i} className="aandacht-rij">
              <input
                placeholder="Titel (bv. Epilepsie)"
                value={a.titel}
                onChange={(e) => wijzigAandachtspunt(i, 'titel', e.target.value)}
              />
              <input
                placeholder="Wat te doen / waarop letten"
                value={a.omschrijving}
                onChange={(e) => wijzigAandachtspunt(i, 'omschrijving', e.target.value)}
              />
              <select value={a.urgentie} onChange={(e) => wijzigAandachtspunt(i, 'urgentie', e.target.value)}>
                {URGENTIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button type="button" className="mini grijs" onClick={() => verwijderAandachtspunt(i)}>×</button>
            </div>
          ))}
          <button type="button" className="mini" onClick={voegAandachtspuntToe}>+ Aandachtspunt</button>
        </div>

        <div className="card">
          <h2>Contactpersoon</h2>
          <div className="form-grid">
            <label>
              Naam
              <input value={form.contactNaam} onChange={set('contactNaam')} />
            </label>
            <label>
              Telefoon
              <input value={form.contactTelefoon} onChange={set('contactTelefoon')} />
            </label>
          </div>
        </div>

        <button type="submit" disabled={bezig}>
          {bezig ? 'Opslaan…' : bewerken ? 'Wijzigingen opslaan' : 'Leerling aanmaken'}
        </button>
      </form>
    </div>
  );
}
