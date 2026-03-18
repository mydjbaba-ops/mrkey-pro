import React, { useState } from "react";
import { supabase } from "./supabase";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "error"|"success", text }

  const inp = {
    width: "100%", boxSizing: "border-box",
    background: "#e8edf8", border: "1px solid rgba(108,99,255,0.25)",
    borderRadius: 12, padding: "13px 14px", color: "#1a1d2e",
    fontSize: 14, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginBottom: 10,
  };

  const btn = (extra = {}) => ({
    width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff",
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    opacity: loading ? 0.6 : 1,
    ...extra,
  });

  const handleSubmit = async () => {
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ type: "success", text: "✅ Compte créé ! Vérifie ton email pour confirmer." });
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg({ type: "success", text: "✅ Email de réinitialisation envoyé !" });
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
    <div style={{ minHeight: "100vh", background: "#c8d0e8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🔑</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1a1d2e", letterSpacing: "-0.5px" }}>MrKey Pro</div>
          <div style={{ fontSize: 13, color: "#5a6585", marginTop: 4 }}>
            {mode === "login" ? "Connexion à votre espace" : mode === "signup" ? "Créer votre compte" : "Réinitialiser le mot de passe"}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#dde3f2", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.12)" }}>

          {msg && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: msg.type === "error" ? "rgba(255,71,87,0.1)" : "rgba(0,245,147,0.1)",
              color: msg.type === "error" ? "#ff4757" : "#00b87a",
              border: `1px solid ${msg.type === "error" ? "rgba(255,71,87,0.3)" : "rgba(0,245,147,0.3)"}` }}>
              {msg.text}
            </div>
          )}

          <input style={inp} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />

          {mode !== "reset" && (
            <input style={inp} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          )}

          <button style={btn()} onClick={handleSubmit} disabled={loading}>
            {loading ? "⏳ Chargement..." : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer le compte" : "Envoyer le lien"}
          </button>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            {mode === "login" && <>
              <button onClick={() => { setMode("signup"); setMsg(null); }} style={{ background: "none", border: "none", color: "#6c63ff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Pas encore de compte ? Créer un compte
              </button>
              <button onClick={() => { setMode("reset"); setMsg(null); }} style={{ background: "none", border: "none", color: "#8890aa", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                Mot de passe oublié ?
              </button>
            </>}
            {mode !== "login" && (
              <button onClick={() => { setMode("login"); setMsg(null); }} style={{ background: "none", border: "none", color: "#6c63ff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ← Retour à la connexion
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#8890aa" }}>
          Vos données sont privées et sécurisées 🔒
        </div>
      </div>
    </div>
  );
}
