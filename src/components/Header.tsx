import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Header() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    navigate({ to: "/" });
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border backdrop-blur"
      style={{ backgroundColor: "#e3d0b5" }}
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Connexion</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                  Inscription
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
