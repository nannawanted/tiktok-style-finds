// Vocabulaire de la recherche visuelle : chaque notion (couleur, vêtement,
// motif, matière, lieu, ambiance…) a une phrase en anglais que l'IA comprend
// (« prompt ») et les mots FR/EN qu'on peut taper dans la barre de recherche.
// Les empreintes des phrases sont calculées une fois (bouton admin) et rangées
// en base ; la recherche compare ensuite ces empreintes aux photos des tenues.

type Cat = "color" | "item" | "pattern" | "material" | "place" | "vibe" | "detail";

const PROMPT: Record<Cat, (en: string) => string> = {
  color: (en) => `a photo of a person wearing ${en} clothes`,
  item: (en) => `a photo of a person wearing ${en}`,
  pattern: (en) => `a photo of clothes with a ${en} pattern`,
  material: (en) => `a photo of a person wearing ${en} clothes`,
  place: (en) => `a photo of a person ${en}`,
  vibe: (en) => `a photo of a ${en} outfit`,
  detail: (en) => `a photo of a person with ${en}`,
};

// clé | catégorie | anglais (pour l'IA) | mots qu'on peut taper (séparés par des virgules)
const RAW = `
black|color|black|noir,noire,noirs,noires,black,all black,total black
white|color|white|blanc,blanche,blancs,blanches,white
grey|color|grey|gris,grise,grises,grey,gray
beige|color|beige|beige,beiges,sable,nude
cream|color|cream and off-white|creme,ecru,ivoire,cream,off white
brown|color|brown|marron,marrons,brun,brune,chocolat,brown
camel|color|camel|camel,caramel,cognac
red|color|red|rouge,rouges,red
burgundy|color|burgundy|bordeaux,burgundy,lie de vin,cerise
pink|color|pink|rose,roses,pink,fuchsia
baby-pink|color|pastel pink|rose pale,rose pastel,rose poudre,baby pink
orange|color|orange|orange,oranges
yellow|color|yellow|jaune,jaunes,yellow,moutarde
green|color|green|vert,verte,verts,vertes,green
khaki|color|khaki and olive green|kaki,olive,vert militaire,khaki
sage|color|sage green|vert sauge,sauge,sage
blue|color|blue|bleu,bleue,bleus,bleues,blue
light-blue|color|light blue|bleu clair,bleu ciel,ciel,light blue
navy|color|navy blue|bleu marine,marine,navy
purple|color|purple|violet,violette,violets,mauve,lilas,lavande,purple
gold|color|gold|dore,doree,or,gold
silver|color|silver metallic|argent,argente,argentee,metallise,silver
colorful|color|very colorful|colore,coloree,multicolore,couleurs vives,colorful
neutral|color|neutral beige and white tones|neutre,neutres,tons neutres,neutral
jacket|item|a jacket|veste,vestes,jacket,blouson
leather-jacket|item|a leather jacket|veste en cuir,blouson en cuir,perfecto,leather jacket
denim-jacket|item|a denim jacket|veste en jean,denim jacket
puffer|item|a puffer jacket|doudoune,doudounes,puffer
bomber|item|a bomber jacket|bomber,blouson aviateur
varsity|item|a varsity jacket|veste universitaire,varsity,teddy
trench|item|a trench coat|trench,trench coat,imper
coat|item|a long coat|manteau,manteaux,coat
blazer|item|a blazer|blazer,veste de costume,veston
suit|item|a suit|costume,costumes,suit,tailleur
windbreaker|item|a windbreaker|coupe vent,windbreaker,k way
hoodie|item|a hoodie|sweat a capuche,hoodie,capuche,hoodies
sweatshirt|item|a sweatshirt|sweat,sweats,sweatshirt,crewneck
sweater|item|a knit sweater|pull,pulls,sweater,tricot,maille
cardigan|item|a cardigan|cardigan,gilet
vest|item|a sleeveless vest|gilet sans manches,doudoune sans manches,vest
shirt|item|a button-up shirt|chemise,chemises,shirt
flannel|item|a flannel shirt|chemise a carreaux,flanelle,flannel
polo|item|a polo shirt|polo,polos
tshirt|item|a t-shirt|t shirt,tshirt,tee shirt,tee,t shirts
graphic-tee|item|a graphic t-shirt|t shirt imprime,graphic tee,tee imprime
tank-top|item|a tank top|debardeur,marcel,tank top
crop-top|item|a crop top|crop top,top court,brassiere
blouse|item|a blouse|blouse,chemisier
corset|item|a corset top|corset,bustier
jersey|item|a football jersey|maillot,maillot de foot,jersey,maillot de football
dress|item|a dress|robe,robes,dress
maxi-dress|item|a long maxi dress|robe longue,maxi dress
mini-dress|item|a mini dress|robe courte,mini robe,mini dress
skirt|item|a skirt|jupe,jupes,skirt
mini-skirt|item|a mini skirt|mini jupe,minijupe,mini skirt
jeans|item|jeans|jean,jeans,denim
baggy-jeans|item|baggy jeans|jean baggy,baggy,jean large,jean oversize
flare-jeans|item|flare jeans|jean flare,flare,patte d eph,pattes d eph
trousers|item|tailored trousers|pantalon,pantalons,pantalon de costume,trousers,pants
cargo|item|cargo pants|cargo,pantalon cargo,cargos
sweatpants|item|sweatpants|jogging,joggings,survet,sweatpants,jogger
tracksuit|item|a tracksuit|survetement,tracksuit,ensemble jogging
shorts|item|shorts|short,shorts,bermuda
leggings|item|leggings|legging,leggings,caleçon
sneakers|item|sneakers|baskets,basket,sneakers,sneaker,tennis
white-sneakers|item|white sneakers|baskets blanches,sneakers blanches,white sneakers
boots|item|boots|bottes,botte,boots,bottines
cowboy-boots|item|cowboy boots|santiags,bottes cowboy,cowboy boots
loafers|item|loafers|mocassins,mocassin,loafers
heels|item|high heels|talons,talon,escarpins,heels,talons hauts
sandals|item|sandals|sandales,sandale,sandals,claquettes,tongs
ballet-flats|item|ballet flats|ballerines,ballerine,ballet flats
cap|item|a baseball cap|casquette,casquettes,cap
beanie|item|a beanie|bonnet,bonnets,beanie
bucket-hat|item|a bucket hat|bob,bucket hat
hat|item|a hat|chapeau,chapeaux,hat
sunglasses|item|sunglasses|lunettes de soleil,lunettes,sunglasses
glasses|item|glasses|lunettes de vue,glasses
handbag|item|a handbag|sac,sac a main,sacs,handbag,bag
tote|item|a tote bag|tote bag,cabas,tote
backpack|item|a backpack|sac a dos,backpack
crossbody|item|a crossbody bag|sacoche,banane,crossbody,sac banane
scarf|item|a scarf|echarpe,foulard,scarf
belt|item|a belt|ceinture,belt
jewelry|item|jewelry and necklaces|bijoux,collier,colliers,chaine,chaines,jewelry,necklace
watch|item|a wristwatch|montre,watch
socks|item|visible socks|chaussettes,socks
gloves|item|gloves|gants,gloves
tie|item|a tie|cravate,tie
uniform|item|a school uniform|uniforme,uniform
swimsuit|item|a swimsuit|maillot de bain,bikini,swimsuit
pyjama|item|pyjamas|pyjama,pyjamas,tenue d interieur
stripes|pattern|striped|rayures,raye,rayee,a rayures,stripes,striped,mariniere
plaid|pattern|plaid tartan|carreaux,a carreaux,tartan,plaid,vichy
floral|pattern|floral|fleuri,fleurie,fleurs,a fleurs,floral
leopard|pattern|leopard print|leopard,leo,animal print
zebra|pattern|zebra print|zebre,zebra
camo|pattern|camouflage|camouflage,camo,militaire
polka|pattern|polka dot|pois,a pois,polka dots
logo|pattern|big logo print|logo,logos,gros logo,monogramme
plain|pattern|plain solid color|uni,unie,sans motif
leather|material|leather|cuir,leather,simili cuir
suede|material|suede|daim,suede
denim-material|material|denim|denim,toile de jean
wool|material|wool knit|laine,wool,tricote
satin|material|satin silk|satin,soie,silk
lace|material|lace|dentelle,lace
linen|material|linen|lin,linen
fur|material|faux fur|fourrure,moumoute,fur,sherpa
velvet|material|velvet|velours,velvet
mesh|material|sheer mesh|transparent,resille,mesh
cotton|material|cotton|coton,cotton
beach|place|at the beach|plage,mer,beach,bord de mer,vacances
snow|place|in the snow|neige,ski,snow,montagne,hiver
street|place|in a city street|rue,ville,street,urbain,city
mirror|place|taking a mirror selfie|miroir,selfie,mirror selfie,fit check
park|place|in a park with trees|parc,nature,foret,park
night|place|at night|nuit,night,de nuit
club|place|at a party club at night|boite,club,fete,soiree,party
office|place|in an office|bureau,travail,office,taf
wedding|place|at a wedding|mariage,wedding,ceremonie
restaurant|place|in a restaurant|restaurant,resto,diner
gym|place|at the gym|salle de sport,gym,muscu
home|place|at home indoors|maison,chez moi,interieur,appart
summer|vibe|summer|ete,estival,summer,ensoleille
winter|vibe|warm winter|hiver,hivernal,winter,froid
autumn|vibe|autumn|automne,autumn,fall
spring|vibe|spring|printemps,spring
oversize|vibe|oversized baggy|oversize,ample,large,baggy fit,loose
fitted|vibe|tight fitted|moulant,moulante,ajuste,slim,fitted
layered|vibe|layered|superposition,layering,layered
elegant|vibe|elegant formal|elegant,elegante,habille,habillee,classe,formal
sporty|vibe|sporty athletic|sportif,sportive,athleisure,sporty
cozy|vibe|cozy comfortable|cosy,confort,confortable,cozy,comfy
luxury|vibe|luxury designer|luxe,luxueux,designer,luxury,haut de gamme
streetwear|vibe|streetwear|streetwear,street wear,urbain
y2k|vibe|y2k 2000s|y2k,annees 2000,2000s
vintage|vibe|vintage retro|vintage,retro,friperie,annees 90,90s
minimal|vibe|minimalist|minimaliste,minimal,epure,sobre
romantic|vibe|romantic feminine|romantique,feminin,feminine,girly
edgy|vibe|edgy dark|edgy,dark,sombre,rock
preppy|vibe|preppy|preppy,bcbg,college
boho|vibe|bohemian boho|boheme,boho,hippie
gorpcore|vibe|outdoor hiking gorpcore|gorpcore,outdoor,randonnee,rando
couple|detail|a couple matching outfits|couple,assortis,matching
kid|detail|a child|enfant,kids,enfants
tattoos|detail|visible tattoos|tatouages,tattoo,tatoue
braids|detail|braided hair|tresses,nattes,braids
`;

export type VisualConcept = { key: string; category: Cat; prompt: string; words: string[] };

export const VISUAL_CONCEPTS: VisualConcept[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const [key, cat, en, words] = line.split("|");
    return { key, category: cat as Cat, prompt: PROMPT[cat as Cat](en), words: words.split(",").map((w) => w.trim()).filter(Boolean) };
  });

const STOP = new Set(["de", "du", "des", "en", "avec", "a", "au", "aux", "la", "le", "les", "l", "un", "une", "et", "pour", "sur", "the", "with", "for", "and", "in", "of", "look", "looks", "tenue", "tenues", "outfit", "outfits"]);

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Dictionnaire « suite de mots → notion », avec les pluriels simples
const PHRASES = new Map<string, string>();
for (const c of VISUAL_CONCEPTS) {
  for (const w of c.words) {
    const n = normalizeText(w);
    if (!n) continue;
    if (!PHRASES.has(n)) PHRASES.set(n, c.key);
    if (!n.endsWith("s") && !PHRASES.has(`${n}s`)) PHRASES.set(`${n}s`, c.key);
  }
}

/**
 * Trouve les notions visuelles dans une recherche (« veste en cuir noire » →
 * leather-jacket + black). On cherche d'abord les expressions les plus longues.
 */
export function detectVisualConcepts(query: string): string[] {
  const tokens = normalizeText(query.replace(/#/g, " ")).split(" ").filter(Boolean);
  const keys: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched = 0;
    for (let len = Math.min(4, tokens.length - i); len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(" ");
      const key = PHRASES.get(phrase);
      if (key) {
        if (!keys.includes(key)) keys.push(key);
        matched = len;
        break;
      }
    }
    if (matched) i += matched;
    else i += 1; // mot inconnu ou petit mot (de, en, avec…) : ignoré pour le visuel
  }
  // « veste en cuir » contient aussi « veste » et « cuir » : on garde la notion la plus précise
  return keys.filter((k) => !(k === "jacket" && keys.includes("leather-jacket"))).slice(0, 6);
}

export const VISUAL_STOPWORDS = STOP;

// ——— Autocomplétion et « affiner », comme Pinterest ———

// Le vocabulaire est écrit sans accents (pour la comparaison) : on les remet pour l'affichage.
const ACCENTS: Record<string, string> = {
  debardeur: "débardeur", creme: "crème", ecru: "écru", dore: "doré", doree: "dorée", argente: "argenté", argentee: "argentée",
  colore: "coloré", coloree: "colorée", survetement: "survêtement", survet: "survêt", leopard: "léopard", zebre: "zèbre",
  raye: "rayé", rayee: "rayée", echarpe: "écharpe", ete: "été", elegant: "élégant", elegante: "élégante", epure: "épuré",
  boheme: "bohème", randonnee: "randonnée", resille: "résille", boite: "boîte", fete: "fête", soiree: "soirée",
  feminin: "féminin", imprime: "imprimé", feminine: "féminine", mariniere: "marinière", metallise: "métallisé", tricote: "tricoté",
  ajuste: "ajusté", habille: "habillé", habillee: "habillée", ensoleille: "ensoleillé", estival: "estival", hivernal: "hivernal",
  luxueux: "luxueux", annees: "années", retro: "rétro", epaules: "épaules", tatoue: "tatoué", foret: "forêt", a: "à",
};
export function displayWord(w: string): string {
  return w
    .split(" ")
    .map((t) => ACCENTS[t] ?? t)
    .join(" ")
    .replace(/^t shirt/, "t-shirt")
    .replace(/^tee shirt/, "tee-shirt")
    .replace(/^coupe vent/, "coupe-vent")
    .replace(/^k way/, "k-way");
}

// Mots proposés : un par notion (le plus parlant), en français quand il existe
const FR_WORDS: { label: string; norm: string; key: string; category: Cat }[] = [];
for (const c of VISUAL_CONCEPTS) {
  for (const w of c.words.slice(0, 2)) {
    const norm = normalizeText(w);
    // pas de doublons ni de pluriels / féminins d'un mot déjà proposé (noir → noire, noirs)
    if (!norm || FR_WORDS.some((x) => x.norm === norm || norm === `${x.norm}s` || norm === `${x.norm}e` || norm === `${x.norm}es`)) continue;
    FR_WORDS.push({ label: displayWord(w), norm, key: c.key, category: c.category });
  }
}

/** Complète ce qui est tapé (« ves » → veste, veste en cuir, veste en jean…). */
export function searchCompletions(query: string, limit = 6): string[] {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const starts = FR_WORDS.filter((w) => w.norm.startsWith(q));
  const inside = FR_WORDS.filter((w) => !w.norm.startsWith(q) && w.norm.split(" ").some((t) => t.startsWith(q)));
  const sort = (a: { norm: string }, b: { norm: string }) => a.norm.length - b.norm.length;
  return [...starts.sort(sort), ...inside.sort(sort)].map((w) => w.label).slice(0, limit);
}

const REFINE: Record<Cat, string[]> = {
  color: ["noir", "blanc", "beige", "marron", "gris", "bleu", "rouge", "vert", "rose", "kaki"],
  item: ["veste", "jean", "robe", "baskets", "pull", "manteau", "jupe", "cargo", "sweat", "bottes"],
  vibe: ["oversize", "elegant", "vintage", "streetwear", "minimaliste", "cosy", "sportif", "luxe"],
  place: ["rue", "plage", "soiree", "bureau", "neige"],
  pattern: ["rayures", "carreaux", "fleuri", "leopard"],
  material: ["cuir", "jean", "laine", "satin", "daim"],
  detail: [],
};

/** Puces « affiner » sous la recherche : ce qu'on peut ajouter pour préciser. */
export function refineSuggestions(query: string, limit = 10): string[] {
  const keys = detectVisualConcepts(query);
  const cats = new Set(keys.map((k) => VISUAL_CONCEPTS.find((c) => c.key === k)?.category));
  const order: Cat[] = cats.has("item")
    ? ["color", "vibe", "material", "place"]
    : cats.has("color")
      ? ["item", "vibe", "pattern"]
      : ["color", "item", "vibe"];
  const have = new Set(normalizeText(query).split(" "));
  // On alterne les familles (une couleur, une ambiance, une couleur…) comme Pinterest
  const lists = order.map((cat) =>
    REFINE[cat].filter((w) => {
      if (have.has(w)) return false;
      const key = detectVisualConcepts(w)[0];
      return !(key && keys.includes(key));
    }),
  );
  const out: string[] = [];
  for (let i = 0; out.length < limit && lists.some((l) => l.length > i); i++) {
    for (const l of lists) if (l[i] && out.length < limit) out.push(displayWord(l[i]));
  }
  return [...new Set(out)];
}

/** Nom affiché d'une notion (« leather-jacket » → « veste en cuir »). */
export function conceptLabel(key: string): string {
  const c = VISUAL_CONCEPTS.find((x) => x.key === key);
  return c ? displayWord(c.words[0]) : key;
}

/**
 * Découpe une recherche en groupes de mots pour la recherche texte : chaque
 * mot (ou expression connue) avec ses synonymes. « baskets noires » →
 * [["baskets","basket","sneakers",…], ["noir","noire","black",…]].
 */
export function searchGroups(query: string): string[] {
  const tokens = normalizeText(query.replace(/#/g, " ")).split(" ").filter(Boolean);
  const groups: string[] = [];
  let i = 0;
  while (i < tokens.length && groups.length < 8) {
    let matched = 0;
    for (let len = Math.min(4, tokens.length - i); len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(" ");
      const key = PHRASES.get(phrase);
      if (key) {
        const c = VISUAL_CONCEPTS.find((x) => x.key === key);
        const words = [phrase, ...(c?.words ?? [])].map(normalizeText).filter(Boolean);
        groups.push([...new Set(words)].slice(0, 12).join("|"));
        matched = len;
        break;
      }
    }
    if (matched) {
      i += matched;
    } else {
      if (!STOP.has(tokens[i]) && tokens[i].length > 1) groups.push(tokens[i]);
      i += 1;
    }
  }
  return groups;
}
