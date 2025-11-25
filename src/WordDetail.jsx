import React, { useEffect, useState } from "react";

export default function WordDetail({ selected }) {
  const [similarWords, setSimilarWords] = useState([]);
  const [aiSentence, setAiSentence] = useState(null);
  const [loadingSentence, setLoadingSentence] = useState(false);

  useEffect(() => {
    if (!selected) return;

    // 清空舊資料
    setSimilarWords([]);
    setAiSentence(null);

    fetchSimilar(selected.word);
    fetchSentence(selected.word);
  }, [selected]);

  // =============================
  // ⭐ 相似單字：DB → GPT fallback
  // =============================
  async function fetchSimilar(word) {
    try {
      // ① 先用 embeddings 版本（資料庫）
      const dbRes = await fetch("/api/words/similar_db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const dbData = await dbRes.json();

      if (!dbData.error && dbData.length > 0) {
        setSimilarWords(dbData);
        return;
      }

      // ② fallback 到 GPT 版本
      const aiRes = await fetch("/api/words/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const aiData = await aiRes.json();

      if (!aiData.error) setSimilarWords(aiData);
    } catch (err) {
      console.error("相似字 API 錯誤：", err);
    }
  }

  // =============================
  // ⭐ 例句：GPT → JSON fallback
  // =============================
  async function fetchSentence(word) {
    setLoadingSentence(true);

    try {
      const res = await fetch("/api/words/sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await res.json();

      if (!data.error && data.sentence) {
        setAiSentence(data);
      } else {
        setAiSentence({
          sentence: `I saw the word ${word} today.`,
          translation: `我今天看到了 ${word} 這個單字。`,
        });
      }
    } catch (err) {
      console.error("例句 API 錯誤：", err);
      setAiSentence({
        sentence: `I saw the word ${word} today.`,
        translation: `我今天看到了 ${word} 這個單字。`,
      });
    }

    setLoadingSentence(false);
  }

  // =============================
  // 🔊 TTS
  // =============================
  function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    speechSynthesis.speak(msg);
  }

  if (!selected) return <p>請選擇單字</p>;

  return (
    <div>
      {/* 單字 + 按鈕 */}
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-3xl font-bold">{selected.word}</h2>
        <button
          onClick={() => speak(selected.word)}
          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg"
        >
          🔊 唸單字
        </button>
      </div>

      {/* 基本資訊 */}
      <p className="text-gray-700 text-lg mb-2">📌 中文：{selected.chinese}</p>
      <p className="text-gray-700">🏷 詞性：{selected.part_of_speech || "—"}</p>
      <p className="text-gray-500 mb-4">Level：{selected.level}</p>

      {/* ⭐ AI 例句 */}
      <h3 className="text-xl font-semibold mt-6">📝 AI 例句</h3>

      {loadingSentence ? (
        <p className="text-gray-400 text-sm">(AI 生成中…)</p>
      ) : aiSentence ? (
        <>
          <p className="mt-2">{aiSentence.sentence}</p>
          <p className="text-gray-600 mb-2">→ {aiSentence.translation}</p>
          <button
            onClick={() => speak(aiSentence.sentence)}
            className="px-3 py-1 bg-green-600 text-white rounded-lg"
          >
            🔊 朗讀例句
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">(尚無例句資料)</p>
      )}

      {/* ⭐ 相似單字 */}
      <h3 className="text-xl font-semibold mt-8">🔍 AI 語意相似單字</h3>

      {similarWords.length > 0 ? (
        <ul className="list-disc ml-5">
          {similarWords.map((x, i) => (
            <li key={i} className="mb-1">
              <span className="font-bold">{x.word}</span>
              <span className="ml-2 text-gray-600">{x.chinese}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-sm">(尚無相似單字)</p>
      )}
    </div>
  );
}
