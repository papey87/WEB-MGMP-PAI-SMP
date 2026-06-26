import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve the uploads directory statically
app.use("/uploads", express.static(uploadDir));

// Route to handle APK file uploads as a raw octet-stream
app.post(
  "/api/upload-apk",
  express.raw({ type: "application/octet-stream", limit: "150mb" }),
  (req, res) => {
    try {
      const filename = (req.headers["x-filename"] as string) || "mgmp-app.apk";
      // Sanitize the filename to prevent directory traversal
      const safeFilename = path.basename(filename);
      const targetPath = path.join(uploadDir, safeFilename);

      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: "Isi berkas kosong atau tidak valid." });
      }

      fs.writeFileSync(targetPath, req.body);
      console.log(`Successfully saved APK to ${targetPath}`);

      const downloadUrl = `/uploads/${safeFilename}`;
      res.json({ success: true, downloadUrl, filename: safeFilename });
    } catch (error: any) {
      console.error("Error writing APK file:", error);
      res.status(500).json({ error: error.message || "Gagal menyimpan berkas APK di server." });
    }
  }
);

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for AI Sobat Guru PAI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Kunci API Gemini tidak ditemukan di server. Pastikan Anda telah mengonfigurasinya di Secrets." 
      });
    }

    const systemInstruction = 
      "Anda adalah AI Sobat Guru PAI, asisten AI khusus untuk guru Pendidikan Agama Islam (PAI) tingkat SMP (Sekolah Menengah Pertama) di Indonesia. " +
      "Tugas Anda adalah membantu guru merancang modul ajar, rencana pelaksanaan pembelajaran (RPP) Kurikulum Merdeka atau Kurikulum 2013, " +
      "membuat butir soal ujian/kuis interaktif, memberikan ide metode pembelajaran inovatif yang menyenangkan (seperti gamifikasi, diskusi kelompok, atau kisah teladan), " +
      "serta menjelaskan konsep-konsep materi PAI SMP (Al-Qur'an Hadis, Aqidah, Akhlak, Fiqih, Sejarah Peradaban Islam/SPI) secara mendalam namun mudah dipahami anak usia SMP. " +
      "Jawablah selalu dalam bahasa Indonesia yang ramah, profesional, solutif, praktis, dan penuh rasa hormat kepada para guru pejuang pendidikan. " +
      "Berikan contoh-contoh praktis, tabel, atau pemformatan Markdown yang rapi agar guru dapat langsung meng-copy bagian yang mereka butuhkan.";

    // Format chat history for contents
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Terjadi kesalahan pada sistem kecerdasan buatan." });
  }
});

// Configure Vite middleware or Static files service
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server komunitas running on port ${PORT}`);
  });
}

configureApp();
