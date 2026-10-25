"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Problem = {
  id: string | number;
  name: string | null;
  problem_code: string | null;
  grade: string | null;
  points: number | null;
  is_active: boolean | null;
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [name, setName] = useState("");
  const [problemCode, setProblemCode] = useState("");
  const [grade, setGrade] = useState("");
  const [points, setPoints] = useState("10");
  const [saving, setSaving] = useState(false);

  async function loadProblems() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("problems")
      .select("id, name, problem_code, grade, points, is_active")
      .order("problem_code", { ascending: true });

    if (error) {
      setMessage("読み込みエラー：" + error.message);
    } else {
      setProblems((data ?? []) as Problem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function checkLogin() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setMessage("ログインしてください。");
        setLoading(false);
        return;
      }

      await loadProblems();
    }

    checkLogin();
  }, []);

  function startEdit(problem: Problem) {
    setEditingId(problem.id);
    setName(problem.name ?? "");
    setProblemCode(problem.problem_code ?? "");
    setGrade(problem.grade ?? "");
    setPoints(String(problem.points ?? 10));
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setProblemCode("");
    setGrade("");
    setPoints("10");
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingId === null) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("problems")
      .update({
        name: name.trim(),
        problem_code: problemCode.trim() || null,
        grade: grade.trim() || null,
        points: Number(points),
      })
      .eq("id", editingId);

    if (error) {
      setMessage("編集エラー：" + error.message);
    } else {
      setMessage("課題を更新しました！");
      cancelEdit();
      await loadProblems();
    }

    setSaving(false);
  }

  async function deleteProblem(problem: Problem) {
    const confirmed = window.confirm(
      `「${problem.name || problem.problem_code || "この課題"}」を削除しますか？この操作は取り消せません。`
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("problems")
      .delete()
      .eq("id", problem.id);

    if (error) {
      setMessage("削除エラー：" + error.message);
    } else {
      setMessage("課題を削除しました。");
      if (editingId === problem.id) cancelEdit();
      await loadProblems();
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-black">課題管理</h1>
        <p className="mb-6 text-slate-400">
          登録済みの課題を編集・削除できます。
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950"
          >
            ＋ 課題を登録
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-slate-800 px-4 py-3 font-bold"
          >
            課題一覧へ戻る
          </Link>
        </div>

        {message && (
          <p className="mb-4 break-words rounded-xl bg-slate-900 p-3">
            {message}
          </p>
        )}

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            <p className="mb-4 text-slate-400">
              登録件数：{problems.length}件
            </p>

            {problems.length === 0 && (
              <p className="rounded-xl bg-slate-900 p-5">
                課題が登録されていません。
              </p>
            )}

            <div className="space-y-4">
              {problems.map((problem) => (
                <article
                  key={problem.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                >
                  {editingId === problem.id ? (
                    <form onSubmit={saveEdit} className="space-y-4">
                      <h2 className="text-lg font-bold">課題を編集</h2>

                      <div>
                        <label className="mb-1 block text-sm">課題名 *</label>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl bg-slate-800 p-3"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm">課題番号</label>
                        <input
                          value={problemCode}
                          onChange={(e) => setProblemCode(e.target.value)}
                          className="w-full rounded-xl bg-slate-800 p-3"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm">グレード</label>
                        <select
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full rounded-xl bg-slate-800 p-3"
                        >
                          <option value="">選択してください</option>
                          {[
                            "10級", "9級", "8級", "7級", "6級", "5級",
                            "4級", "3級", "2級", "1級", "初段", "二段",
                            "三段", "四段",
                          ].map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm">ポイント *</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={points}
                          onChange={(e) => setPoints(e.target.value)}
                          className="w-full rounded-xl bg-slate-800 p-3"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-60"
                        >
                          {saving ? "保存中..." : "変更を保存"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl bg-slate-700 px-4 py-2 font-bold"
                        >
                          キャンセル
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold">
                            {problem.name || "名前なし"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-400">
                            番号：{problem.problem_code || "未設定"}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            グレード：{problem.grade || "未設定"}
                          </p>
                          <p className="mt-1 text-sm text-cyan-400">
                            {problem.points ?? 0} pt
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm">
                          {problem.is_active ? "公開中" : "非公開"}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(problem)}
                          className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProblem(problem)}
                          className="rounded-xl bg-red-700 px-4 py-2 font-bold"
                        >
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
