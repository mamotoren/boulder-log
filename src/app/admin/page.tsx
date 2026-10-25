"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [problemCode, setProblemCode] = useState("");
  const [grade, setGrade] = useState("");
  const [points, setPoints] = useState("10");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function registerProblem(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("先にログインしてください。");
        return;
      }

      let photoUrl: string | null = null;

      if (photoFile) {
        if (!photoFile.type.startsWith("image/")) {
          setMessage("画像ファイルを選択してください。");
          return;
        }

        if (photoFile.size > 5 * 1024 * 1024) {
          setMessage("写真は5MB以下にしてください。");
          return;
        }

        const safeName = photoFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("problem-photos")
          .upload(filePath, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) {
          setMessage("写真アップロードエラー：" + uploadError.message);
          return;
        }

        const { data } = supabase.storage
          .from("problem-photos")
          .getPublicUrl(filePath);

        photoUrl = data.publicUrl;
      }

      const { error } = await supabase.from("problems").insert({
        name: name.trim(),
        problem_code: problemCode.trim() || null,
        grade: grade.trim() || null,
        points: Number(points),
        is_active: true,
        photo_url: photoUrl,
      });

      if (error) {
        setMessage("課題登録エラー：" + error.message);
        return;
      }

      setMessage("課題と写真を登録しました！");
      setName("");
      setProblemCode("");
      setGrade("");
      setPoints("10");
      setPhotoFile(null);
      setPreviewUrl("");
      setFileInputKey((key) => key + 1);
    } catch {
      setMessage("予期しないエラーが発生しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-black">課題登録</h1>
        <p className="mb-6 text-slate-400">
          新しいボルダリング課題を登録します。
        </p>

        <form
          onSubmit={registerProblem}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <div>
            <label className="mb-2 block font-bold">課題名</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：青テープ 01"
              className="w-full rounded-xl bg-slate-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">課題番号</label>
            <input
              value={problemCode}
              onChange={(e) => setProblemCode(e.target.value)}
              placeholder="例：A-01"
              className="w-full rounded-xl bg-slate-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">グレード</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-xl bg-slate-800 p-3 text-white"
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
            <label className="mb-2 block font-bold">ポイント</label>
            <input
              required
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-xl bg-slate-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">課題の写真（任意）</label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhotoFile(file);
                setPreviewUrl(
                  file ? URL.createObjectURL(file) : ""
                );
              }}
              className="w-full rounded-xl bg-slate-800 p-3 text-white"
            />
            <p className="mt-2 text-sm text-slate-400">
              画像ファイル・5MB以下。写真なしでも登録できます。
            </p>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="選択した課題写真のプレビュー"
                className="mt-3 max-h-72 w-full rounded-xl object-contain"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:opacity-60"
          >
            {saving ? "登録中..." : "課題を登録する"}
          </button>

          {message && (
            <p className="break-words text-sm">{message}</p>
          )}
        </form>

        <a
          href="/"
          className="mt-5 inline-block text-cyan-400 underline"
        >
          ← 課題一覧に戻る
        </a>
      </div>
    </main>
  );
}