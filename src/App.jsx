import React, { useState, useEffect } from "react";
import { API_BASE } from "./api";

export default function App() {
  const [query, setQuery] = useState("");
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const [similarWords, setSimilarWords] = useState([]);
  const [aiSentence, setAiSentence] = useState(null);
  const [levelFilter, setLevelFilter] = useState(null);

  // -----------------------------
  // 初始化
  // -----------------------------
  useEffect(() => {
    loadWords();
  }, []);

  // -----------------------------
  // 載入全部單字
  // -----------------------------
  async function loadWords() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/words`);
      const data = await res.json();

      setWords(data);
      setSelected(data[0] || null);
      setApiConnected(true);

      if (data[0]) {
        fetchSimilar(data[0].word);
        fetchAiSentence(data[0].word);
      }
    } catch (err) {
      console.error("⚠️ 連線失敗：", err);
      setApiConnected(false);
    }
    setLoading(false);
  }

  // -----------------------------
  // 搜尋
  // -----------------------------
  async function handleSearch() {
    if (!query.trim()) return loadWords();

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      setWords(data);
      setSelected(data[0] || null);

      if (data[0]) {
        fetchSimilar(data[0].word);
        fetchAiSentence(data[0].word);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleSearch();
  }

  function clearSearch() {
    setQuery("");
    setSimilarWords([]);
    setAiSentence(null);
    loadWords();
  }

  // -----------------------------
  // A–Z 快捷鍵
  // -----------------------------
  async function filterByLetter(letter) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/words/by_letter/${letter}`);
      const data = await res.json();

      setWords(data);
      setSelected(data[0] || null);

      if (data[0]) {
        fetchSimilar(data[0].word);
        fetchAiSentence(data[0].word);
      }
    } catch (err) {
      console.error("A–Z 載入錯誤：", err);
    }
    setLoading(false);
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // -----------------------------
  // 相似字
  // -----------------------------
  async function fetchSimilar(word) {
    try {
      const dbRes = await fetch(`${API_BASE}/api/words/similar_db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const dbData = await dbRes.json();

      if (!dbData.error && dbData.length > 0) {
        setSimilarWords(dbData);
        return;
      }

      const aiRes = await fetch(`${API_BASE}/api/words/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const aiData = await aiRes.json();
      if (!aiData.error) setSimilarWords(aiData);
    } catch (err) {
      console.error("相似字錯誤：", err);
    }
  }

  // -----------------------------
  // AI 例句
  // -----------------------------
  async function fetchAiSentence(word) {
    try {
      const res = await fetch(`${API_BASE}/api/words/sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await res.json();

      if (!data.error) {
        setAiSentence(data);
        return;
      }

      setAiSentence({
        sentence: `I saw the word ${word} today.`,
        translation: `我今天看到了 ${word}。`,
      });
    } catch (err) {
      console.error("例句錯誤：", err);
      setAiSentence({
        sentence: `I saw the word ${word} today.`,
        translation: `我今天看到了 ${word}。`,
      });
    }
  }

  // -----------------------------
  // 點選左側單字
  // -----------------------------
  function handleSelect(w) {
    setSelected(w);
    fetchSimilar(w.word);
    fetchAiSentence(w.word);
  }

  // -----------------------------
  // Level 過濾
  // -----------------------------
  async function filterByLevel(level) {
    setQuery("");
    setSelected(null);
    setSimilarWords([]);
    setAiSentence(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/words/level/${level}`);
      const data = await res.json();

      setWords(data);
      setSelected(data[0] || null);

      if (data[0]) {
        fetchSimilar(data[0].word);
        fetchAiSentence(data[0].word);
      }

      setLevelFilter(level);
    } catch (err) {
      console.error("Level 載入錯誤：", err);
    }

    setLoading(false);
  }

  // -----------------------------
  // TTS
  // -----------------------------
  function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    msg.rate = 0.8;
    msg.pitch = 1;
    msg.volume = 1;
    speechSynthesis.speak(msg);
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-2">
        WordCrack · 英文單字查詢
      </h1>

      {/* 搜尋 */}
      <div className="max-w-3xl mx-auto flex gap-2 mb-6">
        <input
          className="flex-1 border px-4 py-2 rounded-lg"
          placeholder="輸入英文或中文搜尋…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          查詢
        </button>

        {query && (
          <button onClick={clearSearch} className="px-4 py-2 border rounded-lg">
            清除
          </button>
        )}
      </div>

      {/* A–Z */}
      <div className="max-w-3xl mx-auto mb-4 flex flex-wrap justify-center gap-1">
        {alphabet.map((l) => (
          <button
            key={l}
            onClick={() => filterByLetter(l)}
            className="px-2 py-1 text-sm bg-gray-200 rounded"
          >
            {l}
          </button>
        ))}

        {/* 全部（字母） */}
        <button
  onClick={() => {
    setQuery("");
    setLevelFilter(null);     // ⭐ 取消 level 高亮
    setSelected(null);        // ⭐ 清除右側舊資料
    setSimilarWords([]);      // ⭐ 防止顯示舊相似字
    setAiSentence(null);      // ⭐ 防止顯示舊例句
    loadWords();              // ⭐ 重新載入全部單字
  }}
  className="px-3 py-1 text-sm bg-yellow-200 rounded"
>
  全部
</button>
      </div>

      {/* Level 選單 */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap gap-2 justify-center">
        {[1, 2, 3, 4, 5, 6].map((lvl) => (
          <button
            key={lvl}
            onClick={() => filterByLevel(lvl)}
            className={`px-3 py-1 text-sm rounded transition ${
              levelFilter === lvl
                ? "bg-purple-600 text-white shadow"
                : "bg-purple-200 hover:bg-purple-300"
            }`}
          >
            L{lvl}
          </button>
        ))}

      </div>

      {/* 主體 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
        {/* 左側列表 */}
        <div className="bg-white p-4 rounded-xl border shadow-sm max-h-[70vh] overflow-auto">
          <h2 className="text-lg font-semibold mb-3">
            搜尋結果（{words.length}）
          </h2>

          {loading ? (
            <p className="text-gray-500 text-center">載入中…</p>
          ) : (
            <ul>
              {words.map((w) => (
                <li
                  key={w.id}
                  className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => handleSelect(w)}
                >
                  <div className="font-bold">{w.word}</div>
                  <div className="text-sm text-gray-600">{w.chinese}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 右側內容 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          {selected ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{selected.word}</h2>
                <button
                  onClick={() => speak(selected.word)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg"
                >
                  🔊 唸單字
                </button>
              </div>

              <p className="text-lg text-gray-700 mb-2">
                📌 中文：{selected.chinese}
              </p>

              <p className="text-gray-700">
                🏷 詞性：{selected.part_of_speech || "—"}
              </p>

              <p className="text-gray-500 mb-5">Level：{selected.level}</p>

              {/* AI 例句 */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">📝 單字例句</h3>

                {aiSentence ? (
                  <>
                    <div className="flex items-center gap-3">
                      <p className="mb-1">💬 {aiSentence.sentence}</p>

                      <button
                        onClick={() => speak(aiSentence.sentence)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg"
                      >
                        🔊 唸例句
                      </button>
                    </div>

                    <p className="text-gray-600 mb-3">
                      → {aiSentence.translation}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">（尚無例句）</p>
                )}
              </div>

              {/* 相似單字 */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">🔍 同義字</h3>

                {similarWords.length > 0 ? (
                  <ul className="list-disc ml-5">
                    {similarWords.map((sw, idx) => (
                      <li key={idx} className="mb-1">
                        <span className="font-bold">{sw.word}</span>
                        <span className="text-gray-600 ml-2">
                          {sw.chinese}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">（沒有相似單字）</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center">請選擇單字</p>
          )}
        </div>
      </div>
    </div>
  );
}