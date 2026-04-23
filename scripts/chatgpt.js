const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable.');
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * Sends a chat completion request to OpenAI.
 *
 * @param {string} systemPrompt - System-level instructions for the assistant
 * @param {Array<{role: string, content: string}>} [messages] - Conversation history.
 *   If omitted, the systemPrompt is sent as a single user message.
 * @returns {Promise<string>} Assistant reply text
 */
async function chat(systemPrompt, messages) {
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Build the message array: system prompt first, then conversation history
    const builtMessages = messages && messages.length > 0
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [{ role: 'user', content: systemPrompt }];

    const response = await openai.createChatCompletion({
      model,
      messages: builtMessages,
    });

    const reply = response?.data?.choices?.[0]?.message?.content ?? '';
    console.log('✅ LLM reply received.');
    return reply;
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error?.message || String(error);
    console.error('Error connecting to OpenAI:', msg);
    throw error;
  }
}

module.exports = { chat };
