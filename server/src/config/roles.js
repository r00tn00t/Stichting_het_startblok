// Centrale rol-definities. Hiërarchie van laag naar hoog.
export const ROLES = {
  VRIJWILLIGER: 'vrijwilliger', // ziet eigen kinderen (badindeling) + deelnemers van eigen activiteit
  COORDINATOR: 'coordinator',   // beheert kinderen/activiteiten/badindeling van eigen locatie(s), keurt vrijwilligers goed
  DIRECTIE: 'directie',         // volledige toegang, alle locaties
};

// Rangorde voor "minimaal deze rol"-checks.
export const ROLE_RANK = {
  [ROLES.VRIJWILLIGER]: 1,
  [ROLES.COORDINATOR]: 2,
  [ROLES.DIRECTIE]: 3,
};

export const ALL_ROLES = Object.values(ROLES);
