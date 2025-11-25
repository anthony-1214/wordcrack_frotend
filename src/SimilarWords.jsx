import React, { useEffect, useState } from "react";

export default function SimilarWords({ word }) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!word) return;
    loadSimilar();
  }, [word]);

  async function loadSimilar() {
    setLoading(true);

    try {
      const res = await fetch("/api/words/similar_db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await res.json();
      setSimilar(data || []);
    } catch (err) {
      console.error("資料庫相似單字錯誤", err);
    }

    setLoading(false);
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-2">🔍 相關單字</h3>

      {loading && <p className="text-gray-500">載入中…</p>}

      <ul className="space-y-2">
        {similar.map((item) => (
          <li key={item.word} className="p-2 bg-gray-100 rounded-lg">
            <div className="font-semibold">{item.word}</div>
            <div className="text-gray-600 text-sm">{item.chinese}</div>
          </li>
        ))}
      </ul>

      {!loading && similar.length === 0 && (
        <p className="text-gray-400">（沒有找到相關單字）</p>
      )}
    </div>
  );
}