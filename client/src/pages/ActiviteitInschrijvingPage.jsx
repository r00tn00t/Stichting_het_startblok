import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const ACTIVITEITEN = [
  'Conditie-Techniek zwemmen - maandagavond - zwembad de Viergang, Pijnacker',
  'Zeemeerminzwemmen - maandagavond - zwembad de Viergang, Pijnacker',
  'Ouder-en kindzwemmen - dinsdagochtend - Zwembad de Veur, Zoetermeer',
  'Aquafit - dinsdagochtend - Zwembad de Veur, Zoetermeer',
  'Trimzwemmen - dinsdagochtend - Zwembad de Veur, Zoetermeer',
  'Banenzwemmen voor alle leeftijden - dinsdagochtend - Zwembad de Veur, Zoetermeer',
  'Techniek zwemmen - dinsdagochtend - Zwembad de Veur, Zoetermeer',
  'Recreatief zwemmen - dinsdagavond - zwembad de Kulk, Vlaardingen',
  'Zwemactiviteiten volwassen - woensdagochtend - zwembad de Kulk, Vlaardingen',
  'Zwemactiviteiten volwassen - woensdagmiddag - zwembad Kerkpolder, Delft',
  'Zwemactiviteiten volwassen - woensdagavond - Zwembad Albrandswaard, Poortugaal',
  'Zeemeerminzwemmen - woensdagavond - zwembad Albrandswaard, Poortugaal',
  'Aquafit - vrijdagochtend - Zwembad de Watergeus, Zoetermeer',
  'Banenzwemmen en zwemactiviteiten, alle leeftijden - vrijdagochtend - Zwembad de Watergeus, Zoetermeer',
];
const AANDOENINGEN = ['KNO-problemen', 'Hartklachten', 'Astma / COPD', 'Motoriek-problemen', 'ADHD', 'Lichamelijke beperkingen'];
const AANDACHTSPUNTEN = ['evenwichtsstoornissen', 'waterangst', 'gehoor-/gezichtsproblemen', 'concentratieproblemen', 'bewegingsonrust', 'medicijngebruik'];

const leeg = {
  soort: 'activiteit',
  achternaam: '', voorletters: '', roepnaam: '', geslacht: '', geboortedatum: '',
  straatnaam: '', huisnummer: '', postcode: '', plaats: '',
  telefoon: '', email: '', bankrekeningnummer: '',
  akkoordContributie: false, akkoordAlgemeneVoorwaarden: false,
  gekozenLessen: [],
  beperkingNaam: '', beperkingOmschrijving: '',
  toevallen: false, toevallenWaarneming: '', allergieen: false, allergieenWelke: '',
  medicijnen: false, medicijnenWelke: '', fysiotherapie: false, fysiotherapiePraktijk: '',
  overigeInformatie: '', aandoeningen: [], aandoeningOverig: '',
  aandachtspunten: [], aandachtspuntOverig: '',
  mediaWebsite: false, mediaSocial: false, mediaKrant: false,
};

export default function ActiviteitInschrijvingPage() {
  const [form, setForm] = useState(leeg);
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);
  const [bezig, setBezig] = useState(false);

  const set = (v) => (e) => setForm({ ...form, [v]: e.target.value });
  const setBool = (v) => (e) => setForm({ ...form, [v]: e.target.checked });
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
          <p>We hebben je aanmelding voor de activiteit ontvangen. Wanneer je een bevestiging hebt ontvangen, is de inschrijving definitief.</p>
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
      <h1>Inschrijven overige activiteiten</h1>
      <p>Welkom bij Stichting Het Startblok! Wil je jezelf of iemand anders inschrijven voor onze overige activiteiten? Vul dan onderstaand formulier in.</p>
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
                <option value="">—</option><option>Man</option><option>Vrouw</option><option>Anders</option>
              </select>
            </label>
            <label>Geboortedatum *<input type="date" value={form.geboortedatum} onChange={set('geboortedatum')} required /></label>
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
            <label>Bankrekeningnummer *<input value={form.bankrekeningnummer} onChange={set('bankrekeningnummer')} required /></label>
          </div>
        </section>

        <section className="card">
          <h2>Aan welke activiteit(en) wilt u deelnemen?</h2>
          <div className="checkbox-lijst">
            {ACTIVITEITEN.map((act) => (
              <label key={act} className="checkbox-rij">
                <input type="checkbox" checked={form.gekozenLessen.includes(act)} onChange={toggleArr('gekozenLessen', act)} />
                {act}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Vragenlijst aard van de beperking</h2>
          <p className="muted">Deze informatie wordt vertrouwelijk behandeld en helpt onze kaderleden de veiligheid te waarborgen. Voor conditie-/techniekzwemmen is een medische beperking niet vereist.</p>
          <div className="form-grid">
            <label>Nederlandse benaming van de beperking<input value={form.beperkingNaam} onChange={set('beperkingNaam')} /></label>
          </div>
          <label className="vol">Hoe omschrijft u de beperking?<textarea value={form.beperkingOmschrijving} onChange={set('beperkingOmschrijving')} rows={2} /></label>

          <label className="checkbox-rij"><input type="checkbox" checked={form.toevallen} onChange={setBool('toevallen')} /> Last van toevallen</label>
          {form.toevallen && <label className="vol">Hoe neemt men dit waar?<input value={form.toevallenWaarneming} onChange={set('toevallenWaarneming')} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.allergieen} onChange={setBool('allergieen')} /> Allergieën</label>
          {form.allergieen && <label className="vol">Welke?<input value={form.allergieenWelke} onChange={set('allergieenWelke')} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.medicijnen} onChange={setBool('medicijnen')} /> Gebruikt medicijnen</label>
          {form.medicijnen && <label className="vol">Welke?<input value={form.medicijnenWelke} onChange={set('medicijnenWelke')} /></label>}

          <label className="checkbox-rij"><input type="checkbox" checked={form.fysiotherapie} onChange={setBool('fysiotherapie')} /> Krijgt fysiotherapie</label>
          {form.fysiotherapie && <label className="vol">Bij welke praktijk?<input value={form.fysiotherapiePraktijk} onChange={set('fysiotherapiePraktijk')} /></label>}

          <label className="vol">Overige informatie voor de begeleiders<textarea value={form.overigeInformatie} onChange={set('overigeInformatie')} rows={2} /></label>

          <h4>Ik of ons kind heeft:</h4>
          <div className="checkbox-lijst">
            {AANDOENINGEN.map((a) => (
              <label key={a} className="checkbox-rij">
                <input type="checkbox" checked={form.aandoeningen.includes(a)} onChange={toggleArr('aandoeningen', a)} /> {a}
              </label>
            ))}
          </div>
          <label className="vol">Overige beperking<input value={form.aandoeningOverig} onChange={set('aandoeningOverig')} /></label>

          <h4>Aanvullend relevant voor de begeleiders:</h4>
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
            Voor zwemactiviteiten voor volwassenen is geen inschrijfgeld verschuldigd. De contributie bedraagt
            € 23,75 per maand gedurende 10 maanden per jaar. Bedragen kunnen worden aangepast. Alle persoonlijke
            gegevens worden vertrouwelijk behandeld.
          </p>
          <label className="checkbox-rij"><input type="checkbox" checked={form.akkoordContributie} onChange={setBool('akkoordContributie')} /> Ik zorg voor tijdige betaling van de maandelijkse contributie.</label>
          <label className="checkbox-rij"><input type="checkbox" checked={form.akkoordAlgemeneVoorwaarden} onChange={setBool('akkoordAlgemeneVoorwaarden')} required /> <strong>Ik ga akkoord met de algemene voorwaarden van Stichting Het Startblok. *</strong></label>
        </section>

        <button type="submit" disabled={bezig}>{bezig ? 'Versturen…' : 'Inschrijving versturen'}</button>
      </form>
    </div>
  );
}
