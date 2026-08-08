import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
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
      toast.error("Username invalide (3-30 caractères : lettres, chiffres, _ ou .)");
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
      toast.error("Ce username est déjà pris");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Erreur lors de l'inscription");
      return;
    }

    // Insert creator row (RLS allows: auth.uid() = id)
    const { error: e2 } = await supabase.from("creators").insert({
      id: data.user.id,
      username: clean,
    });
    if (e2) {
      setLoading(false);
      toast.error("Compte créé mais profil échoué : " + e2.message);
      return;
    }

    setLoading(false);
    toast.success("Compte créé !");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-black">Inscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crée ton compte créateur Wanted Fashion.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ton_username" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">Connecte-toi</Link>
        </p>
      </div>
    </main>
  );
}
