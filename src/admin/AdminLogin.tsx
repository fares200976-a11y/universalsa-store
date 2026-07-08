import { useState } from "react";
import { useLocation } from "wouter";
import { loginAdmin } from "../lib/auth";
import "../admin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: loginError } = await loginAdmin(email, password);

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    setLocation("/admin/dashboard");
    setLoading(false);
  }

  return (
    <div className="admin-login">
      <div className="login-box">
        <h1>🔐 Admin UniversalSA</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
