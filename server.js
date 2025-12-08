console.log("USER_ID =", USER_ID);
console.log("LINE_TOKEN =", LINE_TOKEN ? "OK" : "EMPTY");


const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// === 必須 === あなたの LINE チャネルアクセストークン（環境変数）
const LINE_TOKEN = process.env.LINE_TOKEN;

// === あなたの LINE ユーザーID ===
const USER_ID = process.env.LINE_USER_ID;


// ------------------------------------------------------
// LINE → M5Stick に送る色の最新値
// ------------------------------------------------------
let latestColor = "#000000";

// ------------------------------------------------------
// M5Stick が色を取得する API
// ------------------------------------------------------
app.get("/getColor", (req, res) => {
  res.json({ color: latestColor });
});

// ------------------------------------------------------
// LINE Webhook で色を受信
// ------------------------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();

        // 色コードまたは色名か？
        if (/^#?[0-9A-Fa-f]{6}$/.test(text) || /^[a-zA-Z]+$/.test(text)) {
          latestColor = text.startsWith("#") ? text : text.toLowerCase();
          console.log("Color updated:", latestColor);

          await replyMessage(event.replyToken, `色を ${latestColor} に設定しました！`);
        } else {
          await replyMessage(event.replyToken, "色（例：red, blue, #00FF00）を送ってください！");
        }
      }
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// ------------------------------------------------------
// M5Stick → LINE へ通知するAPI
// ------------------------------------------------------
app.post("/sendMessage", async (req, res) => {
  const message = req.body.message || "メッセージ無し";

  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: USER_ID,
        messages: [{ type: "text", text: message }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_TOKEN}`
        }
      }
    );

    res.json({ status: "ok" });
  } catch (error) {
    console.log("LINE error:", error.response?.data || error);
    res.status(500).json({ error: "send failed" });
  }
});

// ------------------------------------------------------
async function replyMessage(replyToken, text) {
  return axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [{ type: "text", text }]
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_TOKEN}`
      }
    }
  );
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on " + port);
});
