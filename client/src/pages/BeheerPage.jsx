import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ITEMS = [
  { to: '/inschrijvingen', icoon: 'formulier', titel: 'Inschrijvingen', tekst: 'Beoordeel nieuwe aanmeldingen en zet ze om naar een leerlingdossier.' },
  { to: '/locaties', icoon: 'locatie', titel: 'Locaties & activiteiten', tekst: 'Beheer zwembaden en de activiteiten per locatie.' },
  { to: '/templates', icoon: 'sjabloon', titel: 'Sjablonen', tekst: 'Vaste badindeling-structuren (tijdsblokken + banen) per locatie.' },
  { to: '/niveaus', icoon: 'boek', titel: 'Niveaus', tekst: 'De zwemniveaus (vaardigheden) die je bij een leerling kunt kiezen.' },
  { to: '/vakanties', icoon: 'kalender', titel: 'Vakanties', tekst: 'Vakanties en feestdagen waarop de lessen vervallen. Alleen directie.', alleenDirectie: true },
  { to: '/gebruikers', icoon: 'mensen', titel: 'Gebruikers', tekst: 'Vrijwilligers goedkeuren en beheren; rollen toekennen.' },
  { to: '/afspraken', icoon: 'kalender', titel: 'Afspraken', tekst: 'Losse agenda-afspraken (events). Alleen directie.', alleenDirectie: true },
];

export default function BeheerPage() {
  const { heeftRol } = useAuth();
  const items = ITEMS.filter((i) => !i.alleenDirectie || heeftRol('directie'));
  return (
    <div>
      <h1>Beheer</h1>
      <p className="muted">Instellingen en beheer die je minder vaak nodig hebt.</p>
      <div className="grid">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="card beheer-kaart">
            <span className="beheer-icoon"><Icon naam={item.icoon} size={26} /></span>
            <h3>{item.titel}</h3>
            <p className="muted">{item.tekst}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
