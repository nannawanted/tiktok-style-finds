import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, ShoppingBag } from "lucide-react";

export function Header() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40 transition-all duration-300">
      <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-[auto_1fr_auto] items-center h-20">
        <Link to="/" className="flex items-center gap-1.5 group justify-self-start">
          <Logo />
        </Link>

        <nav className="hidden sm:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <a
            href="/#feed"
            className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300"
          >
            Explorer
          </a>
          <a
            href="/#creators"
            className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300"
          >
            Créateurs
          </a>
        </nav>

        <div className="hidden sm:flex items-center gap-4 justify-self-end">
          {loading ? null : user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/10 font-semibold">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut} className="font-semibold">
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/10 font-semibold">
                  Connexion
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 font-semibold">
                  Inscription
                </Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="sm:hidden col-start-3 justify-self-end">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background border-border">
            <nav className="flex flex-col gap-6 mt-12">
              <div className="mb-6">
                <Logo />
              </div>
              <a
                href="/#feed"
                onClick={() => setOpen(false)}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <ShoppingBag className="w-5 h-5 text-primary" /> Explorer
              </a>
              <a
                href="/#creators"
                onClick={() => setOpen(false)}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <User className="w-5 h-5 text-primary" /> Créateurs
              </a>
              <div className="h-px bg-border my-4" />
              {loading ? null : user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full border-border text-foreground font-bold h-12 rounded-xl">
                      Dashboard
                    </Button>
                  </Link>
                  <Button onClick={() => { setOpen(false); signOut(); }} className="w-full font-bold h-12 rounded-xl">
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full border-border text-foreground font-bold h-12 rounded-xl">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-xl shadow-lg shadow-primary/20">
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
