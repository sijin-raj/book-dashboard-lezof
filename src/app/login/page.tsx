"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";

type LoginResponse = {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(response.data.accessToken);
      router.replace("/dashboard/summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <Image
          src="/Lezof-Black.svg"
          alt="Lezof"
          width={160}
          height={27}
          className="login-logo"
          priority
        />
        <h1>Welcome back!</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 420 }}>
          Sign in to manage appointments, offers, and dashboards.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <input
              className="login-input"
              type="email"
              placeholder="Username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-field login-password-field">
            <input
              className="login-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading} className="login-submit">
            {loading ? "Signing in..." : "Login"}
          </button>
          
        </form>
      </div>
      <div className="login-illustration">
        <div className="login-illustration-card">
          <Image
            src="/login-image.png"
            alt="Login illustration"
            className="login-illustration-img"
            width={640}
            height={640}
          />
          <div className="login-illustration-dots">
            <span />
            <span />
            <span className="is-active" />
          </div>
          <p>
            Make your work easier and organized with <strong>Lezof</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
