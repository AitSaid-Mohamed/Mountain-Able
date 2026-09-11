/**
 * Hand-authored seed dataset for the Mountain-Able platform.
 *
 * All villages are real Italian mountain villages ("borghi") with genuine
 * regions, provinces and approximate real latitude/longitude coordinates.
 * Municipalities model the administrative unions / comunità montane that the
 * platform's officers belong to (some group several nearby villages so the
 * officer-ownership rule can be demonstrated).
 *
 * Image URLs point to representative mountain-village photographs on Unsplash.
 */

/**
 * The last four entries form a **deliberate cluster**: real comuni of the
 * Valtournenche and Ayas valleys in the Aosta Valley, 8-25 km apart, which the
 * inter-municipal coordination feature needs in order to demonstrate anything.
 *
 * The other ten municipalities were chosen to spread twenty scenic villages
 * across Italy, which is right for a discovery platform and useless for a
 * coordination one: at any plausible radius only one of those ten pairs is a
 * neighbour of another. These four are genuine administrations with accurate
 * coordinates, and they sit across real ridges from one another - Torgnon and
 * Ayas are 13 km apart in a straight line but roughly an hour by road, because
 * the only way between them is down to the valley floor and back up. That is
 * exactly the problem the feature exists to address, so the seed had to
 * contain it.
 *
 * Recorded as a design decision in `docs/design-decisions.md`; nothing here is
 * invented, and no reviews or ratings are attributed to these comuni.
 */
/** @type {Array<{name:string, region:string, province:string, contactEmail:string, phone:string}>} */
export const municipalities = [
  {
    name: "Unione Comuni Valle d'Aosta",
    region: 'Aosta Valley',
    province: 'Aosta',
    contactEmail: 'info@unionevda.it',
    phone: '+39 0165 100100',
  },
  {
    name: 'Unione Montana Valli Occitane',
    region: 'Piedmont',
    province: 'Cuneo',
    contactEmail: 'info@vallioccitane.it',
    phone: '+39 0171 200200',
  },
  {
    name: 'Unione Montana Valli del Piemonte',
    region: 'Piedmont',
    province: 'Torino',
    contactEmail: 'info@vallipiemonte.it',
    phone: '+39 0121 300300',
  },
  {
    name: 'Comunità di Montagna della Carnia',
    region: 'Friuli-Venezia Giulia',
    province: 'Udine',
    contactEmail: 'info@montagnacarnia.it',
    phone: '+39 0433 400400',
  },
  {
    name: 'Unione Comuni Dolomiti Lucane',
    region: 'Basilicata',
    province: 'Potenza',
    contactEmail: 'info@dolomitilucane.it',
    phone: '+39 0971 500500',
  },
  {
    name: 'Comunità Montana Gran Sasso–Alto Sangro',
    region: 'Abruzzo',
    province: "L'Aquila",
    contactEmail: 'info@gransassoaltosangro.it',
    phone: '+39 0864 600600',
  },
  {
    name: 'Comunità Montana di Valle Sabbia',
    region: 'Lombardy',
    province: 'Brescia',
    contactEmail: 'info@vallesabbia.it',
    phone: '+39 0365 700700',
  },
  {
    name: 'Comprensorio Wipptal',
    region: 'Trentino-Alto Adige',
    province: 'Bolzano',
    contactEmail: 'info@wipptal.it',
    phone: '+39 0472 800800',
  },
  {
    name: 'Unione Montana Agordina e Giudicarie',
    region: 'Veneto',
    province: 'Belluno',
    contactEmail: 'info@agordinagiudicarie.it',
    phone: '+39 0437 900900',
  },
  {
    name: "Unione dei Comuni dell'Appennino",
    region: 'Emilia-Romagna',
    province: 'Rimini',
    contactEmail: 'info@appenninounione.it',
    phone: '+39 0541 110110',
  },
  {
    name: 'Comune di Valtournenche',
    region: 'Aosta Valley',
    province: 'Aosta',
    contactEmail: 'info@comune.valtournenche.ao.it',
    phone: '+39 0166 92101',
  },
  {
    name: 'Comune di Torgnon',
    region: 'Aosta Valley',
    province: 'Aosta',
    contactEmail: 'info@comune.torgnon.ao.it',
    phone: '+39 0166 540213',
  },
  {
    name: 'Comune di Antey-Saint-Andre',
    region: 'Aosta Valley',
    province: 'Aosta',
    contactEmail: 'info@comune.antey-saint-andre.ao.it',
    phone: '+39 0166 548209',
  },
  {
    name: 'Comune di Ayas',
    region: 'Aosta Valley',
    province: 'Aosta',
    contactEmail: 'info@comune.ayas.ao.it',
    phone: '+39 0125 307113',
  },
];

/** The 8 thematic categories with matching lucide-react icon names. */
export const categories = [
  { name: 'Nature', slug: 'nature', icon: 'Trees' },
  { name: 'Culture & Heritage', slug: 'culture-heritage', icon: 'Landmark' },
  { name: 'Food & Wine', slug: 'food-wine', icon: 'Wine' },
  { name: 'Hiking', slug: 'hiking', icon: 'Footprints' },
  { name: 'Winter Sports', slug: 'winter-sports', icon: 'Snowflake' },
  { name: 'Religious Sites', slug: 'religious-sites', icon: 'Church' },
  { name: 'Museums', slug: 'museums', icon: 'Building2' },
  { name: 'Local Crafts', slug: 'local-crafts', icon: 'Hammer' },
];

/**
* 24 real Italian mountain villages. `municipality` references a municipality
 * by name (resolved to an ObjectId by the seed script).
 */
export const villages = [
  {
    name: 'Chamois',
    slug: 'chamois',
    municipality: "Unione Comuni Valle d'Aosta",
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.8447, lng: 7.6206 },
    altitude: 1815,
    population: 95,
    shortDescription: "Italy's only car-free village, reachable solely by cable car.",
    description:
      "Perched at 1,815 metres above the Valtournenche, Chamois is famously the only municipality in Italy that cannot be reached by car — visitors leave their vehicles in Buisson and ascend by a small cable car. This choice has preserved a silent, pristine alpine landscape of larch woods and pastures beneath the Matterhorn's eastern peaks. In summer the plateau and Lake Lod draw hikers, while winter brings gentle family skiing and snowshoe trails.",
    stats: { hotels: 6, shops: 8 },
  },
  {
    name: 'Bard',
    slug: 'bard',
    municipality: "Unione Comuni Valle d'Aosta",
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.6089, lng: 7.7447 },
    altitude: 400,
    population: 120,
    shortDescription: 'A monumental Napoleonic-era fortress guarding the valley.',
    description:
      'The village of Bard is dominated by its imposing 19th-century Fort, rebuilt by the House of Savoy after Napoleon famously besieged the earlier stronghold in 1800. Today the fortress houses the Museo delle Alpi and hosts major exhibitions, connected to the village by panoramic lifts. The tiny medieval borgo below, with its stone houses and noble palaces, is considered one of the finest examples of Aosta Valley architecture.',
    stats: { hotels: 4, shops: 12 },
  },
  {
    name: 'Fontainemore',
    slug: 'fontainemore',
    municipality: "Unione Comuni Valle d'Aosta",
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.6247, lng: 7.8586 },
    altitude: 757,
    population: 440,
    shortDescription: 'Stone hamlets and an ancient humpback bridge in the Lys valley.',
    description:
      'Fontainemore lies in the lower Lys valley, its name echoing the springs and streams that run through it. A graceful medieval humpback bridge crosses the Lys near the parish church, and the surrounding hamlets preserve traditional Walser-influenced stone and wood architecture. Every five years the village takes part in the historic procession to the sanctuary of Oropa across the mountains.',
    stats: { hotels: 3, shops: 5 },
  },
  {
    name: 'Ostana',
    slug: 'ostana',
    municipality: 'Unione Montana Valli Occitane',
    region: 'Piedmont',
    province: 'Cuneo',
    location: { lat: 44.6906, lng: 7.1006 },
    altitude: 1282,
    population: 85,
    shortDescription: 'A revived Occitan village facing Monviso.',
    description:
      'Facing the pyramid of Monviso in the upper Po valley, Ostana had dwindled to a handful of winter residents before a celebrated revival driven by sensitive architecture and Occitan cultural projects. Its stone-and-slate houses have been carefully restored, earning recognition as one of the "Borghi più belli d\'Italia". The village is now a small hub for alpine tourism, contemporary architecture and mountain-culture festivals.',
    stats: { hotels: 2, shops: 4 },
  },
  {
    name: 'Elva',
    slug: 'elva',
    municipality: 'Unione Montana Valli Occitane',
    region: 'Piedmont',
    province: 'Cuneo',
    location: { lat: 44.5936, lng: 7.07 },
    altitude: 1637,
    population: 90,
    shortDescription: 'A remote Occitan village with Hans Clemer frescoes.',
    description:
      'Reached by the vertiginous Vallone di Elva road carved into the rock, Elva is one of the most isolated communities of the Val Maira. Its parish church guards a remarkable cycle of Renaissance frescoes by the Flemish-Piedmontese master Hans Clemer. The village also preserves the singular tradition of the "cavié", travelling hair-merchants who once collected human hair across Europe.',
    stats: { hotels: 1, shops: 2 },
  },
  {
    name: 'Usseaux',
    slug: 'usseaux',
    municipality: 'Unione Montana Valli del Piemonte',
    region: 'Piedmont',
    province: 'Torino',
    location: { lat: 45.0561, lng: 7.0247 },
    altitude: 1416,
    population: 170,
    shortDescription: 'A painted village of murals, fountains and old mills.',
    description:
      'In the Val Chisone, Usseaux is known as the "village of murals", its stone houses decorated with dozens of frescoes depicting rural life, fairy tales and local trades. Restored bread ovens, wash-houses and a working water mill preserve the everyday heritage of the alpine community. Surrounded by the forests and forts of the Assietta ridge, it is a member of the "Borghi più belli d\'Italia".',
    stats: { hotels: 2, shops: 4 },
  },
  {
    name: 'Viganella',
    slug: 'viganella',
    municipality: 'Unione Montana Valli del Piemonte',
    region: 'Piedmont',
    province: 'Verbano-Cusio-Ossola',
    location: { lat: 46.1472, lng: 8.1808 },
    altitude: 535,
    population: 180,
    shortDescription: 'The village that built a mirror to bring back the sun.',
    description:
      'Deep in the narrow Antrona valley, Viganella spends nearly three months each winter in the shadow of the surrounding peaks. In 2006 the community installed a large computer-controlled mirror on the mountainside to reflect sunlight onto the church square — an ingenious idea that made the village world-famous. The gesture symbolises the resilience and creativity of Italy\'s smallest alpine communities.',
    stats: { hotels: 1, shops: 2 },
  },
  {
    name: 'Sauris',
    slug: 'sauris',
    municipality: 'Comunità di Montagna della Carnia',
    region: 'Friuli-Venezia Giulia',
    province: 'Udine',
    location: { lat: 46.4667, lng: 12.7 },
    altitude: 1400,
    population: 400,
    shortDescription: 'A German-speaking island famed for smoked ham and beer.',
    description:
      'Founded in the 13th century by settlers from the Tyrol and Carinthia, Sauris remains a linguistic island where an archaic German dialect (Zahre) is still spoken. Split between Sauris di Sopra and Sauris di Sotto around a turquoise reservoir lake, it is renowned for its gently smoked prosciutto di Sauris IGP and its craft brewery. The scattered wooden hamlets and the "Borgo Diffuso" hospitality model make it a model of sustainable mountain tourism.',
    stats: { hotels: 5, shops: 9 },
  },
  {
    name: 'Castelmezzano',
    slug: 'castelmezzano',
    municipality: 'Unione Comuni Dolomiti Lucane',
    region: 'Basilicata',
    province: 'Potenza',
    location: { lat: 40.5286, lng: 16.045 },
    altitude: 750,
    population: 800,
    shortDescription: 'Houses clinging to the jagged Lucanian Dolomites.',
    description:
      'Castelmezzano nestles dramatically among the sandstone pinnacles of the Piccole Dolomiti Lucane, its houses seemingly carved into the rock. Steps hewn from the stone lead up to the ruins of a Norman-Swabian lookout with sweeping views over the Basento valley. Together with neighbouring Pietrapertosa it operates the "Volo dell\'Angelo", a thrilling zip-line strung between the two peaks.',
    stats: { hotels: 4, shops: 7 },
  },
  {
    name: 'Pietrapertosa',
    slug: 'pietrapertosa',
    municipality: 'Unione Comuni Dolomiti Lucane',
    region: 'Basilicata',
    province: 'Potenza',
    location: { lat: 40.5108, lng: 16.0642 },
    altitude: 1088,
    population: 1000,
    shortDescription: 'The highest village in Basilicata, crowned by a Saracen castle.',
    description:
      'The highest municipality in Basilicata, Pietrapertosa hides among towering rock spires, with the "Arabata" quarter and a Saracen fortress carved directly into the summit stone. Its labyrinth of narrow lanes and rock-cut dwellings recalls centuries of Byzantine and Arab presence. The village anchors the other end of the "Volo dell\'Angelo" zip-line and the Path of the Seven Stones linking it to Castelmezzano.',
    stats: { hotels: 3, shops: 6 },
  },
  {
    name: 'Santo Stefano di Sessanio',
    slug: 'santo-stefano-di-sessanio',
    municipality: 'Comunità Montana Gran Sasso–Alto Sangro',
    region: 'Abruzzo',
    province: "L'Aquila",
    location: { lat: 42.3436, lng: 13.6431 },
    altitude: 1250,
    population: 110,
    shortDescription: 'A Medici hilltop hamlet reborn as a scattered hotel.',
    description:
      'Set on the Campo Imperatore plateau within the Gran Sasso National Park, Santo Stefano di Sessanio is a honey-coloured medieval hamlet once controlled by the Medici, who traded its prized black lentils and wool. After decades of depopulation it was revived through the pioneering "albergo diffuso" model, restoring stone houses into a diffuse hotel while preserving their austere beauty. The famous Medici tower, toppled by the 2009 earthquake, has since been rebuilt.',
    stats: { hotels: 5, shops: 6 },
  },
  {
    name: 'Scanno',
    slug: 'scanno',
    municipality: 'Comunità Montana Gran Sasso–Alto Sangro',
    region: 'Abruzzo',
    province: "L'Aquila",
    location: { lat: 41.9036, lng: 13.8797 },
    altitude: 1015,
    population: 1700,
    shortDescription: 'A photogenic borgo above a heart-shaped lake.',
    description:
      'Overlooking its celebrated heart-shaped lake in the Sagittario gorge, Scanno is one of Abruzzo\'s most beloved villages, immortalised by photographers such as Henri Cartier-Bresson and Mario Giacomelli. Its steep alleys, baroque churches and stone portals preserve a strong sense of tradition, including the distinctive costume still worn by some older women. Local goldsmiths continue to craft the "presentosa" star-shaped filigree pendant.',
    stats: { hotels: 8, shops: 14 },
  },
  {
    name: 'Barrea',
    slug: 'barrea',
    municipality: 'Comunità Montana Gran Sasso–Alto Sangro',
    region: 'Abruzzo',
    province: "L'Aquila",
    location: { lat: 41.7561, lng: 13.9922 },
    altitude: 1060,
    population: 720,
    shortDescription: 'A lakeside village in the Abruzzo National Park.',
    description:
      'Barrea sits on a rocky spur above its namesake artificial lake, within the Abruzzo, Lazio and Molise National Park. Its compact medieval core is guarded by a castle and encircled by ancient walls, offering wide views over the water and the surrounding beech forests. The area is a haven for wildlife including the Marsican brown bear, Apennine wolf and chamois.',
    stats: { hotels: 4, shops: 5 },
  },
  {
    name: 'Roccaraso',
    slug: 'roccaraso',
    municipality: 'Comunità Montana Gran Sasso–Alto Sangro',
    region: 'Abruzzo',
    province: "L'Aquila",
    location: { lat: 41.8461, lng: 14.0803 },
    altitude: 1236,
    population: 1600,
    shortDescription: "Central-southern Italy's premier ski resort.",
    description:
      'Roccaraso is the best-known winter-sports destination of the central-southern Apennines, its Alto Sangro ski area offering the largest network of slopes south of the Alps. Almost entirely rebuilt after wartime destruction, the modern town bustles with visitors in both winter and summer, when the high meadows fill with hikers. Its altitude and reliable snowfall have long made it a favourite of Roman and Neapolitan skiers.',
    stats: { hotels: 12, shops: 20 },
  },
  {
    name: 'Bagolino',
    slug: 'bagolino',
    municipality: 'Comunità Montana di Valle Sabbia',
    region: 'Lombardy',
    province: 'Brescia',
    location: { lat: 45.8231, lng: 10.4661 },
    altitude: 800,
    population: 3800,
    shortDescription: 'A medieval borgo famed for its Carnival and Bagòss cheese.',
    description:
      'In the upper Valle Sabbia near the border with Trentino, Bagolino preserves a remarkably intact medieval townscape of tall stone houses, arcaded lanes and frescoed churches. It is celebrated for its historic Carnival, when masked dancers and violinists parade to centuries-old melodies. The village also gives its name to Bagòss, a prized aged cow\'s-milk cheese flavoured with saffron.',
    stats: { hotels: 3, shops: 10 },
  },
  {
    name: 'Vipiteno',
    slug: 'vipiteno-sterzing',
    municipality: 'Comprensorio Wipptal',
    region: 'Trentino-Alto Adige',
    province: 'Bolzano',
    location: { lat: 46.8969, lng: 11.43 },
    altitude: 948,
    population: 7000,
    shortDescription: 'A colourful Tyrolean town below the Brenner Pass.',
    description:
      'Vipiteno (Sterzing), the northernmost town in Italy, grew wealthy from Alpine mining and its position on the road to the Brenner Pass. Its pastel-coloured main street, lined with arcades and crowned by the medieval Torre delle Dodici, is one of the most picturesque in South Tyrol. Surrounded by the Alps, it blends Tyrolean tradition with excellent food and access to the Racines and Monte Cavallo ski areas.',
    stats: { hotels: 15, shops: 30 },
  },
  {
    name: "Canale d'Agordo",
    slug: 'canale-dagordo',
    municipality: 'Unione Montana Agordina e Giudicarie',
    region: 'Veneto',
    province: 'Belluno',
    location: { lat: 46.3608, lng: 11.9111 },
    altitude: 976,
    population: 1100,
    shortDescription: 'A Dolomite village and birthplace of Pope John Paul I.',
    description:
      'Set in the Biois valley beneath the Dolomites, Canale d\'Agordo is best known as the birthplace of Albino Luciani, Pope John Paul I. Its handsome parish church and the surrounding stone-and-wood houses reflect the sober elegance of the Agordino. The village is a quiet gateway to the peaks of the Pale di San Martino and the Marmolada, and hosts a museum dedicated to the "smiling Pope".',
    stats: { hotels: 3, shops: 6 },
  },
  {
    name: 'Rango',
    slug: 'rango',
    municipality: 'Unione Montana Agordina e Giudicarie',
    region: 'Trentino-Alto Adige',
    province: 'Trento',
    location: { lat: 46.0139, lng: 10.8256 },
    altitude: 800,
    population: 250,
    shortDescription: 'A Trentino hamlet of arcades famed for its Christmas market.',
    description:
      'Rango, a hamlet of Bleggio Superiore in the Giudicarie, is a rare surviving example of a medieval rural settlement, with covered passageways ("androni"), interconnected courtyards and stone barns clustered against the winter cold. Recognised among the "Borghi più belli d\'Italia", it becomes especially magical during its acclaimed Christmas market, when the vaulted lanes fill with lights and artisan stalls.',
    stats: { hotels: 2, shops: 5 },
  },
  {
    name: 'San Leo',
    slug: 'san-leo',
    municipality: "Unione dei Comuni dell'Appennino",
    region: 'Emilia-Romagna',
    province: 'Rimini',
    location: { lat: 43.8975, lng: 12.3419 },
    altitude: 583,
    population: 2900,
    shortDescription: 'A clifftop fortress town in the Montefeltro.',
    description:
      'San Leo rises spectacularly on an isolated rocky outcrop in the Montefeltro, crowned by a Renaissance fortress that once imprisoned the alchemist Cagliostro. The historic centre preserves a pre-Romanesque parish church ("Pieve") and a fine Romanesque cathedral, both among the oldest religious buildings in the region. Dante and Saint Francis both passed through this stronghold, whose dramatic silhouette has inspired writers for centuries.',
    stats: { hotels: 4, shops: 9 },
  },
  {
    name: 'Cerreto Alpi',
    slug: 'cerreto-alpi',
    municipality: "Unione dei Comuni dell'Appennino",
    region: 'Emilia-Romagna',
    province: 'Reggio Emilia',
    location: { lat: 44.313, lng: 10.278 },
    altitude: 910,
    population: 190,
    shortDescription: 'A stone village of the Tuscan-Emilian Apennines.',
    description:
      'Cerreto Alpi is a compact stone village in the high Reggio Emilia Apennines, within the Tuscan-Emilian Apennine National Park and its UNESCO Biosphere Reserve. Traditionally a community of woodcutters and charcoal-burners, it retains dry-stone houses and a strong tie to its beech and chestnut forests. It serves as a base for hiking towards the Cerreto Pass, the Lagoni lakes and the ridge trails of the Apennine watershed.',
    stats: { hotels: 2, shops: 3 },
  },
  {
    name: 'Valtournenche',
    slug: 'valtournenche',
    municipality: 'Comune di Valtournenche',
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.8747, lng: 7.6236 },
    altitude: 1524,
    population: 2100,
    shortDescription: 'The historic guides’ village beneath the Matterhorn.',
    description:
      'Valtournenche gave the Alps some of its earliest professional mountain guides, and the profession still shapes the village: the guides’ society founded here in 1865 remains active, and the Matterhorn stands at the head of the valley above it. The village is the administrative centre of the valley that also holds Breuil-Cervinia, and serves as the working settlement behind the better-known resort — shops, workshops and the guides’ office rather than hotels alone.',
    stats: { hotels: 24, shops: 30 },
  },
  {
    name: 'Torgnon',
    slug: 'torgnon',
    municipality: 'Comune di Torgnon',
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.8442, lng: 7.5625 },
    altitude: 1489,
    population: 540,
    shortDescription: 'A sunny terrace of hamlets above the Valtournenche.',
    description:
      'Torgnon sits on a broad south-facing shelf above the Valtournenche, scattered across a dozen small hamlets rather than gathered into one centre. It is known for cross-country skiing on the Chaleby plateau and for the Petit Monde hamlet, whose rural buildings and chapel have been carefully restored. Though barely thirteen kilometres from Ayas as the crow flies, the ridge between them means the journey by road runs down to the valley floor and back up.',
    stats: { hotels: 8, shops: 6 },
  },
  {
    name: 'Antey-Saint-André',
    slug: 'antey-saint-andre',
    municipality: 'Comune di Antey-Saint-Andre',
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.8073, lng: 7.5906 },
    altitude: 1080,
    population: 620,
    shortDescription: 'The valley crossroads where the Valtournenche opens out.',
    description:
      'Antey-Saint-André lies where the Valtournenche widens into a green basin, and functions as the junction of the valley: the roads to Torgnon, to La Magdeleine and up towards Cervinia all meet here. Its lower altitude and mild position make it a year-round settlement rather than a seasonal one, with meadows, larch woods and the Marmore torrent running through the centre.',
    stats: { hotels: 11, shops: 12 },
  },
  {
    name: 'Champoluc',
    slug: 'champoluc',
    municipality: 'Comune di Ayas',
    region: 'Aosta Valley',
    province: 'Aosta',
    location: { lat: 45.8319, lng: 7.7278 },
    altitude: 1568,
    population: 1350,
    shortDescription: 'The main village of the Val d’Ayas, under Monte Rosa.',
    description:
      'Champoluc is the principal village of Ayas, at the head of a valley that runs north towards the Monte Rosa massif. The Walser communities who settled these upper valleys in the Middle Ages left their mark in the timber-and-stone houses of the surrounding hamlets. It is a walking and ski-touring base, connected over the ridges to Gressoney and Alagna by lift rather than by road.',
    stats: { hotels: 30, shops: 22 },
  },
];

/**
 * Service taxonomy for inter-municipal coordination.
 *
 * A fixed vocabulary rather than free text: the regional-authority analytics
 * aggregate declarations and requests across the whole territory, and free text
 * does not aggregate. Each entry is a service one mountain comune could
 * plausibly provide *to another comune* — not a product sold to a tourist.
 */
export const serviceTypes = [
  // --- Mobility -------------------------------------------------------------
  { slug: 'shuttle-transport', name: 'Shuttle & group transport', group: 'mobility', sortOrder: 1, icon: 'Bus',
    description: 'Minibus or coach capacity for moving visitor groups between villages.' },
  { slug: 'accessible-transport', name: 'Accessible transport', group: 'mobility', sortOrder: 2, icon: 'Accessibility',
    description: 'Vehicles equipped for visitors with reduced mobility.' },
  { slug: 'ev-charging', name: 'EV charging', group: 'mobility', sortOrder: 3, icon: 'Zap',
    description: 'Public charging points available to visiting vehicles.' },
  { slug: 'road-clearing', name: 'Snow clearing & road access', group: 'mobility', sortOrder: 4, icon: 'Snowflake',
    description: 'Winter clearing capacity and seasonal road-status information.' },

  // --- Expertise ------------------------------------------------------------
  { slug: 'mountain-guide', name: 'Licensed mountain guide', group: 'expertise', sortOrder: 1, icon: 'Mountain',
    description: 'Qualified guides for hiking, alpine routes or ski touring.' },
  { slug: 'cultural-guide', name: 'Cultural & heritage guide', group: 'expertise', sortOrder: 2, icon: 'Landmark',
    description: 'Guided visits to churches, museums and historic sites.' },
  { slug: 'interpreter', name: 'Language support', group: 'expertise', sortOrder: 3, icon: 'Languages',
    description: 'Staff or volunteers able to assist visitors in other languages.' },

  // --- Facilities -----------------------------------------------------------
  { slug: 'group-accommodation', name: 'Group accommodation', group: 'facilities', sortOrder: 1, icon: 'BedDouble',
    description: 'Hostel, refuge or municipal lodging with capacity for a group.' },
  { slug: 'meeting-space', name: 'Meeting & event space', group: 'facilities', sortOrder: 2, icon: 'Presentation',
    description: 'Halls or rooms for events, briefings and gatherings.' },
  { slug: 'equipment-rental', name: 'Equipment rental', group: 'facilities', sortOrder: 3, icon: 'Backpack',
    description: 'Snowshoes, skis, bicycles or via ferrata equipment.' },
  { slug: 'parking-area', name: 'Coach parking & staging', group: 'facilities', sortOrder: 4, icon: 'SquareParking',
    description: 'Space for coaches and for staging group arrivals.' },

  // --- Supply ---------------------------------------------------------------
  { slug: 'local-produce', name: 'Local produce', group: 'supply', sortOrder: 1, icon: 'Wheat',
    description: 'Cheese, cured meats, honey and other produce in quantity.' },
  { slug: 'artisan-crafts', name: 'Artisan crafts', group: 'supply', sortOrder: 2, icon: 'Hammer',
    description: 'Workshops and makers able to host or supply visitors.' },

  // --- Emergency & care -----------------------------------------------------
  { slug: 'first-aid', name: 'First aid & medical presence', group: 'emergency', sortOrder: 1, icon: 'HeartPulse',
    description: 'Staffed first-aid post, nurse or doctor available during an event.' },
  // Deliberately a *liaison contact*, not a dispatch channel: real-time emergency
  // services are outside this project's scope and the description must not imply
  // the platform plays any part in an actual rescue.
  { slug: 'mountain-rescue', name: 'Mountain rescue liaison', group: 'emergency', sortOrder: 2, icon: 'LifeBuoy',
    description: 'Named contact point for the local rescue organisation. Not an emergency channel.' },
];

/**
 * Declared capabilities per municipality, by service slug.
 *
 * Plausible rather than exhaustive. The Valtournenche cluster is well populated
 * so the feature demonstrates properly, while the scattered municipalities have
 * only a few each — which is what gives the regional authority's coverage matrix
 * genuine gaps to show rather than a uniformly full grid.
 */
export const capabilitySeed = [
  { municipality: 'Comune di Valtournenche', services: [
    { slug: 'mountain-guide', description: 'Societa delle Guide del Cervino — alpine and ski-touring guides, year round.', contactName: 'Ufficio Guide' },
    { slug: 'shuttle-transport', description: 'Two 19-seat minibuses, available outside school-transport hours.', contactName: 'Ufficio Tecnico' },
    { slug: 'first-aid', description: 'Seasonal first-aid post staffed through the winter and summer seasons.' },
    { slug: 'equipment-rental', description: 'Snowshoe and via ferrata kit through the guides office.' },
    { slug: 'mountain-rescue', description: 'Liaison with the Soccorso Alpino Valdostano station.' },
  ] },
  { municipality: 'Comune di Torgnon', services: [
    { slug: 'group-accommodation', description: 'Municipal hostel at Chaleby, 38 beds, open December to April and June to September.' },
    { slug: 'equipment-rental', description: 'Cross-country ski and snowshoe hire at the Chaleby centre.' },
    { slug: 'meeting-space', description: 'Sala polivalente, seats 90, projector and kitchen.' },
    { slug: 'local-produce', description: 'Fontina and Toma producers in the hamlets; introductions arranged.' },
  ] },
  { municipality: 'Comune di Antey-Saint-Andre', services: [
    { slug: 'parking-area', description: 'Coach parking for six vehicles at the valley junction, with turning space.' },
    { slug: 'ev-charging', description: 'Four public charging points beside the municipal car park.' },
    { slug: 'interpreter', description: 'French and English speakers among municipal staff; German on request.' },
    { slug: 'accessible-transport', description: 'One wheelchair-accessible vehicle, shared with the social services.' },
  ] },
  { municipality: 'Comune di Ayas', services: [
    { slug: 'mountain-guide', description: 'Monte Rosa guides, including Walser cultural walks.' },
    { slug: 'cultural-guide', description: 'Walser heritage itineraries in the upper hamlets.' },
    { slug: 'group-accommodation', description: 'Two refuges reachable on foot, plus a municipal dormitory in Champoluc.' },
    { slug: 'artisan-crafts', description: 'Woodcarving workshops open to visiting groups.' },
    { slug: 'road-clearing', description: 'Municipal clearing fleet; can assist neighbouring roads by agreement.' },
  ] },
  { municipality: "Unione Comuni Valle d'Aosta", services: [
    { slug: 'shuttle-transport', description: 'Cable-car shuttle coordination for Chamois arrivals.' },
    { slug: 'cultural-guide', description: 'Guided visits to the valley chapels and rural museums.' },
    { slug: 'local-produce', description: 'Alpine cheese producers across the member comuni.' },
  ] },
  { municipality: 'Unione Montana Valli del Piemonte', services: [
    { slug: 'group-accommodation', description: 'Former school converted to a 24-bed group lodge.' },
    { slug: 'meeting-space', description: 'Council chamber available to neighbouring comuni for joint sessions.' },
  ] },
  { municipality: 'Unione Montana Valli Occitane', services: [
    { slug: 'cultural-guide', description: 'Occitan-language cultural itineraries.' },
    { slug: 'artisan-crafts', description: 'Stone and wood workshops in the Maira valley.' },
    { slug: 'local-produce', description: 'Mountain honey and Castelmagno producers.' },
  ] },
  { municipality: 'Comunità Montana Gran Sasso–Alto Sangro', services: [
    { slug: 'mountain-guide', description: 'Guides for the Gran Sasso and Maiella massifs.' },
    { slug: 'equipment-rental', description: 'Snowshoes and crampons at the Scanno visitor point.' },
  ] },
  { municipality: 'Comunità di Montagna della Carnia', services: [
    { slug: 'meeting-space', description: 'Conference room in the comunità headquarters, seats 120.' },
    { slug: 'interpreter', description: 'Friulian, German and Slovene speakers available.' },
  ] },
  { municipality: 'Unione Montana Agordina e Giudicarie', services: [
    { slug: 'group-accommodation', description: 'Dolomite refuges with group booking through the union office.' },
    { slug: 'road-clearing', description: 'Winter clearing across the member comuni.' },
  ] },
];

/**
 * Coordination requests, spread across every lifecycle state so each screen and
 * each authority statistic has something real to show.
 *
 * `daysAgo` positions the request in the past; `respondents` are the neighbours
 * who answered and how. The unmet and expired entries matter most: they are what
 * the regional authority's evidence of missing capability is actually built from.
 */
export const requestSeed = [
  {
    from: 'Comune di Torgnon', service: 'shuttle-transport', daysAgo: 21,
    title: 'Transport for 40 walkers from the valley floor',
    details: 'A walking group of about forty arrives by coach at Antey and needs moving up to Chaleby in two shifts on the Saturday morning. We have no vehicle of our own that size.',
    peopleCount: 40, radiusKm: 60, status: 'fulfilled', fulfilledBy: 'Comune di Valtournenche',
    closedNote: 'Valtournenche sent both minibuses. Arranged directly with their technical office.',
    respondents: [
      { municipality: 'Comune di Valtournenche', type: 'offer', message: 'Both 19-seat minibuses are free that morning. Call the Ufficio Tecnico to fix the times.' },
      { municipality: "Unione Comuni Valle d'Aosta", type: 'decline', message: 'Our shuttle is committed to the cable-car service that weekend.' },
    ],
  },
  {
    from: 'Comune di Ayas', service: 'first-aid', daysAgo: 14,
    title: 'First-aid presence for the Walser festival',
    details: 'Two days of events in the upper hamlets, several hundred visitors expected. We need a staffed first-aid point; ours is only available in the ski season.',
    peopleCount: 300, radiusKm: 60, status: 'open',
    respondents: [
      { municipality: 'Comune di Valtournenche', type: 'partial', message: 'We can cover the Saturday with one qualified volunteer, but not the Sunday.' },
    ],
  },
  {
    from: 'Comune di Valtournenche', service: 'group-accommodation', daysAgo: 30,
    title: 'Beds for 30 during the guides centenary',
    details: 'Our accommodation is full for the centenary weekend and we are short about thirty beds for visiting guide delegations.',
    peopleCount: 30, radiusKm: 60, status: 'fulfilled', fulfilledBy: 'Comune di Torgnon',
    closedNote: 'Torgnon hostel took the delegation. Ayas offered the dormitory as a fallback.',
    respondents: [
      { municipality: 'Comune di Torgnon', type: 'offer', message: 'The Chaleby hostel has 38 beds and is free that weekend.' },
      { municipality: 'Comune di Ayas', type: 'offer', message: 'The Champoluc dormitory could take up to 20 if you need a second site.' },
    ],
  },
  {
    from: 'Comune di Antey-Saint-Andre', service: 'accessible-transport', daysAgo: 45,
    title: 'Accessible vehicle for a visiting group',
    details: 'A group including three wheelchair users is visiting for four days. Our own accessible vehicle is committed to social services that week.',
    peopleCount: 12, radiusKm: 60, status: 'unmet',
    closedNote: 'No neighbouring comune has a second accessible vehicle. Hired privately from Aosta at considerable cost.',
    respondents: [
      { municipality: 'Comune di Valtournenche', type: 'decline', message: 'We do not have an accessible vehicle.' },
      { municipality: 'Comune di Torgnon', type: 'decline', message: 'Nothing suitable here either, sorry.' },
    ],
  },
  {
    from: 'Comune di Torgnon', service: 'interpreter', daysAgo: 60,
    title: 'German-speaking guide for a visiting delegation',
    details: 'A delegation from Tyrol is visiting the Petit Monde restoration and we have nobody able to present it in German.',
    peopleCount: 15, radiusKm: 60, status: 'expired',
    respondents: [],
  },
  {
    from: 'Comune di Ayas', service: 'equipment-rental', daysAgo: 10,
    title: 'Snowshoes for a school group of 25',
    details: 'A school group arrives in February and our hire stock only covers about fifteen. Looking to borrow or hire ten more pairs for the week.',
    peopleCount: 25, radiusKm: 60, status: 'open',
    respondents: [
      { municipality: 'Comune di Torgnon', type: 'offer', message: 'We can lend ten pairs from the Chaleby centre that week. Collection from the desk.' },
      { municipality: 'Comune di Valtournenche', type: 'partial', message: 'We could add four pairs of the smaller sizes if you need them.' },
    ],
  },
  {
    from: 'Comune di Valtournenche', service: 'meeting-space', daysAgo: 5,
    title: 'Hall for a joint valley tourism meeting',
    details: 'Hosting the inter-comunale tourism meeting in March; we need a room for about eighty with a projector.',
    peopleCount: 80, radiusKm: 60, status: 'open',
    respondents: [],
  },
  {
    from: 'Comune di Antey-Saint-Andre', service: 'road-clearing', daysAgo: 70,
    title: 'Assistance clearing the Torgnon road after heavy snow',
    details: 'Our clearing vehicle is out of service and the road up to Torgnon needs a pass before the weekend.',
    radiusKm: 60, status: 'fulfilled', fulfilledBy: 'Comune di Ayas',
    closedNote: 'Ayas sent a vehicle the same afternoon.',
    respondents: [
      { municipality: 'Comune di Ayas', type: 'offer', message: 'We can send a vehicle over on Friday afternoon.' },
    ],
  },
  {
    from: 'Comune di Torgnon', service: 'accessible-transport', daysAgo: 90,
    title: 'Accessible transport for two visitors',
    details: 'Two visitors with reduced mobility staying a week and needing transfers to the valley floor.',
    peopleCount: 2, radiusKm: 60, status: 'unmet',
    closedNote: 'Again nothing available in the valley. This is the second time this year.',
    respondents: [
      { municipality: 'Comune di Antey-Saint-Andre', type: 'decline', message: 'Our vehicle is committed to social services on those dates.' },
    ],
  },
  {
    from: 'Comune di Ayas', service: 'cultural-guide', daysAgo: 3,
    title: 'Cultural guide for a heritage weekend',
    details: 'Looking for a guide able to cover both the Walser hamlets and the chapels lower in the valley over one weekend.',
    peopleCount: 25, radiusKm: 60, status: 'cancelled',
    closedNote: 'The visiting group cancelled their trip, so the need went away.',
    respondents: [],
  },
];
