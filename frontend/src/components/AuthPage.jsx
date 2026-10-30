import React, { useState } from "react";
import {
  GraduationCap,
  BrainCircuit,
  Zap,
  Shield,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onAuth(mode, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Study Partner",
      desc: "Answers grounded in your own notes",
    },
    {
      icon: Zap,
      title: "Smart Quizzes",
      desc: "Auto-generated from your course material",
    },
    {
      icon: BookOpen,
      title: "Full Course Detail",
      desc: "Chapters, syllabus & progress tracking",
    },
  ];

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="auth-art-bg" />
        <div className="auth-art-content">
          <div className="auth-brand">
            <span className="brand-icon">
              <GraduationCap />
            </span>
            <span>StudyVault</span>
          </div>
          <div className="auth-hero">
            <span className="eyebrow">YOUR PERSONAL LEARNING SPACE</span>
            <h1>
              <span style={{ color: "white" }}>Study smarter.</span>
              <br />
              <em>Grow together.</em>
            </h1>
            <p>
              Notes, AI study partner, quizzes, and learning progress — all in
              one premium workspace.
            </p>
          </div>
          <div className="auth-features">
            {features.map(({ icon: Icon, title, desc }) => (
              <div className="auth-feature-card" key={title}>
                <div className="auth-feature-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <b>{title}</b>
                  <small>{desc}</small>
                </div>
                <span className="live-dot" />
              </div>
            ))}
          </div>
          <div className="auth-foot">
            A unified platform for curious minds · StudyVault 2026
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit} autoComplete="on">
          <div className="auth-form-logo">
            <span className="brand-icon sm">
              <GraduationCap />
            </span>
          </div>
          <span className="eyebrow">
            {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
          </span>
          <h2>
            {mode === "login" ? "Sign in to StudyVault" : "Create your account"}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Pick up where your learning left off."
              : "Your next study session starts here."}
          </p>

          {mode === "register" && (
            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@college.edu"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              required
              minLength="8"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="primary full auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
            {!loading && <span>→</span>}
          </button>

          <p className="switch">
            {mode === "login"
              ? "New to StudyVault?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
          <p className="secure">
            <Shield size={10} /> Protected with secure password hashing and JWT
            authentication.
          </p>
        </form>
      </div>
    </div>
  );
}
