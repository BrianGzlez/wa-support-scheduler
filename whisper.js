// scripts/voice.js
const { downloadMediaMessage } = require("@adiwajshing/baileys");
const { Configuration, OpenAIApi } = require("openai");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";

/**
 * Transcribe an audio file using OpenAI Whisper.
 * @param {string} filePath - absolute or relative file path
 * @returns {Promise<string>} transcription text or "ERROR"
 */
const voiceToText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("Audio file not found.");
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY env var.");
      return "ERROR";
    }
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    // Using legacy createTranscription to match your current SDK usage
    const resp = await openai.createTranscription(
      fs.createReadStream(filePath),
      TRANSCRIPTION_MODEL
    );

    return (resp?.data?.text || "").trim();
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    console.error("OpenAI transcription error:", msg);
    return "ERROR";
  }
};

/**
 * Convert OGG to MP3 using ffmpeg.
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<boolean>}
 */
const convertOggMp3 = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioQuality(96)
      .toFormat("mp3")
      .save(outputPath)
      .on("end", () => resolve(true))
      .on("error", (e) => reject(e));
  });
};

/**
 * Downloads a WA voice note, converts it to MP3, sends it to Whisper, and returns text.
 * @param {*} ctx - Baileys message context
 * @returns {Promise<string>} transcription text or "ERROR"
 */
const handlerAI = async (ctx) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const oggPath = path.join(tmpDir, `voice-note-${Date.now()}.ogg`);
  const mp3Path = path.join(tmpDir, `voice-note-${Date.now()}.mp3`);

  const cleanup = async () => {
    try { await fs.promises.unlink(mp3Path); } catch {}
    try { await fs.promises.unlink(oggPath); } catch {}
  };

  try {
    // Download voice message as Buffer
    const buffer = await downloadMediaMessage(ctx, "buffer");
    await fs.promises.writeFile(oggPath, buffer);

    // Convert to MP3
    await convertOggMp3(oggPath, mp3Path);

    // Transcribe
    const text = await voiceToText(mp3Path);
    return text || "ERROR";
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("Voice handler error:", msg);
    return "ERROR";
  } finally {
    await cleanup();
  }
};

module.exports = { handlerAI };
