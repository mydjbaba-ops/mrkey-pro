import React, { useState } from "react";
import { supabase } from "../supabase";
import { KeyRound, Loader2, ArrowLeft, Lock, Mail } from "lucide-react";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ type: "success", text: "Compte créé ! Vérifie ton email pour confirmer." });
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg({ type: "success", text: "Email de réinitialisation envoyé !" });
      }
    } catch (e) {
      const map = {
        "Invalid login credentials": "Email ou mot de passe incorrect.",
        "Email not confirmed": "Confirme ton email avant de te connecter.",
        "User already registered": "Cet email est déjà utilisé.",
      };
      setMsg({ type: "error", text: map[e.message] || e.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-sunken flex flex-col items-center justify-center p-5 font-sans">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            MrKey <span className="gradient-text">Pro</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {mode === "login" ? "Connexion à votre espace" :
             mode === "signup" ? "Créer votre compte" :
             "Réinitialiser le mot de passe"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl p-6 shadow-xl shadow-primary/5 border border-border">
          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              msg.type === "error"
                ? "bg-danger/10 text-danger border border-danger/30"
                : "bg-success-dark/10 text-success-dark border border-success-dark/30"
            }`}>
              {msg.type === "error" ? "⚠" : "✓"} {msg.text}
            </div>
          )}

          <div className="relative mb-3">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-elevated border border-border-strong rounded-xl py-3.5 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {mode !== "reset" && (
            <div className="relative mb-4">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full bg-surface-elevated border border-border-strong rounded-xl py-3.5 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gradient-primary text-white font-bold text-[15px] py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
              </span>
            ) : (
              mode === "login" ? "Se connecter" :
              mode === "signup" ? "Créer le compte" :
              "Envoyer le lien"
            )}
          </button>

          <div className="mt-4 flex flex-col gap-2 text-center">
            {mode === "login" && (
              <>
                <button
                  onClick={() => { setMode("signup"); setMsg(null); }}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Pas encore de compte ? Créer un compte
                </button>
                <button
                  onClick={() => { setMode("reset"); setMsg(null); }}
                  className="text-text-muted font-semibold text-xs hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </>
            )}
            {mode !== "login" && (
              <button
                onClick={() => { setMode("login"); setMsg(null); }}
                className="text-primary font-bold text-sm hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-5 text-xs text-text-muted flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Vos données sont privées et sécurisées
        </p>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: "Mot de passe mis à jour ! Redirection..." });
      setTimeout(() => window.location.href = "/", 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-sunken flex flex-col items-center justify-center p-5 font-sans">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-text-primary">MrKey <span className="gradient-text">Pro</span></h1>
          <p className="text-sm text-text-secondary mt-2">Nouveau mot de passe</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border">
          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-semibold ${
              msg.type === "error" ? "bg-danger/10 text-danger" : "bg-success-dark/10 text-success-dark"
            }`}>{msg.text}</div>
          )}
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-surface-elevated border border-border-strong rounded-xl py-3.5 px-4 text-sm text-text-primary outline-none mb-3"
          />
          <button
            onClick={handleReset}
            disabled={loading || !password}
            className="w-full gradient-primary text-white font-bold py-3.5 rounded-xl disabled:opacity-60"
          >
            {loading ? "..." : "Enregistrer le mot de passe"}
          </button>
        </div>
      </div>
    </div>
  );
}
