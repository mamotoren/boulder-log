"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("ログインしてください。");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("id, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setMessage("会員情報を取得できませんでした。");
      } else {
        setMemberId(data.id);
        setDisplayName(data.display_name ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    const name = displayName.trim();

    if (!memberId) {
      setMessage("会員情報が見つかりません。");
      return;
    }

    if (!name || name.length > 20) {
      setMessage("名前は1〜20文字で入力してください。");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("members")
      .update({ display_name: name })
      .eq("id", memberId);

    if (error) {
      setMessage("保存に失敗しました：" + error.message);
    } else {
      setDisplayName(name);
      setMessage("名前を保存しました！");
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-3xl font-black">プロフィール</h1>
        <p className="text-slate-400">
          ランキングに表示する名前を変更できます。
        </p>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            <label className="block space-y-2">
              <span className="font-bold">表示名</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={20}
                placeholder="ランキングに表示する名前"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
              />
            </label>

            <button
              onClick={saveProfile}
              disabled={saving || !memberId}
              className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "保存中..." : "名前を保存"}
            </button>

            {message && (
              <p className="break-words rounded-xl bg-slate-900 p-3">
                {message}
              </p>
            )}
          </>
        )}

        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl bg-slate-800 p-3 font-bold"
        >
          ホームに戻る
        </button>
      </div>
    </main>
  );
}
