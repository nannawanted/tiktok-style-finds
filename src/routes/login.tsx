import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
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
      toast.error("Identifiants invalides");
      return;
    }
    toast.success("Bienvenue !");
    navigate({ to: "/dashboard" });
  }

 return (
    <main className="mx-auto max-w-sm px-4 py-10" style={{ minHeight: "100vh", backgroundColor: "#6b5240" }}>
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-black">Connexion</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connecte-toi pour gérer tes posts.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="font-semibold text-brand hover:underline">Inscris-toi</Link>
        </p>
      </div>
    </main>
  );
}
