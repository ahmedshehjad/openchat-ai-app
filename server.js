const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.post("/api/chat", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "সার্ভারে OPENAI_API_KEY সেট করা হয়নি। Render-এর Environment Variables-এ এটি যোগ করুন।"
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const requestedModel = typeof body.model === "string" ? body.model : "gpt-4o-mini";
  const allowedModels = new Set(["gpt-4o-mini", "gpt-4o"]);
  if (!allowedModels.has(requestedModel)) {
    return res.status(400).json({ error: "এই মডেলটি সংযুক্ত নয়। আপাতত OpenChat Demo অথবা GPT-4o নির্বাচন করুন।" });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: "একটি মেসেজ পাঠান।" });
  }

  const messages = body.messages.slice(-20).map((item) => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return null;
    const content = item.content.trim().slice(0, 8000);
    return content ? { role: item.role, content } : null;
  }).filter(Boolean);

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "শেষ মেসেজটি user message হতে হবে।" });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate." },
          ...messages
        ],
        temperature: 0.7
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      const message = upstream.status === 401
        ? "OpenAI API key গ্রহণ করা হয়নি। Render-এ সেট করা key যাচাই করুন।"
        : upstream.status === 429
          ? "OpenAI rate limit বা billing limit হয়েছে। API account ও billing যাচাই করুন।"
          : "AI provider থেকে উত্তর পাওয়া যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।";
      return res.status(status).json({ error: message });
    }

    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({ error: "AI থেকে খালি উত্তর এসেছে। আবার চেষ্টা করুন।" });
    }
    return res.status(200).json({ reply: answer.trim() });
  } catch (error) {
    return res.status(502).json({ error: "AI সার্ভারে সংযোগ করা যায়নি। নেটওয়ার্ক বা deployment যাচাই করুন।" });
  }
});

app.get("/api/chat", (_req, res) => {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "শুধু POST request গ্রহণ করা হয়।" });
});

app.use(express.static(path.join(__dirname), {
  index: "index.html",
  dotfiles: "ignore"
}));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenChat AI server listening on port ${PORT}`);
});
