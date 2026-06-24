import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const typeLabel = { oefening: 'Oefening', tip: 'Tip', pictogram: 'Pictogram', protocol: 'Protocol' };
const TYPES = ['tip', 'oefening', 'pictogram', 'protocol'];
const CATEGORIEEN = [
  'lichamelijk',
  'verstandelijk',
  'zintuiglijk',
  'gedrag-ontwikkeling',
  'meervoudig',
  'overig',
];

const leegItem = { titel: '', type: 'tip', categorie: '', inhoud: '', tags: '' };

export default function KennisbankPage() {
  const { heeftRol } = useAuth();
  const magSchrijven = heeftRol('coordinator');
  const magVerwijderen = heeftRol('coordinator');

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(leegItem);
  const [toonForm, setToonForm] = useState(false);
  const [fout, setFout] = useState('');

  function laad() {
    const pad = filter ? `/kennisbank?categorie=${filter}` : '/kennisbank';
    api(pad).then(setItems).catch((e) => setFout(e.message));
  }
  useEffect(laad, [filter]);

  const set = (veld) => (e) => setForm({ ...form, [veld]: e.target.value });

  async function voegToe(e) {
    e.preventDefault();
    setFout('');
    try {
      await api('/kennisbank', {
        method: 'POST',
        body: {
          titel: form.titel,
          type: form.type,
          inhoud: form.inhoud,
          categorie: form.categorie ? [form.categorie] : [],
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        },
      });
      setForm(leegItem);
      setToonForm(false);
      laad();
    } catch (err) {
      setFout(err.message);
    }
  }

  async function verwijder(id) {
    if (!confirm('Dit item verwijderen?')) return;
    try {
      await api(`/kennisbank/${id}`, { method: 'DELETE' });
      laad();
    } catch (err) {
      setFout(err.message);
    }
  }

  return (
    <div>
      <div className="kop-rij">
        <h1>Kennisbank</h1>
        {magSchrijven && (
          <button onClick={() => setToonForm((v) => !v)}>
            {toonForm ? 'Annuleren' : '+ Nieuw item'}
          </button>
        )}
      </div>
      <p className="muted">Oefeningen en tips per type beperking. Bevat geen persoonsgegevens.</p>
      {fout && <div className="alert">{fout}</div>}

      {toonForm && magSchrijven && (
        <form className="card" onSubmit={voegToe}>
          <h2>Nieuw item</h2>
          <div className="form-grid">
            <label>Titel<input value={form.titel} onChange={set('titel')} required /></label>
            <label>
              Type
              <select value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </label>
            <label>
              Categorie
              <select value={form.categorie} onChange={set('categorie')}>
                <option value="">Algemeen</option>
                {CATEGORIEEN.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Tags (komma-gescheiden)<input value={form.tags} onChange={set('tags')} /></label>
          </div>
          <label className="vol">Inhoud<textarea value={form.inhoud} onChange={set('inhoud')} rows={3} /></label>
          <button type="submit">Opslaan</button>
        </form>
      )}

      <div className="filter-rij">
        <label>
          Filter op categorie:&nbsp;
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Alle</option>
            {CATEGORIEEN.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="kennis-lijst">
        {items.map((item) => (
          <div key={item._id} className="card">
            <span className="badge">{typeLabel[item.type]}</span>
            {item.categorie?.map((c) => <span key={c} className="badge">{c}</span>)}
            <h3>{item.titel}</h3>
            <p className="kennis-inhoud">{item.inhoud}</p>
            {item.tags?.length > 0 && (
              <p className="muted">{item.tags.map((t) => `#${t}`).join(' ')}</p>
            )}
            {magVerwijderen && (
              <button className="mini grijs" onClick={() => verwijder(item._id)}>Verwijderen</button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="muted">Geen items gevonden.</p>}
      </div>
    </div>
  );
}
