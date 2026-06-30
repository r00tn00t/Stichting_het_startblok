import { ROLES } from '../config/roles.js';

// Mag deze gebruiker de opgegeven locatie beheren/zien?
// - Directie: alles.
// - Coördinator: alleen de aan hem/haar gekoppelde locaties.
// - Vrijwilliger: nee (beheer); zichtbaarheid loopt via activiteiten, niet hier.
export function magLocatieBeheren(user, locatieId) {
  if (user.role === ROLES.DIRECTIE) return true;
  if (user.role !== ROLES.COORDINATOR) return false;
  const eigen = (user.locaties || []).map((l) => l.toString());
  return eigen.includes(locatieId.toString());
}

// Mongo-filter dat de zichtbare leerlingen beperkt op basis van de rol:
// - Directie: alles.
// - Coördinator: leerlingen van zijn/haar locatie(s).
// - Vrijwilliger: leerlingen die in een van zijn/haar activiteiten zitten.
// Vereist req.user.locaties / req.user.activiteiten (zie loadUserScope).
export function leerlingZichtbaarheidFilter(user) {
  if (user.role === ROLES.DIRECTIE) return {};
  if (user.role === ROLES.COORDINATOR) {
    return { locatie: { $in: user.locaties || [] } };
  }
  // vrijwilliger
  return { activiteiten: { $in: user.activiteiten || [] } };
}

// Mag deze gebruiker een badindeling van deze activiteit maken/zien?
// Vrijwilliger: alleen als hij/zij op die activiteit zit. Coördinator: als de
// activiteit op een van zijn locaties valt. Directie: altijd.
// `activiteit` moet een doc zijn met `locatie` (of populated locatie).
export function magActiviteitBeheren(user, activiteit) {
  if (user.role === ROLES.DIRECTIE) return true;
  if (user.role === ROLES.COORDINATOR) {
    const locId = activiteit.locatie?._id || activiteit.locatie;
    return magLocatieBeheren(user, locId);
  }
  return false;
}

export function zitOpActiviteit(user, activiteitId) {
  const eigen = new Set((user.activiteiten || []).map((a) => a.toString()));
  return eigen.has(activiteitId.toString());
}

// Per-document check (voor detail-endpoints).
export function magLeerlingZien(user, leerling) {
  if (user.role === ROLES.DIRECTIE) return true;
  if (user.role === ROLES.COORDINATOR) {
    const eigen = (user.locaties || []).map((l) => l.toString());
    return leerling.locatie ? eigen.includes(leerling.locatie.toString()) : false;
  }
  // vrijwilliger: overlap tussen leerling-activiteiten en eigen activiteiten
  const eigenAct = new Set((user.activiteiten || []).map((a) => a.toString()));
  return (leerling.activiteiten || []).some((a) => eigenAct.has(a.toString()));
}
