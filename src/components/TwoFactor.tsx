import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";

// Double vérification (2FA) avec une appli d'authentification (Google Authenticator,
// Microsoft Authenticator, 1Password…), comme Instagram. Gérée par Supabase Auth.
// Côté serveur, toute action admin exige le code quand la 2FA est activée (fonction admin_ok).

type Factor = { id: string; status: string; friendly_name?: string };

function useFactors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mfa-factors", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return (data?.all ?? []) as Factor[];
    },
  });
}

function CodeInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="123456"
      className="h-14 w-full rounded-2xl border-[1.5px] border-border bg-background text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-foreground/50"
    />
  );
}

/** Section « Double vérification » dans Paramètres. */
export function TwoFactorSettings() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: factors } = useFactors();
  const verified = (factors ?? []).find((f) => f.status === "verified");
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    // Les essais non terminés sont retirés avant d'en commencer un nouveau
    for (const f of (factors ?? []).filter((x) => x.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "WantedFashion" });
    setBusy(false);
    if (error || !data) {
      toast.error(t("mfa.error"));
      return;
    }
    setSetup({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }

  async function confirm() {
    if (!setup || code.length !== 6) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: setup.id, code });
    setBusy(false);
    if (error) {
      toast.error(t("mfa.wrongCode"));
      return;
    }
    setSetup(null);
    toast.success(t("mfa.enabled"));
    qc.invalidateQueries({ queryKey: ["mfa-factors"] });
  }

  async function disable() {
    if (!verified) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    setBusy(false);
    if (error) {
      toast.error(t("mfa.error"));
      return;
    }
    toast.success(t("mfa.disabled"));
    qc.invalidateQueries({ queryKey: ["mfa-factors"] });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${verified ? "bg-emerald-600 text-white" : "bg-background"}`}>
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("mfa.title")}</span>
          <span className="block text-[13px] text-foreground/60">{verified ? t("mfa.on") : t("mfa.off")}</span>
        </span>
        {!setup &&
          (verified ? (
            <button type="button" disabled={busy} onClick={disable} className="rounded-full border-[1.5px] border-border px-4 py-2 text-sm font-semibold">
              {t("mfa.turnOff")}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={start} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t("mfa.turnOn")}
            </button>
          ))}
      </div>
      {setup && (
        <div className="flex flex-col gap-3 rounded-2xl bg-background p-4">
          <p className="text-sm font-semibold">{t("mfa.scan")}</p>
          <img src={setup.qr} alt={t("mfa.qrAlt")} className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
          <p className="break-all text-center text-xs text-foreground/60">
            {t("mfa.orKey")} <span className="font-mono font-semibold text-foreground">{setup.secret}</span>
          </p>
          <label htmlFor="mfa-setup-code" className="text-sm font-semibold">
            {t("mfa.enterCode")}
          </label>
          <CodeInput id="mfa-setup-code" value={code} onChange={setCode} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setSetup(null)} className="h-12 flex-1 rounded-full border-[1.5px] border-border font-semibold">
              {t("dashboard.cancel")}
            </button>
            <button type="button" disabled={busy || code.length !== 6} onClick={confirm} className="h-12 flex-1 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-40">
              {t("mfa.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Après la connexion : si la double vérification est activée, on demande le code
 * avant de continuer (comme Instagram). Sans le code, aucune action admin n'est possible.
 */
export function TwoFactorGate() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setFactorId(null);
      return;
    }
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!alive || !data || data.currentLevel !== "aal1" || data.nextLevel !== "aal2") return;
      const { data: f } = await supabase.auth.mfa.listFactors();
      const totp = f?.totp?.find((x) => x.status === "verified");
      if (alive && totp) setFactorId(totp.id);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function verify() {
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) {
      toast.error(t("mfa.wrongCode"));
      setCode("");
      return;
    }
    setFactorId(null);
    window.location.reload(); // recharge avec la session vérifiée
  }

  if (!factorId) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mfa-gate-title" className="fixed inset-0 z-[70] flex items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <ShieldCheck className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 id="mfa-gate-title" className="font-display text-3xl font-bold">
          {t("mfa.gateTitle")}
        </h2>
        <p className="text-sm text-foreground/65">{t("mfa.gateText")}</p>
        <CodeInput id="mfa-gate-code" value={code} onChange={setCode} />
        <button type="button" disabled={busy || code.length !== 6} onClick={verify} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("mfa.confirm")}
        </button>
        <button type="button" onClick={() => void supabase.auth.signOut().then(() => window.location.assign("/"))} className="text-sm font-semibold underline underline-offset-4">
          {t("nav2.logout")}
        </button>
      </div>
    </div>
  );
}
