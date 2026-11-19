import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { safeRedirect } from "@/components/AuthPrompt";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(s.redirect) }),
  head: () => ({ meta: [{ title: "Connexion — Wanted Fashion" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Après la connexion : retour sur la page d'où vient la personne (sinon son espace)
  const { redirect: back } = Route.useSearch();
  const router = useRouter();
  const goAfter = () => (back ? router.history.push(back) : navigate({ to: "/dashboard" }));
  const { user } = useAuth();

  useEffect(() => {
    if (user) goAfter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error(t("auth.emailNotConfirmed"));
      } else {
        toast.error(t("auth.invalidCreds"));
      }
      return;
    }
    toast.success(t("auth.welcome"));
    goAfter();
  }

 return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-black">{t("auth.loginTitle")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <PasswordInput id="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? t("auth.loggingIn") : t("auth.login")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" search={{ redirect: back }} className="font-semibold text-brand hover:underline">{t("auth.signupLink")}</Link>
        </p>
      </div>
    </main>
  );
}
