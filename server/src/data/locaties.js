// Echte locaties (zwembaden) van Het Startblok met hun activiteiten.
// Wordt ingeladen door seed.js. `key` is een interne sleutel om in de seed
// makkelijk naar een locatie/activiteit te verwijzen.

export const locatieData = [
  {
    key: 'viergang',
    naam: 'Zwembad de Viergang',
    plaats: 'Pijnacker',
    activiteiten: [
      { naam: 'Zwemles - maandagavond', weekdag: 'maandag', soort: 'zwemles' },
      { naam: 'Zwemles ouder-kind - maandagavond', weekdag: 'maandag', soort: 'zwemles' },
      { naam: 'Conditie-Techniek zwemmen - maandagavond', weekdag: 'maandag', soort: 'activiteit' },
      { naam: 'Zeemeerminzwemmen - maandagavond', weekdag: 'maandag', soort: 'activiteit' },
    ],
  },
  {
    key: 'alexanderhof',
    naam: 'Het Alexanderhof',
    plaats: 'Rotterdam',
    activiteiten: [
      { naam: 'Zwemles - dinsdagavond', weekdag: 'dinsdag', soort: 'zwemles' },
      { naam: 'Zwemles ouder-kind - dinsdagavond', weekdag: 'dinsdag', soort: 'zwemles' },
    ],
  },
  {
    key: 'watergeus',
    naam: 'De Watergeus',
    plaats: 'Zoetermeer',
    activiteiten: [
      { naam: 'Zwemles - woensdagmiddag', weekdag: 'woensdag', soort: 'zwemles' },
      { naam: 'Aquafit - vrijdagochtend', weekdag: 'vrijdag', soort: 'activiteit' },
      { naam: 'Banenzwemmen en zwemactiviteiten, alle leeftijden - vrijdagochtend', weekdag: 'vrijdag', soort: 'activiteit' },
    ],
  },
  {
    key: 'kerkpolder',
    naam: 'Zwembad Kerkpolder',
    plaats: 'Delft',
    activiteiten: [
      { naam: 'Zwemles - woensdagmiddag', weekdag: 'woensdag', soort: 'zwemles' },
      { naam: 'Zwemles ouder-kind - woensdagmiddag', weekdag: 'woensdag', soort: 'zwemles' },
      { naam: 'Zwemactiviteiten volwassen - woensdagmiddag', weekdag: 'woensdag', soort: 'activiteit' },
    ],
  },
  {
    key: 'hogebomen',
    naam: 'De Hoge Bomen',
    plaats: 'Naaldwijk',
    activiteiten: [
      { naam: 'Zwemles - woensdagavond', weekdag: 'woensdag', soort: 'zwemles' },
    ],
  },
  {
    key: 'albrandswaard',
    naam: 'Zwembad Albrandswaard',
    plaats: 'Poortugaal',
    activiteiten: [
      { naam: 'Zwemles - woensdagavond', weekdag: 'woensdag', soort: 'zwemles' },
      { naam: 'Zwemactiviteiten volwassen - woensdagavond', weekdag: 'woensdag', soort: 'activiteit' },
      { naam: 'Zeemeerminzwemmen - woensdagavond', weekdag: 'woensdag', soort: 'activiteit' },
    ],
  },
  {
    key: 'groenoord',
    naam: 'Zwembad Groenoord',
    plaats: 'Schiedam',
    activiteiten: [
      { naam: 'Zwemles - donderdagavond', weekdag: 'donderdag', soort: 'zwemles' },
      { naam: 'Zwemles ouder-kind - donderdagavond', weekdag: 'donderdag', soort: 'zwemles' },
      { naam: 'Zwemles - vrijdagavond', weekdag: 'vrijdag', soort: 'zwemles' },
      { naam: 'Zwemles ouder-kind - vrijdagavond', weekdag: 'vrijdag', soort: 'zwemles' },
    ],
  },
  {
    key: 'deveur',
    naam: 'Zwembad de Veur',
    plaats: 'Zoetermeer',
    activiteiten: [
      { naam: 'Ouder-en kindzwemmen - dinsdagochtend', weekdag: 'dinsdag', soort: 'activiteit' },
      { naam: 'Aquafit - dinsdagochtend', weekdag: 'dinsdag', soort: 'activiteit' },
      { naam: 'Trimzwemmen - dinsdagochtend', weekdag: 'dinsdag', soort: 'activiteit' },
      { naam: 'Banenzwemmen voor alle leeftijden - dinsdagochtend', weekdag: 'dinsdag', soort: 'activiteit' },
      { naam: 'Techniek zwemmen - dinsdagochtend', weekdag: 'dinsdag', soort: 'activiteit' },
    ],
  },
  {
    key: 'dekulk',
    naam: 'Zwembad de Kulk',
    plaats: 'Vlaardingen',
    activiteiten: [
      { naam: 'Recreatief zwemmen - dinsdagavond', weekdag: 'dinsdag', soort: 'activiteit' },
      { naam: 'Zwemactiviteiten volwassen - woensdagochtend', weekdag: 'woensdag', soort: 'activiteit' },
    ],
  },
];
