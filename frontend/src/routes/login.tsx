import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Activity, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/app-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login - NetworkIQ" }] }),
  component: LoginPage,
});

function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loginError = useAuthStore((s) => s.loginError);
  const navigate = useNavigate();
  const [email, setEmail] = useState("warehouse@networkiq.com");
  const [password, setPassword] = useState("warehouse123");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const user = login(email, password);
    if (!user) return;
    void navigate({ to: user.role === "admin" ? "/" : "/warehouse" });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-hero px-4">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <Activity className="size-6 text-primary-foreground" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold">NetworkIQ</h1>
            <p className="text-sm text-muted-foreground">Role-based inventory operations</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl pl-9" />
            </div>
          </div>
          {loginError && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{loginError}</p>}
          <Button className="w-full rounded-xl bg-gradient-primary">Sign in</Button>
        </form>

        <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-surface/50 p-3 text-xs text-muted-foreground">
          <p><strong className="text-foreground">Admin:</strong> admin@networkiq.com / admin123</p>
          <p><strong className="text-foreground">Warehouse:</strong> warehouse@networkiq.com / warehouse123</p>
        </div>
      </motion.section>
    </main>
  );
}
