import React, { useState, useRef, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  HelpCircle, 
  GraduationCap, 
  Copy, 
  Check, 
  RotateCcw,
  BookOpen,
  Lock,
  ShieldAlert,
  KeyRound,
  CheckSquare,
  Printer,
  Share2
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

const SUGGESTED_PROMPTS = [
  {
    icon: GraduationCap,
    label: "Modul Ajar Akhlak VII",
    prompt: "Buat Rencana Pelaksanaan Pembelajaran (RPP) / Modul Ajar Kurikulum Merdeka PAI SMP Kelas VII Materi Akhlak Terpuji terhadap sesama manusia."
  },
  {
    icon: HelpCircle,
    label: "Kuis Tajwid Kelas VIII",
    prompt: "Harap susun 5 soal pilihan ganda tentang Hukum Bacaan Mad (Mad Thabi'i dan Mad Far'i) untuk siswa kelas VIII SMP, lengkap kunci jawaban dan pembahasannya."
  },
  {
    icon: BookOpen,
    label: "Metode Mengajar Fiqih",
    prompt: "Berikan 3 ide metode pembelajaran interaktif dan menyenangkan untuk materi Fiqih Thaharah (Najis dan Hadas) Kelas VII agar siswa tidak bosan saat menghafal teori."
  },
  {
    icon: FileText,
    label: "Ringkasan Sejarah Islam",
    prompt: "Buat ringkasan infografis teks tentang Sejarah Daulah Umayyah di Damaskus Kelas VIII agar mudah diingat siswa dalam model peta konsep."
  }
];

interface AISobatGuruTabProps {
  onShareToArticles?: (title: string, content: string) => void;
}

export default function AISobatGuruTab({ onShareToArticles }: AISobatGuruTabProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "wel-1",
      role: "model",
      text: "Selamat datang, Bapak/Ibu Guru pejuang pendidikan! Saya adalah **AI Sobat Guru PAI**, asisten kecerdasan buatan dari MGMP PAI yang terlatih secara khusus untuk mendampingi proses rujukan ajar Anda.\n\nContoh kueri yang dapat saya bantu:\n- 📝 Merangkai **Modul Ajar/RPP** Kurikulum Merdeka atau K13.\n- 💡 Menyarankan ide dekorasi kelas atau **metode bermain peran (role-playing)**.\n- 🎯 Merancang kuis, bank soal, kisi-kisi, atau kartu ujian.\n- 📖 Menganalisis tafsir draf materi Al-Qur'an Hadis, Hukum Islam, maupun Sejarah (Tarikh).\n\nSilakan pilih salah satu kartu shortcut di atas atau ketik langsung kebutuhan belajar mengajar Anda di bawah ini!"
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verification & access restriction states
  const [verifiedTeacher, setVerifiedTeacher] = useState<any | null>(() => {
    const saved = localStorage.getItem("verified_teacher_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyWarning, setVerifyWarning] = useState<string | null>(null);
  const [foundTeacherInfo, setFoundTeacherInfo] = useState<any | null>(null);

  const handleVerifyTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameTrimmed = usernameInput.trim().toLowerCase();
    const passwordTrimmed = passwordInput.trim();

    if (!usernameTrimmed || !passwordTrimmed) {
      setVerifyError("Silakan masukkan Username dan Password Anda!");
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    setVerifyWarning(null);
    setFoundTeacherInfo(null);

    try {
      const teachersRef = collection(db, "siladik-guru-pai-smp");
      
      // Query by username
      const q = query(teachersRef, where("username", "==", usernameTrimmed));
      const querySnapshot = await getDocs(q);
      
      let matchDoc: any = null;
      if (!querySnapshot.empty) {
        // Find matching document where password matches
        for (const docSnap of querySnapshot.docs) {
          const d = docSnap.data();
          if (d.password === passwordTrimmed) {
            matchDoc = { id: docSnap.id, ...d };
            break;
          }
        }
      }

      if (matchDoc) {
        // Check status_pembayaran or iuran_bulanan fields
        const isPaid = matchDoc.status_pembayaran === "Lunas" || 
                       matchDoc.status_pembayaran === "Aktif" || 
                       matchDoc.iuran_bulanan === "Lunas" || 
                       matchDoc.iuran_bulanan === "Aktif" ||
                       matchDoc.iuranStatus === "Lunas";

        if (isPaid) {
          localStorage.setItem("verified_teacher_data", JSON.stringify(matchDoc));
          setVerifiedTeacher(matchDoc);
        } else {
          setFoundTeacherInfo(matchDoc);
          setVerifyWarning(
            `Halo ${matchDoc.nama}, akun Sigap PAI Anda aktif, namun fitur AI Sobat Guru saat ini terkunci karena Anda belum menyelesaikan iuran keanggotaan MGMP. Silakan hubungi Bendahara Komisariat wilayah Anda untuk aktivasi.`
          );
        }
      } else {
        setVerifyError(
          "Kredensial Sigap PAI tidak dikenali. Silakan periksa kembali Username/Password Anda atau hubungi Admin MGMP Kabupaten Subang."
        );
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerifyError("Terjadi kesalahan sistem saat menghubungi database: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetVerification = () => {
    localStorage.removeItem("verified_teacher_data");
    setVerifiedTeacher(null);
    setUsernameInput("");
    setPasswordInput("");
    setVerifyError(null);
    setVerifyWarning(null);
    setFoundTeacherInfo(null);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend) return;

    // Reset input
    setInputMessage("");

    // Create user message object
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text: textToSend
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Map existing chat history for server consumption
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil respon dari AI Sobat Guru. Pastikan Server Anda bekerja.");
      }

      const data = await res.json();
      const responseText = data.text || "";

      // Estimate tokens based on character count: ~1 token per 3 characters for Indonesian text
      const promptTokensCount = Math.max(12, Math.ceil(textToSend.length / 3) + 5);
      const responseTokensCount = Math.max(15, Math.ceil(responseText.length / 3) + 10);
      const totalTokensCount = promptTokensCount + responseTokensCount;

      try {
        await addDoc(collection(db, "ai-interactions"), {
          prompt: textToSend,
          response: responseText,
          promptTokens: promptTokensCount,
          responseTokens: responseTokensCount,
          totalTokens: totalTokensCount,
          userEmail: auth.currentUser?.email || "Guru-Anonim@mgmp.or.id",
          timestamp: new Date().toISOString(),
          dateString: new Date().toISOString().split("T")[0] // YYYY-MM-DD format for easy Recharts indexing
        });
      } catch (logErr) {
        console.warn("Failed to write AI interaction log to Firestore:", logErr);
      }

      const modelMsg: ChatMessage = {
        id: "model-" + Date.now(),
        role: "model",
        text: responseText || "Maaf, draf jawaban kosong. Hubungi admin terkait."
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "model",
        text: `⚠️ **Galat Koneksi API**\n\n${e.message || "Gagal menghubungkan ke server AI. Mohon pastikan kredensial GEMINI_API_KEY telah di-inject di Secrets panel Anda di pojok kanan atas."}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePrintMessage = (text: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Gagal membuka jendela cetak. Pastikan pop-up browser Anda diaktifkan.");
      return;
    }

    const parseMarkdownToHtml = (mdText: string): string => {
      return mdText
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed === "") return "<br/>";
          if (trimmed.startsWith("### ")) {
            return `<h3 class="doc-h3" style="font-size: 14px; font-weight: 700; color: #0f766e; margin-top: 20px; margin-bottom: 8px;">${trimmed.substring(4).replace(/\*\*/g, "")}</h3>`;
          }
          if (trimmed.startsWith("## ")) {
            return `<h2 class="doc-h2" style="font-size: 16px; font-weight: 800; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; margin-bottom: 10px;">${trimmed.substring(3).replace(/\*\*/g, "")}</h2>`;
          }
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return `<li style="margin-bottom: 5px; font-size: 13px;">${trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`;
          }
          const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numberedMatch) {
            return `<p style="font-size: 13px; margin-bottom: 12px; text-align: justify;"><strong>${numberedMatch[1]}.</strong> ${numberedMatch[2].replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
          }
          return `<p style="font-size: 13px; margin-bottom: 12px; text-align: justify;">${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
        })
        .join("\n");
    };

    const formattedHtml = parseMarkdownToHtml(text);

    const htmlContent = `
      <html>
        <head>
          <title>Hasil Rancangan AI - MGMP PAI SMP Kab. Subang</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .kop-surat {
              border-bottom: 4px double #0f766e;
              padding-bottom: 15px;
              margin-bottom: 30px;
              text-align: center;
            }
            .kop-surat h1 {
              font-size: 18px;
              font-weight: 800;
              color: #0f766e;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-surat h2 {
              font-size: 12px;
              font-weight: 600;
              color: #334155;
              margin: 5px 0 0 0;
            }
            .kop-surat p {
              font-size: 10px;
              color: #64748b;
              margin: 3px 0 0 0;
            }
            .doc-meta {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              font-size: 12px;
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              border: 1px solid #e2e8f0;
            }
            .doc-meta div span {
              font-weight: 600;
              color: #475569;
            }
            .no-print-btn {
              position: fixed;
              bottom: 20px;
              right: 20px;
              background-color: #0f766e;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              z-index: 9999;
            }
            @media print {
              .no-print-btn {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <h1>MUSYAWARAH GURU MATA PELAJARAN (MGMP) PAI SMP</h1>
            <h2>KABUPATEN SUBANG - PROVINSI JAWA BARAT</h2>
            <p>Sekretariat: Gedung Pusat Kegiatan Guru (PKG) Dinas Pendidikan Kabupaten Subang</p>
          </div>

          <div class="doc-meta">
            <div><span>Jenis Dokumen:</span> Rencana Pelaksanaan Pembelajaran (RPP) / Modul Ajar AI</div>
            <div><span>Pengembang AI:</span> Sobat Guru AI v1.2</div>
            <div><span>Guru Pengampu:</span> ${verifiedTeacher?.nama || "Guru PAI SMP Subang"}</div>
            <div><span>Asal Sekolah:</span> ${verifiedTeacher?.sekolah || "SMP Kabupaten Subang"}</div>
            <div><span>Tanggal Cetak:</span> ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            <div><span>Verifikasi Akses:</span> Terdaftar Aktif (SILADIK)</div>
          </div>

          <div class="content">
            ${formattedHtml}
          </div>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px;">
            <div style="text-align: center;">
              <p>Mengetahui,</p>
              <p style="margin-bottom: 50px;">Kepala Sekolah</p>
              <p>_______________________</p>
              <p>NIP. ..................................</p>
            </div>
            <div style="text-align: center;">
              <p>Subang, ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
              <p style="margin-bottom: 50px;">Guru Mata Pelajaran PAI</p>
              <p><strong>${verifiedTeacher?.nama || "...................................."}</strong></p>
              <p>NUPTK. ${verifiedTeacher?.nuptk || ".................................."}</p>
            </div>
          </div>

          <button class="no-print-btn" onclick="window.print()">Cetak Dokumen (Print)</button>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleShareToArticlesAction = (text: string) => {
    if (!onShareToArticles) return;
    
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let title = "Nasihat & Praktik Baik Guru PAI";
    if (lines.length > 0) {
      const firstLineClean = lines[0].replace(/[#*]/g, "").trim();
      if (firstLineClean.length > 5 && firstLineClean.length < 100) {
        title = firstLineClean;
      }
    }
    
    onShareToArticles(title, text);
  };

  const clearChatHistory = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan AI Sobat Guru?")) {
      setMessages([messages[0]]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // A very clean, dependency-safe Markdown and block parser in React to style output cleanly
  const renderMessageContent = (text: string) => {
    const paragraphs = text.split("\n");
    return paragraphs.map((line, pIndex) => {
      // Return empty line spacer
      if (line.trim() === "") return <div key={pIndex} className="h-2.5" />;

      // Header h3 formatting (### Title)
      if (line.startsWith("### ")) {
        return (
          <h4 key={pIndex} className="text-sm md:text-base font-bold text-slate-800 pt-3 pb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-amber-500 rounded-sm"></span>
            {line.substring(4).replace(/\*\*/g, "")}
          </h4>
        );
      }

      // Header h2 formatting (## Title)
      if (line.startsWith("## ")) {
        return (
          <h3 key={pIndex} className="text-base md:text-lg font-extrabold text-slate-800 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-emerald-700 rounded-sm"></span>
            {line.substring(3).replace(/\*\*/g, "")}
          </h3>
        );
      }

      // Bullets parsing (* or - )
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const value = line.trim().substring(2);
        return (
          <li key={pIndex} className="list-disc list-inside text-xs md:text-sm text-slate-650 leading-relaxed ml-3 pl-1">
            {formatBoldText(value)}
          </li>
        );
      }

      // Numbered items parsing (e.g. 1. )
      const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={pIndex} className="flex gap-2.5 items-start text-xs md:text-sm text-slate-650 leading-relaxed ml-1 pl-1">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 rounded text-[11px] mt-0.5 whitespace-nowrap">
              {numberedMatch[1]}
            </span>
            <span>{formatBoldText(numberedMatch[2])}</span>
          </div>
        );
      }

      // Regular line: parse **bold words**
      return (
        <p key={pIndex} className="text-xs md:text-sm text-slate-650 leading-relaxed">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  // Safe inner bold parser using React tags instead of dangerouslySetInnerHTML
  const formatBoldText = (textString: string) => {
    const parts = textString.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // Odd indices represent values captured between double asterisks
      if (index % 2 !== 0) {
        return <strong key={index} className="font-bold text-slate-800">{part}</strong>;
      }
      return part;
    });
  };

  if (!verifiedTeacher) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in-up">
        {/* Verification Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 to-teal-700" />
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-800 border border-emerald-100 shadow-inner">
              <Lock className="w-8 h-8 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Login Terintegrasi SILADIK</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Silakan masuk dengan kredensial resmi aplikasi siladik-guru-smp (Sigap PAI) Anda untuk mengaktifkan fitur premium asisten kecerdasan buatan (AI Sobat Guru).
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyTeacher} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-extrabold text-xs text-slate-700 block">Username Resmi Sigap PAI</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan Username Anda (contoh: ahmad.fauzi)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-medium text-xs md:text-sm"
                    disabled={verifying}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-xs text-slate-700 block">Password Kunci</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan Password Kunci Anda"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-medium text-xs md:text-sm"
                    disabled={verifying}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {verifyError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900 leading-relaxed font-semibold shadow-sm">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-800 block text-xs">Status: Gagal Login (Red Alert)</span>
                  <p>{verifyError}</p>
                </div>
              </div>
            )}

            {verifyWarning && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-start gap-3 text-xs text-amber-900 leading-relaxed font-semibold">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 block text-xs">Status: Akses Dibatasi (Amber Warning)</span>
                    <p>{verifyWarning}</p>
                  </div>
                </div>
                <div className="bg-white border border-amber-200/50 p-3.5 rounded-lg text-xs leading-normal text-slate-600 font-semibold space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px] border-b border-slate-100 pb-1">Detail Akun Pendidik:</span>
                  <div>• Nama Guru: <strong className="text-slate-800">{foundTeacherInfo?.nama}</strong></div>
                  <div>• Tempat Tugas: <strong className="text-slate-800">{foundTeacherInfo?.sekolah}</strong></div>
                  <div>• Komisariat: <strong className="text-slate-800">Wilayah {foundTeacherInfo?.komisariat?.toUpperCase()}</strong></div>
                  <div>• Status Iuran: <span className="bg-red-100 text-red-800 font-black px-2 py-0.5 rounded text-[10px] ml-1">🔴 Belum Bayar / Menunggak</span></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-black py-3 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memvalidasi Kredensial Sigap PAI...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Login & Validasi Akses SILADIK</span>
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 flex flex-col items-center space-y-2 text-[10px] text-slate-400 font-medium text-center leading-relaxed">
            <p className="font-semibold text-slate-500">
              💡 <strong>Catatan Demo & Simulasi:</strong> Akun guru lunas bawaan adalah: <code className="bg-slate-150 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">ahmad.fauzi</code> / <code className="bg-slate-150 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">sigap123</code>. Akun terkunci belum bayar bawaan adalah: <code className="bg-slate-150 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">lailatul</code> / <code className="bg-slate-150 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">sigap123</code>. Anda bisa menyesuaikan status iuran atau kredensial guru apa pun lewat menu <strong>Admin Panel &gt; Kelola Data Guru</strong> secara instan.
            </p>
            <p className="text-slate-350">Portal Database SILADIK Terverifikasi Dokumen Resmi MGMP PAI SMP Kabupaten Subang</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logged in Teacher Info Banner */}
      <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">Akses Sobat AI Aktif (Premium Terverifikasi)</div>
            <p className="text-[12px] text-emerald-800 font-bold leading-tight mt-0.5">
              Selamat Datang, <strong className="text-emerald-950 font-extrabold">{verifiedTeacher.nama}</strong> dengan asal sekolah <strong className="text-emerald-950 font-extrabold">{verifiedTeacher.sekolah}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={handleResetVerification}
          className="text-[10px] font-black text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          Keluar Sesi Guru
        </button>
      </div>
      {/* Intro info card layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-300 animate-pulse" />
            AI Sobat Guru PAI
          </h1>
          <p className="text-xs text-slate-500">
            Asisten cerdas perencana ajar dan evaluasi berbasis Kurikulum Merdeka SMP.
          </p>
        </div>
        
        {/* Reset Chat button and instructions */}
        <button
          onClick={clearChatHistory}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-100 bg-white shadow-sm transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Mulai Percakapan Baru
        </button>
      </div>

      {/* Suggested chips list */}
      <section id="prompt-shortcuts" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <div 
            key={i}
            onClick={() => handleSendMessage(prompt.prompt)}
            className="group cursor-pointer p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-100 hover:bg-emerald-50/10 hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-3"
          >
            <div className="p-2 w-max rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <prompt.icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-705 group-hover:text-emerald-800 transition-colors">
                {prompt.label}
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                {prompt.prompt}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Main chat conversation container */}
      <section id="chat-frame" className="rounded-3xl border border-slate-150 bg-slate-50 overflow-hidden flex flex-col h-[520px]">
        
        {/* Top bar */}
        <div className="bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white flex items-center justify-center font-bold">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs md:text-sm">Sobat Guru v1.2</h3>
              <p className="text-[10px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                AI Pendamping Aktif
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">
            Model: Gemini 3.5 Flash
          </span>
        </div>

        {/* Scrollable conversation section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === "user" 
                  ? "bg-slate-200 text-slate-805" 
                  : "bg-emerald-100 text-emerald-805"
              }`}>
                {msg.role === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Message bubble content with action menu */}
              <div className={`relative group/bubble p-5 rounded-2xl border ${
                msg.role === "user" 
                  ? "bg-emerald-800 text-emerald-50 border-emerald-700 rounded-tr-none" 
                  : "bg-white text-slate-700 border-slate-200/60 rounded-tl-none shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]"
              }`}>
                
                {/* Action buttons (only show for AI responses) */}
                {msg.role === "model" && (
                  <div className="absolute right-3 top-3 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1.5 bg-white p-0.5 rounded-lg shadow-sm border border-slate-100">
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="p-1.5 rounded-md hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Salin ke Papan Klip"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handlePrintMessage(msg.text)}
                      className="p-1.5 rounded-md hover:bg-slate-150 text-slate-500 hover:text-emerald-700 transition-colors"
                      title="Cetak RPP / Dokumen Resmi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {onShareToArticles && (
                      <button
                        onClick={() => handleShareToArticlesAction(msg.text)}
                        className="p-1.5 rounded-md hover:bg-slate-150 text-slate-500 hover:text-teal-700 transition-colors"
                        title="Bagikan ke Kumpulan Nasihat"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Styled text layout */}
                <div className="space-y-2.5">
                  {renderMessageContent(msg.text)}
                </div>

                {/* Tooltip hint to copy/print */}
                {msg.role === "model" && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 select-none">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Dibuat oleh AI Sobat Guru
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handlePrintMessage(msg.text)}
                        className="hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                      >
                        Cetak PDF
                      </button>
                      <span>•</span>
                      {onShareToArticles && (
                        <button 
                          type="button"
                          onClick={() => handleShareToArticlesAction(msg.text)}
                          className="hover:text-teal-700 font-bold transition-colors cursor-pointer"
                        >
                          Bagikan Nasihat
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtext info for copy confirm */}
                {copiedId === msg.id && (
                  <span className="absolute bottom-2 right-4 text-[9px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full border border-emerald-100 animate-bounce">
                    Berhasil disalin!
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Prompt typing indicator loader spinner */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-805 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/50 rounded-tl-none flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                <span className="text-xs text-slate-500 font-medium italic">Sobat Guru sedang memformulasikan RPP/Kuis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Form area */}
        <div className="bg-white border-t border-slate-150 p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-3 items-center"
          >
            <input 
              type="text"
              placeholder="Ketik topik materi PAI, misal: 'Tuliskan modul Fiqih Shalat Jumat Kelas VII beserta asessmennya'..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 text-xs md:text-sm text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 p-3 rounded-xl text-white shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            ⚠️ Sobat Guru PAI SMP bekerja offline & online menggunakan Kecerdasan Buatan. Selalu tinjau kelayakan rancangan ajar sebelum direkatkan ke RPP resmi Anda.
          </p>
        </div>

      </section>
    </div>
  );
}
