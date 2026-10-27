import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import type { SuggestedCreator as CreatorCardData } from "@/lib/public-data";
import { styleLabelKey } from "@/lib/styles";
import { Avatar } from "./OutfitCard";
import { FollowButton } from "./FollowButton";

export function CreatorCard({ creator, index = 0 }: { creator: CreatorCardData; index?: number }) {
  const { t } = useTranslation();
  return (
    <article
      className="fade-up relative flex h-full flex-col items-center gap-2.5 rounded-3xl bg-surface p-5 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <Link
        to="/@{$username}"
        params={{ username: creator.username }}
        className="flex flex-col items-center gap-2.5 after:absolute after:inset-0 after:rounded-3xl after:content-['']"
      >
        <span className="rounded-full p-[3px] ring-2 ring-primary">
          <Avatar src={creator.profile_image} name={creator.username} className="h-20 w-20 text-xl" />
        </span>
        <span className="text-[15px] font-bold text-foreground">@{creator.username}</span>
      </Link>
      {creator.mutual && creator.mutual.count > 0 ? (
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/75">
          {t("social.followedBy")} {creator.mutual.names.map((n) => `@${n}`).join(", ")}
          {creator.mutual.count > creator.mutual.names.length &&
            ` ${t("social.andOthers")} ${creator.mutual.count - creator.mutual.names.length}`}
        </p>
      ) : (
        creator.bio && <p className="line-clamp-2 text-[13px] leading-snug text-foreground/70">{creator.bio}</p>
      )}
      {creator.styles.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {creator.styles.slice(0, 3).map((s) => (
            <li key={s} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80">
              {t(styleLabelKey(s))}
            </li>
          ))}
        </ul>
      )}
      <FollowButton creatorId={creator.id} className="relative z-10 mt-auto" />
    </article>
  );
}

export function CreatorGrid({ creators }: { creators: CreatorCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {creators.map((c, i) => (
        <CreatorCard key={c.id} creator={c} index={i} />
      ))}
    </div>
  );
}

/** Rangée défilante (accueil) : évite les cartes orphelines quel que soit le nombre. */
export function CreatorRow({ creators }: { creators: CreatorCardData[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:-mx-6 md:gap-4 md:px-6">
      {creators.map((c, i) => (
        <div key={c.id} className="w-[46%] shrink-0 snap-start sm:w-[220px]">
          <CreatorCard creator={c} index={i} />
        </div>
      ))}
    </div>
  );
}
