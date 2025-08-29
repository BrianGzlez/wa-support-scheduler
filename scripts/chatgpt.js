const { Configuration, OpenAIApi } = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable.');
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * Sends a single-turn prompt to OpenAI and returns the assistant reply.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function chat(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // keep your original model selection
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = response?.data?.choices?.[0]?.message?.content ?? '';
    // Avoid printing full LLM content to logs to prevent accidental leaks
    console.log('✅ LLM reply received.');
    return reply;
  } catch (error) {
    console.error('Error connecting to OpenAI:', error?.response?.data || error?.message || error);
    throw error;
  }
}

module.exports = { chat };
