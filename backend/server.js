import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import AWS from "aws-sdk";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// 🔐 Configure AWS Polly
AWS.config.update({
  accessKeyId: "YOUR_AWS_ACCESS_KEY",
  secretAccessKey: "YOUR_AWS_SECRET",
  region: "ap-south-1",
});

const polly = new AWS.Polly();

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

// 🔊 Convert text to speech
function textToSpeech(text) {
  const params = {
    OutputFormat: "mp3",
    Text: text.substring(0, 3000), // limit
    VoiceId: "Aditi", // Hinglish support
  };

  return polly.synthesizeSpeech(params).promise();
}

// 🚀 API
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const text = await extractText(req.file.path, req.file.mimetype);

    if (!text) {
      return res.status(400).json({ error: "Text extraction failed" });
    }

    const audio = await textToSpeech(text);

    const audioPath = `audio-${Date.now()}.mp3`;
    fs.writeFileSync(audioPath, audio.AudioStream);

    res.json({
      audioUrl: `http://localhost:5000/${audioPath}`,
      text: text.substring(0, 500), // preview
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// serve audio
app.use(express.static("."));

app.listen(5000, () => console.log("Server running on port 5000"));