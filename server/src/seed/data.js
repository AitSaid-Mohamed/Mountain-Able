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
 * 20 real Italian mountain villages. `municipality` references a municipality
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
];
