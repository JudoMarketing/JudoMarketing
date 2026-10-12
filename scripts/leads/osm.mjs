/**
 * Negocios de una zona sacados de OpenStreetMap, gratis y sin clave.
 *
 * Reemplaza a Google Places desde el 12 de octubre de 2026: Junior apagó las
 * búsquedas en Google porque las llamadas salían demasiado caras. OSM es el
 * mapa abierto del mundo; trae nombre, rubro, dirección, teléfono, website y
 * a veces el correo del negocio. No trae reseñas ni el puesto en Google Maps:
 * eso lo mira la sesión con su búsqueda web cuando hace falta.
 *
 * Dos servicios públicos, los dos gratis y con reglas de uso que se respetan
 * aquí (identificarse, pocas peticiones, sin ráfagas):
 * - Nominatim: dónde queda la zona (una petición por corrida).
 * - Overpass: los negocios alrededor de ese punto (una o dos peticiones).
 *   Los servidores públicos a veces se caen; se prueban varios espejos.
 *
 * Datos © colaboradores de OpenStreetMap, licencia ODbL.
 */

const UA = "JudoMarketing/1.0 (prospeccion; admin@judomarketing.net)";
const ESPEJOS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Centro de la zona: un zip de Estados Unidos o una ciudad de zonas.json. */
export async function centroDe(zona) {
  const q = new URLSearchParams({ format: "jsonv2", limit: "1" });
  if (/^\d{5}$/.test(zona.id)) {
    q.set("postalcode", zona.id);
    q.set("country", "us");
  } else {
    q.set("q", zona.consulta ?? zona.nombre);
  }
  for (const espera of [0, 3000, 8000]) {
    if (espera) await esperar(espera);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const [r] = await res.json();
      if (r) return { lat: Number(r.lat), lon: Number(r.lon), nombre: r.display_name };
    } catch {
      // red: se reintenta
    }
  }
  throw new Error(`No se pudo ubicar la zona ${zona.id} en el mapa (Nominatim)`);
}

/** Una consulta Overpass, probando espejos hasta que uno conteste. */
async function overpass(consulta) {
  const errores = [];
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (const url of ESPEJOS) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: consulta }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!res.ok) {
          errores.push(`${new URL(url).host} ${res.status}`);
          continue;
        }
        const datos = await res.json();
        return datos.elements ?? [];
      } catch (e) {
        errores.push(`${new URL(url).host} ${e.name === "TimeoutError" ? "tardó demasiado" : e.message}`);
      }
    }
    await esperar(5000);
  }
  throw new Error(`OpenStreetMap no contestó (${errores.slice(-3).join("; ")})`);
}

/*
 * De la etiqueta de OSM al rubro. Cada fila: [rubro, tipo]. El rubro es el
 * nombre que se guarda (leads.rubro, el mismo vocabulario de antes); el tipo
 * son palabras que estudiarSitio() reconoce para saber si es comida,
 * servicio, profesional o tienda (antes era el tipo de Google).
 */
const RUBROS = {
  amenity: {
    restaurant: ["restaurant", "restaurant food"],
    cafe: ["cafe", "cafe food"],
    fast_food: ["restaurant", "restaurant food"],
    bar: ["bar", "bar food"],
    pub: ["bar", "bar food"],
    ice_cream: ["bakery", "bakery food"],
    dentist: ["dental clinic", "dentist dental"],
    doctors: ["medical clinic", "doctor clinic"],
    clinic: ["medical clinic", "clinic"],
    veterinary: ["veterinarian", "veterinary"],
    childcare: ["daycare", "daycare"],
    kindergarten: ["daycare", "daycare"],
    driving_school: ["driving school", "tutor"],
    language_school: ["tutoring center", "tutor"],
    music_school: ["tutoring center", "tutor"],
    car_wash: ["car wash", "car_wash"],
    car_repair: ["auto repair shop", "repair"],
  },
  shop: {
    hairdresser: ["beauty salon", "salon beauty"],
    beauty: ["beauty salon", "beauty salon"],
    massage: ["spa", "massage spa"],
    tattoo: ["tattoo studio", "salon"],
    cosmetics: ["beauty store", "beauty store"],
    bakery: ["bakery", "bakery food"],
    pastry: ["bakery", "bakery food"],
    deli: ["restaurant", "restaurant food"],
    clothes: ["clothing store", "clothing store"],
    boutique: ["clothing store", "clothing boutique"],
    shoes: ["clothing store", "clothing store"],
    furniture: ["furniture store", "furniture store"],
    jewelry: ["jewelry store", "jewelry store"],
    florist: ["florist", "florist store"],
    car_repair: ["auto repair shop", "repair"],
    car: ["car dealership", "dealer"],
    tyres: ["auto repair shop", "repair"],
    pet_grooming: ["pet groomer", "groom"],
    pet: ["pet store", "store"],
    copyshop: ["print shop", "store"],
    tailor: ["tailor", "repair"],
    dry_cleaning: ["cleaning service", "cleaning"],
    laundry: ["cleaning service", "cleaning"],
    optician: ["optician", "clinic store"],
    wholesale: ["wholesale distributor", "wholesale distributor"],
    hardware: ["hardware store", "store"],
    electronics: ["electronics store", "store"],
    mobile_phone: ["electronics store", "store repair"],
    gift: ["gift shop", "store"],
    bicycle: ["bike shop", "store repair"],
    music: ["music store", "store"],
    art: ["art gallery", "store"],
    interior_decoration: ["furniture store", "furniture store"],
  },
  office: {
    lawyer: ["law firm", "lawyer law_firm"],
    accountant: ["accounting firm", "accountant accounting"],
    tax_advisor: ["accounting firm", "accountant tax"],
    insurance: ["insurance agency", "insurance"],
    estate_agent: ["real estate agency", "real_estate"],
    property_management: ["real estate agency", "real_estate"],
    financial: ["financial advisor", "financial"],
    financial_advisor: ["financial advisor", "financial"],
    architect: ["architect", "professional"],
    moving_company: ["moving company", "moving"],
    travel_agent: ["travel agency", "store"],
    employment_agency: ["staffing agency", "professional"],
    notary: ["notary", "professional"],
    company: ["company", "professional"],
    yes: ["company", "professional"],
  },
  craft: {
    plumber: ["plumber", "plumber contractor"],
    electrician: ["electrician", "electrician contractor"],
    hvac: ["contractor", "contractor"],
    carpenter: ["contractor", "contractor"],
    builder: ["contractor", "contractor"],
    roofer: ["contractor", "contractor"],
    painter: ["contractor", "contractor"],
    tiler: ["contractor", "contractor"],
    cleaning: ["cleaning service", "cleaning"],
    gardener: ["landscaping", "landscap"],
    landscaper: ["landscaping", "landscap"],
    caterer: ["catering", "catering food"],
    photographer: ["photographer", "photograph"],
    tailor: ["tailor", "repair"],
    upholsterer: ["furniture store", "repair"],
  },
  healthcare: {
    psychotherapist: ["mental health clinic", "therapist mental"],
    counselling: ["counseling center", "counsel therapy"],
    speech_therapist: ["speech therapy", "therapy"],
    occupational_therapist: ["occupational therapy", "therapy"],
    physiotherapist: ["physical therapy", "physio therapy"],
    dentist: ["dental clinic", "dentist dental"],
    doctor: ["medical clinic", "doctor clinic"],
    clinic: ["medical clinic", "clinic"],
    alternative: ["spa", "massage spa"],
    optometrist: ["optician", "clinic"],
    podiatrist: ["medical clinic", "clinic"],
  },
  leisure: {
    fitness_centre: ["gym", "gym"],
    sports_centre: ["gym", "gym"],
    dance: ["dance studio", "gym"],
  },
};

// Lo que no es cliente: gobierno, embajadas, escuelas, hospitales, iglesias,
// cadenas y competidores (agencias de marketing, publicidad o IT).
const FUERA = {
  office: /^(government|diplomatic|educational_institution|association|ngo|religion|political_party|coworking|advertising_agency|marketing|it|telecommunication|research|charity|union|foundation)$/,
  shop: /^(supermarket|convenience|department_store|mall|kiosk|vacant|chemist|fuel|e-cigarette|tobacco|alcohol|lottery|pawnbroker|money_lender)$/,
  amenity: /^(hospital|pharmacy|school|college|university|bank|atm|fuel|place_of_worship)$/,
  healthcare: /^(hospital|pharmacy|laboratory|blood_donation|birthing_centre)$/,
};

// Nicho de salud mental: por la etiqueta o por el nombre. El rubro sale de la
// misma lista que NICHOS.salud_mental en src/lib/leads.ts, para que el correo
// lleve el botón del nicho.
const NOMBRE_SALUD = /\b(aba|behaviou?r(al)?|autism|counsel(l)?ing|mental|psycholog\w*|psychiatr\w*|therap(y|ies|ist|ists)|speech|occupational|recovery|addiction|rehab\w*|wellness)\b/i;
function rubroSalud(nombre, tags) {
  const t = `${nombre} ${tags.healthcare ?? ""} ${tags["healthcare:speciality"] ?? ""}`.toLowerCase();
  if (/physio|physical therap/.test(t)) return null;
  // Hospitales, asilos y centros de cuidado: instituciones, no clientes.
  if (/hospital|nursing|care center|assisted living|senior|hgh|drip bar/.test(t)) return null;
  if (/\baba\b|behaviou?r/.test(t)) return "ABA therapy";
  if (/autism/.test(t)) return "autism center";
  if (/psychiatr/.test(t)) return "psychiatrist";
  if (/psycholog/.test(t)) return "psychologist";
  if (/speech/.test(t)) return "speech therapy";
  if (/occupational/.test(t)) return "occupational therapy";
  if (/addiction|recovery|rehab/.test(t)) return "addiction treatment center";
  if (/counsel/.test(t)) return "counseling center";
  if (/famil/.test(t) && /therap/.test(t)) return "family therapist";
  if (/mental|psychotherap|therap/.test(t)) return "mental health clinic";
  return null;
}

function categoria(tags) {
  for (const clave of Object.keys(RUBROS)) {
    const valor = tags[clave];
    if (!valor) continue;
    if (FUERA[clave]?.test(valor)) return { fuera: true };
    const fila = RUBROS[clave][valor];
    if (fila) return { rubro: fila[0], tipo: `${fila[1]} ${clave}=${valor}` };
    if (clave === "shop") return { rubro: "store", tipo: `store ${valor}` };
    if (clave === "craft") return { rubro: "contractor", tipo: `contractor ${valor}` };
  }
  return null;
}

// Cadenas que en el mapa a veces no llevan la etiqueta de marca. No son
// clientes: su página la hace la casa matriz.
const CADENAS = /^(starbucks|mcdonald'?s|subway|dunkin'?|burger king|wendy'?s|taco bell|kfc|popeyes|chick-fil-a|chipotle|panera|domino'?s|pizza hut|papa john'?s|little caesars|five guys|shake shack|sweetgreen|pollo tropical|wingstop|jersey mike'?s|jimmy john'?s|dairy queen|baskin|cinnabon|auntie anne'?s|krispy kreme|tim hortons|pret a manger|costa coffee|greggs|nando'?s|walgreens|cvs|rite aid|7-eleven|circle k|publix|walmart|target|costco|whole foods|trader joe'?s|aldi|lidl|tesco|sainsbury'?s|boots|home depot|lowe'?s|best buy|apple store|t-mobile|verizon|at&t|sprint|metro by t-mobile|cricket|boost mobile|ups store|the ups store|fedex|usps|chase|bank of america|wells fargo|citibank|td bank|bbva|santander|barclays|hsbc|lloyds|natwest|sephora|ulta|bath & body works|victoria'?s secret|gap|old navy|h&m|zara|nike|adidas|foot locker|supercuts|great clips|sport clips|planet fitness|la fitness|equinox|orangetheory|f45|24 hour fitness|anytime fitness|massage envy|european wax center|h&r block|jackson hewitt|state farm|allstate|geico|farmers insurance|remax|re\/max|keller williams|coldwell banker|century 21|compass|enterprise|hertz|avis|budget|jiffy lube|midas|pep boys|autozone|o'?reilly|advance auto|firestone|goodyear|petco|petsmart|banfield|vca)\b/i;
const esCadena = (t) => Boolean(t.brand || t["brand:wikidata"] || t["operator:wikidata"] || CADENAS.test((t.name ?? "").trim()));

function website(t) {
  let w = t.website || t["contact:website"] || t.url || null;
  if (!w) return null;
  w = String(w).split(/[;\s]/)[0].trim();
  if (!/^https?:\/\//i.test(w)) w = `https://${w}`;
  try {
    return new URL(w).href;
  } catch {
    return null;
  }
}

function direccion(t) {
  const calle = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
  const resto = [t["addr:unit"] && `#${t["addr:unit"]}`, t["addr:city"], t["addr:state"], t["addr:postcode"]].filter(Boolean).join(", ");
  return [calle, resto].filter(Boolean).join(", ") || null;
}

/**
 * Los negocios independientes de la zona, en el formato que buscar.mjs ya
 * conocía de Places (place_id "osm:node/123"). Reparte entre rubros, pone
 * primero a quien tiene website o correo (se le puede escribir) y deja unos
 * pocos sin website para la lista de llamadas.
 */
export async function negociosOsm(zona, { maximo = 100, semilla = 0, nicho = null } = {}) {
  const centro = await centroDe(zona);
  const ciudadGrande = (zona.poblacion ?? 0) >= 1_000_000;
  const radio = /^\d{5}$/.test(zona.id) ? 3000 : ciudadGrande ? 6000 : (zona.poblacion ?? 0) >= 150_000 ? 5000 : 4000;
  // El nicho está menos cargado en el mapa: se busca más lejos.
  const r = `around:${nicho ? radio * 4 : radio},${centro.lat.toFixed(5)},${centro.lon.toFixed(5)}`;
  const consulta = nicho
    ? `[out:json][timeout:90];(
        nwr(${r})["name"]["healthcare"];
        nwr(${r})["name"]["amenity"~"^(clinic|doctors)$"];
        nwr(${r})["name"~"ABA|Behavior|Behaviour|Autism|Counsel|Mental|Psycholog|Psychiatr|Therap|Speech|Occupational|Addiction|Recovery",i]["office"];
      );out center tags;`
    : `[out:json][timeout:90];(
        nwr(${r})["name"]["shop"];
        nwr(${r})["name"]["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|dentist|doctors|clinic|veterinary|childcare|kindergarten|driving_school|language_school|music_school|car_wash|car_repair)$"];
        nwr(${r})["name"]["office"];
        nwr(${r})["name"]["craft"];
        nwr(${r})["name"]["healthcare"];
        nwr(${r})["name"]["leisure"~"^(fitness_centre|sports_centre|dance)$"];
      );out center tags;`;
  const elementos = await overpass(consulta);

  const vistos = new Set();
  const porRubro = new Map();
  for (const e of elementos) {
    const t = e.tags ?? {};
    const nombre = (t.name ?? "").trim();
    if (!nombre || esCadena(t) || t.disused || t["disused:shop"]) continue;
    let cat = categoria(t);
    if (nicho) {
      const salud = rubroSalud(nombre, t);
      if (!salud) continue;
      cat = { rubro: salud, tipo: `therapy mental ${cat?.tipo ?? ""}`.trim() };
    }
    if (!cat || cat.fuera) continue;
    const web = website(t);
    const llave = web ? new URL(web).hostname.replace(/^www\./, "") : nombre.toLowerCase();
    if (vistos.has(llave)) continue;
    vistos.add(llave);
    const correo = (t["contact:email"] || t.email || "").split(/[;\s]/)[0].trim().toLowerCase() || null;
    const c = {
      place_id: `osm:${e.type}/${e.id}`,
      nombre,
      direccion: direccion(t),
      telefono: t.phone || t["contact:phone"] || null,
      website: web,
      email_osm: correo && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(correo) ? correo : null,
      tipo_google: cat.tipo,
      busqueda: cat.rubro,
      rating: null,
      resenas: null,
      posicion: null,
      maps: null,
      conocido: null,
      fuente: "osm",
    };
    if (!porRubro.has(cat.rubro)) porRubro.set(cat.rubro, []);
    porRubro.get(cat.rubro).push(c);
  }

  // Dentro de cada rubro: primero con correo, luego con website, luego el resto.
  const valor = (c) => (c.email_osm ? 3 : 0) + (c.website ? 2 : 0) + (c.telefono ? 1 : 0);
  for (const lista of porRubro.values()) lista.sort((a, b) => valor(b) - valor(a));
  // El orden de los rubros rota con la zona, como antes con Places.
  const rubros = [...porRubro.keys()].sort();
  const desde = rubros.length ? semilla % rubros.length : 0;
  const orden = [...rubros.slice(desde), ...rubros.slice(0, desde)];

  const conWeb = [];
  const sinWeb = [];
  let vuelta = 0;
  while (conWeb.length + sinWeb.length < maximo && orden.some((k) => porRubro.get(k).length > vuelta)) {
    for (const k of orden) {
      const c = porRubro.get(k)[vuelta];
      if (!c) continue;
      if (c.website || c.email_osm) conWeb.push(c);
      else if (sinWeb.length < 25 && c.telefono) sinWeb.push(c);
      if (conWeb.length + sinWeb.length >= maximo) break;
    }
    vuelta++;
  }
  return { candidatos: [...conWeb, ...sinWeb], encontrados: elementos.length, centro };
}
