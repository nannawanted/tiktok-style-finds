import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isPwnedPassword } from "@/lib/pwned";
import { adultBirthDate } from "@/lib/create-creator-profile";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createCreatorProfile } from "@/lib/create-creator-profile";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { CAPTCHA_ENABLED } from "@/lib/captcha";
import { USERNAME_PATTERN, isReservedUsername } from "@/lib/username-rules";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({ meta: [{ title: "Inscription — Wanted Fashion" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { t, lang } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [username, setUsername] = useState("");
  const [birth, setBirth] = useState({ d: "", m: "", y: "" });
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
    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (!USERNAME_PATTERN.test(clean)) {
      toast.error(t("auth.invalidUsername"));
      return;
    }
    if (isReservedUsername(clean)) {
      toast.error(t("auth.usernameReserved"));
      return;
    }
    if (waitingCaptcha) {
      toast.error(t("auth.captchaRequired"));
      return;
    }
    // Site réservé aux 18 ans et plus (date revérifiée sur le serveur)
    const birthDate = birth.y && birth.m && birth.d ? `${birth.y}-${birth.m.padStart(2, "0")}-${birth.d.padStart(2, "0")}` : "";
    if (!birthDate) {
      toast.error(t("auth.birthRequired"));
      return;
    }
    if (!adultBirthDate(birthDate)) {
      toast.error(t("auth.underage"));
      return;
    }

    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      toast.error(t("auth.pwRuleLength"));
      return;
    }
    if (password !== password2) {
      toast.error(t("auth.pwNoMatch"));
      return;
    }

    setLoading(true);

    // Mot de passe déjà volé dans une fuite connue → refusé (si la vérification échoue, on ne bloque pas)
    if ((await isPwnedPassword(password)) === true) {
      setLoading(false);
      toast.error(t("auth.pwnedPassword"));
      return;
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("creators_public")
      .select("id")
      .eq("username", clean)
      .maybeSingle();
    if (existing) {
      setLoading(false);
      toast.error(t("auth.usernameTaken"));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Le username est enregistré dans les métadonnées du compte : c'est le
      // serveur qui le relit pour créer le profil (jamais une valeur envoyée
      // directement par le navigateur à la création du profil).
      options: { emailRedirectTo: window.location.origin, data: { username: clean, birth_date: birthDate } },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? t("auth.signupError"));
      return;
    }

    // Le jeton anti-robot est vérifié par notre serveur, une seule fois, à la création du profil
    const profileResult = await createCreatorProfile({ data: { userId: data.user.id, captchaToken: CAPTCHA_ENABLED ? captchaToken : undefined } });
    // Un jeton ne sert qu'une fois : on en redemande un pour un éventuel nouvel essai
    if (CAPTCHA_ENABLED) setCaptchaKey((k) => k + 1);
    if (!profileResult.ok) {
      setLoading(false);
      toast.error(
        profileResult.error === "underage"
          ? t("auth.underage")
          : profileResult.error === "captcha"
            ? t("auth.captchaFailed")
            : t("auth.profileFailed") + " " + profileResult.error,
      );
      return;
    }

    setLoading(false);

    // Si la confirmation d'email est activée côté Supabase, aucune session
    // n'est retournée tant que le lien reçu par email n'a pas été cliqué.
    if (!data.session) {
      toast.success(t("auth.checkYourEmail"));
      navigate({ to: "/login" });
      return;
    }

    toast.success(t("auth.accountCreated"));
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-black">{t("auth.signupTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.signupSubtitle")}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input id="username" name="nickname" autoComplete="nickname" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={31} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder={t("auth.usernamePlaceholder")} aria-describedby="username-rules" />
            <UsernameRules value={username} />
          </div>
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t("auth.birthDate")}</legend>
            <div className="grid grid-cols-[1fr_1.4fr_1.2fr] gap-2">
              <select aria-label={t("auth.day")} required value={birth.d} onChange={(e) => setBirth((b) => ({ ...b, d: e.target.value }))} className="h-10 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="">{t("auth.day")}</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select aria-label={t("auth.month")} required value={birth.m} onChange={(e) => setBirth((b) => ({ ...b, m: e.target.value }))} className="h-10 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="">{t("auth.month")}</option>
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <option key={i} value={String(i + 1)}>
                    {new Date(2000, i, 1).toLocaleDateString(lang === "en" ? "en-GB" : "fr-BE", { month: "long" })}
                  </option>
                ))}
              </select>
              <select aria-label={t("auth.year")} required value={birth.y} onChange={(e) => setBirth((b) => ({ ...b, y: e.target.value }))} className="h-10 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="">{t("auth.year")}</option>
                {Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i)).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{t("auth.birthHint")}</p>
          </fieldset>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <PasswordInput id="password" name="new-password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-rules" />
            <ul id="password-rules" className="mt-1.5 space-y-0.5 text-xs">
              <Rule ok={password.length >= 8} active={password.length > 0} label={t("auth.pwRuleLength")} />
              {new TextEncoder().encode(password).length > 72 && <Rule ok={false} active label={t("auth.pwTooLong")} />}
              <li className="text-muted-foreground">{t("auth.pwRuleAny")}</li>
            </ul>
          </div>
          <div>
            <Label htmlFor="password2">{t("auth.passwordConfirm")}</Label>
            <PasswordInput id="password2" name="new-password-confirm" autoComplete="new-password" required value={password2} onChange={(e) => setPassword2(e.target.value)} />
            {password2.length > 0 && (
              <ul className="mt-1.5 text-xs">
                <Rule ok={password === password2} active label={password === password2 ? t("auth.pwMatch") : t("auth.pwNoMatch")} />
              </ul>
            )}
          </div>
          {CAPTCHA_ENABLED && <TurnstileWidget onToken={setCaptchaToken} onError={setCaptchaBroken} resetKey={captchaKey} />}
          <Button type="submit" disabled={loading || waitingCaptcha} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? t("auth.creating") : waitingCaptcha ? t("auth.captchaChecking") : t("auth.createAccount")}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {t("auth.legalBefore")}{" "}
            <Link to="/conditions" target="_blank" className="font-semibold underline">
              {t("auth.legalTerms")}
            </Link>{" "}
            {t("auth.legalAnd")}{" "}
            <Link to="/confidentialite" target="_blank" className="font-semibold underline">
              {t("auth.legalPrivacy")}
            </Link>
            .
          </p>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.alreadyAccount")}{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </main>
  );
}

/** Une règle qui se coche en direct pendant la frappe (comme sur Google ou Instagram). */
function Rule({ ok, active, label }: { ok: boolean; active: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-1.5 ${!active ? "text-muted-foreground" : ok ? "text-emerald-700" : "text-destructive"}`}>
      {active && ok ? <Check className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : active ? <X className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      <span>{label}</span>
    </li>
  );
}

/** Règles du nom d'utilisateur, vérifiées en direct ; montre exactement le caractère refusé. */
function UsernameRules({ value }: { value: string }) {
  const { t } = useTranslation();
  const v = value.trim().replace(/^@/, "");
  const bad = [...new Set([...value.replace(/^@/, "")].filter((c) => !/[a-z0-9_.]/.test(c)))];
  return (
    <ul id="username-rules" className="mt-1.5 space-y-0.5 text-xs">
      <Rule ok={v.length >= 3 && v.length <= 30} active={v.length > 0} label={t("auth.unRuleLength")} />
      <Rule ok={bad.length === 0} active={v.length > 0} label={t("auth.unRuleChars")} />
      {bad.length > 0 && (
        <li className="pl-5 font-semibold text-destructive">
          {t("auth.unBadChar")} {bad.map((c) => (c === " " ? `« ${t("auth.unSpace")} »` : `« ${c} »`)).join(" ")}
        </li>
      )}
    </ul>
  );
}
