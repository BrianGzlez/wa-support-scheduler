const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: "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",
});

const openai = new OpenAIApi(configuration);

async function chat(prompt) {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4", // Cambia aquí el modelo a GPT-4
            messages: [{ role: "user", content: prompt }],
        });

        const reply = response.data.choices[0].message.content;
        console.log(reply);
        return reply;
    } catch (error) {
        console.error("Error al conectar con OpenAI: ", error);
        throw error;
    }
}


module.exports = { chat };
