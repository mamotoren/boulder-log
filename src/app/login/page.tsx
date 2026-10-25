"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("ログインエラー：" + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto mt-16 max-w-md rounded-2xl bg-slate-900 p-6">
        <h1 className="text-2xl font-black">ログイン</h1>
        <p className="mt-2 text-sm text-slate-400">
          登録した情報を入力してください。
        </p>

        <label className="mt-6 block">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl bg-slate-800 p-3"
        />

        <label className="mt-4 block">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl bg-slate-800 p-3"
        />

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="mt-6 w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        {message && (
          <p className="mt-4 break-words text-sm text-red-400">
            {message}
          </p>
        )}

        <p className="mt-4 text-sm text-slate-400">
          まだ会員登録していない場合は、/signup から登録してください。
        </p>
      </div>
    </main>
  );
}