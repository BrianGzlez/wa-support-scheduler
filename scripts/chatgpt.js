const OpenAI = require('openai');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Sends a chat completion request to OpenAI (SDK v4).
 *
 * @param {string} systemPrompt - System-level instructions for the assistant
 * @param {Array<{role: string, content: string}>} [messages] - Conversation history.
 *   If omitted, the systemPrompt is sent as a single user message.
 * @returns {Promise<string>} Assistant reply text
 */
async function chat(systemPrompt, messages) {
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  const builtMessages = messages && messages.length > 0
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : [{ role: 'user', content: systemPrompt }];

  const response = await openai.chat.completions.create({
    model,
    messages: builtMessages,
  });

  const reply = response.choices?.[0]?.message?.content ?? '';
  console.log('✅ LLM reply received.');
  return reply;
}

module.exports = { chat };
