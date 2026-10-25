"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabase() {
  const [message, setMessage] = useState("接続を確認しています...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("problems")
        .select("*")
        .limit(1);

      if (error) {
        setMessage(`応答あり。ただし確認が必要です：${error.message}`);
      } else {
        setMessage("成功！Supabaseに接続できました。");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-2xl font-bold">Supabase接続テスト</h1>
      <p className="mt-4">{message}</p>
    </main>
  );
}