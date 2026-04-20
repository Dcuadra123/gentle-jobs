import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;

const signUpSchema = z.object({
  username: z.string().trim().regex(usernameRegex, "Usuario inválido (3-30, letras/números/._-)"),
  fullName: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  email: z.string().trim().email("Email no válido").max(255).optional().or(z.literal("")),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signInSchema = z.object({
  identifier: z.string().trim().min(3, "Usuario o email requerido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      identifier: fd.get("identifier"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setIsLoading(true);

    let email = parsed.data.identifier;
    // If it doesn't look like an email, treat it as username
    if (!email.includes("@")) {
      const { data, error } = await supabase.rpc("get_email_by_username", {
        _username: email,
      });
      if (error || !data) {
        setIsLoading(false);
        toast.error("Usuario o contraseña incorrectos");
        return;
      }
      email = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    setIsLoading(false);
    if (error) toast.error("Usuario o contraseña incorrectos");
    else navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      username: fd.get("username"),
      fullName: fd.get("fullName"),
      email: fd.get("email") || "",
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setIsLoading(true);

    // Check username availability
    const { data: existing } = await supabase.rpc("get_email_by_username", {
      _username: parsed.data.username,
    });
    if (existing) {
      setIsLoading(false);
      toast.error("Ese nombre de usuario ya existe");
      return;
    }

    // Use real email if provided; otherwise generate placeholder
    const authEmail =
      parsed.data.email && parsed.data.email.length > 0
        ? parsed.data.email
        : `${parsed.data.username.toLowerCase()}@user.local`;

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username: parsed.data.username,
          full_name: parsed.data.fullName,
        },
      },
    });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Ya puedes acceder.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elevated">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Gestor de Mantenimiento</h1>
          <p className="text-sm text-muted-foreground">Edificios e instalaciones</p>
        </div>
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Inicia sesión o crea una cuenta nueva.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-identifier">Usuario o email</Label>
                    <Input id="si-identifier" name="identifier" autoComplete="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-password">Contraseña</Label>
                    <Input id="si-password" name="password" type="password" autoComplete="current-password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-username">Nombre de usuario *</Label>
                    <Input id="su-username" name="username" autoComplete="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Nombre completo *</Label>
                    <Input id="su-name" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input id="su-email" name="email" type="email" autoComplete="email" />
                    <p className="text-xs text-muted-foreground">Puedes añadirlo más tarde desde tu perfil.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Contraseña *</Label>
                    <Input id="su-password" name="password" type="password" autoComplete="new-password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creando…" : "Crear cuenta"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    El primer usuario registrado obtiene rol de administrador.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
