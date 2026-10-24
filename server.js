const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const MODEL_CONFIG = {
  "Gemini Flash (Free)": { provider: "gemini", model: "gemini-3.8-flash", key: "GEMINI_API_KEY" },
  "GPT-4o": { provider: "openai", model: "gpt-4o", key: "OPENAI_API_KEY" },
  "Claude": { provider: "anthropic", model: "claude-sonnet-4-20250514", key: "ANTHROPIC_API_KEY" },
  "Gemini": { provider: "gemini", model: "gemini-3.8-flash", key: "GEMINI_API_KEY" },
  "Llama": { provider: "groq", model: "llama-3.3-70b-versatile", key: "GROQ_API_KEY" }
};

function normalizeMessages(input) {
  return input.slice(-20).map(item => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return null;
    const content = item.content.trim().slice(0, 8000);
    if (!content) return null;
    return { role: item.role, content };
  }).filter(Boolean);
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(apiKey, messages) {
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const isWeb = /Tool:\\s*Web Research/i.test(lastUser);
  const isVideo = /Tool:\\s*Video Summary/i.test(lastUser);
  const isImage = /Tool:\\s*Image Prompt Maker/i.test(lastUser);
  const videoMatch = lastUser.match(/https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=[\\w-]+|youtu\\.be\\/[\\w-]+)/i);
  const cleanPrompt = lastUser.replace(/^Tool:[^\\n]*(?:\\n|\\\\n)Instructions:[^\\n]*(?:\\n|\\\\n)User request:\\s*/i, "").trim();
  if (isVideo && !videoMatch) {
    const textOnly = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    return { reply: "ভিডিও সারাংশের জন্য একটি পাবলিক YouTube URL দিন, অথবা ভিডিওর transcript/নোট পেস্ট করুন।" };
  }
  const parts = [{ text: isImage ? "Create an image based on this request. Return a generated image, not just a prompt. User request: " + cleanPrompt : messages[messages.length - 1].content }];
  if (isVideo && videoMatch) parts.unshift({ file_data: { file_uri: videoMatch[0] } });
  const contents = isVideo && videoMatch
    ? [{ role: "user", parts }]
    : messages.map((m, i) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const bodyObject = {
    systemInstruction: { parts: [{ text: "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate. Format answers clearly with Markdown when useful." }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  if (isWeb) bodyObject.tools = [{ google_search: {} }];
  const models = isImage
    ? ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview"]
    : ["gemini-3.8-flash", "gemini-3.6-flash"];
  let upstream;
  for (let i = 0; i < models.length; i++) {
    upstream = await fetchWithTimeout("https://generativelanguage.googleapis.com/v1beta/models/" + models[i] + ":generateContent", {
      method: "POST", headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(bodyObject)
    }, 90000);
    if (upstream.status !== 503 && !(isImage && upstream.status === 404)) break;
  }
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) throw new Error(providerError("Gemini", upstream.status, data.error?.message));
  const responseParts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = responseParts.find(p => p.inline_data?.data || p.inlineData?.data);
  const imageData = imagePart ? {
    mimeType: imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType || "image/png",
    data: imagePart.inline_data?.data || imagePart.inlineData?.data
  } : null;
  const reply = responseParts.map(p => typeof p.text === "string" ? p.text : "").filter(Boolean).join("\\n").trim();
  if (isImage && !imageData && !reply) throw new Error("এই API account-এ image generation চালু নেই বা মডেলটি উপলভ্য নয়। Google AI Studio-র model access ও quota যাচাই করুন।");
  return { reply: reply || (imageData ? "ছবি তৈরি হয়েছে।" : ""), imageData };
}

async function callOpenAI(apiKey, messages, model) {
  const upstream = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate. Use clear Markdown formatting." }, ...messages.map(m => ({ role: m.role, content: m.content }))], temperature: 0.7, max_tokens: 2048 })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) throw new Error(providerError("OpenAI", upstream.status, data.error?.message));
  return data.choices?.[0]?.message?.content?.trim();
}

async function callAnthropic(apiKey, messages, model) {
  const system = "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate. Use clear Markdown formatting.";
  const upstream = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, system, max_tokens: 2048, messages: messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })) })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) throw new Error(providerError("Claude", upstream.status, data.error?.message));
  return data.content?.filter(p => p.type === "text").map(p => p.text).join("").trim();
}

async function callGroq(apiKey, messages, model) {
  const upstream = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: "You are OpenChat AI, a helpful assistant. Reply in the user's language, including Bengali when appropriate. Use clear Markdown formatting." }, ...messages.map(m => ({ role: m.role, content: m.content }))], temperature: 0.7, max_tokens: 2048 })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) throw new Error(providerError("Llama/Groq", upstream.status, data.error?.message));
  return data.choices?.[0]?.message?.content?.trim();
}

function providerError(provider, status, detail) {
  console.error(provider + " API error:", status, detail || "No provider error message");
  if (status === 401 || status === 403) return provider + " API key ভুল, অথবা API access চালু নেই। Render Environment Variables যাচাই করুন।";
  if (status === 429) return provider + " API usage limit শেষ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।";
  if (status === 404) return provider + " মডেলটি পাওয়া যায়নি বা আপনার API account-এ উপলভ্য নয়।";
  return provider + " থেকে উত্তর পাওয়া যায়নি (HTTP " + status + ")। API key ও provider-এর usage limit যাচাই করুন।";
}

app.post("/api/chat", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const selected = typeof body.model === "string" ? body.model : "Gemini Flash (Free)";
  const config = MODEL_CONFIG[selected];
  if (!config) return res.status(400).json({ error: "মডেলটি তালিকায় নেই।" });
  const apiKey = process.env[config.key];
  if (!apiKey) {
    const keyLabels = { GEMINI_API_KEY: "Google AI Studio-তে তৈরি GEMINI_API_KEY", OPENAI_API_KEY: "OPENAI_API_KEY", ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY", GROQ_API_KEY: "GROQ_API_KEY" };
    return res.status(503).json({ error: selected + " ব্যবহার করতে Render Environment Variables-এ " + keyLabels[config.key] + " যোগ করতে হবে। API key কখনো ওয়েবপেজে বা চ্যাটে লিখবেন না।" });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return res.status(400).json({ error: "একটি মেসেজ পাঠান।" });
  const messages = normalizeMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "শেষ মেসেজটি user message হতে হবে।" });

  try {
    let answer;
    if (config.provider === "gemini") answer = await callGemini(apiKey, messages);
    else if (config.provider === "openai") answer = await callOpenAI(apiKey, messages, config.model);
    else if (config.provider === "anthropic") answer = await callAnthropic(apiKey, messages, config.model);
    else answer = await callGroq(apiKey, messages, config.model);
    if (!answer) return res.status(502).json({ error: "AI থেকে খালি উত্তর এসেছে। আবার চেষ্টা করুন।" });
    return res.status(200).json({ reply: answer });
  } catch (error) {
    const message = error?.name === "AbortError" ? "AI উত্তর দিতে বেশি সময় নিচ্ছে। আবার চেষ্টা করুন।" : (error.message || "AI সার্ভারে সংযোগ করা যায়নি।");
    return res.status(502).json({ error: message });
  }
});

app.get("/api/chat", (_req, res) => { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "শুধু POST request গ্রহণ করা হয়।" }); });
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("*", (req, res) => req.path.startsWith("/api/") ? res.status(404).json({ error: "API endpoint পাওয়া যায়নি।" }) : res.status(404).send("Not found"));
app.listen(PORT, "0.0.0.0", () => console.log("OpenChat AI server listening on port " + PORT));
