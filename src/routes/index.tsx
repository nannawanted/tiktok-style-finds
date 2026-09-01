import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Play,
  ShoppingBag,
  Tag,
  Video,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Crown,
  Heart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Wanted Fashion — Feed" },
      { name: "description", content: "Découvre les outfits shoppables des créateurs francophones." },
      { property: "og:title", content: "Wanted Fashion" },
      { property: "og:description", content: "Découvre les outfits shoppables." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Feed,
});

// Reproduit l'animation au scroll du design Base44, sans dépendance supplémentaire
function AnimatedElement({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setIsVisible(true);
      return;
    }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 200px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function formatCount(n: number | null | undefined) {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${n}`;
}

function platformButtonClass(url: string | null) {
  if (!url) return "bg-foreground text-background";
  if (url.includes("tiktok")) return "bg-foreground text-background";
  if (url.includes("instagram")) return "bg-gradient-to-tr from-accent via-primary to-secondary text-primary-foreground";
  if (url.includes("youtube")) return "bg-destructive text-destructive-foreground";
  return "bg-foreground text-background";
}

function HeroSection() {
  return (
    <section className="relative w-full bg-gradient-to-b from-secondary to-foreground pt-24 pb-32 sm:pt-32 sm:pb-40 rounded-b-[2.5rem] shadow-2xl overflow-hidden">
      <div
        className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
        style={{ animation: "floatA 10s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[140px] pointer-events-none"
        style={{ animation: "floatB 12s ease-in-out 2s infinite" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/10 backdrop-blur-md border border-background/20 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-background">Le social shopping made for you</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-background max-w-4xl">
            Trouve les pièces{" "}
            <span className="bg-gradient-to-r from-primary-foreground via-accent to-primary-foreground bg-clip-text text-transparent">
              de tes créateurs
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-background/80 max-w-2xl mx-auto font-medium">
            Vidéo <ArrowRight className="inline w-4 h-4 mx-1 opacity-50" />
            références <ArrowRight className="inline w-4 h-4 mx-1 opacity-50" />
            achat en 1 clic
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-5 justify-center w-full">
            <a href="#feed" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-lg font-bold hover:-translate-y-1 transition-all duration-300 group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explorer les looks <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </a>
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-10 h-14 text-lg font-bold border-background/30 text-foreground bg-background/5 backdrop-blur-sm hover:bg-background/15 hover:text-background hover:border-background/50 transition-all duration-300"
              >
                Devenir créateur
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: Video, title: "La vidéo", description: "Le créateur poste sa tenue en vidéo sur TikTok, Instagram ou YouTube." },
    { icon: Tag, title: "Les références", description: "Chaque pièce portée est identifiée et listée sur la page du post." },
    { icon: ShoppingBag, title: "L'achat", description: "Un clic sur la carte produit et tu es redirigé chez le vendeur." },
  ];

  return (
    <section className="relative w-full bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedElement className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Comment ça marche</h2>
          <p className="text-lg text-foreground/60 mt-3 font-medium">Trois étapes, zéro friction.</p>
        </AnimatedElement>

        <div className="grid grid-cols-3 gap-3 sm:gap-8 relative">
          {steps.map((step, i) => (
            <AnimatedElement key={step.title} delay={i * 150}>
              <div className="relative group bg-card hover:bg-card/80 border border-border/50 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/5 hover:-translate-y-2 h-full flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-3 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                  <step.icon className="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-sm sm:text-xl font-bold text-card-foreground mb-1 sm:mb-3">{step.title}</h3>
                <p className="text-xs sm:text-base text-card-foreground/70 leading-relaxed font-medium">{step.description}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularCreatorsSection({
  creators,
}: {
  creators: { username: string; profile_image: string | null }[];
}) {
  return (
    <section id="creators" className="relative w-full bg-background pt-16 pb-4 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedElement className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </span>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Créateurs populaires</h2>
          </div>
          <a href="#feed" className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group">
            Voir tous <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </AnimatedElement>

        <AnimatedElement delay={200}>
          <div className="flex flex-nowrap gap-8 overflow-x-auto pb-2 pt-4 px-4 -mx-4 hide-scrollbar">
            {creators.map((creator, index) => (
              <Link
                key={creator.username}
                to="/creator/$username"
                params={{ username: creator.username }}
                className="flex flex-col items-center gap-4 text-center shrink-0 group"
              >
                <div className="relative">
                  {index === 0 && (
                    <div className="absolute -top-3 -right-2 z-10 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                      <Crown className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-accent via-primary to-secondary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-foreground/10">
                    <div className="w-full h-full rounded-full border-[3px] border-background overflow-hidden bg-muted">
                      {creator.profile_image ? (
                        <img
                          src={creator.profile_image}
                          alt={creator.username}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-black text-muted-foreground">
                          {creator.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-base font-bold text-foreground block group-hover:text-primary transition-colors">
                  @{creator.username}
                </span>
              </Link>
            ))}
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function FeedSection({
  posts,
  isLoading,
}: {
  posts: {
    id: string;
    title: string;
    cover_image: string | null;
    creator_username: string;
    tiktok_url: string | null;
    products: { id: string }[];
  }[];
  isLoading: boolean;
}) {
  return (
    <section id="feed" className="relative w-full bg-background py-24">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedElement className="mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Les derniers outfits</h2>
          <p className="text-lg text-foreground/60 mt-3 font-medium">Shop les looks de tes créateurs préférés.</p>
        </AnimatedElement>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-hidden pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-40 sm:w-52 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Aucun post pour le moment.
          </div>
        ) : (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2 px-4 -mx-4 hide-scrollbar">
            {posts.map((post, index) => (
              <AnimatedElement key={post.id} delay={index * 40} className="shrink-0">
                <Link
                  to="/post/$id"
                  params={{ id: post.id }}
                  className="group flex flex-col w-40 sm:w-52 rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-foreground/10 hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
                    {post.tiktok_url && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold shadow-lg ${platformButtonClass(
                            post.tiktok_url
                          )} group-hover:scale-105 transition-transform duration-300`}
                        >
                          <Play className="w-3 h-3 fill-current" /> Voir la vidéo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between bg-card">
                    <h3 className="font-bold text-sm text-card-foreground leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs font-bold text-card-foreground/80 flex items-center gap-1.5 truncate">
                        <div className="w-4 h-4 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[8px]">
                          @
                        </div>
                        <span className="truncate">{post.creator_username}</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1 shrink-0">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        {post.products?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedElement>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CreatorCTASection() {
  return (
    <section className="relative w-full bg-secondary py-32 overflow-hidden rounded-t-[3rem] mt-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      <AnimatedElement className="relative max-w-4xl mx-auto px-6 text-center z-10">
        <div className="w-20 h-20 rounded-3xl bg-background shadow-xl shadow-foreground/5 flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-6 hover:scale-110 transition-all duration-500">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-secondary-foreground tracking-tight leading-tight">
          Deviens créateur, <br className="hidden sm:block" />
          <span className="text-background bg-foreground px-4 py-1 rounded-xl inline-block mt-2 rotate-[-1deg]">
            monétise ton style
          </span>
        </h2>
        <p className="mt-8 text-xl text-secondary-foreground/80 max-w-2xl mx-auto font-medium leading-relaxed">
          Rejoins Wanted Fashion, poste tes tenues, tague tes pièces et touche une commission sur chaque vente générée par ta communauté.
        </p>
        <Link to="/signup">
          <Button
            size="lg"
            className="relative overflow-hidden mt-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-12 h-16 text-xl font-black shadow-2xl shadow-primary/30 hover:-translate-y-2 hover:shadow-primary/50 transition-all duration-300 group"
          >
            <span className="relative z-10 flex items-center gap-3">
              Créer mon compte créateur <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </Button>
        </Link>
      </AnimatedElement>
    </section>
  );
}

function Feed() {
  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, title, cover_image, creator_username, tiktok_url, created_at, products(id)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return posts ?? [];
    },
  });

  const { data: topCreators } = useQuery({
    queryKey: ["top-creators"],
    queryFn: async () => {
      const { data: creators, error } = await supabase
        .from("creators")
        .select("username, profile_image")
        .limit(20);
      if (error) throw error;
      return creators ?? [];
    },
  });

  return (
    <main className="bg-background min-h-screen">
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-30px) rotate(5deg) scale(1.05); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-40px) rotate(-5deg) scale(1.1); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <HeroSection />
      {topCreators && topCreators.length > 0 && <PopularCreatorsSection creators={topCreators} />}
      <FeedSection posts={data ?? []} isLoading={isLoading} />
      <HowItWorksSection />
      <CreatorCTASection />
    </main>
  );
}
