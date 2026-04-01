import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📄 Extract text
async function extractText(filePath, mimetype) {
  const buffer = fs.readFileSync(filePath);

  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return data.text;
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return "";
}

// 🔊 Convert text → speech using OpenAI
async function textToSpeech(text) {
  const response = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text.substring(0, 3000), // limit for MVP
  });

  const audioPath = `audio-${Date.now()}.mp3`;

  // Convert to buffer
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(audioPath, buffer);

  return audioPath;
}

// 🚀 API
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const text = await extractText(req.file.path, req.file.mimetype);

    if (!text) {
      return res.status(400).json({ error: "Text extraction failed" });
    }

    const audioPath = await textToSpeech(text);

    res.json({
      audioUrl: `http://localhost:5000/${audioPath}`,
      text: text.substring(0, 500),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// serve audio
app.use(express.static("."));

app.listen(5000, () => console.log("Server running on port 5000"));