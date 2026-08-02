/**
 * Database seed script — `npm run seed`.
 *
 * Wipes every collection and repopulates the database with a realistic dataset:
 * municipalities, categories, 20 real mountain villages, per-village attractions
 * and events, one user per role, and dozens of moderated comments. After the
 * comments are inserted, each village's rating aggregates are recomputed through
 * the Comment model's static method so `ratingAverage` / `ratingCount` reflect
 * only approved reviews.
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import config from '../config/env.js';

import User from '../models/User.js';
import Municipality from '../models/Municipality.js';
import Village from '../models/Village.js';
import Category from '../models/Category.js';
import Attraction from '../models/Attraction.js';
import Event from '../models/Event.js';
import Comment from '../models/Comment.js';
import OfficerRequest from '../models/OfficerRequest.js';
import VisitedVillage from '../models/VisitedVillage.js';
import Favorite from '../models/Favorite.js';
import SavedRoute from '../models/SavedRoute.js';

import { municipalities, categories, villages } from './data.js';

// --- Small deterministic helpers -----------------------------------------
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99',
  'https://images.unsplash.com/photo-1552083375-1447ce886485',
];

const img = (i) => `${IMAGE_POOL[i % IMAGE_POOL.length]}?auto=format&fit=crop&w=1200&q=70`;
const pick = (arr, i) => arr[i % arr.length];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Attraction name templates keyed by category slug. */
const ATTRACTION_TEMPLATES = {
  nature: (v) => ({ name: `Belvedere di ${v.name}`, blurb: `A scenic viewpoint overlooking the valleys around ${v.name}.` }),
  'culture-heritage': (v) => ({ name: `Centro Storico di ${v.name}`, blurb: `The historic stone core of ${v.name} with its old lanes and squares.` }),
  'food-wine': (v) => ({ name: `Osteria del Borgo`, blurb: `A traditional tavern serving the mountain specialities of ${v.name}.` }),
  hiking: (v) => ({ name: `Sentiero di ${v.name}`, blurb: `A marked footpath climbing through the woods and pastures above ${v.name}.` }),
  'winter-sports': (v) => ({ name: `Pista da Sci di ${v.name}`, blurb: `Snow slopes and trails for winter sports near ${v.name}.` }),
  'religious-sites': (v) => ({ name: `Chiesa Parrocchiale di ${v.name}`, blurb: `The parish church of ${v.name}, at the heart of village life.` }),
  museums: (v) => ({ name: `Museo Etnografico di ${v.name}`, blurb: `A small museum on the rural traditions and crafts of ${v.name}.` }),
  'local-crafts': (v) => ({ name: `Bottega Artigiana`, blurb: `A workshop keeping alive the traditional crafts of ${v.name}.` }),
};

/** Event templates (seasonal). */
const EVENT_TEMPLATES = [
  { title: 'Sagra dei Sapori di Montagna', blurb: 'A food festival celebrating local mountain produce, cheeses and cured meats.', month: 7 },
  { title: 'Festa Patronale', blurb: 'The traditional patron-saint celebration with procession, music and markets.', month: 8 },
  { title: 'Mercatino di Natale', blurb: 'A Christmas market filling the old lanes with lights, crafts and mulled wine.', month: 12 },
  { title: 'Festival della Cultura Alpina', blurb: 'Talks, concerts and exhibitions dedicated to alpine culture and heritage.', month: 9 },
  { title: 'Ciaspolata sotto le Stelle', blurb: 'A guided night-time snowshoe walk followed by warm food and drink.', month: 2 },
];

/** Sample review snippets paired with a rating band. */
const COMMENT_POOL = [
  { content: 'Absolutely magical place, the views are breathtaking and the people so welcoming.', rating: 5 },
  { content: 'One of the most authentic mountain villages I have ever visited. Highly recommend.', rating: 5 },
  { content: 'Beautiful stone houses and wonderful walking trails. We will come back.', rating: 5 },
  { content: 'Lovely spot for a quiet weekend away from the crowds. Great local food.', rating: 4 },
  { content: 'Very charming, though a few things were closed off-season. Still worth it.', rating: 4 },
  { content: 'Nice village with good hiking nearby. Parking can be a little tricky.', rating: 4 },
  { content: 'Pleasant visit. The scenery is the main draw; not much else to do in a day.', rating: 3 },
  { content: 'Interesting history but the village felt a bit sleepy when we went.', rating: 3 },
  { content: 'Getting there is a long drive on narrow roads — go slowly and enjoy the views.', rating: 3 },
  { content: 'A hidden gem of the Apennines. The silence and the air are unforgettable.', rating: 5 },
  { content: 'Great base for exploring the national park. Saw plenty of wildlife.', rating: 5 },
  { content: 'The local cheese and cured meats alone are worth the trip.', rating: 4 },
];

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  // 1. Wipe everything.
  await Promise.all([
    User.deleteMany({}),
    Municipality.deleteMany({}),
    Village.deleteMany({}),
    Category.deleteMany({}),
    Attraction.deleteMany({}),
    Event.deleteMany({}),
    Comment.deleteMany({}),
    OfficerRequest.deleteMany({}),
    VisitedVillage.deleteMany({}),
    Favorite.deleteMany({}),
    SavedRoute.deleteMany({}),
  ]);
  console.log('🧹 Collections cleared.');

  // 2. Municipalities + categories.
  const municipalityDocs = await Municipality.insertMany(municipalities);
  const municipalityByName = new Map(municipalityDocs.map((m) => [m.name, m]));
  const categoryDocs = await Category.insertMany(categories);
  console.log(`🏛️  ${municipalityDocs.length} municipalities, 🏷️  ${categoryDocs.length} categories.`);

  // 3. Villages (published), with cover/gallery images.
  const villageDocs = await Village.insertMany(
    villages.map((v, i) => ({
      name: v.name,
      slug: v.slug,
      description: v.description,
      shortDescription: v.shortDescription,
      region: v.region,
      province: v.province,
      location: v.location,
      geo: { type: 'Point', coordinates: [v.location.lng, v.location.lat] },
      altitude: v.altitude,
      population: v.population,
      municipalityId: municipalityByName.get(v.municipality)._id,
      coverImage: img(i),
      images: [img(i), img(i + 3), img(i + 6)],
      stats: v.stats,
      isPublished: true,
    }))
  );
  console.log(`🏔️  ${villageDocs.length} villages.`);

  // 4. Attractions (3–5 per village) + events (1–3 per village).
  const attractionsToInsert = [];
  const eventsToInsert = [];
  const catBySlug = new Map(categoryDocs.map((c) => [c.slug, c]));
  const catSlugs = categories.map((c) => c.slug);

  villageDocs.forEach((village, vi) => {
    const nAttractions = rand(3, 5);
    for (let a = 0; a < nAttractions; a++) {
      const slug = pick(catSlugs, vi + a);
      const tpl = ATTRACTION_TEMPLATES[slug](village);
      attractionsToInsert.push({
        name: tpl.name,
        description: tpl.blurb,
        categoryId: catBySlug.get(slug)._id,
        villageId: village._id,
        images: [img(vi + a)],
        location: {
          lat: village.location.lat + (Math.random() - 0.5) * 0.01,
          lng: village.location.lng + (Math.random() - 0.5) * 0.01,
        },
      });
    }

    const nEvents = rand(1, 3);
    for (let e = 0; e < nEvents; e++) {
      const tpl = pick(EVENT_TEMPLATES, vi + e);
      const year = 2026;
      const start = new Date(year, tpl.month - 1, rand(1, 20));
      const end = new Date(start);
      end.setDate(end.getDate() + rand(1, 3));
      eventsToInsert.push({
        title: `${tpl.title} — ${village.name}`,
        description: tpl.blurb,
        startDate: start,
        endDate: end,
        villageId: village._id,
        image: img(vi + e + 2),
      });
    }
  });

  const attractionDocs = await Attraction.insertMany(attractionsToInsert);
  const eventDocs = await Event.insertMany(eventsToInsert);
  console.log(`📍 ${attractionDocs.length} attractions, 🎉 ${eventDocs.length} events.`);

  // 5. Users — one per role + several officers/tourists. Shared dev password.
  const password = config.seedPassword;
  const adminDoc = await User.create({
    firstName: 'Alessandro', lastName: 'Bianchi', email: 'admin@mountainable.it',
    password, role: 'admin', status: 'active', city: 'Milano',
  });

  const authorityDoc = await User.create({
    firstName: 'Regione', lastName: 'Osservatorio', email: 'authority@mountainable.it',
    password, role: 'authority', status: 'active', city: 'Torino',
  });

  // 4 officers, each linked to a municipality (active for easy testing).
  const officerSpecs = [
    { firstName: 'Giulia', lastName: 'Rossi', email: 'officer.aosta@mountainable.it', municipality: "Unione Comuni Valle d'Aosta" },
    { firstName: 'Marco', lastName: 'Ferrari', email: 'officer.lucane@mountainable.it', municipality: 'Unione Comuni Dolomiti Lucane' },
    { firstName: 'Chiara', lastName: 'Esposito', email: 'officer.gransasso@mountainable.it', municipality: 'Comunità Montana Gran Sasso–Alto Sangro' },
    { firstName: 'Luca', lastName: 'Colombo', email: 'officer.agordina@mountainable.it', municipality: 'Unione Montana Agordina e Giudicarie' },
  ];
  const officerDocs = [];
  for (const o of officerSpecs) {
    officerDocs.push(
      await User.create({
        firstName: o.firstName, lastName: o.lastName, email: o.email,
        password, role: 'officer', status: 'active', city: 'Comune',
        municipalityId: municipalityByName.get(o.municipality)._id,
      })
    );
  }

  // 7 tourists.
  const touristSpecs = [
    ['Sara', 'Greco', 'sara@example.com', 'Bologna'],
    ['Davide', 'Marchetti', 'davide@example.com', 'Firenze'],
    ['Elena', 'Ricci', 'elena@example.com', 'Roma'],
    ['Matteo', 'Conti', 'matteo@example.com', 'Napoli'],
    ['Francesca', 'Gallo', 'francesca@example.com', 'Genova'],
    ['Andrea', 'Fontana', 'andrea@example.com', 'Verona'],
    ['Martina', 'Barbieri', 'martina@example.com', 'Padova'],
  ];
  const touristDocs = [];
  for (const [firstName, lastName, email, city] of touristSpecs) {
    touristDocs.push(
      await User.create({ firstName, lastName, email, password, role: 'tourist', status: 'active', city })
    );
  }
  console.log(`👤 users: 1 admin, 1 authority, ${officerDocs.length} officers, ${touristDocs.length} tourists.`);

  // 6. Comments (~50) with varied ratings, moderation statuses and creation
  // dates spread across the last 12 months (so the satisfaction time series has
  // real monthly variation). Every (userId, villageId) pair is unique, which
  // the compound unique index on the Comment model enforces at the DB level.

  /** A random Date within the last 12 months. */
  const randomDateLast12Months = () => {
    const now = Date.now();
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    return new Date(now - Math.floor(Math.random() * yearMs));
  };

  // Build every possible tourist × village pair, then shuffle and take a slice,
  // guaranteeing uniqueness of (userId, villageId).
  const allPairs = [];
  for (const tourist of touristDocs) {
    for (const village of villageDocs) {
      allPairs.push({ userId: tourist._id, villageId: village._id });
    }
  }
  for (let i = allPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]];
  }

  const targetComments = 54;
  const commentsToInsert = allPairs.slice(0, targetComments).map((pair, i) => {
    const sample = pick(COMMENT_POOL, i);
    // ~85% approved, ~8% pending, ~7% rejected → only approved affect ratings.
    const r = Math.random();
    const status = r < 0.85 ? 'approved' : r < 0.93 ? 'pending' : 'rejected';
    const createdAt = randomDateLast12Months();
    return {
      content: sample.content,
      rating: sample.rating,
      userId: pair.userId,
      villageId: pair.villageId,
      status,
      createdAt,
      updatedAt: createdAt,
    };
  });
  // Disable auto-timestamps so the explicit createdAt values are preserved.
  await Comment.insertMany(commentsToInsert, { timestamps: false });
  console.log(`💬 ${commentsToInsert.length} comments (unique user/village pairs, spread over 12 months).`);

  // 6b. A couple of pending officer account requests for the admin queue.
  await OfficerRequest.insertMany([
    {
      requesterName: 'Paolo Verdi',
      email: 'paolo.verdi@example.com',
      municipalityName: 'Comune di Usseaux',
      region: 'Piedmont',
      province: 'Torino',
      message: 'I coordinate tourism for Usseaux and would like to keep our village page up to date.',
      status: 'pending',
    },
    {
      requesterName: 'Anna Neri',
      email: 'anna.neri@example.com',
      municipalityName: 'Comune di Bagolino',
      region: 'Lombardy',
      province: 'Brescia',
      message: 'Requesting officer access to publish events for the Bagolino Carnival.',
      status: 'pending',
    },
  ]);
  console.log('📨 2 pending officer requests.');

  // 6c. Self-declared visits and favourites for the first two tourists, so the
  // tourist dashboard has data on first login. (Never auto-detected.)
  const day = 24 * 60 * 60 * 1000;
  const sara = touristDocs[0];
  const davide = touristDocs[1];
  const visitedSeed = [
    { user: sara, vi: 0, daysAgo: 20, note: 'Left the car in Buisson and took the cable car — magical silence.' },
    { user: sara, vi: 8, daysAgo: 75, note: 'The Volo dell\'Angelo was the highlight.' },
    { user: sara, vi: 11, daysAgo: 140, note: 'The heart-shaped lake really is heart-shaped from above.' },
    { user: sara, vi: 3, daysAgo: 210, note: '' },
    { user: davide, vi: 15, daysAgo: 30, note: 'Colourful Tyrolean streets, great coffee.' },
    { user: davide, vi: 18, daysAgo: 90, note: '' },
  ];
  await VisitedVillage.insertMany(
    visitedSeed.map((v) => ({
      userId: v.user._id,
      villageId: villageDocs[v.vi]._id,
      visitedAt: new Date(Date.now() - v.daysAgo * day),
      note: v.note || undefined,
    }))
  );
  await Favorite.insertMany([
    { userId: sara._id, villageId: villageDocs[5]._id },
    { userId: sara._id, villageId: villageDocs[11]._id },
    { userId: sara._id, villageId: villageDocs[16]._id },
    { userId: davide._id, villageId: villageDocs[2]._id },
  ]);
  console.log(`🧭 ${visitedSeed.length} visited records, 4 favourites.`);

  // 7. Recompute rating aggregates for every village (approved comments only).
  // insertMany bypasses document hooks, so trigger the static explicitly.
  for (const village of villageDocs) {
    await Comment.recalculateRatings(village._id);
  }
  console.log('⭐ Village rating aggregates recomputed.');

  await disconnectDB();
  console.log('\n✅ Seed complete.');
  console.log('   Dev password for every seeded account:', password);
  console.log('   Admin login:      admin@mountainable.it');
  console.log('   Authority login:  authority@mountainable.it');
  console.log('   Officer example:  officer.aosta@mountainable.it');
  console.log('   Tourist example:  sara@example.com');
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
