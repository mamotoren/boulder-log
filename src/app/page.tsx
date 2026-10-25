"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Problem = {
  id: string | number;
  problem_code?: string | null;
  name?: string | null;
  grade?: string | number | null;
  points?: number | null;
  is_active?: boolean | null;
  photo_url?: string | null;
};

type Send = {
  problem_id: string | number;
};

type LeaderboardEntry = {
  member_id: string;
  display_name: string;
  total_points: number;
  completed_count: number;
};

export default function Home() {
  const [tab, setTab] = useState("課題一覧");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [sent, setSent] = useState<(string | number)[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("ログインしてください。");
        setLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !member) {
        setError(
          "会員情報が見つかりません。membersテーブルのuser_idを確認してください。"
        );
        setLoading(false);
        return;
      }

      setMemberId(member.id);

      const [problemResult, sendResult] = await Promise.all([
        supabase.from("problems").select("*"),
        supabase
          .from("sends")
          .select("problem_id")
          .eq("member_id", member.id),
      ]);

      if (problemResult.error) {
        setError("課題の読み込みエラー：" + problemResult.error.message);
      } else if (sendResult.error) {
        setError("完登記録の読み込みエラー：" + sendResult.error.message);
      } else {
        const rows = (problemResult.data ?? []) as Problem[];
        setProblems(rows.filter((p) => p.is_active !== false));

        const records = (sendResult.data ?? []) as Send[];
        setSent(records.map((record) => record.problem_id));
      }

      setLoading(false);
    }

    loadData();
  }, []);

  async function loadLeaderboard() {
    setRankingLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc("get_leaderboard");

      if (error) {
        setError("ランキング取得エラー：" + error.message);
      } else {
        setLeaderboard((data ?? []) as LeaderboardEntry[]);
      }
    } catch {
      setError("ランキングの読み込みに失敗しました。");
    } finally {
      setRankingLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "ランキング") {
      loadLeaderboard();
    }
  }, [tab]);

  async function toggleSend(problem: Problem) {
    if (!memberId || savingId !== null) return;

    setSavingId(problem.id);
    setError("");

    const alreadySent = sent.includes(problem.id);

    if (alreadySent) {
      const { error: deleteError } = await supabase
        .from("sends")
        .delete()
        .eq("member_id", memberId)
        .eq("problem_id", problem.id);

      if (deleteError) {
        setError("取り消しエラー：" + deleteError.message);
      } else {
        setSent((old) => old.filter((id) => id !== problem.id));

        if (tab === "ランキング") {
          await loadLeaderboard();
        }
      }
    } else {
      const { error: insertError } = await supabase.from("sends").insert({
        member_id: memberId,
        problem_id: problem.id,
      });

      if (insertError) {
        setError("保存エラー：" + insertError.message);
      } else {
        setSent((old) => [...old, problem.id]);
      }
    }

    setSavingId(null);
  }

  const completed = problems.filter((p) => sent.includes(p.id));
  const score = completed.reduce(
    (sum, p) => sum + (Number(p.points) || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 p-6">
        <p className="font-bold text-cyan-400">CLIMBING CLUB</p>
        <h1 className="mt-2 text-3xl font-black">BOULDER LOG</h1>
        <p className="mt-2 text-sm text-slate-400">
          登った課題を記録しよう。
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto p-4">
        {["課題一覧", "完登記録", "ランキング"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-4 py-2 font-bold ${
              tab === item
                ? "bg-cyan-400 text-slate-950"
                : "bg-slate-800 text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className="mx-auto max-w-2xl space-y-4 p-4">
        {error && (
          <p className="break-words rounded-xl bg-red-950 p-3 text-red-300">
            {error}
          </p>
        )}

        {loading && <p>データを読み込んでいます...</p>}

        {!loading && !error && (
          <>
            {tab === "課題一覧" && (
              <>
                <h2 className="text-xl font-bold">課題一覧</h2>

                {problems.length === 0 && (
                  <p className="text-slate-400">
                    課題がありません。Supabaseに課題を登録してください。
                  </p>
                )}

                {problems.map((p) => (
                  <article
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                  >
                    {p.photo_url && (
                      <img
                        src={p.photo_url}
                        alt={`${p.name || p.problem_code || "課題"}の写真`}
                        className="max-h-96 w-full bg-slate-950 object-contain"
                        loading="lazy"
                      />
                    )}

                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="break-words font-bold">
                          {p.name || p.problem_code || `課題 ${p.id}`}
                        </p>
                        <p className="text-sm text-slate-400">
                          {p.grade != null ? `${p.grade} ・ ` : ""}
                          {Number(p.points) || 0} pt
                        </p>
                      </div>

                      <button
                        onClick={() => toggleSend(p)}
                        disabled={savingId !== null}
                        className="shrink-0 rounded-xl bg-cyan-400 px-3 py-2 font-bold text-slate-950 disabled:opacity-60"
                      >
                        {savingId === p.id
                          ? "保存中..."
                          : sent.includes(p.id)
                            ? "完登済み ✓"
                            : "完登！"}
                      </button>
                    </div>
                  </article>
                ))}
              </>
            )}

            {tab === "完登記録" && (
              <>
                <h2 className="text-xl font-bold">完登記録</h2>

                <div className="rounded-2xl bg-slate-900 p-5">
                  <p className="text-slate-400">完登した課題数</p>
                  <p className="text-4xl font-black text-cyan-400">
                    {completed.length} 課題
                  </p>

                  <p className="mt-3">獲得ポイント：{score} pt</p>

                  <p className="mt-3 text-sm">
                    {completed
                      .map((p) => p.name || p.problem_code || `課題 ${p.id}`)
                      .join("、") || "まだ記録がありません"}
                  </p>
                </div>
              </>
            )}

            {tab === "ランキング" && (
              <>
                <h2 className="text-xl font-bold">ランキング</h2>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-slate-400">あなたの獲得ポイント</p>
                  <p className="text-4xl font-black text-cyan-400">
                    {score} pt
                  </p>
                </div>

                {rankingLoading && (
                  <p className="text-slate-400">
                    ランキングを読み込んでいます...
                  </p>
                )}

                {!rankingLoading && leaderboard.length === 0 && (
                  <p className="rounded-xl bg-slate-900 p-4 text-slate-400">
                    ランキングデータがありません。
                  </p>
                )}

                {leaderboard.slice(0, 8).map((entry, index) => (
                  <article
                    key={entry.member_id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl font-black">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold">
                        {entry.display_name}
                      </p>
                      <p className="text-sm text-slate-400">
                        完登 {entry.completed_count} 課題
                      </p>
                    </div>

                    <p className="shrink-0 text-xl font-black text-cyan-400">
                      {entry.total_points} pt
                    </p>
                  </article>
                ))}

                <button
                  onClick={loadLeaderboard}
                  disabled={rankingLoading}
                  className="w-full rounded-xl bg-slate-800 p-3 font-bold disabled:opacity-60"
                >
                  {rankingLoading ? "更新中..." : "ランキングを更新"}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}