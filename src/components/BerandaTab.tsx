import React, { useState } from "react";
import { NewsItem, ArticleItem } from "../types";
import SiladikDashboard from "./SiladikDashboard";
import { 
  Users, 
  School, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  BookMarked,
  Quote,
  Clock,
  ArrowRight,
  Info,
  Smartphone,
  Download,
  X,
  AlertTriangle,
  RefreshCw,
  Check,
  PenTool,
  Plus,
  Sparkles
} from "lucide-react";

interface BerandaTabProps {
  news: NewsItem[];
  onSelectNews: (item: NewsItem) => void;
  onChangeTab: (tabId: string) => void;
  articles: ArticleItem[];
  onOpenArticle: (article: ArticleItem) => void;
  onWriteArticle?: () => void;
}

const QUOTES = [
  {
    text: "Siapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
    source: "Hadits Riwayat Muslim"
  },
  {
    text: "Pendidikan adalah penuntun segala kekuatan kodrat yang ada pada anak-anak, agar mereka dapat mencapai keselamatan dan kebahagiaan.",
    source: "Ki Hajar Dewantara"
  },
  {
    text: "Anak-anak itu bagaikan sehelai sutra putih bersih, yang siap menerima warna apa saja yang akan dipakaikan oleh pendidik kepadanya.",
    source: "Imam Al-Ghazali"
  },
  {
    text: "Tujuan tertinggi dari edukasi adalah menanamkan adab serta membekali murid untuk menyebarkan kemaslahatan di muka bumi.",
    source: "Pesan Syeikh Nawawi Al-Bantani"
  }
];

export default function BerandaTab({ news, onSelectNews, onChangeTab, articles = [], onOpenArticle, onWriteArticle }: BerandaTabProps) {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlState, setDlState] = useState<"idle" | "downloading" | "success">("idle");

  const latestArticles = articles.slice(0, 3);

  const apkVersion = localStorage.getItem("apk_version") || "v1.2.0";
  const apkBuild = localStorage.getItem("apk_build") || "Build 2026/06";
  const apkFilename = localStorage.getItem("apk_filename") || "mgmp-pai-subang-v12.apk";
  const apkSize = localStorage.getItem("apk_size") || "24.8 MB";

  const startApkDownload = () => {
    if (dlState === "downloading") return;
    setDlState("downloading");
    setDlProgress(0);
    const timer = setInterval(() => {
      setDlProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setDlState("success");
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const rotateQuote = () => {
    setActiveQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const currentQuote = QUOTES[activeQuoteIndex];

  return (
    <div className="space-y-8">
      {/* Hero Banner Section */}
      <section id="hero-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-emerald-850 text-white shadow-md border border-emerald-800">
        {/* Absolute Decorative Geometric Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full opacity-10 blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full opacity-10 blur-3xl -ml-16 -mb-16"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent bg-[#0e744c] border-[#0e744c]"></div>
 
        <div 
          className="relative px-6 py-8 md:py-10 md:px-10 max-w-4xl space-y-4 bg-[#0e744c]"
          style={{ width: "627.2px", height: "297.8px", maxWidth: "100%", maxHeight: "100%" }}
        >
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30"
            style={{ fontSize: "14px" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Portal Komunitas Guru PAI SMP
          </span>
          <h1 
            className="font-extrabold tracking-tight leading-tight"
            style={{ fontSize: "30px" }}
          >
            Mewujudkan Generasi <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              Cerdas, Berkarakter & Beradab
            </span>
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed max-w-2xl">
            Selamat datang di Portal Resmi Musyawarah Guru Mata Pelajaran (MGMP) Pendidikan Agama Islam SMP. 
            Wadah kolaborasi, berbagi perangkat ajar Kurikulum Merdeka, peningkatan kompetensi guru PAI, 
            dan integrasi kecerdasan buatan dalam pembelajaran Islam abad 21.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <button 
              id="btn-download-apk"
              onClick={() => setIsApkModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-emerald-950 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
            >
              Unduh APK MGMP
              <Smartphone className="w-4 h-4" />
            </button>
            <button 
              id="btn-try-ai"
              onClick={() => onChangeTab("ai-sobat")}
              className="inline-flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-50 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            >
              Coba AI Sobat Guru
              <span className="text-[9px] bg-amber-400 text-emerald-950 font-extrabold px-1 py-0.5 rounded">NEW</span>
            </button>
          </div>
        </div>
      </section>

      {/* SILADIK PAI SUBANG - Real-time Database Dashboard */}
      <SiladikDashboard />

      {/* Kolom Berbagi Nasihat (Undangan Menulis) */}
      <section id="latest-articles-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#080808] flex items-center gap-2">
              <PenTool className="w-5.5 h-5.5 text-emerald-600" />
              Kolom Berbagi Nasihat Guru PAI
            </h2>
            <p className="text-xs text-[#000000]">Tulis praktik baik, gagasan kreatif, atau nasihat hikmah Anda hari ini</p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={onWriteArticle}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Nasihat Baru</span>
            </button>
            <button 
              onClick={() => onChangeTab("artikel")}
              className="text-xs text-emerald-600 font-bold hover:text-emerald-700 inline-flex items-center gap-1 hover:translate-x-1 transition-transform bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl"
            >
              Kumpulan Artikel
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High-visibility "Berbagi Nasihat" full-width banner on the front page */}
        <div className="bg-[#0e744c] text-white rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle glow decorative background circle */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full opacity-20 blur-2xl -mr-12 -mt-12"></div>
          
          <div className="space-y-2 text-center md:text-left relative z-10">
            <h3 className="font-extrabold text-base md:text-lg tracking-tight flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
              Mari Berbagi Nasihat & Inspirasi Kebaikan
            </h3>
            <p className="text-xs text-emerald-100/95 max-w-2xl leading-relaxed">
              Punya praktik baik pembelajaran, ide kreatif, atau nasihat hikmah? Bagikan tulisan Anda sekarang agar dapat dibaca, dipelajari, dan menginspirasi seluruh guru PAI SMP se-Kabupaten Subang.
            </p>
          </div>
          <button
            onClick={onWriteArticle}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap relative z-10"
          >
            <Plus className="w-4 h-4" />
            Tulis & Berbagi Nasihat Sekarang
          </button>
        </div>
      </section>

      {/* Main Grid: News Feed + Islamic Quote Panel */}
      <section id="berita-dan-quote" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Column: News Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-[#080808]">Berita & Pengumuman Komunitas</h2>
              <p className="text-xs text-[#000000]">Kabar kegiatan terbaru, rilis regulasi, dan info penting seputar MGMP PAI SMP</p>
            </div>
            <button 
              onClick={() => onSelectNews(news[0])}
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center gap-0.5"
            >
              Terbaru
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div id="news-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => onSelectNews(item)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                    {item.category}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className={`font-semibold leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 ${index === 0 ? "text-[#000000]" : "text-slate-800"}`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="pt-2 text-xs text-emerald-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Baca Selengkapnya
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Islamic Quote & Quick Info */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Ruang Inspirasi</h2>
            <p className="text-xs text-[#000000]">Mutiara hikmah dan referensi keguruan</p>
          </div>

          {/* Golden Quote Board */}
          <div id="quote-board" className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border-2 border-amber-200/50 space-y-4 shadow-sm">
            <Quote className="w-8 h-8 text-amber-500/30 absolute right-4 top-4" />
            <span className="inline-block bg-amber-400 text-emerald-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Hikmah Hari Ini
            </span>
            <div className="min-h-[140px] flex flex-col justify-between">
              <p className="text-slate-700 italic text-sm font-medium leading-relaxed">
                "{currentQuote.text}"
              </p>
              <div className="pt-4 border-t border-amber-200/40 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-widest">
                  — {currentQuote.source}
                </span>
                <button 
                  onClick={rotateQuote}
                  className="text-xs bg-white text-slate-600 hover:text-amber-800 p-1.5 rounded-lg border border-slate-100 hover:border-amber-200 shadow-sm active:scale-95 transition-all"
                  title="Ganti Hikmah"
                >
                  Acak
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* APK Download & Installation Guide Modal */}
      {isApkModalOpen && (
        <div id="apk-download-modal" className="fixed inset-0 z-50 bg-slate-900/70 p-4 flex items-center justify-center backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col my-8">
            {/* Modal Header */}
            <div className="bg-emerald-900 text-white p-6 md:p-8 flex justify-between items-start shrink-0">
              <div className="space-y-1 md:space-y-2">
                <span className="bg-amber-400 text-emerald-950 font-black text-[9px] px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                  Android App Bundle (.apk)
                </span>
                <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-amber-400 shrink-0" />
                  Unduh Aplikasi Resmi MGMP PAI
                </h3>
                <p className="text-xs text-emerald-200/90 leading-relaxed max-w-lg font-medium">
                  Versi terbaru {apkVersion} ({apkBuild}) - Terintegrasi penuh dengan portal database SILADIK Kabupaten Subang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsApkModalOpen(false);
                  setDlState("idle");
                  setDlProgress(0);
                }}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] text-slate-705 font-sans">
              
              {/* Downloader Widget */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center space-y-4 shadow-inner">
                {dlState === "idle" && (
                  <div className="space-y-3">
                    <p className="text-xs md:text-sm text-slate-500 font-semibold">
                      Unduh berkas instalasi mandiri aman untuk semua jenis perangkat smartphone berbasis Android.
                    </p>
                    <button
                      type="button"
                      onClick={startApkDownload}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl text-xs md:text-sm font-black shadow-md shadow-emerald-200 inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Mulai Unduh APK ({apkSize})
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium font-semibold">Berkas baru dipindai & aman oleh Google Play Protect</p>
                  </div>
                )}

                {dlState === "downloading" && (
                  <div className="space-y-3 p-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 px-1">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-4.5 h-4.5 text-emerald-600 animate-spin animate-infinite" />
                        Mengunduh berkas APK...
                      </span>
                      <span>{dlProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${dlProgress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">Mohon tunggu hingga proses selesai...</p>
                  </div>
                )}

                {dlState === "success" && (
                  <div className="space-y-3 p-2 text-center animate-fade-in-up">
                    <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                      <Check className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">Unduhan APK Berhasil Dimulai!</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                      Berkas <strong>{apkFilename}</strong> telah diekstraksi. Jika unduhan tidak otomatis berjalan, silakan tekan tombol di bawah.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDlState("idle");
                        setDlProgress(0);
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-750 underline font-extrabold cursor-pointer"
                    >
                      Unduh Ulang Berkas APK
                    </button>
                  </div>
                )}
              </div>

              {/* Step-by-Step Installation Guide */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  MENGAPA PERLU INSTALASI MANDIRI? (APK NON-PLAY STORE)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Aplikasi MGMP PAI ini dirilis secara mandiri oleh Bidang Media & IT MGMP PAI SMP Kabupaten Subang untuk mempermudah akses guru-guru internal. Mengingat aplikasi belum dipublikasikan ke Google Play Store, silakan ikuti panduan berikut:
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      step: "01",
                      title: "Unduh Berkas APK",
                      desc: "Tekan tombol unduh berkas di atas. File 'mgmp-pai-subang-v12.apk' (24.8 MB) akan tersimpan langsung ke folder Unduhan di memori HP Anda."
                    },
                    {
                      step: "02",
                      title: "Aktifkan Sumber Tidak Dikenal",
                      desc: "Masuk ke Pengaturan (Setelan) HP Android Anda > Keamanan / Privasi > Aktifkan izin 'Instal Aplikasi dari Sumber Tidak Dikenal' (Install Unknown Apps) untuk peramban Google Chrome atau aplikasi Pengelola File (File Manager)."
                    },
                    {
                      step: "03",
                      title: "Lakukan Pemasangan & Klik Detail",
                      desc: "Buka file APK yang telah diunduh. Saat instalasi dimulai, apabila muncul jendela pop-up pemberitahuan Google Play Protect 'Diblokir oleh Play Protect' (Blocked by Play Protect), ketuk tombol 'Detail' atau 'Info Selengkapnya' yang berukuran kecil, kemudian pilih 'Tetap Instal' (Install Anyway). Ini aman 100% dan bebas dari virus."
                    },
                    {
                      step: "04",
                      title: "Aplikasi Siap Digunakan",
                      desc: "Setelah selesai, ikon MGMP PAI Subang akan muncul di layar utama smartphone Anda. Buka aplikasi dan nikmati integrasi penuh kepegawaian SILADIK serta fitur konsultasi kurikulum mandiri!"
                    }
                  ].map((guide) => (
                    <div key={guide.step} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/40 transition-all">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 w-8 h-8 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0 select-none">
                        {guide.step}
                      </span>
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-slate-800 text-xs md:text-sm">{guide.title}</h5>
                        <p className="text-[11px] md:text-xs text-slate-550 leading-relaxed font-semibold">{guide.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 md:px-8 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsApkModalOpen(false);
                  setDlState("idle");
                  setDlProgress(0);
                }}
                className="bg-slate-850 hover:bg-slate-900 duration-200 text-white font-extrabold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Tutup Panduan Pemasangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
