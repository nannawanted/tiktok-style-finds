import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("auth.invalidCreds"));
      return;
    }
    toast.success(t("auth.welcome"));
    navigate({ to: "/dashboard" });
  }

 return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-black">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? t("auth.loggingIn") : t("auth.login")}
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
