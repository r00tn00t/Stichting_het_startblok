import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import registratieRoutes from './routes/registratie.js';
import leerlingenRoutes from './routes/leerlingen.js';
import locatiesRoutes from './routes/locaties.js';
import activiteitenRoutes from './routes/activiteiten.js';
import badindelingenRoutes from './routes/badindelingen.js';
import templatesRoutes from './routes/templates.js';
import aanwezigheidRoutes from './routes/aanwezigheid.js';
import vakantiesRoutes from './routes/vakanties.js';
import afsprakenRoutes from './routes/afspraken.js';
import inschrijvingenRoutes from './routes/inschrijvingen.js';
import kennisbankRoutes from './routes/kennisbank.js';
import usersRoutes from './routes/users.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/registratie', registratieRoutes);
app.use('/api/leerlingen', leerlingenRoutes);
app.use('/api/locaties', locatiesRoutes);
app.use('/api/activiteiten', activiteitenRoutes);
app.use('/api/badindelingen', badindelingenRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/aanwezigheid', aanwezigheidRoutes);
app.use('/api/vakanties', vakantiesRoutes);
app.use('/api/afspraken', afsprakenRoutes);
app.use('/api/inschrijvingen', inschrijvingenRoutes);
app.use('/api/kennisbank', kennisbankRoutes);
app.use('/api/users', usersRoutes);

// Centrale foutafhandeling (vangt async fouten af die zijn doorgegooid).
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  // Mongoose-validatie / verkeerde id -> 400 i.p.v. 500.
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Ongeldige waarde of id' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Waarde bestaat al (dubbele invoer)' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Serverfout' });
});

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart')
  .then(() => {
    app.listen(PORT, () => console.log(`[server] luistert op http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[db] verbinding mislukt:', err.message);
    process.exit(1);
  });
