import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({ meta: [{ title: "Inscription — Wanted Fashion" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_.]{3,30}$/.test(clean)) {
      toast.error(t("auth.invalidUsername"));
      return;
    }
    setLoading(true);

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("creators")
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
      options: { emailRedirectTo: window.location.origin },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? t("auth.signupError"));
      return;
    }

    // Insert creator row (RLS allows: auth.uid() = id)
    const { error: e2 } = await supabase.from("creators").insert({
      id: data.user.id,
      username: clean,
    });
    if (e2) {
      setLoading(false);
      toast.error(t("auth.profileFailed") + " " + e2.message);
      return;
    }

    setLoading(false);
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
            <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("auth.usernamePlaceholder")} />
          </div>
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? t("auth.creating") : t("auth.createAccount")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.alreadyAccount")}{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </main>
  );
}
