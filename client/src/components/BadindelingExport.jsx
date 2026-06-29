// Export-weergave van de badindeling als tabel-raster, zo dicht mogelijk bij het
// papieren Poortugaal-formulier: per tijdsblok een oranje koprij met zone-namen,
// daaronder de vrijwilliger (vet) en de kinderen per zone, plus een legenda.
// Wordt off-screen gerenderd en door html-to-image/jspdf vastgelegd.

const STATUS_KLASSE = {
  nieuw: 'exp-nieuw',
  oproep: 'exp-oproep',
  afwezig: 'exp-afwezig',
  verplaatst: 'exp-verplaatst',
  taxi: 'exp-taxi',
};

export default function BadindelingExport({ exportRef, titel, datumLabel, blokken, vrijwilligerNaam, leerlingNaam, notities }) {
  // Max aantal kinderen in een zone bepaalt het aantal kindrijen per blok.
  return (
    <div ref={exportRef} className="exp-wrap">
      <div className="exp-titel">{titel}<span> · {datumLabel}</span></div>

      {blokken.map((blok, bi) => {
        const maxKind = Math.max(1, ...blok.zones.map((z) => z.kinderen.length));
        return (
          <table key={bi} className="exp-tabel">
            <thead>
              <tr>
                <th className="exp-tijd">{blok.label}</th>
                {blok.zones.map((z, zi) => <th key={zi} className="exp-zone">{z.naam}</th>)}
              </tr>
            </thead>
            <tbody>
              {/* Rij met de vrijwilliger per zone (vetgedrukt). */}
              <tr>
                <td className="exp-rijlabel"></td>
                {blok.zones.map((z, zi) => (
                  <td key={zi} className="exp-vrijwilliger">{z.vrijwilliger ? vrijwilligerNaam(z.vrijwilliger) : ''}</td>
                ))}
              </tr>
              {/* Kindrijen. */}
              {Array.from({ length: maxKind }).map((_, ri) => (
                <tr key={ri}>
                  <td className="exp-rijlabel"></td>
                  {blok.zones.map((z, zi) => {
                    const k = z.kinderen[ri];
                    return (
                      <td key={zi} className={k ? STATUS_KLASSE[k.status] || '' : ''}>
                        {k ? `${leerlingNaam(k.leerling)}${k.niveau ? ` (${k.niveau})` : ''}` : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}

      {notities && <div className="exp-notities"><strong>Notities:</strong> {notities}</div>}

      <div className="exp-legenda">
        <span className="exp-legenda-titel">Legenda:</span>
        <span className="exp-chip exp-nieuw">komt nieuw</span>
        <span className="exp-chip exp-oproep">oproep</span>
        <span className="exp-chip exp-afwezig">afwezig</span>
        <span className="exp-chip exp-verplaatst">verplaatst</span>
        <span className="exp-chip exp-taxi">taxi (*)</span>
        <span className="exp-legenda-niveau">(A/B/C) = diplomaniveau</span>
      </div>
    </div>
  );
}
