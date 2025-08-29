// scripts/chatgpt.js
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

/**
 * Calls OpenAI with a system prompt and a user message.
 * Returns the assistant's text reply (string).
 *
 * @param {string} prompt - System prompt
 * @param {string} text   - User message
 * @returns {Promise<string>} Assistant reply text, or "ERROR" on failure
 */
const chat = async (prompt, text) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY env var.");
      return "ERROR";
    }

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // set your own in .env (e.g., gpt-3.5-turbo)

    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
    });

    const content = completion?.data?.choices?.[0]?.message?.content ?? "";
    // Don't print full LLM output to avoid leaking data
    console.log("✅ OpenAI reply received.");
    return content;
  } catch (err) {
    // Keep logs safe; don't dump entire error objects with potential request data
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    console.error("Error connecting to OpenAI:", msg);
    return "ERROR";
  }
};

module.exports = chat;
