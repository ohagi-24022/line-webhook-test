// ===============================
// server.js（テキスト返信 + 画像保存 完全対応）
// ===============================

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// --- LINE のチャネルアクセストークンを設定 ---
const LINE_TOKEN = process.env.LINE_TOKEN || "ここに長期アクセストークンを入れる";

// --- 画像保存フォルダ（Renderの場合、/tmp のみ書き込み可能） ---
const IMAGE_SAVE_DIR = "/tmp/images";
if (!fs.existsSync(IMAGE_SAVE_DIR)) {
  fs.mkdirSync(IMAGE_SAVE_DIR, { recursive: true });
}

// =======================================================
// Webhook 受信
// =======================================================
app.post("/webhook", async (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));

  // イベントを取得
  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.sendStatus(200);
  }

  // 全イベントを処理
  for (const event of events) {
    const replyToken = event.replyToken;

    // ---- ① テキストメッセージの処理 ----
    if (event.type === "message" && event.message.type === "text") {
      const userText = event.message.text;

      await replyText(replyToken, `受け取りました！あなたのメッセージ：${userText}`);
    }

    // ---- ② 画像メッセージの処理 ----
    if (event.type === "message" && event.message.type === "image") {
      const messageId = event.message.id;

      // LINEサーバーから画像を取得
      const imageBuffer = await downloadImage(messageId);

      // 保存パス
      const filename = `${Date.now()}.jpg`;
      const savePath = path.join(IMAGE_SAVE_DIR, filename);

      fs.writeFileSync(savePath, imageBuffer);

      // ユーザーへ返信
      await replyText(replyToken, `画像を受け取りました！保存しました。\nファイル名：${filename}`);
    }
  }

  res.sendStatus(200);
});

// =======================================================
// LINEにテキスト返信
// =======================================================
async function replyText(replyToken, text) {
  return axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken: replyToken,
      messages: [{ type: "text", text: text }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_TOKEN}`,
      },
    }
  );
}

// =======================================================
// LINEサーバーから画像を取得
// =======================================================
async function downloadImage(messageId) {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
  });

  return response.data;
}

// =======================================================
// サーバー起動
// =======================================================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
