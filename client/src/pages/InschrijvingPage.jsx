import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const LESSEN = [
  'Zwemles - maandagavond - de Viergang, Pijnacker',
  'Zwemles ouder-kind - maandagavond - de Viergang, Pijnacker',
  'Zwemles - dinsdagavond - Het Alexanderhof, Rotterdam',
  'Zwemles ouder-kind - dinsdagavond - Het Alexanderhof, Rotterdam',
  'Zwemles - woensdagmiddag - De Watergeus, Zoetermeer',
  'Zwemles - woensdagmiddag - Kerkpolder, Delft',
  'Zwemles ouder-kind - woensdagmiddag - Kerkpolder, Delft',
  'Zwemles - woensdagavond - de Hoge Bomen, Naaldwijk',
  'Zwemles - woensdagavond - Zwembad Albrandswaard, Poortugaal',
  'Zwemles - donderdagavond - Groenoord, Schiedam',
  'Zwemles ouder-kind - donderdagavond - Zwembad Groenoord, Schiedam',
  'Zwemles - vrijdagavond - Zwembad Groenoord, Schiedam',
  'Zwemles ouder-kind - vrijdagavond - Zwembad Groenoord, Schiedam',
];
const AANDOENINGEN = ['KNO-problemen', 'Hartklachten', 'Astma / COPD', 'Motoriek-problemen', 'ADHD', 'Lichamelijke beperkingen'];
const AANDACHTSPUNTEN = ['evenwichtsstoornissen', 'waterangst', 'gehoor-/gezichtsproblemen', 'concentratieproblemen', 'bewegingsonrust', 'medicijngebruik'];

const leeg = {
  achternaam: '', voorletters: '', roepnaam: '', geslacht: '', geboortedatum: '',
  straatnaam: '', huisnummer: '', postcode: '', plaats: '',
  telefoon: '', email: '', dagbestedingSchool: '', bankrekeningnummer: '',
  akkoordInschrijfgeld: false, akkoordContributie: false, akkoordAlgemeneVoorwaarden: false,
  gekozenLessen: [], eerderGezwommen: false, eerderToelichting: '',
  beperkingNaam: '', beperkingOmschrijving: '',
  toevallen: false, toevallenWaarneming: '', allergieen: false, allergieenWelke: '',
  medicijnen: false, medicijnenWelke: '', medicijnenLetOp: false, medicijnenInstructie: '',
  fysiotherapie: false, fysiotherapiePraktijk: '',
  overigeInformatie: '', aandoeningen: [], aandoeningOverig: '',
  aandachtspunten: [], aandachtspuntOverig: '',
  mediaWebsite: false, mediaSocial: false, mediaKrant: false,
};

export default function InschrijvingPage() {
  const [form, setForm] = useState(leeg);
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);
  const [bezig, setBezig] = useState(false);

  const set = (v) => (e) => setForm({ ...form, [v]: e.target.value });
  const setBool = (v) => (e) => setForm({ ...form, [v]: e.target.checked });
  // Toggle een waarde in een array-veld (checkbox-groep).
  const toggleArr = (veld, waarde) => (e) => {
    const huidig = form[veld];
    setForm({
      ...form,
      [veld]: e.target.checked ? [...huidig, waarde] : huidig.filter((x) => x !== waarde),
    });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setFout('');
    if (!form.akkoordAlgemeneVoorwaarden) {
      setFout('Je moet akkoord gaan met de algemene voorwaarden.');
      return;
    }
    setBezig(true);
    try {
      await api('/registratie/inschrijving', {
        method: 'POST',
        body: { ...form, geboortedatum: form.geboortedatum || undefined },
      });
      setGelukt(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  }

  if (gelukt) {
    return (
      <div className="content">
        <div className="card">
          <h1>Bedankt voor je inschrijving! 🏊</h1>
          <p>We hebben je aanmelding ontvangen. Een van onze medewerkers beoordeelt de inschrijving en neemt contact met je op.</p>
          <p className="muted">
            Let op: de inschrijving is pas definitief zodra het inschrijfgeld van €22,50 is voldaan op
            NL23 RABO 0300 6383 37.
          </p>
          <Link to="/login" className="knop-link">Terug</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div style={{ textAlign: 'center' }}>
        <img src="/startblok-logo.png" alt="Het Startblok" style={{ maxHeight: 64 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <h1>Inschrijven zwemlessen</h1>
      <p>Welkom bij Stichting Het Startblok! Vul onderstaand formulier in om je kind aan te melden.</p>
      {fout && <div className="alert">{fout}</div>}

      <form onSubmit={onSubmit}>
        <section className="card">
          <h2>Gegevens nieuw lid</h2>
          <div className="form-grid">
            <label>Achternaam *<input value={form.achternaam} onChange={set('achternaam')} required /></label>
            <label>Voorletter(s)<input value={form.voorletters} onChange={set('voorletters')} /></label>
            <label>Roepnaam *<input value={form.roepnaam} onChange={set('roepnaam')} required /></label>
            <label>Geslacht
              <select value={form.geslacht} onChange={set('geslacht')}>
                <option value="">—</option><option>Jongen</option><option>Meisje</option><option>Anders</option>
              </select>
            </label>
            <label>Geboortedatum (vanaf 5 jaar)<input type="date" value={form.geboortedatum} onChange={set('geboortedatum')} /></label>
          </div>
        </section>

        <section className="card">
          <h2>Adres & contact</h2>
          <div className="form-grid">
            <label>Straatnaam *<input value={form.straatnaam} onChange={set('straatnaam')} required /></label>
            <label>Huisnummer *<input value={form.huisnummer} onChange={set('huisnummer')} required /></label>
            <label>Postcode *<input value={form.postcode} onChange={set('postcode')} required /></label>
            <label>Plaats *<input value={form.plaats} onChange={set('plaats')} required /></label>
            <label>Telefoonnummer *<input value={form.telefoon} onChange={set('telefoon')} required /></label>
            <label>E-mail *<input type="email" value={form.email} onChange={set('email')} required /></label>
            <label>Dagbesteding / school<input value={form.dagbestedingSchool} onChange={set('dagbestedingSchool')} /></label>
            <label>Bankrekeningnummer *<input value={form.bankrekeningnummer} onChange={set('bankrekeningnummer')} required /></label>
          </div>
        </section>

        <section className="card">
          <h2>Zwemles-keuze</h2>
          <div className="checkbox-lijst">
            {LESSEN.map((les) => (
              <label key={les} className="checkbox-rij">
                <input type="checkbox" checked={form.gekozenLessen.includes(les)} onChange={toggleArr('gekozenLessen', les)} />
                {les}
              </label>
            ))}
          </div>
          <label className="checkbox-rij" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={form.eerderGezwommen} onChange={setBool('eerderGezwommen')} />
            Mijn kind heeft eerder deelgenomen aan zwemlessen
          </label>
          {form.eerderGezwommen && (
            <label className="vol">Vertel zoveel mogelijk over de zwemervaring (welk niveau/badje, bij welke club of school, hoe lang, wat ging goed/lastig)
              <textarea value={form.eerderToelichting} onChange={set('eerderToelichting')} rows={4} />
            </label>
          )}
        </section>

        <section className="card">
          <h2>Vragenlijst aard van de beperking</h2>
          <p className="muted">Deze informatie wordt vertrouwelijk behandeld en helpt onze kaderleden de veiligheid te waarborgen.</p>
          <div className="form-grid">
            <label>Nederlandse benaming van de beperking<input value={form.beperkingNaam} onChange={set('beperkingNaam')} /></label>
          </div>
          <label className="vol">Hoe omschrijft u de beperking?<textarea value={form.beperkingOmschrijving} onChange={set('beperkingOmschrijving')} rows={2} /></label>

          <label className="checkbox-rij"><input type="checkbox" checked={form.toevallen} onChange={setBool('toevallen')} /> Heeft last van toevallen</label>
          {form.toevallen && <label className="vol">Hoe neemt men dit waar?<input value={form.toevallenWaarneming} onChange={set('toevallenWaarneming')} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.allergieen} onChange={setBool('allergieen')} /> Heeft allergieën</label>
          {form.allergieen && <label className="vol">Welke?<input value={form.allergieenWelke} onChange={set('allergieenWelke')} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.medicijnen} onChange={setBool('medicijnen')} /> Gebruikt medicijnen</label>
          {form.medicijnen && <label className="vol">Welke?<input value={form.medicijnenWelke} onChange={set('medicijnenWelke')} /></label>}
          {form.medicijnen && <label className="checkbox-rij"><input type="checkbox" checked={form.medicijnenLetOp} onChange={setBool('medicijnenLetOp')} /> De lesgevers moeten rekening houden met de medicijnen tijdens de les</label>}
          {form.medicijnen && form.medicijnenLetOp && <label className="vol">Waar moeten de begeleiders op letten? (bv. tijdstip, bijwerkingen, wat te doen)<textarea value={form.medicijnenInstructie} onChange={set('medicijnenInstructie')} rows={2} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.fysiotherapie} onChange={setBool('fysiotherapie')} /> Krijgt fysiotherapie</label>
          {form.fysiotherapie && <label className="vol">Bij welke praktijk?<input value={form.fysiotherapiePraktijk} onChange={set('fysiotherapiePraktijk')} /></label>}

          <label className="vol">Overige informatie voor de begeleiders<textarea value={form.overigeInformatie} onChange={set('overigeInformatie')} rows={2} /></label>

          <h4>Mijn kind heeft:</h4>
          <div className="checkbox-lijst">
            {AANDOENINGEN.map((a) => (
              <label key={a} className="checkbox-rij">
                <input type="checkbox" checked={form.aandoeningen.includes(a)} onChange={toggleArr('aandoeningen', a)} /> {a}
              </label>
            ))}
          </div>
          <label className="vol">Overige beperking<input value={form.aandoeningOverig} onChange={set('aandoeningOverig')} /></label>

          <h4>Aanvullend relevant voor de zwemleerkrachten:</h4>
          <div className="checkbox-lijst">
            {AANDACHTSPUNTEN.map((a) => (
              <label key={a} className="checkbox-rij">
                <input type="checkbox" checked={form.aandachtspunten.includes(a)} onChange={toggleArr('aandachtspunten', a)} /> {a}
              </label>
            ))}
          </div>
          <label className="vol">Andere / overige<input value={form.aandachtspuntOverig} onChange={set('aandachtspuntOverig')} /></label>
        </section>

        <section className="card">
          <h2>Toestemming media</h2>
          <label className="checkbox-rij"><input type="checkbox" checked={form.mediaWebsite} onChange={setBool('mediaWebsite')} /> Foto's/films op de website van Het Startblok</label>
          <label className="checkbox-rij"><input type="checkbox" checked={form.mediaSocial} onChange={setBool('mediaSocial')} /> Foto's/films op Facebook of andere sociale media</label>
          <label className="checkbox-rij"><input type="checkbox" checked={form.mediaKrant} onChange={setBool('mediaKrant')} /> Foto's in de krant</label>
        </section>

        <section className="card">
          <h2>Akkoord</h2>
          <p className="muted">
            Per lid dient eenmalig €22,50 inschrijfkosten te worden voldaan op NL23 RABO 0300 6383 37.
            De inschrijving is pas definitief zodra de betaling is ontvangen. Alle persoonlijke gegevens
            worden vertrouwelijk behandeld.
          </p>
          <label className="checkbox-rij"><input type="checkbox" checked={form.akkoordInschrijfgeld} onChange={setBool('akkoordInschrijfgeld')} /> Ik begrijp dat de inschrijving pas definitief is na betaling van het inschrijfgeld (geen nota).</label>
          <label className="checkbox-rij"><input type="checkbox" checked={form.akkoordContributie} onChange={setBool('akkoordContributie')} /> Ik zorg voor tijdige betaling van de maandelijkse contributie.</label>
          <label className="checkbox-rij"><input type="checkbox" checked={form.akkoordAlgemeneVoorwaarden} onChange={setBool('akkoordAlgemeneVoorwaarden')} required /> <strong>Ik ga akkoord met de algemene voorwaarden van Stichting Het Startblok. *</strong></label>
        </section>

        <button type="submit" disabled={bezig}>{bezig ? 'Versturen…' : 'Inschrijving versturen'}</button>
      </form>
    </div>
  );
}
