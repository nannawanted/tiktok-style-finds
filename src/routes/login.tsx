import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TurnstileWidget, isCaptchaError } from "@/components/TurnstileWidget";
import { CAPTCHA_ENABLED } from "@/lib/captcha";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connexion — Wanted Fashion" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaBroken, setCaptchaBroken] = useState(false);
  // On attend le jeton anti-robot, sauf si Cloudflare ne répond pas (le serveur décidera)
  const waitingCaptcha = CAPTCHA_ENABLED && !captchaToken && !captchaBroken;
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (waitingCaptcha) {
      toast.error(t("auth.captchaRequired"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: CAPTCHA_ENABLED ? { captchaToken } : undefined });
    setLoading(false);
    // Un jeton anti-robot ne sert qu'une fois : on en redemande un pour l'essai suivant
    if (CAPTCHA_ENABLED) setCaptchaKey((k) => k + 1);
    if (error) {
      if (isCaptchaError(error.message)) {
        toast.error(t("auth.captchaFailed"));
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error(t("auth.emailNotConfirmed"));
      } else {
        toast.error(t("auth.invalidCreds"));
      }
      return;
    }
    toast.success(t("auth.welcome"));
    navigate({ to: "/dashboard" });
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
          {CAPTCHA_ENABLED && <TurnstileWidget onToken={setCaptchaToken} onError={setCaptchaBroken} resetKey={captchaKey} />}
          <Button type="submit" disabled={loading || waitingCaptcha} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? t("auth.loggingIn") : waitingCaptcha ? t("auth.captchaChecking") : t("auth.login")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="font-semibold text-brand hover:underline">{t("auth.signupLink")}</Link>
        </p>
      </div>
    </main>
  );
}
