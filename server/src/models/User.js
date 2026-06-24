import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    telefoon: { type: String, default: '' },
    // Wordt nooit teruggestuurd naar de client (select: false).
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.VRIJWILLIGER,
      required: true,
    },
    // Geheimhoudingsverklaring akkoord (AVG / vertrouwelijkheid).
    geheimhoudingAkkoord: { type: Boolean, default: false },
    actief: { type: Boolean, default: true },
    // Zelf-geregistreerde vrijwilligers staan eerst 'in afwachting' en hebben
    // GEEN toegang tot dossiers tot de coördinator goedkeurt. Door de coördinator
    // aangemaakte accounts zijn meteen goedgekeurd.
    goedgekeurd: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Helper om een wachtwoord te zetten (hasht automatisch).
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Verwijder gevoelige velden bij serialisatie.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
