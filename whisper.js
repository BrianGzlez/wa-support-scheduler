const { downloadMediaMessage } = require("@adiwajshing/baileys");
const OpenAI = require("openai");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

ffmpeg.setFfmpegPath(ffmpegPath);

const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";

/**
 * Transcribe an audio file using OpenAI (SDK v4).
 * @param {string} filePath - absolute or relative path to an MP3 file
 * @returns {Promise<string>} transcription text or "ERROR"
 */
const voiceToText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("Audio file not found: " + filePath);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY env var.");
    return "ERROR";
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: TRANSCRIPTION_MODEL,
    });

    return (transcription.text || "").trim();
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("OpenAI transcription error:", msg);
    return "ERROR";
  }
};

/**
 * Convert OGG to MP3 using ffmpeg.
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
const convertOggToMp3 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioQuality(96)
      .toFormat("mp3")
      .save(outputPath)
      .on("end", resolve)
      .on("error", reject);
  });
};

/**
 * Downloads a WhatsApp voice note, converts it to MP3, transcribes it, and returns the text.
 * @param {object} ctx - Baileys message context
 * @returns {Promise<string>} transcription text or "ERROR"
 */
const handlerAI = async (ctx) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const timestamp = Date.now();
  const oggPath = path.join(tmpDir, `voice-note-${timestamp}.ogg`);
  const mp3Path = path.join(tmpDir, `voice-note-${timestamp}.mp3`);

  const cleanup = async () => {
    for (const file of [oggPath, mp3Path]) {
      try { await fs.promises.unlink(file); } catch {}
    }
  };

  try {
    const buffer = await downloadMediaMessage(ctx, "buffer");
    await fs.promises.writeFile(oggPath, buffer);
    await convertOggToMp3(oggPath, mp3Path);
    const text = await voiceToText(mp3Path);
    return text || "ERROR";
  } catch (err) {
    console.error("Voice handler error:", err?.message || err);
    return "ERROR";
  } finally {
    await cleanup();
  }
};

module.exports = { handlerAI };
