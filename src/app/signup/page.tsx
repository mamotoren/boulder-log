"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup() {
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("登録エラー：" + error.message);
    } else {
      setMessage(
        "登録処理が完了しました。確認メールが届いた場合は、メール内のリンクを開いてください。"
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto mt-16 max-w-md rounded-2xl bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">会員登録</h1>

        <label className="mt-6 block">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl bg-slate-800 p-3"
          placeholder="メールアドレス"
        />

        <label className="mt-4 block">パスワード（6文字以上）</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl bg-slate-800 p-3"
          placeholder="パスワード"
        />

        <button
          onClick={handleSignup}
          disabled={!email || password.length < 6}
          className="mt-6 w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:opacity-50"
        >
          会員登録する
        </button>

        {message && <p className="mt-4 break-words">{message}</p>}
      </div>
    </main>
  );
}