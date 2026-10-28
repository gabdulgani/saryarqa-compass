/* Saryarqa Routes trip database (prototype). The Trip Builder may only use what is in here. */
(function () {
  const L = (en, de) => ({ en, de });

  /* Stops: lon/lat for the route maps */
  const STOPS = {
    almaty:   { ll: [76.8897, 43.2389], name: L('Almaty', 'Almaty'), alt: 850 },
    ala:      { ll: [77.0405, 43.3521], name: L('Almaty airport', 'Flughafen Almaty'), alt: 680 },
    charyn:   { ll: [79.0786, 43.3523], name: L('Charyn Canyon', 'Charyn-Canyon'), alt: 1250, photo: true },
    saty:     { ll: [78.405, 43.055], name: L('Saty', 'Saty'), alt: 1650 },
    kolsai1:  { ll: [78.3236, 42.9947], name: L('Kolsai Lake 1', 'Kolsai-See 1'), alt: 1818, photo: true },
    kolsai2:  { ll: [78.3361, 42.9397], name: L('Kolsai Lake 2', 'Kolsai-See 2'), alt: 2252 },
    kaindy:   { ll: [78.4653, 42.9853], name: L('Kaindy Lake', 'Kaindy-See'), alt: 2000, photo: true },
    bal:      { ll: [76.985, 43.0507], name: L('Big Almaty Lake', 'Großer Almaty-See'), alt: 2511, photo: true },
    nqz:      { ll: [71.4669, 51.0222], name: L('Astana airport', 'Flughafen Astana'), alt: 350 },
    astana:   { ll: [71.4491, 51.1694], name: L('Astana', 'Astana'), alt: 350 },
    burabay:  { ll: [70.313, 53.083], name: L('Burabay', 'Burabay'), alt: 320, photo: true },
    okzhetpes:{ ll: [70.2647, 53.0717], name: L('Okzhetpes rock', 'Felsen Okschetpes'), alt: 440 },
    kokshe:   { ll: [70.2133, 53.0617], name: L('Mount Kokshe', 'Berg Kokshe'), alt: 947 },
    hsa:      { ll: [68.5497, 43.3134], name: L('Turkistan airport', 'Flughafen Turkistan'), alt: 200 },
    turkestan:{ ll: [68.2518, 43.2973], name: L('Turkistan', 'Turkistan'), alt: 210, photo: true },
    sauran:   { ll: [67.9285, 43.3647], name: L('Sauran', 'Sauran'), alt: 200 },
    otrar:    { ll: [68.30, 42.853], name: L('Otrar', 'Otrar'), alt: 190 },
    karatau:  { ll: [68.55, 43.55], name: L('Karatau foothills', 'Karatau-Vorberge'), alt: 600 }
  };

  /* Look-around scenes. haov/vaov follow the photo's pixel ratio. */
  const SCENES = {
    'charyn-castles': { img: 'img/charyn-2.jpg', haov: 110, vaov: 70.5, title: L('Valley of Castles', 'Tal der Burgen'), sub: L('Charyn Canyon · 1,250 m', 'Charyn-Canyon · 1.250 m'),
      hs: [
        { p: -16, y: -6, t: 'info', h: L('Trail to the Charyn River', 'Weg zum Charyn-Fluss'), x: L('3 km down the canyon floor, 150 m below the rim.', '3 km über den Canyonboden, 150 m unter dem Rand.') },
        { p: 6, y: 30, t: 'photo', h: L('Photo point', 'Fotopunkt'), x: L('The “castle” walls glow red in the last hour before sunset.', 'Die „Burgmauern“ leuchten in der letzten Stunde vor Sonnenuntergang rot.') },
        { p: -4, y: -40, t: 'info', h: L('Eco-park gate', 'Eingang Öko-Park'), x: L('Entry fee is included in your trip price.', 'Der Eintritt ist im Reisepreis enthalten.') }
      ] },
    'charyn-rim': { img: 'img/charyn.jpg', haov: 115, vaov: 64.5, title: L('Canyon rim', 'Canyonrand'), sub: L('Charyn Canyon · 1,250 m', 'Charyn-Canyon · 1.250 m'),
      hs: [
        { p: -6, y: 0, t: 'photo', h: L('Rim viewpoint', 'Aussichtspunkt am Rand'), x: L('Ten minutes from the car park, no climbing needed.', 'Zehn Minuten vom Parkplatz, ohne Steigung.') },
        { p: -12, y: 35, t: 'info', h: L('12 million years of rock', '12 Millionen Jahre Gestein'), x: L('Your guide explains the layers on the walk down.', 'Dein Guide erklärt die Schichten beim Abstieg.') }
      ] },
    'kolsai': { img: 'img/kolsai.jpg', haov: 100, vaov: 75, title: L('Kolsai Lake 1', 'Kolsai-See 1'), sub: L('Kolsai Lakes · 1,818 m', 'Kolsai-Seen · 1.818 m'),
      hs: [
        { p: -18, y: -18, t: 'info', h: L('Lakeshore path', 'Uferweg'), x: L('5 km, almost flat. The gentle option for this day.', '5 km, fast eben. Die sanfte Variante für diesen Tag.') },
        { p: 2, y: 8, t: 'info', h: L('Trail to Lake 2', 'Weg zum See 2'), x: L('Starts at the far end: 8 km and 434 m up through spruce forest.', 'Beginnt am Ende des Sees: 8 km und 434 Höhenmeter durch Fichtenwald.') },
        { p: -8, y: 30, t: 'photo', h: L('Photo point', 'Fotopunkt'), x: L('Morning mist on the water, best before 8 am.', 'Morgennebel über dem Wasser, am schönsten vor 8 Uhr.') }
      ] },
    'kaindy': { img: 'img/kaindy.jpg', haov: 100, vaov: 75, title: L('Kaindy Lake', 'Kaindy-See'), sub: L('Sunken forest · 2,000 m', 'Versunkener Wald · 2.000 m'),
      hs: [
        { p: -14, y: 0, t: 'info', h: L('Sunken spruce trunks', 'Versunkene Fichten'), x: L('The lake formed after the 1911 Kebin earthquake dammed the valley.', 'Der See entstand, nachdem das Kebin-Erdbeben 1911 das Tal aufstaute.') },
        { p: 4, y: -34, t: 'info', h: L('4×4 track', '4×4-Piste'), x: L('Included. The last 1.5 km you walk.', 'Inklusive. Die letzten 1,5 km gehst du zu Fuß.') },
        { p: -4, y: 32, t: 'photo', h: L('Photo point', 'Fotopunkt'), x: L('Still water in the morning mirrors the trunks.', 'Morgens spiegelt das ruhige Wasser die Stämme.') }
      ] },
    'saty-valley': { img: 'img/kolsai-2.jpg', haov: 100, vaov: 74, title: L('Kolsai valley', 'Kolsai-Tal'), sub: L('Near Saty · 1,700 m', 'Bei Saty · 1.700 m'),
      hs: [
        { p: -10, y: 8, t: 'info', h: L('Road to Saty', 'Straße nach Saty'), x: L('Our guesthouse is 15 minutes from here.', 'Unser Gästehaus liegt 15 Minuten von hier.') },
        { p: 8, y: -20, t: 'photo', h: L('Cloud line', 'Wolkengrenze'), x: L('Weather changes fast here; pack a warm layer.', 'Das Wetter wechselt schnell; nimm eine warme Schicht mit.') }
      ] },
    'big-almaty': { img: 'img/big-almaty-lake.jpg', haov: 100, vaov: 75, title: L('Big Almaty Lake', 'Großer Almaty-See'), sub: L('Ile-Alatau · 2,511 m', 'Ile-Alatau · 2.511 m'),
      hs: [
        { p: -12, y: -4, t: 'info', h: L('Big Almaty Lake', 'Großer Almaty-See'), x: L('2,511 m. Swimming isn’t allowed; it supplies the city with water.', '2.511 m. Baden ist verboten; der See versorgt die Stadt mit Wasser.') },
        { p: 14, y: 12, t: 'photo', h: L('Snow peaks', 'Schneegipfel'), x: L('The ridge above rises well over 3,500 m.', 'Der Grat darüber ist weit über 3.500 m hoch.') }
      ] },
    'burabay': { img: 'img/burabay-wide.jpg', haov: 105, vaov: 70.5, title: L('Lake Borovoe', 'Borowoje-See'), sub: L('Burabay National Park · 320 m', 'Nationalpark Burabay · 320 m'),
      hs: [
        { p: -10, y: 16, t: 'info', h: L('Granite shore', 'Granitufer'), x: L('Pine forest and granite rise straight out of the steppe here.', 'Hier steigen Kiefernwald und Granit direkt aus der Steppe.') },
        { p: 0, y: -30, t: 'photo', h: L('Photo point', 'Fotopunkt'), x: L('Calm water before 9 am. Kayaks for rent nearby (€15).', 'Ruhiges Wasser vor 9 Uhr. Kajaks in der Nähe (15 €).') }
      ] },
    'astana': { img: 'img/baiterek.jpg', haov: 60, vaov: 90, title: L('Baiterek tower', 'Baiterek-Turm'), sub: L('Astana · pickup point', 'Astana · Treffpunkt'),
      hs: [
        { p: 18, y: 0, t: 'info', h: L('Baiterek, 97 m', 'Baiterek, 97 m'), x: L('Our Astana meeting point if you arrive a day early.', 'Unser Treffpunkt in Astana, wenn du früher anreist.') }
      ] },
    'turkestan': { img: 'img/turkistan.jpg', haov: 100, vaov: 72, title: L('Mausoleum of Khoja Ahmed Yasawi', 'Mausoleum des Hodscha Ahmad Yasawi'), sub: L('Turkistan · UNESCO World Heritage', 'Turkistan · UNESCO-Welterbe'),
      hs: [
        { p: 10, y: 0, t: 'info', h: L('Started in 1389', 'Baubeginn 1389'), x: L('Built on Timur’s order and never finished. UNESCO World Heritage since 2003.', 'Auf Befehl Timurs errichtet und nie vollendet. UNESCO-Welterbe seit 2003.') },
        { p: -14, y: 26, t: 'info', h: L('Dress code', 'Kleiderordnung'), x: L('Shoulders and knees covered inside; scarves are provided.', 'Schultern und Knie bedeckt; Tücher liegen bereit.') }
      ] }
  };

  /* Inclusion vocabulary */
  const INC = {
    pickup: L('Airport pickup', 'Abholung am Flughafen'),
    dropoff: L('Airport drop-off', 'Transfer zum Flughafen'),
    transport: L('Private transport', 'Privater Transport'),
    x4: L('4×4 to Kaindy', '4×4 nach Kaindy'),
    guide: L('Licensed guide', 'Lizenzierter Guide'),
    parkfee: L('National park fees', 'Nationalpark-Gebühren'),
    tickets: L('Entrance tickets', 'Eintrittskarten'),
    b: L('Breakfast', 'Frühstück'),
    l: L('Picnic lunch', 'Picknick-Mittag'),
    d: L('Dinner', 'Abendessen'),
    guesthouse: L('Guesthouse, twin room', 'Gästehaus, Doppelzimmer'),
    hotel: L('Hotel, twin room', 'Hotel, Doppelzimmer'),
    water: L('Water & snacks', 'Wasser & Snacks')
  };
  const EXTRA = {
    horse2: { n: L('Horse ride to Lake 2', 'Reiten zum See 2'), p: 25 },
    horseK: { n: L('Horse ride at Kaindy', 'Reiten am Kaindy'), p: 20 },
    banya: { n: L('Kazakh banya (sauna)', 'Kasachische Banja'), p: 12 },
    kayak: { n: L('Kayak on Lake Borovoe', 'Kajak auf dem Borowoje-See'), p: 15 },
    flight: { n: L('Flight Astana → Almaty', 'Flug Astana → Almaty'), p: [60, 90] },
    citydinner: { n: L('Dinner in the city', 'Abendessen in der Stadt'), p: [15, 25] },
    tips: { n: L('Tips (optional)', 'Trinkgeld (freiwillig)'), p: null },
    lunchT: { n: L('Lunch in a café', 'Mittagessen im Café'), p: [8, 12] }
  };

  /* Day modules. price = € per person, two travellers sharing. */
  const MODULES = {
    'ala-charyn-saty': {
      region: 'almaty', scene: 'charyn-castles', price: 195, maxAlt: 1650,
      title: L('Almaty → Charyn Canyon → Saty', 'Almaty → Charyn-Canyon → Saty'),
      text: L('Pickup at the airport or your hotel. Walk down the Valley of Castles to the Charyn River, then drive into the mountains to Saty.', 'Abholung am Flughafen oder Hotel. Abstieg durch das Tal der Burgen zum Charyn-Fluss, dann Fahrt in die Berge nach Saty.'),
      legs: [['almaty', 'charyn', 'road', 200, 210], ['charyn', 'saty', 'road', 100, 120]],
      hike: { km: 6, up: 180, h: 2.5 }, level: 'moderate',
      gentle: { hike: { km: 2, up: 40, h: 1 }, level: 'easy', note: L('Rim viewpoints only, no descent to the river.', 'Nur Aussichtspunkte am Rand, ohne Abstieg zum Fluss.') },
      sleep: 'guesthouse', inc: ['transport', 'guide', 'parkfee', 'l', 'd', 'guesthouse', 'water'], extra: ['tips'],
      profile: [['Almaty', 850], [L('Charyn rim', 'Charyn-Rand'), 1250], [L('Charyn River', 'Charyn-Fluss'), 1060], [L('Charyn rim', 'Charyn-Rand'), 1250], ['Saty', 1650]]
    },
    'kolsai-lakes': {
      region: 'almaty', scene: 'kolsai', price: 165, maxAlt: 2252,
      title: L('Kolsai Lake 1 → Lake 2', 'Kolsai-See 1 → See 2'),
      text: L('Through spruce forest from the first lake to the second, 434 m higher. Picnic at Lake 2, back the same way.', 'Durch Fichtenwald vom ersten zum zweiten See, 434 m höher. Picknick am See 2, zurück auf demselben Weg.'),
      legs: [['saty', 'kolsai1', 'road', 15, 30], ['kolsai1', 'kolsai2', 'hike', 8, 180]],
      hike: { km: 16, up: 450, h: 6.5 }, level: 'demanding',
      gentle: { hike: { km: 5, up: 60, h: 2 }, level: 'easy', note: L('Lakeshore path at Lake 1; ride to Lake 2 on horseback if you like (€25).', 'Uferweg am See 1; auf Wunsch zu Pferd zum See 2 (25 €).') },
      sleep: 'guesthouse', inc: ['transport', 'guide', 'parkfee', 'b', 'l', 'd', 'guesthouse', 'water'], extra: ['horse2', 'banya'],
      profile: [['Saty', 1650], [L('Lake 1', 'See 1'), 1818], [L('Lake 2', 'See 2'), 2252], [L('Lake 1', 'See 1'), 1818], ['Saty', 1650]]
    },
    'kaindy-saty': {
      region: 'almaty', scene: 'kaindy', price: 175, maxAlt: 2000,
      title: L('Kaindy, the sunken forest', 'Kaindy, der versunkene Wald'),
      text: L('4×4 up the Kaindy gorge, then on foot to the lake where spruce trunks stand in the water. Afternoon free in Saty.', 'Mit dem 4×4 durch die Kaindy-Schlucht, dann zu Fuß zum See mit den Fichtenstämmen im Wasser. Nachmittag frei in Saty.'),
      legs: [['saty', 'kaindy', 'road', 25, 60]],
      hike: { km: 7, up: 250, h: 3 }, level: 'moderate',
      gentle: { hike: { km: 3, up: 60, h: 1.5 }, level: 'easy', note: L('4×4 to the last car park, then a short walk to the shore.', 'Mit dem 4×4 bis zum letzten Parkplatz, dann ein kurzer Weg zum Ufer.') },
      sleep: 'guesthouse', inc: ['x4', 'guide', 'parkfee', 'b', 'l', 'd', 'guesthouse'], extra: ['horseK', 'banya'],
      profile: [['Saty', 1650], ['Kaindy', 2000], ['Saty', 1650]]
    },
    'saty-almaty': {
      region: 'almaty', scene: 'saty-valley', price: 160, maxAlt: 1818,
      title: L('Sunrise at Lake 1, back to Almaty', 'Sonnenaufgang am See 1, zurück nach Almaty'),
      text: L('An easy loop at Lake 1 while the water is still, then the scenic drive back to Almaty.', 'Eine leichte Runde am See 1, solange das Wasser ruhig ist, dann die schöne Fahrt zurück nach Almaty.'),
      legs: [['saty', 'almaty', 'road', 300, 300]],
      hike: { km: 5, up: 80, h: 2 }, level: 'easy', gentle: null,
      sleep: 'hotel', inc: ['transport', 'guide', 'b', 'l', 'hotel'], extra: ['citydinner'],
      profile: [['Saty', 1650], [L('Lake 1', 'See 1'), 1818], ['Almaty', 850]]
    },
    'bal-airport': {
      region: 'almaty', scene: 'big-almaty', price: 150, maxAlt: 2511,
      title: L('Big Almaty Lake, then your flight', 'Großer Almaty-See, dann dein Flug'),
      text: L('A morning walk above the turquoise reservoir at 2,511 m, lunch in the city and a transfer to the airport.', 'Morgenwanderung über dem türkisen Stausee auf 2.511 m, Mittagessen in der Stadt und Transfer zum Flughafen.'),
      legs: [['almaty', 'bal', 'road', 30, 60], ['bal', 'ala', 'road', 45, 70]],
      hike: { km: 6, up: 250, h: 2.5 }, level: 'moderate',
      gentle: { hike: { km: 2, up: 40, h: 1 }, level: 'easy', note: L('Viewpoint walk at the dam.', 'Kurzer Weg zum Aussichtspunkt am Damm.') },
      sleep: null, inc: ['transport', 'guide', 'parkfee', 'b', 'l', 'dropoff'], extra: ['tips'],
      profile: [['Almaty', 850], [L('Big Almaty Lake', 'Großer Almaty-See'), 2511], [L('Airport', 'Flughafen'), 680]]
    },
    'nqz-burabay': {
      region: 'burabay', scene: 'burabay', price: 150, maxAlt: 440,
      title: L('Astana → Burabay', 'Astana → Burabay'),
      text: L('Pickup at Astana airport, three hours north across the steppe, then an easy walk to the Okzhetpes viewpoint.', 'Abholung am Flughafen Astana, drei Stunden nach Norden durch die Steppe, dann ein leichter Weg zum Aussichtspunkt Okschetpes.'),
      legs: [['nqz', 'burabay', 'road', 250, 180], ['burabay', 'okzhetpes', 'hike', 3, 60]],
      hike: { km: 5, up: 120, h: 2 }, level: 'easy', gentle: null,
      sleep: 'hotel', inc: ['pickup', 'transport', 'guide', 'parkfee', 'l', 'd', 'hotel'], extra: ['tips'],
      profile: [['Astana', 350], ['Burabay', 320], ['Okzhetpes', 440], ['Burabay', 320]]
    },
    'burabay-kokshe': {
      region: 'burabay', scene: 'burabay', price: 140, maxAlt: 947,
      title: L('Mount Kokshe ridge walk', 'Gratwanderung am Kokshe'),
      text: L('Up through pine forest to the highest point of Burabay, 947 m, with six lakes below you.', 'Durch Kiefernwald auf den höchsten Punkt von Burabay, 947 m, mit sechs Seen unter dir.'),
      legs: [['burabay', 'kokshe', 'hike', 5.5, 150]],
      hike: { km: 11, up: 560, h: 5 }, level: 'moderate',
      gentle: { hike: { km: 6, up: 40, h: 2 }, level: 'easy', note: L('Shoreline path around Lake Burabay instead of the summit.', 'Uferweg um den Burabay-See statt des Gipfels.') },
      sleep: 'hotel', inc: ['transport', 'guide', 'parkfee', 'b', 'l', 'd', 'hotel'], extra: ['kayak'],
      profile: [['Burabay', 320], ['Kokshe', 947], ['Burabay', 320]]
    },
    'burabay-nqz': {
      region: 'burabay', scene: 'astana', price: 120, maxAlt: 340,
      title: L('Blue Bay walk, back to Astana', 'Blaue Bucht, zurück nach Astana'),
      text: L('A short morning walk at Blue Bay, time to kayak, and the drive back to Astana airport.', 'Kurzer Morgenspaziergang an der Blauen Bucht, Zeit zum Kajakfahren und Fahrt zurück zum Flughafen Astana.'),
      legs: [['burabay', 'nqz', 'road', 250, 180]],
      hike: { km: 4, up: 30, h: 1.5 }, level: 'easy', gentle: null,
      sleep: null, inc: ['transport', 'guide', 'b', 'l', 'dropoff'], extra: ['kayak'],
      profile: [['Burabay', 320], [L('Blue Bay', 'Blaue Bucht'), 340], ['Astana', 350]]
    },
    'burabay-fly-ala': {
      region: 'burabay', scene: 'burabay', price: 130, maxAlt: 340,
      title: L('Lake Borovoe, evening flight to Almaty', 'Borowoje-See, Abendflug nach Almaty'),
      text: L('Morning on the granite shore of Lake Borovoe, drive to Astana and fly south. Our driver meets you in Almaty.', 'Vormittag am Granitufer des Borowoje-Sees, Fahrt nach Astana und Flug in den Süden. Unser Fahrer holt dich in Almaty ab.'),
      legs: [['burabay', 'nqz', 'road', 250, 180], ['nqz', 'ala', 'air', 970, 105]],
      hike: { km: 6, up: 40, h: 2 }, level: 'easy', gentle: null,
      sleep: 'hotel', inc: ['transport', 'guide', 'b', 'l', 'pickup', 'hotel'], extra: ['flight'],
      profile: [['Burabay', 320], ['Astana', 350], ['Almaty', 850]]
    },
    'kaindy-almaty': {
      region: 'almaty', scene: 'kaindy', price: 185, maxAlt: 2000,
      title: L('Kaindy, then back to Almaty', 'Kaindy, dann zurück nach Almaty'),
      text: L('Early 4×4 ride to Kaindy Lake, a short hike, and the drive back to Almaty for your flight or hotel.', 'Früh mit dem 4×4 zum Kaindy-See, eine kurze Wanderung und Rückfahrt nach Almaty zu Flug oder Hotel.'),
      legs: [['saty', 'kaindy', 'road', 25, 60], ['kaindy', 'almaty', 'road', 320, 330]],
      hike: { km: 7, up: 250, h: 3 }, level: 'moderate',
      gentle: { hike: { km: 3, up: 60, h: 1.5 }, level: 'easy', note: L('4×4 to the last car park, then a short walk to the shore.', 'Mit dem 4×4 bis zum letzten Parkplatz, dann ein kurzer Weg zum Ufer.') },
      sleep: null, inc: ['x4', 'guide', 'parkfee', 'b', 'l', 'dropoff'], extra: ['citydinner'],
      profile: [['Saty', 1650], ['Kaindy', 2000], ['Saty', 1650], ['Almaty', 850]]
    },
    'hsa-turkestan': {
      region: 'turkestan', scene: 'turkestan', price: 140, maxAlt: 210,
      title: L('Turkistan and the Yasawi mausoleum', 'Turkistan und das Yasawi-Mausoleum'),
      text: L('Pickup at Turkistan airport, a guided walk through the Hazret Sultan complex and dinner at the caravanserai.', 'Abholung am Flughafen Turkistan, Führung durch den Hazret-Sultan-Komplex und Abendessen in der Karawanserei.'),
      legs: [['hsa', 'turkestan', 'road', 20, 25]],
      hike: { km: 4, up: 10, h: 2 }, level: 'easy', gentle: null,
      sleep: 'hotel', inc: ['pickup', 'transport', 'guide', 'tickets', 'd', 'hotel'], extra: ['lunchT'],
      profile: [[L('Airport', 'Flughafen'), 200], ['Turkistan', 210]]
    },
    'sauran-otrar': {
      region: 'turkestan', scene: 'turkestan', price: 160, maxAlt: 220,
      title: L('Sauran and Otrar, Silk Road ruins', 'Sauran und Otrar, Ruinen der Seidenstraße'),
      text: L('Walk the mud-brick walls of Sauran, then the excavated streets of Otrar with a former archaeologist.', 'Über die Lehmmauern von Sauran, dann durch die ausgegrabenen Straßen von Otrar mit einem ehemaligen Archäologen.'),
      legs: [['turkestan', 'sauran', 'road', 40, 45], ['sauran', 'otrar', 'road', 75, 80], ['otrar', 'turkestan', 'road', 60, 60]],
      hike: { km: 6, up: 30, h: 2.5 }, level: 'easy', gentle: null,
      sleep: 'hotel', inc: ['transport', 'guide', 'tickets', 'b', 'l', 'hotel', 'water'], extra: ['citydinner'],
      profile: [['Turkistan', 210], ['Sauran', 200], ['Otrar', 190], ['Turkistan', 210]]
    },
    'karatau-hsa': {
      region: 'turkestan', scene: 'turkestan', price: 150, maxAlt: 600,
      title: L('Karatau foothills, then your flight', 'Karatau-Vorberge, dann dein Flug'),
      text: L('A morning hike in the Karatau foothills with wide views over the Syr Darya plain, then the airport.', 'Morgenwanderung in den Karatau-Vorbergen mit weitem Blick über die Syrdarja-Ebene, dann zum Flughafen.'),
      legs: [['turkestan', 'karatau', 'road', 45, 50], ['karatau', 'hsa', 'road', 50, 55]],
      hike: { km: 7, up: 200, h: 3 }, level: 'moderate',
      gentle: { hike: { km: 3, up: 50, h: 1.2 }, level: 'easy', note: L('Short loop to the first viewpoint.', 'Kurze Runde zum ersten Aussichtspunkt.') },
      sleep: null, inc: ['transport', 'guide', 'b', 'l', 'dropoff'], extra: ['tips'],
      profile: [['Turkistan', 210], ['Karatau', 600], [L('Airport', 'Flughafen'), 200]]
    }
  };

  const TRIPS = [
    { id: 'lakes', img: 'img/kolsai.jpg', alt: L('Kolsai Lake between spruce-covered slopes', 'Kolsai-See zwischen fichtenbewachsenen Hängen'),
      name: L('Canyons & Kolsai Lakes', 'Canyons & Kolsai-Seen'), start: 'almaty', end: 'almaty', airIn: 'ALA', airOut: 'ALA',
      modules: ['ala-charyn-saty', 'kolsai-lakes', 'kaindy-saty', 'saty-almaty', 'bal-airport'],
      months: [5, 6, 7, 8, 9, 10], weekday: 6, guides: ['aigerim', 'daniyar', 'saule', 'askar'],
      tags: ['canyon', 'lakes', 'mountains', 'hiking'] },
    { id: 'loop', img: 'img/charyn-2.jpg', alt: L('Road winding through the Valley of Castles, Charyn Canyon', 'Straße durch das Tal der Burgen, Charyn-Canyon'),
      name: L('Steppe to Tian Shan', 'Von der Steppe zum Tian Shan'), start: 'astana', end: 'almaty', airIn: 'NQZ', airOut: 'ALA',
      modules: ['nqz-burabay', 'burabay-fly-ala', 'ala-charyn-saty', 'kolsai-lakes', 'kaindy-almaty'],
      months: [5, 6, 7, 8, 9], weekday: 0, guides: ['madina', 'aigerim', 'askar'],
      tags: ['canyon', 'lakes', 'forest', 'steppe', 'hiking'] },
    { id: 'burabay', img: 'img/burabay-wide.jpg', alt: L('Granite boulders on the shore of Lake Borovoe, Burabay', 'Granitblöcke am Ufer des Borowoje-Sees, Burabay'),
      name: L('Burabay: Granite & Pine', 'Burabay: Granit & Kiefern'), start: 'astana', end: 'astana', airIn: 'NQZ', airOut: 'NQZ',
      modules: ['nqz-burabay', 'burabay-kokshe', 'burabay-nqz'],
      months: [5, 6, 7, 8, 9], weekday: 5, guides: ['madina'],
      tags: ['forest', 'lakes', 'weekend', 'hiking', 'family'] },
    { id: 'silk', img: 'img/turkistan.jpg', alt: L('Mausoleum of Khoja Ahmed Yasawi in Turkistan', 'Mausoleum des Hodscha Ahmad Yasawi in Turkistan'),
      name: L('Turkestan & the Silk Road', 'Turkestan & die Seidenstraße'), start: 'turkestan', end: 'turkestan', airIn: 'HSA', airOut: 'HSA',
      modules: ['hsa-turkestan', 'sauran-otrar', 'karatau-hsa'],
      months: [4, 5, 6, 9, 10], weekday: 4, guides: ['yerlan'],
      tags: ['culture', 'history', 'architecture'] }
  ];

  const GUIDES = [
    { id: 'aigerim', name: 'Aigerim Seitkali', ini: 'AS', region: 'almaty', base: L('Saty village, Almaty region', 'Dorf Saty, Region Almaty'), img: 'img/kolsai.jpg', slides: ['img/kolsai.jpg', 'img/kaindy.jpg', 'img/kolsai-2.jpg'],
      years: 9, rating: 4.9, reviews: 41, trips: ['lakes', 'loop'], langs: [['de', 'C1'], ['en', 'C1'], ['kk', 'N'], ['ru', 'N']],
      spec: L('Lakes and forest hikes', 'Seen- und Waldwanderungen'), checked: '2026-10-12',
      certs: [L('Licensed tour guide, Almaty region', 'Lizenzierte Reiseleiterin, Region Almaty'), L('Wilderness First Aid (16 h), valid to 2027', 'Wilderness First Aid (16 Std.), gültig bis 2027'), L('Goethe-Zertifikat C1', 'Goethe-Zertifikat C1'), L('Police clearance certificate', 'Polizeiliches Führungszeugnis')],
      intro: { en: ["Salem! I'm Aigerim.", 'I grew up in Saty, the village right below the Kolsai Lakes.', 'I learned German in Almaty and have guided hikers here since 2017.', "On the way to Lake 2 I'll show you wild apple trees. Apples first grew here.", 'See you at the trailhead!'],
               de: ['Salem! Ich bin Aigerim.', 'Ich bin in Saty aufgewachsen, dem Dorf direkt unter den Kolsai-Seen.', 'Deutsch habe ich in Almaty gelernt, Wandergruppen führe ich seit 2017.', 'Auf dem Weg zum See 2 zeige ich dir wilde Apfelbäume. Der Apfel stammt von hier.', 'Bis bald am Wanderweg!'] },
      revs: [{ n: 'Katrin', c: 'Freiburg', m: 'Sep 2026', r: 5, t: L('Aigerim changed the plan when my knee hurt and we took the horses to Lake 2. Her German is excellent.', 'Aigerim hat den Plan geändert, als mein Knie wehtat, und wir sind zu Pferd zum See 2. Ihr Deutsch ist ausgezeichnet.') },
             { n: 'Jonas', c: 'Hamburg', m: 'Jun 2026', r: 5, t: L('Felt like walking with a friend who knows every tree. The guesthouse dinner was the best of the trip.', 'Wie eine Wanderung mit einer Freundin, die jeden Baum kennt. Das Abendessen im Gästehaus war das beste der Reise.') }] },
    { id: 'daniyar', name: 'Daniyar Ospanov', ini: 'DO', region: 'almaty', base: L('Almaty', 'Almaty'), img: 'img/charyn-2.jpg', slides: ['img/charyn-2.jpg', 'img/charyn.jpg', 'img/big-almaty-lake.jpg'],
      years: 12, rating: 4.8, reviews: 56, trips: ['lakes'], langs: [['en', 'C1'], ['de', 'B2'], ['kk', 'N'], ['ru', 'N']],
      spec: L('Canyons and geology', 'Canyons und Geologie'), checked: '2026-10-03',
      certs: [L('Licensed tour guide, Almaty region', 'Lizenzierter Reiseleiter, Region Almaty'), L('MSc Geology, Satbayev University', 'MSc Geologie, Satbajew-Universität'), L('Wilderness First Aid (16 h), valid to 2027', 'Wilderness First Aid (16 Std.), gültig bis 2027')],
      intro: { en: ["Hi, I'm Daniyar, a geologist by training.", "Charyn's red walls are about 12 million years of sediment, and I read them like a book.", 'We walk down the Valley of Castles to the river, where it is ten degrees cooler.', 'I always carry extra water and a sense of humour.'],
               de: ['Hallo, ich bin Daniyar, von Beruf Geologe.', 'Die roten Wände des Charyn sind rund 12 Millionen Jahre Sediment. Ich lese sie wie ein Buch.', 'Wir steigen durch das Tal der Burgen zum Fluss ab, dort ist es zehn Grad kühler.', 'Extra Wasser und Humor habe ich immer dabei.'] },
      revs: [{ n: 'Thomas', c: 'Köln', m: 'May 2026', r: 5, t: L('I understood the landscape for the first time. Daniyar answered every question, even the silly ones.', 'Zum ersten Mal habe ich die Landschaft verstanden. Daniyar hat jede Frage beantwortet, auch die albernen.') },
             { n: 'Lea', c: 'Leipzig', m: 'Aug 2026', r: 4, t: L('Great guide, very punctual. The drive on day one is long, so bring a podcast.', 'Toller Guide, sehr pünktlich. Die Fahrt am ersten Tag ist lang, also einen Podcast mitnehmen.') }] },
    { id: 'madina', name: 'Madina Zhaksylyk', ini: 'MZ', region: 'burabay', base: L('Astana and Burabay', 'Astana und Burabay'), img: 'img/burabay.jpg', slides: ['img/burabay-wide.jpg', 'img/burabay.jpg', 'img/baiterek.jpg'],
      years: 6, rating: 5.0, reviews: 23, trips: ['burabay', 'loop'], langs: [['de', 'C2'], ['en', 'B2'], ['kk', 'N'], ['ru', 'N']],
      spec: L('Gentle hikes, families, birds', 'Sanfte Wanderungen, Familien, Vögel'), checked: '2026-10-08',
      certs: [L('Licensed tour guide, Akmola region', 'Lizenzierte Reiseleiterin, Region Akmola'), L('First aid incl. children (12 h)', 'Erste Hilfe inkl. Kinder (12 Std.)'), L('Studied in Leipzig for four years', 'Vier Jahre Studium in Leipzig')],
      intro: { en: ["Hallo! I'm Madina. I lived in Leipzig for four years.", 'Now I guide in Burabay: pine forest and granite rising out of the steppe.', 'My trips go at a calm pace, so they work well for parents and kids.', 'Bring binoculars. We often see herons and eagles over the lakes.'],
               de: ['Hallo! Ich bin Madina und habe vier Jahre in Leipzig gelebt.', 'Jetzt führe ich in Burabay: Kiefernwald und Granit mitten in der Steppe.', 'Meine Touren sind ruhig, ideal mit Eltern oder Kindern.', 'Nimm ein Fernglas mit. Über den Seen sehen wir oft Reiher und Adler.'] },
      revs: [{ n: 'Familie Weber', c: 'München', m: 'Jul 2026', r: 5, t: L('Our kids (8 and 11) loved her. Perfectly paced, and she knew every bird.', 'Unsere Kinder (8 und 11) haben sie geliebt. Perfektes Tempo, und sie kannte jeden Vogel.') },
             { n: 'Ursula', c: 'Stuttgart', m: 'Sep 2026', r: 5, t: L('I travelled with my 74-year-old mother. Madina made it easy for both of us.', 'Ich war mit meiner 74-jährigen Mutter unterwegs. Madina hat es uns beiden leicht gemacht.') }] },
    { id: 'yerlan', name: 'Yerlan Abenov', ini: 'YA', region: 'turkestan', base: L('Turkistan', 'Turkistan'), img: 'img/turkistan.jpg', slides: ['img/turkistan.jpg', 'img/yurt.jpg', 'img/altyn-emel.jpg'],
      years: 15, rating: 4.9, reviews: 64, trips: ['silk'], langs: [['en', 'C1'], ['de', 'B1'], ['tr', 'B2'], ['kk', 'N'], ['ru', 'N']],
      spec: L('History and archaeology', 'Geschichte und Archäologie'), checked: '2026-10-01',
      certs: [L('Licensed tour guide, Turkistan region', 'Lizenzierter Reiseleiter, Region Turkistan'), L('Ten years on excavations in Sauran and Otrar', 'Zehn Jahre bei Ausgrabungen in Sauran und Otrar'), L('First aid (16 h), valid to 2027', 'Erste Hilfe (16 Std.), gültig bis 2027')],
      intro: { en: ["Assalaumagaleikum! I'm Yerlan, from Turkistan.", 'I spent ten years on archaeological digs in Sauran and Otrar.', "The Yasawi mausoleum was started on Timur's order in 1389 and never finished. I'll show you why.", 'In summer it gets very hot, so we walk early and rest at midday.'],
               de: ['Assalaumagaleikum! Ich bin Yerlan aus Turkistan.', 'Zehn Jahre habe ich bei Ausgrabungen in Sauran und Otrar gearbeitet.', 'Das Yasawi-Mausoleum wurde 1389 auf Befehl Timurs begonnen und nie vollendet. Ich zeige dir, warum.', 'Im Sommer wird es sehr heiß, also gehen wir früh los und ruhen mittags.'] },
      revs: [{ n: 'Michael', c: 'Berlin', m: 'Oct 2026', r: 5, t: L('Like a private lecture on the Silk Road, on site. Unforgettable.', 'Wie eine Privatvorlesung über die Seidenstraße, direkt vor Ort. Unvergesslich.') },
             { n: 'Anja', c: 'Dresden', m: 'May 2026', r: 5, t: L('He spoke slowly in German when we needed it and switched to English for the details.', 'Er sprach langsam Deutsch, wenn wir es brauchten, und wechselte für Details ins Englische.') }] },
    { id: 'askar', name: 'Askar Nurlanuly', ini: 'AN', region: 'almaty', base: L('Almaty', 'Almaty'), img: 'img/big-almaty-lake.jpg', slides: ['img/big-almaty-lake.jpg', 'img/kolsai.jpg', 'img/kaindy.jpg'],
      years: 11, rating: 4.8, reviews: 37, trips: ['lakes', 'loop'], langs: [['en', 'C1'], ['de', 'A2'], ['kk', 'N'], ['ru', 'N']],
      spec: L('Longer days and high trails', 'Lange Etappen und hohe Pfade'), checked: '2026-10-15',
      certs: [L('Mountain leader certificate', 'Zertifikat Bergwanderführer'), L('Wilderness First Responder (80 h)', 'Wilderness First Responder (80 Std.)'), L('Licensed tour guide, Almaty region', 'Lizenzierter Reiseleiter, Region Almaty')],
      intro: { en: ["I'm Askar, a mountain leader from Almaty.", 'If you want a longer day, Lake 2 and the ridge above it are my favourite.', 'I carry a satellite messenger and a full first-aid kit on every hike.', 'My German is basic, my English is fluent, and my tea is strong.'],
               de: ['Ich bin Askar, Bergwanderführer aus Almaty.', 'Wer einen langen Tag will: See 2 und der Grat darüber sind mein Favorit.', 'Satelliten-Messenger und Erste-Hilfe-Set sind bei jeder Tour dabei.', 'Mein Deutsch ist einfach, mein Englisch fließend und mein Tee stark.'] },
      revs: [{ n: 'Sebastian', c: 'Frankfurt', m: 'Aug 2026', r: 5, t: L('We did the extended Lake 2 route. Askar read the weather perfectly.', 'Wir sind die lange Route zum See 2 gegangen. Askar hat das Wetter perfekt gelesen.') },
             { n: 'Nina', c: 'Bremen', m: 'Jul 2026', r: 4, t: L('Very safe and calm. Speaks mostly English, which was fine for us.', 'Sehr sicher und ruhig. Spricht überwiegend Englisch, für uns kein Problem.') }] },
    { id: 'saule', name: 'Saule Temirbek', ini: 'ST', region: 'almaty', base: L('Almaty', 'Almaty'), img: 'img/kaindy.jpg', slides: ['img/kaindy.jpg', 'img/charyn.jpg', 'img/kolsai-2.jpg'],
      years: 7, rating: 4.9, reviews: 29, trips: ['lakes'], langs: [['en', 'C2'], ['de', 'B2'], ['ru', 'N'], ['kk', 'N']],
      spec: L('Photography hikes', 'Fotowanderungen'), checked: '2026-10-10',
      certs: [L('Licensed tour guide, Almaty region', 'Lizenzierte Reiseleiterin, Region Almaty'), L('Wilderness First Aid (16 h), valid to 2028', 'Wilderness First Aid (16 Std.), gültig bis 2028'), L('Landscape photographer', 'Landschaftsfotografin')],
      intro: { en: ["Hi, I'm Saule. I photograph the Tian Shan in every season.", 'I plan our days around the light: Kaindy at sunrise, the canyon at sunset.', 'I can help you set up your camera, or just tell you where to stand.', 'Ich spreche auch Deutsch, ruhig und gut verständlich.'],
               de: ['Hallo, ich bin Saule. Ich fotografiere den Tian Shan zu jeder Jahreszeit.', 'Ich plane die Tage nach dem Licht: Kaindy bei Sonnenaufgang, der Canyon bei Sonnenuntergang.', 'Ich helfe dir mit der Kamera oder sage dir einfach, wo du stehen sollst.', 'Ich spreche ruhig und gut verständlich Deutsch.'] },
      revs: [{ n: 'Paul', c: 'Nürnberg', m: 'Sep 2026', r: 5, t: L('My best photos ever. She waited 40 minutes with me for the light at Kaindy.', 'Meine besten Fotos überhaupt. Sie hat 40 Minuten mit mir auf das Licht am Kaindy gewartet.') },
             { n: 'Miriam', c: 'Hannover', m: 'Jun 2026', r: 5, t: L('Warm, funny and very organised.', 'Herzlich, witzig und sehr gut organisiert.') }] }
  ];

  const LANGS = { de: L('German', 'Deutsch'), en: L('English', 'Englisch'), kk: L('Kazakh', 'Kasachisch'), ru: L('Russian', 'Russisch'), tr: L('Turkish', 'Türkisch') };
  const LEVEL_PCT = { N: 100, C2: 94, C1: 82, B2: 66, B1: 50, A2: 32 };

  const PRICING = { deposit: 0.2, solo: 1.4, group34: 0.92, group56: 0.88, singleRoom: 28, balanceDays: 30, freeCancelDays: 45 };

  /* Arrival concierge */
  const PASSPORTS = [
    { id: 'DE', n: L('Germany', 'Deutschland'), free: true, fo: { n: L('Federal Foreign Office: Kazakhstan', 'Auswärtiges Amt: Kasachstan'), u: 'https://www.auswaertiges-amt.de/de/service/laender/kasachstan-node' } },
    { id: 'AT', n: L('Austria', 'Österreich'), free: true, fo: { n: L('Austrian Foreign Ministry: travel info', 'BMEIA: Reiseinformationen'), u: 'https://www.bmeia.gv.at/reise-services/reiseinformation' } },
    { id: 'CH', n: L('Switzerland', 'Schweiz'), free: true, fo: { n: L('Swiss FDFA: travel advice', 'EDA: Reisehinweise'), u: 'https://www.eda.admin.ch/eda/de/home/vertretungen-und-reisehinweise.html' } },
    { id: 'NL', n: L('Netherlands', 'Niederlande'), free: true, fo: null },
    { id: 'FR', n: L('France', 'Frankreich'), free: true, fo: null },
    { id: 'IT', n: L('Italy', 'Italien'), free: true, fo: null },
    { id: 'PL', n: L('Poland', 'Polen'), free: true, fo: null },
    { id: 'GB', n: L('United Kingdom', 'Vereinigtes Königreich'), free: true, fo: { n: L('GOV.UK: Kazakhstan travel advice', 'GOV.UK: Reisehinweise Kasachstan'), u: 'https://www.gov.uk/foreign-travel-advice/kazakhstan' } },
    { id: 'US', n: L('United States', 'Vereinigte Staaten'), free: true, fo: { n: L('U.S. State Department: travel', 'US-Außenministerium: Reisen'), u: 'https://travel.state.gov' } },
    { id: 'XX', n: L('Another country', 'Anderes Land'), free: null, fo: null }
  ];
  const OFFICIAL = [
    { n: L('Ministry of Foreign Affairs of Kazakhstan', 'Außenministerium Kasachstans'), u: 'https://www.gov.kz/memleket/entities/mfa' },
    { n: L('Embassy of Kazakhstan in Germany', 'Botschaft Kasachstans in Deutschland'), u: 'https://www.gov.kz/memleket/entities/mfa-berlin' },
    { n: L('Kazakhstan e-visa and migration portal', 'E-Visum- und Migrationsportal Kasachstans'), u: 'https://www.vmp.gov.kz' }
  ];
  const HOME_AIRPORTS = [
    ['FRA', L('Frankfurt', 'Frankfurt')], ['MUC', L('Munich', 'München')], ['BER', L('Berlin', 'Berlin')], ['DUS', L('Düsseldorf', 'Düsseldorf')],
    ['HAM', L('Hamburg', 'Hamburg')], ['STR', L('Stuttgart', 'Stuttgart')], ['VIE', L('Vienna', 'Wien')], ['ZRH', L('Zurich', 'Zürich')]
  ];
  const KZ_AIRPORTS = { NQZ: L('Astana', 'Astana'), ALA: L('Almaty', 'Almaty'), HSA: L('Turkistan', 'Turkistan') };
  const TRANSFERS = [
    { id: 'sedan', n: L('Sedan, 1–3 people', 'Limousine, 1–3 Personen'), p: 39 },
    { id: 'van', n: L('Minivan, 4–7 people', 'Minivan, 4–7 Personen'), p: 59 },
    { id: 'none', n: L('No transfer', 'Kein Transfer'), p: 0 }
  ];

  const CREDITS = [
    ['hero.jpg', 'Edrey Mountains, Karaganda region', 'Astrobond', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Edrey_Mountains,_Karaganda_region,_Kazakhstan._May_2025_01.jpg'],
    ['charyn.jpg', 'Charyn Canyon', 'Bgag', 'CC0', 'https://commons.wikimedia.org/wiki/File:Charyn_Canyon,_Kazakhstan_01.jpg'],
    ['charyn-2.jpg', 'Charyn Canyon, Valley of Castles', 'Bgag', 'CC0', 'https://commons.wikimedia.org/wiki/File:Charyn_Canyon,_Kazakhstan_03.jpg'],
    ['kolsai.jpg', 'Kolsai Lake', 'Katariyakartikey', 'CC0', 'https://commons.wikimedia.org/wiki/File:Kolsai_lake.jpg'],
    ['kolsai-2.jpg', 'Kolsai lakes, mountains', 'Dimash Kenesbek', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Kolsai_lakes.Mountains.jpg'],
    ['kaindy.jpg', 'Kaindy Lake', 'Katariyakartikey', 'CC0', 'https://commons.wikimedia.org/wiki/File:Kaindy_lake.jpg'],
    ['burabay.jpg', 'Lake Borovoe, Burabay', 'Alter-Ego9312', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:%D0%9E%D0%B7%D0%B5%D1%80%D0%BE_%D0%91%D0%BE%D1%80%D0%BE%D0%B2%D0%BE%D0%B5,_%D0%91%D1%83%D1%80%D0%B0%D0%B1%D0%B0%D0%B9.jpg'],
    ['turkistan.jpg', 'Mausoleum of Khoja Ahmed Yasawi', 'Petar Milošević', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Mausoleum_of_Khoja_Ahmed_Yasavi_in_Turkestan,_Kazakhstan.jpg'],
    ['big-almaty-lake.jpg', 'Big Almaty Lake in June', 'Ds02006', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Big_Almaty_Lake_(Bolshaya_Almatinka)_in_June.jpg'],
    ['baiterek.jpg', 'Baiterek, Astana', 'Quarot', 'CC0', 'https://commons.wikimedia.org/wiki/File:Baiterek_August.jpg'],
    ['almaty.jpg', 'Almaty from Kok Tobe', 'Vmenkov', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Sunset_over_the_Almaty_seen_from_Kok_Tobe_mountain,_pic_1.jpg'],
    ['yurt.jpg', 'Yurt at the foot of the cliffs, Aktobe Region', 'Danatleg122', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Yurt_at_the_Foot_of_the_Cliffs,_Aktobe_Region,_Kazakhstan.jpg'],
    ['altyn-emel.jpg', 'Singing Dune, Altyn-Emel', 'Jjm2311', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:210723_Altyn_Emel_Singing_Dune_top.jpg']
  ];

  /* Bearings from Astana (computed great-circle, see map-data.js) */
  const COMPASS = [
    { id: 'charyn', n: L('Charyn Canyon', 'Charyn-Canyon') },
    { id: 'kolsai', n: L('Kolsai Lakes', 'Kolsai-Seen') },
    { id: 'burabay', n: L('Burabay', 'Burabay') },
    { id: 'turkestan', n: L('Turkestan', 'Turkestan') }
  ];

  /* MVP plan and first-year costs, taken from the team report (Big Yahu, Technology Product) */
  const MVP = {
    weeks: [
      { w: [1, 2], t: L('Trip database, confirmed payment option', 'Reisedatenbank, bestätigte Zahlungsoption'), d: L('Interview German travelers and company managers; collect all prices, dates and inclusions into one database; choose a payment provider.', 'Deutsche Reisende und Manager des Unternehmens befragen; alle Preise, Termine und Leistungen in einer Datenbank sammeln; einen Zahlungsanbieter wählen.') },
      { w: [3, 4], t: L('Approved design', 'Freigegebenes Design'), d: L('Wireframes and a clickable prototype; first test with 5 users; start translations.', 'Wireframes und ein klickbarer Prototyp; erster Test mit 5 Nutzern; Übersetzungen beginnen.') },
      { w: [5, 8], t: L('Working website in English and German', 'Funktionierende Website auf Englisch und Deutsch'), d: L('Build trip pages, guide profiles and the deposit checkout; film guide videos and prepare panoramas.', 'Reiseseiten, Guide-Profile und die Anzahlungskasse bauen; Guide-Videos drehen und Panoramen vorbereiten.') },
      { w: [9, 10], t: L('Full MVP on a test server', 'Komplettes MVP auf einem Testserver'), d: L('Connect the AI Trip Builder to the database; add the Arrival Concierge; test payments with foreign cards.', 'Den KI-Reiseplaner mit der Datenbank verbinden; den Ankunfts-Concierge ergänzen; Zahlungen mit ausländischen Karten testen.') },
      { w: [11, 12], t: L('Test results and a go / no-go decision', 'Testergebnisse und eine Go/No-Go-Entscheidung'), d: L('Pilot with 15–20 German-speaking users; fix problems; soft launch.', 'Pilot mit 15–20 deutschsprachigen Nutzern; Probleme beheben; Soft Launch.') }
    ],
    budget: [
      { k: L('Development', 'Entwicklung'), v: 11200000,
        d: L('Two freelance web developers, 3 months (4.8M) · UX/UI designer, 2 months (1.2M) · AI Trip Builder setup and testing (0.8M) · English and German translation, native proofreading (0.9M) · 360° panoramas and photos (1.5M) · short videos for 6–8 guides (0.7M) · payment integration and legal / GDPR advice (1.0M) · user testing (0.3M)',
             'Zwei freiberufliche Webentwickler, 3 Monate (4,8 Mio.) · UX/UI-Designer, 2 Monate (1,2 Mio.) · Aufbau und Test des KI-Reiseplaners (0,8 Mio.) · Übersetzung Englisch und Deutsch, muttersprachliches Lektorat (0,9 Mio.) · 360°-Panoramen und Fotos (1,5 Mio.) · kurze Videos für 6–8 Guides (0,7 Mio.) · Zahlungsintegration und Rechts-/DSGVO-Beratung (1,0 Mio.) · Nutzertests (0,3 Mio.)') },
      { k: L('Launch, months 4–6', 'Start, Monate 4–6'), v: 3500000,
        d: L('Online advertising in Germany (2.5M) · German-language content and travel blogger cooperation (1.0M)', 'Online-Werbung in Deutschland (2,5 Mio.) · deutschsprachige Inhalte und Kooperation mit Reisebloggern (1,0 Mio.)') },
      { k: L('Running costs, year 1', 'Laufende Kosten, Jahr 1'), v: 2700000,
        d: L('Hosting, AI usage, map and panorama tools, months 4–12 (0.9M) · part-time developer for fixes, months 4–12 (1.8M)', 'Hosting, KI-Nutzung, Karten- und Panorama-Tools, Monate 4–12 (0,9 Mio.) · Teilzeit-Entwickler für Korrekturen, Monate 4–12 (1,8 Mio.)') },
      { k: L('Reserve (about 13%)', 'Reserve (etwa 13 %)'), v: 2600000,
        d: L('For problems we can’t predict', 'Für Probleme, die wir nicht vorhersehen können') }
    ],
    pilot: [
      { m: L('Tester finds the price and what is included', 'Testperson findet Preis und Leistungen'), t: L('80% or more, within 2 minutes', '80 % oder mehr, innerhalb von 2 Minuten') },
      { m: L('Trust score after seeing guide profiles (scale 1–5)', 'Vertrauenswert nach den Guide-Profilen (Skala 1–5)'), t: L('Average of 4 or higher', 'Durchschnitt 4 oder höher') },
      { m: L('100 test questions to the AI, checked by a manager', '100 Testfragen an die KI, von einem Manager geprüft'), t: L('No invented prices or dates; unknown questions passed to a human', 'Keine erfundenen Preise oder Termine; unbekannte Fragen gehen an einen Menschen') },
      { m: L('Payments with foreign cards', 'Zahlungen mit ausländischen Karten'), t: L('Every test payment goes through', 'Jede Testzahlung geht durch') },
      { m: L('Early bookings for summer 2027', 'Frühe Buchungen für Sommer 2027'), t: L('First deposits from real German travelers', 'Erste Anzahlungen von echten deutschen Reisenden') }
    ],
    tech: [L('Figma for wireframes', 'Figma für Wireframes'), L('Common web framework with a simple trip database', 'Gängiges Web-Framework mit einfacher Reisedatenbank'), L('Existing LLM via API, answering only from the trip database', 'Bestehendes Sprachmodell per API, antwortet nur aus der Reisedatenbank'), L('Open-source panorama viewer', 'Open-Source-Panorama-Viewer'), L('OpenStreetMap-based map', 'Karte auf OpenStreetMap-Basis'), L('WhatsApp Business for manager handover', 'WhatsApp Business für die Übergabe an Manager'), L('Privacy-friendly analytics', 'Datenschutzfreundliche Analyse')]
  };

  window.SC_DATA = { STOPS, SCENES, INC, EXTRA, MODULES, TRIPS, GUIDES, LANGS, LEVEL_PCT, PRICING, PASSPORTS, OFFICIAL, HOME_AIRPORTS, KZ_AIRPORTS, TRANSFERS, CREDITS, COMPASS, MVP, UPDATED: '2026-10-24' };
})();
