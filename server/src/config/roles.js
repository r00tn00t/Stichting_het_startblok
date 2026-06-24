// Centrale rol-definities. Hiërarchie van laag naar hoog.
export const ROLES = {
  VRIJWILLIGER: 'vrijwilliger', // alleen lezen
  HOOFDTRAINER: 'hoofdtrainer', // lezen + schrijven (voortgang, profielen)
  COORDINATOR: 'coordinator',   // volledig beheer (incl. gebruikers)
};

// Rangorde voor "minimaal deze rol"-checks.
export const ROLE_RANK = {
  [ROLES.VRIJWILLIGER]: 1,
  [ROLES.HOOFDTRAINER]: 2,
  [ROLES.COORDINATOR]: 3,
};

export const ALL_ROLES = Object.values(ROLES);
