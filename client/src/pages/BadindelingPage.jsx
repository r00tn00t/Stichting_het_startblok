import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Vandaag als YYYY-MM-DD (voor het date-input-default).
function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BadindelingPage() {
  const [activiteiten, setActiviteiten] = useState([]);
  const [activiteitId, setActiviteitId] = useState('');
  const [datum, setDatum] = useState(vandaagISO());

  const [leerlingen, setLeerlingen] = useState([]);   // kinderen van de activiteit
  const [vrijwilligers, setVrijwilligers] = useState([]); // vrijwilligers van de activiteit

  // aanwezig: Set van leerling-id's. toewijzing: { leerlingId: vrijwilligerId }.
  const [aanwezig, setAanwezig] = useState(new Set());
  const [toewijzing, setToewijzing] = useState({});

  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  // Activiteiten (gescoped door de backend) laden.
  useEffect(() => {
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
  }, []);

  // Bij keuze van activiteit: kinderen + vrijwilligers van die activiteit ophalen.
  useEffect(() => {
    if (!activiteitId) return;
    setFout('');
    Promise.all([api('/leerlingen'), api('/users')])
      .then(([alleLeerlingen, alleUsers]) => {
        setLeerlingen(alleLeerlingen.filter((l) => (l.activiteiten || []).includes(activiteitId)));
        setVrijwilligers(
          alleUsers.filter(
            (u) => u.role === 'vrijwilliger' && (u.activiteiten || []).includes(activiteitId)
          )
        );
      })
      .catch((e) => setFout(e.message));
  }, [activiteitId]);

  // Bestaande indeling voor activiteit+datum laden.
  useEffect(() => {
    if (!activiteitId || !datum) return;
    setMelding('');
    api(`/badindelingen?activiteit=${activiteitId}&datum=${datum}`)
      .then(({ indeling }) => {
        if (!indeling) {
          setAanwezig(new Set());
          setToewijzing({});
          return;
        }
        setAanwezig(new Set((indeling.aanwezig || []).map((l) => l._id)));
        const t = {};
        for (const tw of indeling.toewijzingen || []) {
          for (const k of tw.kinderen || []) {
            t[k._id] = tw.vrijwilliger?._id;
          }
        }
        setToewijzing(t);
      })
      .catch((e) => setFout(e.message));
  }, [activiteitId, datum]);

  function toggleAanwezig(leerlingId) {
    setAanwezig((s) => {
      const next = new Set(s);
      if (next.has(leerlingId)) {
        next.delete(leerlingId);
        setToewijzing((t) => { const c = { ...t }; delete c[leerlingId]; return c; });
      } else {
        next.add(leerlingId);
      }
      return next;
    });
  }

  async function opslaan() {
    setFout('');
    setMelding('');
    // Groepeer kinderen per vrijwilliger op basis van toewijzing.
    const perVrijwilliger = {};
    for (const leerlingId of aanwezig) {
      const vId = toewijzing[leerlingId];
      if (!vId) continue;
      (perVrijwilliger[vId] ||= []).push(leerlingId);
    }
    const toewijzingen = Object.entries(perVrijwilliger).map(([vrijwilliger, kinderen]) => ({
      vrijwilliger,
      kinderen,
    }));
    try {
      await api('/badindelingen', {
        method: 'PUT',
        body: { activiteit: activiteitId, datum, aanwezig: [...aanwezig], toewijzingen },
      });
      setMelding('Badindeling opgeslagen.');
    } catch (e) {
      setFout(e.message);
    }
  }

  return (
    <div>
      <h1>Badindeling maken</h1>
      <p className="muted">Kies een activiteit en datum, vink de aanwezige kinderen aan en koppel ze aan een vrijwilliger.</p>
      {fout && <div className="alert">{fout}</div>}
      {melding && <div className="melding">{melding}</div>}

      <div className="card">
        <div className="form-grid">
          <label>
            Activiteit
            <select value={activiteitId} onChange={(e) => setActiviteitId(e.target.value)}>
              <option value="">— kies —</option>
              {activiteiten.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.naam}{a.locatie?.naam ? ` — ${a.locatie.naam}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Datum
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </label>
        </div>
      </div>

      {activiteitId && (
        <div className="card">
          <h2>Aanwezigheid & toewijzing</h2>
          {leerlingen.length === 0 && <p className="muted">Geen kinderen gekoppeld aan deze activiteit.</p>}
          {vrijwilligers.length === 0 && leerlingen.length > 0 && (
            <p className="muted">Let op: nog geen vrijwilligers gekoppeld aan deze activiteit.</p>
          )}
          <table className="tabel">
            <thead>
              <tr><th>Aanwezig</th><th>Kind</th><th>Vrijwilliger</th></tr>
            </thead>
            <tbody>
              {leerlingen.map((l) => (
                <tr key={l._id}>
                  <td>
                    <input type="checkbox" checked={aanwezig.has(l._id)} onChange={() => toggleAanwezig(l._id)} />
                  </td>
                  <td>{l.naam}</td>
                  <td>
                    <select
                      value={toewijzing[l._id] || ''}
                      disabled={!aanwezig.has(l._id)}
                      onChange={(e) => setToewijzing((t) => ({ ...t, [l._id]: e.target.value }))}
                    >
                      <option value="">— niet toegewezen —</option>
                      {vrijwilligers.map((v) => (
                        <option key={v._id} value={v._id}>{v.naam}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={opslaan} disabled={!activiteitId}>Badindeling opslaan</button>
        </div>
      )}
    </div>
  );
}
