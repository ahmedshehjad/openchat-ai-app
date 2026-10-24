const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.post("/api/chat", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "সার্ভারে GEMINI_API_KEY সেট করা হয়নি। Render-এর Environment Variables-এ Google AI Studio-এর key যোগ করুন।"
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const requestedModel = typeof body.model === "string" ? body.model : "gemini-3.8-flash";
  if (requestedModel !== "gemini-3.8-flash") {
    return res.status(400).json({ error: "আপাতত শুধু Gemini Flash মডেলটি সংযুক্ত আছে।" });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: "একটি মেসেজ পাঠান।" });
  }

  const messages = body.messages.slice(-20).map((item) => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return null;
    const content = item.content.trim().slice(0, 8000);
    if (!content) return null;
    return {
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: content }]
    };
  }).filter(Boolean);

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "শেষ মেসেজটি user message হতে হবে।" });
  }

  try {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate." }]
      },
      contents: messages,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    });

    // Gemini may briefly return 503 during demand spikes; retry twice with a short delay.
    let upstream;
    for (let attempt = 0; attempt < 3; attempt++) {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: requestBody
      });
      if (upstream.status !== 503 || attempt === 2) break;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      // Log only the provider's status and error message; never log the API key.
      console.error("Gemini API error:", upstream.status, data.error?.message || "No provider error message");
      const message = upstream.status === 401 || upstream.status === 403
        ? "Gemini API key গ্রহণ করা হয়নি, অথবা API access চালু নেই। Google AI Studio key ও API access যাচাই করুন।"
        : upstream.status === 429
          ? "Gemini-এর ফ্রি ব্যবহারের সীমা আপাতত শেষ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
          : upstream.status === 404
            ? "Gemini মডেলটি পাওয়া যায়নি। Google AI Studio-তে Gemini 3.8 Flash access যাচাই করুন।"
            : upstream.status === 400
              ? "Gemini request গ্রহণ করেনি। মেসেজের ফরম্যাট বা API configuration যাচাই করতে হবে।"
              : "Gemini থেকে উত্তর পাওয়া যায়নি (HTTP " + upstream.status + ")। Render logs-এ বিস্তারিত দেখা যাবে।";
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: message });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map((part) => typeof part.text === "string" ? part.text : "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "Gemini থেকে খালি উত্তর এসেছে। আবার চেষ্টা করুন।" });
    }
    return res.status(200).json({ reply: answer });
  } catch (_error) {
    return res.status(502).json({ error: "AI সার্ভারে সংযোগ করা যায়নি। Render deployment ও নেটওয়ার্ক যাচাই করুন।" });
  }
});

app.get("/api/chat", (_req, res) => {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "শুধু POST request গ্রহণ করা হয়।" });
});

app.get("/", (_req, res) => {
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint পাওয়া যায়নি।" });
  }
  return res.status(404).send("Not found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenChat AI server listening on port ${PORT}`);
});
