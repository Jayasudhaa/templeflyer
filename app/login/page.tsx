"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setMsg(null);

    if (!email || !password) {
      setMsg("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMsg(error.message);
      setMsg("Account created. Now switch to Login.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    router.push("/editor");
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h2>{mode === "signup" ? "Create Account" : "Login"}</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <button onClick={submit} style={{ width: "100%", padding: 10, marginTop: 12 }}>
        {mode === "signup" ? "Create Account" : "Login"}
      </button>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        Switch to {mode === "signup" ? "Login" : "Create Account"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
