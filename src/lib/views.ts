// Vues des looks. Le comptage et les protections anti-fausses vues se font sur le serveur
// (fonction record_post_view) : 1 vue max toutes les 30 min par personne et par look,
// plafonds par heure, robots ignorés, le créateur ne compte pas ses propres vues.

/** Identifiant anonyme de ce navigateur (aucune donnée personnelle). */
export function deviceId(): string {
  try {
    let id = localStorage.getItem("wf_device");
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem("wf_device", id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // navigation privée : la limite par connexion protège quand même
  }
}

/** 1 234 → « 1,2 k », comme sur TikTok / Instagram. */
export function compactCount(n: number, locale = "fr"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
