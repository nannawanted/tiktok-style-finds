import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { Camera, Instagram, Music2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkUploadedImage } from "@/lib/nsfw-check";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { fetchCreatorProfile } from "@/lib/public-data";
import { styleLabelKey, type StyleKey } from "@/lib/styles";
import { absoluteUrl, clip, DEFAULT_OG_IMAGE, profilePath, SITE_NAME } from "@/lib/site";
import { ShareButton } from "@/components/ShareButton";
import { Avatar, OutfitGrid } from "@/components/vitrine/OutfitCard";
import { FollowButton } from "@/components/vitrine/FollowButton";
import { MadeWithBadge } from "@/components/vitrine/MadeWith";
import { EmptyBox } from "@/components/vitrine/EmptyBox";
import { ImageCropDialog } from "@/components/vitrine/ImageCropDialog";
import { FollowedByLine, FollowSuggestions, ProfileStats } from "@/components/vitrine/FollowLists";

export const Route = createFileRoute("/@{$username}")({
  loader: async ({ params }) => {
    const data = await fetchCreatorProfile(params.username);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `Créateur | ${SITE_NAME}` }, { name: "robots", content: "noindex" }] };
    const { creator, outfits } = loaderData;
    const url = absoluteUrl(profilePath(creator.username));
    const description = clip(
      `${creator.bio ? `${creator.bio} — ` : ""}@${creator.username} : ${outfits.length} tenue${outfits.length > 1 ? "s" : ""}, toutes avec le lien de chaque pièce, sur WantedFashion.`,
    );
    const image = outfits.find((o) => o.cover_image)?.cover_image ?? creator.profile_image ?? DEFAULT_OG_IMAGE;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url,
      mainEntity: {
        "@type": "Person",
        name: `@${creator.username}`,
        alternateName: creator.username,
        ...(creator.bio ? { description: creator.bio } : {}),
        ...(creator.profile_image ? { image: creator.profile_image } : {}),
        sameAs: [creator.tiktok_url, creator.instagram_url].filter(Boolean),
      },
    };
    return {
      meta: [
        { title: `@${creator.username} — ses tenues pièce par pièce | ${SITE_NAME}` },
        { name: "description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:title", content: `@${creator.username} sur WantedFashion` },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }],
    };
  },
  component: ProfilePage,
  notFoundComponent: NotFoundProfile,
});

function NotFoundProfile() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-24 text-center">
      <p className="text-lg text-foreground/75">{t("profile.notFound")}</p>
      <Link to="/createurs" className="rounded-full bg-ink px-6 py-3 font-bold text-surface">
        {t("nav2.creators")}
      </Link>
    </main>
  );
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Changer de profil = repartir de zéro (filtres et tri remis par défaut)
function ProfilePage() {
  const { creator } = Route.useLoaderData();
  return <ProfileContent key={creator.id} />;
}

function ProfileContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { creator, outfits } = Route.useLoaderData();
  const isOwner = user?.id === creator.id;
  const [filter, setFilter] = useState<StyleKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<{ kind: "avatars" | "banners"; file: File } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  // Styles présents dans les tenues du créateur (pour filtrer sa page)
  const outfitStyles = useMemo(() => {
    const s = new Set<StyleKey>();
    outfits.forEach((o) => o.styles.forEach((x) => s.add(x)));
    return [...s];
  }, [outfits]);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const activeFilter = filter && outfitStyles.includes(filter) ? filter : null;
  const filtered = activeFilter ? outfits.filter((o) => o.styles.includes(activeFilter)) : outfits;
  // Récents : looks épinglés d'abord (comme Insta), puis ordre de publication. Populaires : les plus likés.
  // Récents : comme Instagram, les looks épinglés sont simplement les premiers de la liste
  const pinned =
    sort === "recent" ? filtered.filter((o) => o.pinned_at).sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? "")) : [];
  const shown =
    sort === "popular"
      ? filtered.map((o, i) => ({ o, i })).sort((a, b) => b.o.likes - a.o.likes || a.i - b.i).map(({ o }) => o)
      : [...pinned, ...filtered.filter((o) => !pinned.includes(o))];

  async function upload(kind: "avatars" | "banners", file: File) {
    if (!isOwner) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error(t("profile.uploadError"));
      return;
    }
    setUploading(true);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${creator.id}.${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(kind).upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(t("profile.uploadError"));
      return;
    }
    if ((await checkUploadedImage(kind, path)) === "explicit") {
      setUploading(false);
      toast.error(t("safety.explicit"));
      return;
    }
    const { data } = supabase.storage.from(kind).getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase
      .from("creators")
      .update(kind === "avatars" ? { profile_image: url } : { banner_image: url })
      .eq("id", creator.id);
    setUploading(false);
    if (error) {
      toast.error(t("profile.saveError"));
      return;
    }
    toast.success(t("profile.updated"));
    router.invalidate();
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-ink text-surface" : "border border-border bg-surface text-foreground hover:border-foreground/40"
    }`;

  return (
    <main className="mx-auto max-w-5xl md:px-6 md:pt-6">
      <div className="relative h-40 overflow-hidden bg-secondary sm:h-56 md:rounded-[28px]">
        {creator.banner_image && <img src={creator.banner_image} alt="" className="h-full w-full object-cover" />}
        <div className="absolute right-3 top-3 flex gap-2">
          {isOwner && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => bannerInput.current?.click()}
              className="flex h-11 items-center gap-2 rounded-full bg-surface/95 px-4 text-sm font-semibold"
            >
              <Camera className="h-4 w-4" aria-hidden="true" /> {t("profile.changeBanner")}
            </button>
          )}
          <ShareButton
            title={`@${creator.username} sur WantedFashion`}
            image={creator.profile_image}
            url={absoluteUrl(profilePath(creator.username))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/95"
            iconClassName="h-5 w-5"
          />
        </div>
      </div>

      <div className="relative -mt-14 flex flex-col items-center px-4 text-center">
        <div className="relative">
          <span className="block rounded-full bg-background p-1 ring-[3px] ring-primary">
            <Avatar src={creator.profile_image} name={creator.username} className="h-28 w-28 text-3xl" />
          </span>
          {isOwner && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => avatarInput.current?.click()}
              aria-label={t("profile.changePhoto")}
              className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-surface shadow"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <h1 className="font-display fade-up mt-3 text-3xl font-bold">@{creator.username}</h1>
        {creator.bio && <p className="mt-2 max-w-md whitespace-pre-line text-[15px] leading-relaxed text-foreground/75">{creator.bio}</p>}

        {creator.styles.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
            {creator.styles.map((s) => (
              <li key={s}>
                <Link to="/createurs" search={{ style: s }} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/80 hover:border-foreground/50">
                  {t(styleLabelKey(s))}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {(creator.tiktok_url || creator.instagram_url) && (
          <div className="mt-4 flex gap-2">
            {creator.tiktok_url && (
              <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer me" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-surface">
                <Music2 className="h-4 w-4" aria-hidden="true" /> TikTok
              </a>
            )}
            {creator.instagram_url && (
              <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer me" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-bold">
                <Instagram className="h-4 w-4" aria-hidden="true" /> Instagram
              </a>
            )}
          </div>
        )}

        <ProfileStats creatorId={creator.id} outfitCount={outfits.length} />
        <FollowedByLine creatorId={creator.id} />

        <div className="mt-5 w-full max-w-sm">
          {isOwner ? (
            <div className="flex gap-2">
              <Link to="/dashboard/settings" className="flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-surface font-bold">
                {t("profile.edit")}
              </Link>
              <Link to="/dashboard/post/new" className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary font-bold text-primary-foreground">
                <Plus className="h-4 w-4" aria-hidden="true" /> {t("profile.publish")}
              </Link>
            </div>
          ) : (
            <FollowButton creatorId={creator.id} size="lg" tone="brand" className="w-full" />
          )}
        </div>
      </div>

      <section className="mt-8 px-4 md:px-0">
        {outfits.length > 1 && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{t("profile.looks")}</h2>
            <div className="flex shrink-0 gap-1 rounded-full bg-surface p-1" role="tablist" aria-label={t("profile.sortLabel")}>
              {(["recent", "popular"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={sort === k}
                  onClick={() => setSort(k)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${sort === k ? "bg-ink text-surface" : "text-foreground/70"}`}
                >
                  {k === "recent" ? t("profile.sortRecent") : t("profile.sortPopular")}
                </button>
              ))}
            </div>
          </div>
        )}
        {outfitStyles.length > 0 && (
          <div className="no-scrollbar sticky top-[var(--sticky-top,118px)] z-30 -mx-4 mb-5 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2.5 backdrop-blur-md transition-[top] duration-300 md:mx-0 md:px-0" role="group">
            <button type="button" aria-pressed={!activeFilter} className={chip(!activeFilter)} onClick={() => setFilter(null)}>
              {t("profile.all")} · {outfits.length}
            </button>
            {outfitStyles.map((s) => (
              <button key={s} type="button" aria-pressed={activeFilter === s} className={chip(activeFilter === s)} onClick={() => setFilter(activeFilter === s ? null : s)}>
                {t(styleLabelKey(s))}
              </button>
            ))}
          </div>
        )}
        {shown.length ? (
          <OutfitGrid outfits={shown} showCreator={false} showPinned={sort === "recent"} />
        ) : isOwner ? (
          <EmptyBox text={t("profile.emptyOwner")} action={{ to: "/dashboard/post/new", label: t("profile.publish") }} />
        ) : (
          <EmptyBox text={t("profile.empty")} />
        )}
      </section>

      <FollowSuggestions creatorId={creator.id} styles={creator.styles} />

      <div className="mt-12 flex justify-center px-4 empty:hidden">
        <MadeWithBadge />
      </div>

      <input
        ref={avatarInput}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPending({ kind: "avatars", file: f });
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInput}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPending({ kind: "banners", file: f });
          e.target.value = "";
        }}
      />
      <ImageCropDialog
        file={pending?.file ?? null}
        aspect={pending?.kind === "banners" ? 3 : 1}
        round={pending?.kind === "avatars"}
        onCancel={() => setPending(null)}
        onDone={(f) => {
          const kind = pending?.kind;
          setPending(null);
          if (kind) upload(kind, f);
        }}
      />
    </main>
  );
}
