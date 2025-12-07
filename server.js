const express = require("express");
const app = express();
app.use(express.json());

// LINE Messaging API からの Webhook を受け取る部分
app.post("/webhook", (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200); // ← これが重要（200を返す）
});

// Render が使うポート
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
