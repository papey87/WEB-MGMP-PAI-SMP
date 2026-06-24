import React, { useState, useEffect } from "react";
import { TeacherResource } from "../types";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Plus, 
  UploadCloud, 
  Check, 
  AlertCircle,
  X,
  FileBox,
  MonitorPlay,
  Users,
  BookOpen,
  Printer,
  ShieldCheck
} from "lucide-react";

const INITIAL_RESOURCES: TeacherResource[] = [
  {
    id: "res-1",
    title: "Modul Ajar Kurikulum Merdeka VII - Bab 1: Kedudukan Al-Qur'an & Sunnah",
    category: "Al-Qur'an Hadis",
    grade: "7",
    type: "RPP/Modul Ajar",
    fileSize: "1.4 MB",
    downloads: 345,
    author: "H. Ahmad Fauzi, S.Ag.",
    createdDate: "2026-05-12"
  },
  {
    id: "res-2",
    title: "Materi PPT Interaktif Aqidah Kelas VIII - Pembiasaan Menghindari Akhlak Mazmumah",
    category: "Aqidah Akhlak",
    grade: "8",
    type: "Media PPT",
    fileSize: "7.8 MB",
    downloads: 512,
    author: "Zainal Abidin, S.Pd.I.",
    createdDate: "2026-06-02"
  },
  {
    id: "res-3",
    title: "LKPD Lembar Kerja Fiqih Kelas IX - Ketentuan Penyembelihan Hewan Qurban",
    category: "Fiqih",
    grade: "9",
    type: "LKPD",
    fileSize: "850 KB",
    downloads: 219,
    author: "Fatimah Az-Zahra, M.Pd.",
    createdDate: "2026-05-28"
  },
  {
    id: "res-4",
    title: "Silabus & Rencana Program Tahunan (PROTA) PAI Fase D Kelas VII-IX",
    category: "Umum / Kurikulum",
    grade: "Semua",
    type: "Silabus/Prota",
    fileSize: "2.1 MB",
    downloads: 670,
    author: "Nur Hidayat, M.Pd.",
    createdDate: "2026-04-15"
  },
  {
    id: "res-5",
    title: "Asesmen Sumatif Tengah Semester (ASTS) Materi Sejarah Perkembangan Islam di Nusantara",
    category: "Sejarah Peradaban Islam (Tarikh)",
    grade: "9",
    type: "Kuis/Asesmen",
    fileSize: "620 KB",
    downloads: 184,
    author: "Dr. Lailatul Badriyah",
    createdDate: "2026-06-10"
  },
  {
    id: "res-6",
    title: "Modul Ajar Kelas VII - Bab 5: Menghargai Keragaman Berdasarkan Syariat Islam",
    category: "Umum / Kurikulum",
    grade: "7",
    type: "RPP/Modul Ajar",
    fileSize: "1.7 MB",
    downloads: 142,
    author: "Dra. Siti Aminah",
    createdDate: "2026-06-18"
  },
  {
    id: "res-7",
    title: "Kisi-Kisi & Kisi Soal Sumatif Akhir Semester (SAS) Ganjil Kurikulum Merdeka VII-IX",
    category: "Umum / Kurikulum",
    grade: "Semua",
    type: "Kuis/Asesmen",
    fileSize: "1.2 MB",
    downloads: 129,
    author: "Tim Pokja Kurikulum Merdeka",
    createdDate: "2026-06-20"
  },
  {
    id: "res-8",
    title: "Bank Soal Pilihan Ganda & Essai Aqidah Akhlak Kelas VII Lengkap Kunci Jawaban",
    category: "Aqidah Akhlak",
    grade: "7",
    type: "Kuis/Asesmen",
    fileSize: "2.5 MB",
    downloads: 304,
    author: "Ahmad Fauzi, S.Ag.",
    createdDate: "2026-06-15"
  }
];

// Initial predefined Articles
const INITIAL_ARTICLES = [
  {
    id: "art-1",
    title: "Implementasi Adab Sopan Santun Terhadap Guru dan Orang Tua di Era Gen-Z",
    author: "Drs. H. Maimun Zubair, M.Pd.I.",
    date: "23 Juni 2026",
    summary: "Refleksi mendalam tentang tantangan menanamkan akhlakul karimah kepada generasi digital yang serba instan.",
    content: "Di tengah arus deras teknologi informasi di era Gen-Z, hubungan interpersonal mengalami pergeseran makna yang signifikan. Salah satu poin krusial yang terancam melonggar adalah nilai-nilai adab kesopanan murid terhadap guru serta orang tua.\n\nSebagai guru Pendidikan Agama Islam (PAI), kita ditantang untuk merumuskan ulang metode pengajaran akhlak. Tidak lagi sekadar menuntut hafalan dalil, melainkan menyajikan teladan yang adaptif melalui pendekatan emosional.\n\nDalam tulisan ini, dibahas langkah taktis seperti membiasakan budaya 'Tabayyun' sebelum merespons di jejaring sosial, membiasakan bersalaman santun, serta mengedepankan empati tatkala berdiskusi di forum publik."
  },
  {
    id: "art-2",
    title: "Strategi Pembelajaran Sejarah Kebudayaan Islam (SKI) yang Interaktif",
    author: "Lailatul Badriyah, M.Pd.",
    date: "19 Juni 2026",
    summary: "Meniadakan rasa jenuh siswa saat menyerap perjalanan sejarah nabi dan khulafaur rasyidin menggunakan visual mapping.",
    content: "Materi SKI sering kali dianggap sebagai materi hafalan kering oleh murid tingkat SMP. Guru yang hanya mengandalkan metode ceramah monoton rentan menciptakan kebosanan di ruang kelas.\n\nLangkah inovatif yang bisa dicoba adalah memanfaatkan visual timeline and role-playing (bermain peran). Misalnya, merancang drama singkat tentang Perjanjian Hudaibiyah. Murid akan merasakan atmosfer diplomasi Rasulullah SAW yang penuh kelembutan namun tegas.\n\nDengan demikian, esensi keteladanan kepemimpinan Islam diserap secara visual, motorik, dan afektif tingkat tinggi."
  }
];

export default function PerangkatAjarTab() {
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [activeSubdivision, setActiveSubdivision] = useState<"modul" | "kisi-soal" | "artikel">("modul");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("Semua");
  const [filterCategory, setFilterCategory] = useState<string>("Semua");
  const [filterType, setFilterType] = useState<string>("Semua");
  
  // Simulated download manager states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Custom Alert state
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Al-Qur'an Hadis");
  const [newGrade, setNewGrade] = useState<any>("7");
  const [newType, setNewType] = useState<any>("RPP/Modul Ajar");
  const [newAuthor, setNewAuthor] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Article flow states as requested
  const [articles, setArticles] = useState<any[]>([]);
  const [isArticleWritingMode, setIsArticleWritingMode] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleAuthor, setArticleAuthor] = useState("");
  const [articleDate, setArticleDate] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<any | null>(null);

  // Load from LocalStorage or fallback
  useEffect(() => {
    const saved = localStorage.getItem("mgmp_pai_resources");
    if (saved) {
      try {
        setResources(JSON.parse(saved));
      } catch (e) {
        setResources(INITIAL_RESOURCES);
      }
    } else {
      setResources(INITIAL_RESOURCES);
      localStorage.setItem("mgmp_pai_resources", JSON.stringify(INITIAL_RESOURCES));
    }

    const savedArticles = localStorage.getItem("mgmp_pai_articles");
    if (savedArticles) {
      try {
        setArticles(JSON.parse(savedArticles));
      } catch (e) {
        setArticles(INITIAL_ARTICLES);
      }
    } else {
      setArticles(INITIAL_ARTICLES);
      localStorage.setItem("mgmp_pai_articles", JSON.stringify(INITIAL_ARTICLES));
    }
  }, []);

  const [verifiedTeacher] = useState<any | null>(() => {
    const saved = localStorage.getItem("verified_teacher_data");
    return saved ? JSON.parse(saved) : null;
  });

  const handlePrintArticle = (art: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Gagal membuka jendela cetak. Pastikan pop-up browser Anda diaktifkan.");
      return;
    }

    const parseContentToHtml = (text: string): string => {
      return text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed === "") return "<br/>";
          if (trimmed.startsWith("### ")) {
            return `<h3 style="font-size: 14px; font-weight: 700; color: #0f766e; margin-top: 15px; margin-bottom: 8px;">${trimmed.substring(4)}</h3>`;
          }
          if (trimmed.startsWith("## ")) {
            return `<h2 style="font-size: 16px; font-weight: 800; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;">${trimmed.substring(3)}</h2>`;
          }
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return `<li style="margin-bottom: 4px; font-size: 13px; margin-left: 15px;">${trimmed.substring(2)}</li>`;
          }
          return `<p style="font-size: 13px; margin-bottom: 10px; text-align: justify; text-indent: 20px; line-height: 1.6;">${trimmed}</p>`;
        })
        .join("\n");
    };

    const formattedHtml = parseContentToHtml(art.content || art.isi || "");

    const htmlContent = `
      <html>
        <head>
          <title>${art.title || art.judul}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600;700;800&display=swap');
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
            .article-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f766e;
              line-height: 1.4;
              margin-bottom: 15px;
              text-align: center;
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
            <div><span>Jenis Dokumen:</span> Kajian Pembelajaran & Praktik Baik Guru</div>
            <div><span>Penyusun/Penulis:</span> ${art.author || art.nama || "Guru PAI SMP Subang"}</div>
            <div><span>Kategori Materi:</span> ${art.category || "Umum / Kurikulum"}</div>
            <div><span>Tanggal Rilis:</span> ${art.date || art.tanggalPenulisan || "Baru saja"}</div>
            <div><span>Status Publikasi:</span> Terdaftar Resmi MGMP Portal</div>
            <div><span>Verifikasi Dokumen:</span> Berhasil (SILADIK)</div>
          </div>

          <h2 class="article-title">${art.title || art.judul}</h2>

          <div class="content">
            ${formattedHtml}
          </div>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px;">
            <div style="text-align: center;">
              <p>Mengetahui,</p>
              <p style="margin-bottom: 50px;">Ketua MGMP PAI SMP Subang</p>
              <p><strong>Drs. H. Maimun Zubair, M.Pd.I.</strong></p>
              <p>NIP. 19740812 200212 1 003</p>
            </div>
            <div style="text-align: center;">
              <p>Subang, ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
              <p style="margin-bottom: 50px;">Penulis / Guru Pengampu</p>
              <p><strong>${art.author || art.nama || "...................................."}</strong></p>
              <p>NIP/NUPTK. ..................................</p>
            </div>
          </div>

          <button class="no-print-btn" onclick="window.print()">Cetak PDF / Dokumen Resmi</button>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownload = (id: string) => {
    const resItem = resources.find(r => r.id === id);
    if (resItem?.fileUrl) {
      window.open(resItem.fileUrl, "_blank");
      
      const updated = resources.map((res) => {
        if (res.id === id) {
          return { ...res, downloads: res.downloads + 1 };
        }
        return res;
      });
      setResources(updated);
      localStorage.setItem("mgmp_pai_resources", JSON.stringify(updated));
      return;
    }

    setDownloadingId(id);
    
    // Simulating a real stream download delay
    setTimeout(() => {
      const updated = resources.map((res) => {
        if (res.id === id) {
          return { ...res, downloads: res.downloads + 1 };
        }
        return res;
      });
      setResources(updated);
      localStorage.setItem("mgmp_pai_resources", JSON.stringify(updated));
      setDownloadingId(null);

      // Trigger custom UI download notification dialog
      const itemTitle = resources.find(r => r.id === id)?.title || "Dokumen Pendukung";
      setCustomAlert({
        title: "Pengunduhan Berhasil!",
        message: `Berkas perangkat ajar "${itemTitle}" sedang diunduh dan disimpan ke folder sitem lokal perangkat Anda.`
      });
    }, 1200);
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim() || !fileUrl.trim()) {
      setErrorMessage("⚠️ Mohon isi semua kolom judul, nama lengkap, dan tautan berkas.");
      return;
    }

    const nRes: TeacherResource = {
      id: "res-" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      grade: newGrade,
      type: newType,
      fileSize: "Link Tautan",
      downloads: 0,
      author: newAuthor.trim(),
      createdDate: new Date().toISOString().split('T')[0],
      isCustom: true,
      fileUrl: fileUrl.trim()
    };

    const updated = [nRes, ...resources];
    setResources(updated);
    localStorage.setItem("mgmp_pai_resources", JSON.stringify(updated));

    // Form inputs cleanup
    setNewTitle("");
    setNewAuthor("");
    setFileUrl("");
    setErrorMessage("");
    setSuccessMessage("✅ Berhasil! Tautan dokumen Anda telah disumbangkan ke dalam database.");

    setTimeout(() => {
      setIsModalOpen(false);
      setSuccessMessage("");
    }, 2000);
  };

  // Filter process
  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === "Semua" || res.grade === filterGrade;
    const matchesCategory = filterCategory === "Semua" || res.category === filterCategory;
    const matchesType = filterType === "Semua" || res.type === filterType;

    // Subdivision conditional checks
    const isKisiSoal = res.type === "Kuis/Asesmen" || 
                       res.title.toLowerCase().includes("kisi-kisi") || 
                       res.title.toLowerCase().includes("bank soal") ||
                       res.title.toLowerCase().includes("kisi soal") ||
                       res.title.toLowerCase().includes("soal");
                       
    const matchesSubdivision = activeSubdivision === "modul" ? !isKisiSoal : isKisiSoal;

    return matchesSearch && matchesGrade && matchesCategory && matchesType && matchesSubdivision;
  });

  return (
    <div className="space-y-8">
      {/* Tab intro heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Gudang Perangkat Ajar PAI
          </h1>
          <p className="text-xs text-slate-500">
            Kumpulan Modul Ajar, RPP, Silabus, LKPD, dan media belajar digital terverifikasi Kurikulum Merdeka Fase D (SMP)
          </p>
        </div>
        
        {/* Summited Trigger Action */}
        <button
          id="btn-upload"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Kontribusi Perangkat
        </button>
      </div>

      {/* Subdivision Segments Selection */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto shrink-0 pb-1 sm:pb-0">
          <button
            onClick={() => {
              setActiveSubdivision("modul");
              setFilterType("Semua");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubdivision === "modul"
                ? "bg-emerald-800 text-white shadow-sm font-extrabold"
                : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            MODUL AJAR
          </button>
          <button
            onClick={() => {
              setActiveSubdivision("kisi-soal");
              setFilterType("Semua");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubdivision === "kisi-soal"
                ? "bg-emerald-800 text-white shadow-sm font-extrabold"
                : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            KISI-KISI DAN BANK SOAL
          </button>
          <button
            onClick={() => {
              setActiveSubdivision("artikel");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubdivision === "artikel"
                ? "bg-emerald-800 text-white shadow-sm font-extrabold"
                : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            ARTIKEL & MATERI GURU
          </button>
        </div>
      </div>

      {activeSubdivision === "artikel" ? (
        <div className="space-y-6 animate-fade-in">
          {isArticleWritingMode ? (
            /* Document Editor Tab Canvas */
            <div className="space-y-6 bg-white p-6 md:p-10 rounded-3xl border border-slate-200/60 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-800">Tulis Ringkasan Materi & Artikel Baru</h2>
                  <p className="text-xs text-slate-400">Silakan isi draft di bawah ini untuk didistribusikan ke guru-guru se-kabupaten</p>
                </div>
                <button 
                  onClick={() => {
                    setIsArticleWritingMode(false);
                    setErrorMessage("");
                  }}
                  className="px-3.5 py-1.5 hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Kembali
                </button>
              </div>

              {errorMessage && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-600 text-amber-800 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!articleTitle.trim() || !articleAuthor.trim() || !articleContent.trim() || !articleDate.trim()) {
                  setErrorMessage("⚠️ Semua kolom bertanda bintang (*) wajib diisi.");
                  return;
                }

                const nArt = {
                  id: "art-" + Date.now(),
                  title: articleTitle.trim(),
                  author: articleAuthor.trim(),
                  date: articleDate.trim(),
                  summary: articleSummary.trim() || (articleContent.slice(0, 100) + "..."),
                  content: articleContent.trim()
                };

                const updated = [nArt, ...articles];
                setArticles(updated);
                localStorage.setItem("mgmp_pai_articles", JSON.stringify(updated));

                // Clean up
                setArticleTitle("");
                setArticleAuthor("");
                setArticleDate("");
                setArticleSummary("");
                setArticleContent("");
                setErrorMessage("");
                setIsArticleWritingMode(false);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Judul Artikel / Materi PAI *</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Metode Menghafal Juz Amma dengan Gerakan Isyarat"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Nama Penulis / Guru *</label>
                      <input 
                        type="text"
                        placeholder="Siti Rahmah, S.Pd.I."
                        value={articleAuthor}
                        onChange={(e) => setArticleAuthor(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Tanggal Publikasi *</label>
                      <input 
                        type="text"
                        placeholder="23 Juni 2026"
                        value={articleDate}
                        onChange={(e) => setArticleDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ringkasan Materi Pendek</label>
                  <input 
                    type="text"
                    placeholder="Deskripsi satu kalimat ringkas tentang isi materi..."
                    value={articleSummary}
                    onChange={(e) => setArticleSummary(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Rincian Lengkap / Isi Materi Pembelajaran *</label>
                  <textarea 
                    rows={8}
                    placeholder="Tuliskan materi ajar lengkap Anda, metode pengajaran, atau rangkuman materi di bagian kosong ini..."
                    value={articleContent}
                    onChange={(e) => setArticleContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsArticleWritingMode(false)}
                    className="px-5 py-2 hover:bg-slate-100 rounded-xl text-slate-500 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow cursor-pointer"
                  >
                    Simpan & Publikasikan Artikel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedArticleDetail ? (
            /* Immersion view for selected article detail */
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setSelectedArticleDetail(null)}
                  className="inline-flex items-center gap-1 hover:text-emerald-700 font-bold text-slate-500 text-xs border border-slate-200 px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  ← Kembali ke Daftar Artikel
                </button>
                <button
                  onClick={() => handlePrintArticle(selectedArticleDetail)}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Dokumen Resmi
                </button>
              </div>
              <div className="space-y-2">
                <h1 className="text-lg md:text-2xl font-black text-slate-800 leading-tight">
                  {selectedArticleDetail.title}
                </h1>
                <p className="text-xs text-slate-400 font-sans">
                  Penyusun: <strong className="text-slate-600">{selectedArticleDetail.author}</strong> | Dirilis Tanggal: <strong className="text-slate-600">{selectedArticleDetail.date}</strong>
                </p>
              </div>
              <div className="border-t pt-5 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {selectedArticleDetail.content}
              </div>
            </div>
          ) : (
            /* Standard grid display */
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Artikel Kajian & Materi Pembelajaran</h3>
                  <p className="text-xs text-slate-400">Distribusi modul non-dokumen hasil buah pikir dan karya tulis guru PAI SMP</p>
                </div>
                <button 
                  onClick={() => {
                    setIsArticleWritingMode(true);
                    setArticleTitle("");
                    setArticleAuthor("");
                    setArticleDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                    setArticleSummary("");
                    setArticleContent("");
                    setErrorMessage("");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Daftar & Tulis Artikel PAI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {articles.length > 0 ? (
                  articles.map((art) => (
                    <div key={art.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow active:border-emerald-100 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded">
                            Artikel Guru
                          </span>
                          <span>{art.date}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-850 hover:text-emerald-700 text-sm md:text-base leading-snug cursor-pointer line-clamp-2" onClick={() => setSelectedArticleDetail(art)}>
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {art.summary || art.content.slice(0, 100) + "..."}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Penulis: <strong className="text-slate-700 font-bold">{art.author}</strong>
                        </span>
                        <button 
                          onClick={() => setSelectedArticleDetail(art)}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          Baca Lengkap →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center text-slate-400 space-y-2">
                    <FileBox className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium">Belum ada materi/artikel yang dipublikasikan.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Control Actions / Search Bar Filter Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/50">
            {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari perangkat, materi, atau penyusun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs md:text-sm border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800"
          />
        </div>

        {/* Filter Grade */}
        <div id="filter-grade-box" className="relative">
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="w-full pl-3 pr-8 py-2 rounded-xl text-xs md:text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="Semua">Kelas: Semua Kelas</option>
            <option value="7">Kelas VII (Fase D)</option>
            <option value="8">Kelas VIII (Fase D)</option>
            <option value="9">Kelas IX (Fase D)</option>
            <option value="Semua">Kelas Semua Tingkatan</option>
          </select>
        </div>

        {/* Filter Type */}
        <div id="filter-type-box" className="relative">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-3 pr-8 py-2 rounded-xl text-xs md:text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="Semua">Format: Semua Berkas</option>
            <option value="RPP/Modul Ajar">Modul Ajar / RPP</option>
            <option value="Silabus/Prota">Silabus / PROTA / PROMES</option>
            <option value="LKPD">LKPD / Tugas Siswa</option>
            <option value="Media PPT">PowerPoint Interaktif</option>
            <option value="Kuis/Asesmen">Kisi-Kisi / Kuis Tes</option>
          </select>
        </div>
      </div>

      {/* Secondary Categories horizontal filter list */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mr-2">Materi Agama:</span>
        {["Semua", "Al-Qur'an Hadis", "Aqidah Akhlak", "Fiqih", "Sejarah Peradaban Islam (Tarikh)", "Umum / Kurikulum"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterCategory === cat
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200/40"
                : "bg-white text-slate-600 border border-slate-150 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Library Items container */}
      <div id="resources-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length > 0 ? (
          filteredResources.map((res) => (
            <div 
              key={res.id}
              className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Upper tags & size metadata info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-600 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded">
                      Kelas {res.grade}
                    </span>
                    {!res.isCustom && (
                      <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5 border border-emerald-150/50" title="Dokumen Kurikulum resmi yang telah diverifikasi oleh POKJA Kurikulum Merdeka MGMP Subang">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        Vetted
                      </span>
                    )}
                  </div>
                  <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100/50">
                    {res.fileSize}
                  </span>
                </div>

                {/* Main title layout */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 text-sm md:text-base">
                    {res.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      🕌 {res.category}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                      📂 {res.type}
                    </span>
                  </div>
                </div>

                {/* Submitting author information details */}
                <div className="pt-3 border-t border-slate-100/80 space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Beban kerja disusun oleh:</p>
                  <p className="text-xs text-slate-800 font-semibold">{res.author}</p>
                </div>
              </div>

              {/* Lower downloads statistics & interactive actionable buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {res.downloads} kali diunduh
                </span>
                
                <button
                  onClick={() => handleDownload(res.id)}
                  disabled={downloadingId !== null}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all ${
                    downloadingId === res.id 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                  }`}
                >
                  {downloadingId === res.id ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-emerald-700 animate-spin"></span>
                      Proses...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Unduh Berkas
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-slate-400 space-y-3">
            <FileBox className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-600">Berkas tidak ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tidak ada perangkat ajar yang cocok dengan kata kunci pencarian atau kombinasi filter Anda saat ini.
            </p>
          </div>
        )}
      </div>
      </>)}

      {/* Interactive simulation upload modal */}
      {isModalOpen && (
        <div id="upload-modal" className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between">
            {/* Header info bar */}
            <div className="p-6 border-b border-radial border-slate-100 bg-gradient-to-r from-emerald-550 to-emerald-650 flex items-center justify-between text-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-800 inline-flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  Sumbangkan Perangkat Ajar
                </h3>
                <p className="text-[11px] text-slate-500">Mendukung penyebaran metode ajar PAI SMP terbaik</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body form input fields */}
            <form onSubmit={handleCreateResource} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Perangkat / Judul Materi *</label>
                <input 
                  type="text"
                  placeholder="Contoh: Modul Ajar Kelas VII Bab Menghormati Guru Kurikulum Merdeka"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* Categories & Grade selection side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 font-semibold">Lingkup Materi PAI</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Al-Qur'an Hadis">Al-Qur'an Hadis</option>
                    <option value="Aqidah Akhlak">Aqidah Akhlak</option>
                    <option value="Fiqih">Fiqih</option>
                    <option value="Sejarah Peradaban Islam (Tarikh)">Sejarah Peradaban Islam (Tarikh)</option>
                    <option value="Umum / Kurikulum">Umum / Kurikulum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 font-semibold">Tingkatan Siswa</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="7">Kelas VII</option>
                    <option value="8">Kelas VIII</option>
                    <option value="9">Kelas IX</option>
                    <option value="Semua">Semua Tingkatan</option>
                  </select>
                </div>
              </div>

              {/* Type resource selection box */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 font-semibold">Jenis Dokumen Berkas</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="RPP/Modul Ajar">Modul Ajar / RPP</option>
                    <option value="Silabus/Prota">Silabus / PROTA</option>
                    <option value="LKPD">Lembar Kerja / LKPD</option>
                    <option value="Media PPT">PowerPoint Presentasi</option>
                    <option value="Kuis/Asesmen">Kisi Tes / Kuis</option>
                  </select>
                </div>

                {/* Link Tautan Berkas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-705">Tautan/Link Berkas (Google Drive/dll) *</label>
                  <input 
                    type="url"
                    placeholder="Contoh: https://drive.google.com/..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50"
                    required
                  />
                </div>
              </div>

              {/* Author field */}
              <div className="space-y-1 pb-2">
                <label className="text-xs font-bold text-slate-707">Nama Penyusun / Guru Pendamping *</label>
                <input 
                  type="text"
                  placeholder="Contoh: Siti Rahmah, S.Pd.I."
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* Footer CTA buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                >
                  Upload & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Dialogue */}
      {customAlert && (
        <div id="download-success-dialog" className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm md:text-base">{customAlert.title}</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold">
                  {customAlert.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="bg-slate-800 hover:bg-slate-900 active:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
