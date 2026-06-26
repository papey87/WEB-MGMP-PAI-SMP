import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
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

  const latestArticles = articles.slice(0, 4);

  const [apkVersion, setApkVersion] = useState(() => localStorage.getItem("apk_version") || "v1.2.0");
  const [apkBuild, setApkBuild] = useState(() => localStorage.getItem("apk_build") || "Build 2026/06");
  const [apkFilename, setApkFilename] = useState(() => localStorage.getItem("apk_filename") || "mgmp-pai-subang-v12.apk");
  const [apkSize, setApkSize] = useState(() => localStorage.getItem("apk_size") || "24.8 MB");
  const [apkDownloadUrl, setApkDownloadUrl] = useState(() => localStorage.getItem("apk_download_url") || "");

  useEffect(() => {
    const docRef = doc(db, "settings", "apk");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.version) {
          setApkVersion(data.version);
          localStorage.setItem("apk_version", data.version);
        }
        if (data.build) {
          setApkBuild(data.build);
          localStorage.setItem("apk_build", data.build);
        }
        if (data.filename) {
          setApkFilename(data.filename);
          localStorage.setItem("apk_filename", data.filename);
        }
        if (data.size) {
          setApkSize(data.size);
          localStorage.setItem("apk_size", data.size);
        }
        if (data.downloadUrl) {
          setApkDownloadUrl(data.downloadUrl);
          localStorage.setItem("apk_download_url", data.downloadUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  const [layoutConfig, setLayoutConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_layout_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.homeSections) return parsed;
      }
    } catch (e) {}
    return {
      homeSections: [
        { id: "hero", label: "Hero Banner", visible: true, order: 1, title: "", subtitle: "", description: "", badgeText: "" },
        { id: "siladik", label: "Sistem Informasi SILADIK", visible: true, order: 2, title: "" },
        { id: "advice", label: "Kolom Berbagi Nasihat / Tulisan Guru", visible: true, order: 3, title: "", description: "" },
        { id: "news_quote", label: "Berita, Pengumuman & Ruang Inspirasi", visible: true, order: 4, title: "", description: "", quoteTitle: "", quoteDescription: "" }
      ],
      customSections: [] as any[]
    };
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "layout"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLayoutConfig((prev) => ({
          ...prev,
          homeSections: data.homeSections || prev.homeSections,
          customSections: data.customSections || []
        }));
      }
    }, (err) => {
      console.warn("Layout listener failed in BerandaTab.tsx:", err);
    });
    return () => unsub();
  }, []);

  const triggerActualDownload = () => {
    const url = apkDownloadUrl || `/uploads/${apkFilename}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", apkFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startApkDownload = () => {
    if (dlState === "downloading") return;
    setDlState("downloading");
    setDlProgress(0);
    const timer = setInterval(() => {
      setDlProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setDlState("success");
          
          // Trigger actual download
          triggerActualDownload();
          
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const rotateQuote = () => {
    setActiveQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const currentQuote = QUOTES[activeQuoteIndex];

  return (
    <div className="space-y-4 md:space-y-5">
      {[...(layoutConfig.homeSections || [])]
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((sect: any) => {
          if (sect.visible === false) return null;

          switch (sect.id) {
            case "hero":
              return (
                <section key="hero" id="hero-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-emerald-850 text-white shadow-md border border-emerald-800">
                  {/* Absolute Decorative Geometric Accents */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full opacity-10 blur-3xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full opacity-10 blur-3xl -ml-16 -mb-16"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent bg-[#0e744c] border-[#0e744c]"></div>
           
                  <div className="relative px-5 py-5 md:py-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    {/* Left Column: Title and Description */}
                    <div className="lg:col-span-8 space-y-4">
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-sm animate-fade-in"
                        style={{ fontSize: "13px" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        {sect.badgeText || "Portal Komunitas Guru PAI SMP Kab. Subang"}
                      </span>
                      <h1 
                        className="font-extrabold tracking-tight leading-tight"
                        style={{ fontSize: "30px" }}
                      >
                        {sect.title || "Mewujudkan Generasi"} <br />
                        <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                          {sect.subtitle || "Cerdas, Berkarakter & Beradab"}
                        </span>
                      </h1>
                      <p className="text-emerald-100 text-xs md:text-sm leading-relaxed max-w-2xl">
                        {sect.description || "Selamat datang di Portal Resmi Musyawarah Guru Mata Pelajaran (MGMP) Pendidikan Agama Islam SMP Kabupaten Subang. Wadah kolaborasi, berbagi perangkat ajar Kurikulum Merdeka, peningkatan kompetensi guru PAI, dan integrasi kecerdasan buatan dalam pembelajaran Islam abad 21."}
                      </p>
                    </div>

                    {/* Right Column: Actions (Far Right, not in center) */}
                    <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch lg:justify-center bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/25 backdrop-blur-sm self-center w-full">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest text-center lg:text-left mb-1 opacity-95">
                        Akses Cepat Portal
                      </div>
                      
                      <button 
                        id="btn-download-apk"
                        onClick={() => setIsApkModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-between gap-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-emerald-950 px-5 py-3 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 shrink-0 text-emerald-950" />
                          Unduh APK Android
                        </span>
                        <span className="bg-emerald-950/10 px-2 py-0.5 rounded text-[9px] font-bold">V1.2</span>
                      </button>

                      <button 
                        id="btn-try-ai"
                        onClick={() => onChangeTab("ai-sobat")}
                        className="flex-1 inline-flex items-center justify-between gap-3 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border border-emerald-600/50 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                          Coba AI Sobat Guru
                        </span>
                        <span className="bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">BARU</span>
                      </button>
                    </div>
                  </div>
                </section>
              );

            case "siladik":
              return (
                <div key="siladik">
                  <SiladikDashboard onOpenApkInfo={() => setIsApkModalOpen(true)} />
                </div>
              );

            case "advice":
              return (
                <section key="advice" id="latest-articles-section" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-2xl font-bold text-[#080808] flex items-center gap-2">
                        <PenTool className="w-5.5 h-5.5 text-emerald-600" />
                        {sect.title || "Kolom Berbagi Nasihat Guru PAI"}
                      </h2>
                      <p className="text-xs text-[#000000]">
                        {sect.description || "Tulis praktik baik, gagasan kreatif, atau nasihat hikmah Anda hari ini"}
                      </p>
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

                  {latestArticles && latestArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestArticles.map((article, index) => {
                        const isFullWidth = (latestArticles.length === 1) || (latestArticles.length === 3 && index === 2);
                        return (
                          <div 
                            key={article.id}
                            onClick={() => onOpenArticle(article)}
                            className={`bg-white border border-slate-200/60 hover:border-emerald-500/40 rounded-3xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex flex-col justify-between cursor-pointer group space-y-3 ${
                              isFullWidth ? "md:col-span-2" : ""
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-emerald-100 uppercase">
                                  Praktik Baik
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {article.tanggalPenulisan}
                                </span>
                              </div>

                              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {article.judul}
                              </h3>

                              <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                                {article.isi}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-700 truncate">{article.nama}</span>
                                <span className="text-[10px] font-semibold text-slate-400 truncate flex items-center gap-1">
                                  <School className="w-3 h-3 text-slate-400 shrink-0" />
                                  {article.asalSekolah}
                                </span>
                              </div>
                              <span className="text-xs text-emerald-600 font-extrabold group-hover:translate-x-1 transition-transform shrink-0 flex items-center gap-1">
                                Baca
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-500">Belum ada tulisan nasihat guru.</p>
                      <p className="text-xs text-slate-400">Jadilah yang pertama membagikan tulisan praktik baik Anda!</p>
                    </div>
                  )}
                </section>
              );

            case "news_quote":
              return (
                <section key="news_quote" id="berita-dan-quote" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left 2 Column: News Feed */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-bold text-[#080808]">
                          {sect.title || "Berita & Pengumuman Komunitas"}
                        </h2>
                        <p className="text-xs text-[#000000]">
                          {sect.description || "Kabar kegiatan terbaru, rilis regulasi, dan info penting seputar MGMP PAI SMP"}
                        </p>
                      </div>
                      <button 
                        onClick={() => onSelectNews(news[0])}
                        className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center gap-0.5"
                      >
                        Terbaru
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div id="news-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div className="p-4 space-y-2.5">
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
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-800">
                        {sect.quoteTitle || "Ruang Inspirasi"}
                      </h2>
                      <p className="text-xs text-[#000000]">
                        {sect.quoteDescription || "Mutiara hikmah dan referensi keguruan"}
                      </p>
                    </div>

                    {/* Golden Quote Board */}
                    <div id="quote-board" className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border-2 border-amber-200/50 space-y-4 shadow-sm">
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
              );

            default:
              return null;
          }
        })}

      {/* Render Custom Layout Sections created by Admin */}
      {(layoutConfig.customSections || [])
        .filter((c: any) => c.visible !== false)
        .map((c: any, index: number) => (
          <section key={c.id || index} className="bg-white border border-slate-150/70 p-6 rounded-3xl shadow-sm space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {c.imageUrl && (
                <div className="w-full sm:w-1/3 h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                  <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="flex-grow space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800">{c.title}</h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {c.content}
                </div>
              </div>
            </div>
          </section>
        ))}

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
                  <div className="space-y-4 p-2 text-center animate-fade-in-up">
                    <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                      <Check className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">Unduhan APK Berhasil Dimulai!</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                      Berkas <strong>{apkFilename}</strong> sedang diunduh. Jika unduhan tidak otomatis berjalan, silakan klik tombol di bawah untuk mengunduh secara manual.
                    </p>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={triggerActualDownload}
                        className="bg-emerald-600 hover:bg-emerald-750 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        Mulai Unduh Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDlState("idle");
                          setDlProgress(0);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-700 underline font-extrabold cursor-pointer mt-1"
                      >
                        Kembali / Reset Status
                      </button>
                    </div>
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
