// Vérification des liens de pièces (utilisé par le site ET par le serveur).
// But : refuser les liens dangereux ou qui ne mènent pas à un vêtement/accessoire.

export type LinkProblem = "not_https" | "bad_host" | "shortener" | "file" | "not_shop" | "blocked" | "not_fashion";

// Raccourcisseurs : ils cachent la vraie destination
const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rebrand.ly", "shorturl.at",
  "rb.gy", "t.ly", "tiny.cc", "lnkd.in", "s.id", "v.gd", "shorte.st", "adf.ly", "linktr.ee", "beacons.ai", "bio.link",
  "lnk.bio", "taplink.cc", "qrco.de", "urlz.fr", "frama.link",
]);

// Sites qui ne sont pas des boutiques (réseaux, messageries, fichiers, paiements…)
const NOT_SHOPS = [
  "tiktok.com", "instagram.com", "facebook.com", "fb.com", "youtube.com", "youtu.be", "x.com", "twitter.com",
  "snapchat.com", "pinterest.com", "pin.it", "reddit.com", "discord.com", "discord.gg", "t.me", "telegram.me",
  "wa.me", "whatsapp.com", "google.com", "docs.google.com", "drive.google.com", "forms.gle", "dropbox.com",
  "mega.nz", "wetransfer.com", "mediafire.com", "onedrive.live.com", "paypal.com", "paypal.me", "revolut.me",
  "lydia-app.com", "cash.app", "venmo.com", "onlyfans.com", "twitch.tv",
];

// Boutiques de mode connues : acceptées même si leur page ne se laisse pas lire
const FASHION_SHOPS = [
  "zara.com", "hm.com", "www2.hm.com", "asos.com", "zalando.be", "zalando.fr", "zalando.com", "zalando.de", "zalando.nl",
  "shein.com", "nike.com", "adidas.com", "adidas.be", "adidas.fr", "puma.com", "newbalance.com", "newbalance.fr",
  "vinted.be", "vinted.fr", "vinted.com", "mango.com", "bershka.com", "pullandbear.com", "stradivarius.com",
  "massimodutti.com", "uniqlo.com", "primark.com", "jdsports.be", "jdsports.fr", "footlocker.be", "footlocker.fr",
  "courir.com", "snipes.com", "levi.com", "carhartt-wip.com", "stussy.com", "ralphlauren.com", "ralphlauren.fr",
  "lacoste.com", "tommy.com", "calvinklein.be", "calvinklein.fr", "thenorthface.com", "patagonia.com", "converse.com",
  "vans.com", "vans.fr", "drmartens.com", "timberland.com", "timberland.fr", "sezane.com", "sandro-paris.com",
  "maje.com", "claudiepierlot.com", "ba-sh.com", "apc.fr", "amiparis.com", "jacquemus.com", "isabelmarant.com",
  "celio.com", "jules.com", "kiabi.be", "kiabi.com", "c-and-a.com", "lafayette.com", "galerieslafayette.com",
  "inno.be", "printemps.com", "farfetch.com", "ssense.com", "mytheresa.com", "net-a-porter.com", "endclothing.com",
  "aboutyou.be", "aboutyou.fr", "aboutyou.com", "boohoo.com", "prettylittlething.com", "prettylittlething.fr",
  "urbanoutfitters.com", "weekday.com", "cos.com", "arket.com", "monki.com", "otherstories.com", "veja-store.com",
  "birkenstock.com", "ugg.com", "asics.com", "reebok.com", "fila.com", "champion.com", "ellesse.com", "kappa.com",
  "superdry.com", "guess.eu", "guess.com", "diesel.com", "gucci.com", "prada.com", "louisvuitton.com", "dior.com",
  "balenciaga.com", "ysl.com", "versace.com", "burberry.com", "moncler.com", "stoneisland.com", "cpcompany.com",
  "palaceskateboards.com", "supremenewyork.com", "kith.com", "corteiz.com", "trapstarlondon.com", "represent.clo",
  "representclo.com", "fearofgod.com", "essentials.com", "ami.fr", "jennyfer.com", "pimkie.com", "promod.eu",
  "camaieu.fr", "etam.com", "undiz.com", "intimissimi.com", "calzedonia.com", "tezenis.com", "lululemon.com",
  "gymshark.com", "decathlon.be", "decathlon.fr", "pandora.net", "swarovski.com", "rayban.com", "ray-ban.com",
  "daniel-wellington.com", "eastpak.com", "herschel.com", "longchamp.com", "michaelkors.com", "coach.com",
  "lescarpin.com", "eram.fr", "sarenza.com", "spartoo.be", "spartoo.com", "zalando-lounge.be", "veepee.be",
  "vestiairecollective.com", "depop.com", "grailed.com", "stockx.com", "goat.com", "klekt.com", "laboutiqueofficielle.com",
  "amazon.fr", "amazon.com.be", "amazon.de", "amazon.com", "aliexpress.com", "etsy.com", "ebay.fr", "ebay.com",
]; // NB : grands magasins généralistes acceptés, mais la page doit ensuite parler d'un vêtement (voir isFashionText)

const GENERALIST = new Set(["amazon.fr", "amazon.com.be", "amazon.de", "amazon.com", "aliexpress.com", "etsy.com", "ebay.fr", "ebay.com"]);

const FILE_EXT = /\.(exe|apk|msi|dmg|pkg|bat|cmd|scr|js|jar|zip|rar|7z|iso|bin|sh|ps1|vbs|pdf|docm|xlsm)(\?|#|$)/i;

export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const matches = (host: string, list: Iterable<string>) => {
  for (const d of list) if (host === d || host.endsWith(`.${d}`)) return true;
  return false;
};

/** Contrôle de la forme du lien (sans aller sur la page). null = OK. */
export function checkLinkShape(raw: string): LinkProblem | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return "bad_host";
  }
  if (u.protocol !== "https:") return "not_https";
  if (raw.length > 2048 || u.username || u.password || u.port) return "bad_host";
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) || /^[\d.]+$/.test(host) || /(^|\.)xn--/.test(host)) return "bad_host";
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return "bad_host";
  if (SHORTENERS.has(host)) return "shortener";
  if (FILE_EXT.test(u.pathname)) return "file";
  if (matches(host, NOT_SHOPS)) return "not_shop";
  return null;
}

/** Boutique de mode connue (sauf grands magasins généralistes). */
export function isKnownFashionShop(url: string): boolean {
  const host = linkHost(url);
  return !GENERALIST.has(host) && matches(host, FASHION_SHOPS);
}

const FASHION_WORDS = [
  // FR
  "vetement", "robe", "jupe", "pantalon", "jean", "short", "chemise", "chemisier", "t-shirt", "tshirt", "tee-shirt", "top",
  "pull", "sweat", "hoodie", "veste", "manteau", "blouson", "doudoune", "gilet", "cardigan", "legging", "jogging",
  "survetement", "maillot", "chaussure", "basket", "sneaker", "botte", "bottine", "sandale", "mocassin", "escarpin",
  "talon", "sac", "pochette", "ceinture", "casquette", "bonnet", "chapeau", "echarpe", "foulard", "gant", "lunette",
  "bijou", "collier", "bracelet", "bague", "boucle", "montre", "chaussette", "lingerie", "soutien", "culotte", "boxer",
  "pyjama", "costume", "blazer", "tailleur", "polo", "debardeur", "body", "combinaison", "salopette", "parka", "trench",
  "kimono", "tunique", "corset", "bustier", "cargo", "denim", "maille", "polaire", "mode", "taille", "coton", "lin",
  "cuir", "daim", "laine", "cachemire", "soie",
  // EN
  "dress", "skirt", "pants", "trousers", "jeans", "shirt", "tee", "sweater", "jumper", "sweatshirt", "jacket", "coat",
  "puffer", "vest", "leggings", "joggers", "tracksuit", "shoe", "sneakers", "trainers", "boots", "sandals", "loafers",
  "heels", "bag", "handbag", "tote", "backpack", "belt", "cap", "beanie", "hat", "scarf", "gloves", "sunglasses",
  "jewelry", "jewellery", "necklace", "earring", "ring", "watch", "socks", "underwear", "bra", "suit", "tank",
  "bodysuit", "jumpsuit", "overalls", "knit", "knitwear", "fleece", "apparel", "clothing", "fashion", "wear", "outfit",
  "size", "cotton", "leather", "wool", "cashmere", "silk", "streetwear", "sneaker",
];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Le texte (nom du produit, adresse de la page…) parle-t-il d'un vêtement ou accessoire ? */
export function isFashionText(...texts: string[]): boolean {
  const words = new Set(normalize(texts.join(" ")).split(/[^a-z0-9-]+/).flatMap((w) => [w, w.replace(/s$/, ""), ...w.split("-")]));
  return FASHION_WORDS.some((w) => words.has(w));
}

/** Erreur renvoyée par la base quand un lien est refusé → clé de texte à afficher. */
export function linkErrorKey(message: string | undefined): `link.${LinkProblem}` | null {
  if (!message) return null;
  if (message.includes("link_not_https")) return "link.not_https";
  if (message.includes("link_bad_host")) return "link.bad_host";
  if (message.includes("link_blocked")) return "link.blocked";
  return null;
}
