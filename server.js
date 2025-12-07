const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("LINE Webhook received:", req.body);
  res.send("OK");
});

// Renderが使うポート番号
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});
