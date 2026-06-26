import React, { useState, useEffect } from "react";
import { NewsItem, ArticleItem } from "./types";
import BerandaTab from "./components/BerandaTab";
import ProfilTab from "./components/ProfilTab";
import PerangkatAjarTab from "./components/PerangkatAjarTab";
import KegiatanTab from "./components/KegiatanTab";
import InformasiTab from "./components/InformasiTab";
import AISobatGuruTab from "./components/AISobatGuruTab";
import AdminTab from "./components/AdminTab";
import ArtikelTab, { SEED_ARTICLES } from "./components/ArtikelTab";
import LogoMGMP from "./components/LogoMGMP";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Users, 
  Sparkles, 
  Home, 
  Menu, 
  X, 
  ArrowLeft, 
  BookOpenCheck,
  Check,
  FileText,
  Info,
  Lock
} from "lucide-react";


// Initial mock News data in Indonesian
const INITIAL_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Workshop Sinkronisasi Asesmen Kurikulum Merdeka PAI SMP Fase D",
    category: "AGENDA",
    date: "18 Juni 2026",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
    summary: "MGMP PAI SMP menyelenggarakan forum sinkronisasi penyusunan soal ujian Sumatif Akhir Semester (SAS) di tingkat kabupaten/kota guna menyelaraskan keterbacaan asesmen.",
    content: "Surabaya — Ratusan guru rujukan dari perwakilan MGMP PAI SMP di Jawa Timur menghadiri sidang koordinasi khusus penyusunan draf Bank Soal dan Asesmen Sumatif Akhir Semester (ASAS) Berbasis Kurikulum Merdeka.\n\nKetua MGMP Ahmad Fauzi menekankan bahwa materi ajar fase D mencakup lima pilar utama yang harus diramu secara moderat. Sinkronisasi bertujuan menyelaraskan pencapaian tujuan pembelajaran (TP) di tiap satuan pendidikan agar tidak terhimpit perbedaan kurikulum transisi.\n\nDalam workshop ini, diperkenalkan pula metode penilaian berbasis gamifikasi berbasis kuis digital untuk meringankan kecemasan murid ketika menempuh ulangan umum."
  },
  {
    id: "news-2",
    title: "Kemenag Salurkan Bantuan Kuota & Insentif Guru PAI Non-PNS Berprestasi",
    category: "REGULASI",
    date: "14 Juni 2026",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600",
    summary: "Kementerian Agama mengumumkan pemberian bantuan dana hibah dan peningkatan sarana pendukung digital untuk guru honorer PAI berdedikasi.",
    content: "Jakarta — Kabar gembira datang untuk seluruh jajaran pendidik PAI non-PNS tingkat SMP. Kementerian Agama menaruh perhatian tinggi terhadap percepatan digitalisasi kelas agama.\n\nTahun ini, penyaluran insentif akan diarahkan kepada guru-guru penggerak yang aktif berkontribusi membuat modul ajar mandiri atau mengelola komunitas guru pembelajar. Selain itu, subsidi kuota internet media belajar PAI diusulkan naik 20% dibandingkan tahun anggaran sebelumnya guna melancarkan platform pembelajaran daring/hybrid."
  },
  {
    id: "news-3",
    title: "Bimtek Pemanfaatan Teknologi AI dan ChatGPT dalam Desain Pembelajaran",
    category: "EDUKASI",
    date: "05 Juni 2026",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600",
    summary: "Sejalan dengan perkembagan dunia teknologi digital, MGMP mendorong para guru mengadopsi asisten AI secara bijak untuk meningkatkan produktivitas mengajar.",
    content: "Malang — Perkembangan Generative AI tidak boleh dipandang sebelah mata. Guru PAI se-kabupaten sepakat bahwa asisten AI seperti ChatGPT dan AI Sobat Guru bentukan MGMP dapat mendatangkan berkah produktivitas jika digunakan dengan bijaksana.\n\nDalam Bimtek tersebut, pemateri IT memperagakan pembuatan materi drama bertema 'Keteladanan Ummu Sulaim dalam Membela Kaum Muslim' hanya dalam waktu 5 menit. Guru diajarkan cara menulis prompt yang efektif agar AI memberikan analisis materi fadhilah akhlak yang valid secara historis dan syariat."
  },
  {
    id: "news-4",
    title: "Pedoman Penyelenggaraan Pentas Keterampilan dan Seni Islam (MAPSI) Tingkat SMP",
    category: "KESISWAAN",
    date: "25 Mei 2026",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600",
    summary: "Berikut petunjuk teknis juknis resmi pelaksanaan perlombaan tilawah Qur'an, kaligrafi kontemporer, pidato islami, dan rebana modern tingkat siswa.",
    content: "Sidoarjo — Panitia pelaksana kesiswaan MGMP PAI telah meluncurkan dokumen juknis (petunjuk teknis) pameran prestasi siswa MAPSI SMP tahun pelajaran 2026/2027.\n\nLomba-lomba ini ditujukan untuk memupuk kepercayaan diri siswa dan menyalurkan kreativitas seni muslim Nusantara yang berkemajuan. Cabang perlombaan meliputi pidato moderasi beragama, seni tulisan arab (kaligrafi khat naskhi), hingga aransemen musik rebana modern. Seluruh pedoman seleksi berkas tingkat rayon kini dapat diakses gratis di sekretariat bersama."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("beranda");
  const [showAdminTab, setShowAdminTab] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasSecret = params.get("admin") === "subang-juara" || 
                        params.get("akses") === "siladik-subang" || 
                        params.get("secret") === "mgmp-subang-juara" || 
                        params.get("kode") === "admin-mgmp-subang" ||
                        params.get("key") === "siladik-2026";
      if (hasSecret) {
        localStorage.setItem("admin_portal_access", "true");
        return true;
      }
    } catch (e) {
      console.warn("localStorage check failed", e);
    }
    return localStorage.getItem("admin_portal_access") === "true";
  });

  // Automatically reveal admin tab if officially logged in as the authorized admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === "feri.gunawan87@gmail.com") {
        setShowAdminTab(true);
        localStorage.setItem("admin_portal_access", "true");
      }
    });
    return () => unsub();
  }, []);

  const [layoutConfig, setLayoutConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_layout_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      tabs: [
        { id: "beranda", label: "Beranda", visible: true },
        { id: "profil", label: "Profil MGMP", visible: true },
        { id: "informasi", label: "Informasi", visible: true },
        { id: "kegiatan", label: "Agenda Kegiatan", visible: true },
        { id: "perangkat", label: "Perangkat Ajar", visible: true },
        { id: "artikel", label: "Artikel", visible: true },
        { id: "ai-sobat", label: "Tanya AI Sobat Guru", visible: true }
      ]
    };
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "layout"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tabs) {
          setLayoutConfig({ tabs: data.tabs });
          try {
            const saved = localStorage.getItem("custom_layout_config");
            let merged = { tabs: data.tabs };
            if (saved) {
              const parsed = JSON.parse(saved);
              merged = { ...parsed, tabs: data.tabs };
            }
            localStorage.setItem("custom_layout_config", JSON.stringify(merged));
          } catch (e) {
            console.error("Failed to merge layout config in App.tsx:", e);
          }
        }
      }
    }, (err) => {
      console.warn("Layout listener failed in App.tsx:", err);
    });
    return () => unsub();
  }, []);

  // Validate active tab selection
  useEffect(() => {
    if (activeTab === "admin") return;
    const isTabAvailable = (layoutConfig.tabs || []).some((t: any) => t.id === activeTab && t.visible !== false);
    if (!isTabAvailable) {
      const firstAvailableTab = (layoutConfig.tabs || []).find((t: any) => t.visible !== false);
      if (firstAvailableTab) {
        setActiveTab(firstAvailableTab.id);
      }
    }
  }, [activeTab, layoutConfig.tabs]);

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS);
  const [articlesList, setArticlesList] = useState<ArticleItem[]>(SEED_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [isArtikelFormOpen, setIsArtikelFormOpen] = useState(false);
  const [artikelFormPreset, setArtikelFormPreset] = useState<{ title: string; content: string } | null>(null);

  // Load news dynamically from Firestore, falling back to INITIAL_NEWS if empty
  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: NewsItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NewsItem);
      });
      if (list.length > 0) {
        setNewsList(list);
      }
    }, (err) => {
      console.warn("Failed to listen to news collection in App.tsx:", err);
    });
    return () => unsub();
  }, []);

  // Load articles dynamically from Firestore, falling back to SEED_ARTICLES if empty
  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: ArticleItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ArticleItem);
      });
      if (list.length > 0) {
        setArticlesList(list);
      } else {
        setArticlesList(SEED_ARTICLES);
      }
    }, (err) => {
      console.warn("Failed to listen to articles collection in App.tsx:", err);
      setArticlesList(SEED_ARTICLES);
    });
    return () => unsub();
  }, []);

  const tabIcons: Record<string, any> = {
    "beranda": Home,
    "profil": Users,
    "informasi": Info,
    "kegiatan": Calendar,
    "perangkat": BookOpen,
    "artikel": FileText,
    "ai-sobat": Sparkles
  };

  const dynamicTabs = (layoutConfig.tabs || [])
    .filter((t: any) => t.visible !== false)
    .map((t: any) => ({
      id: t.id,
      label: t.label,
      icon: tabIcons[t.id] || Home
    }));

  const tabsConfig = [
    ...dynamicTabs,
    ...(showAdminTab ? [{ id: "admin", label: "Portal Admin", icon: Lock }] : [])
  ];

  return (
    <div id="main-portal" className="min-h-screen bg-[#FBFDFB] text-slate-800 font-sans flex flex-col">
      {/* HEADER NAVBAR */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Logo Brand & Mobile Toggle icon */}
          <div className="flex items-center justify-between py-1.5 sm:py-2">
            {/* Logo Brand Brand Area */}
            <div 
              onClick={() => {
                setActiveTab("beranda");
                setSelectedNews(null);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
            >
              <LogoMGMP size={62} className="md:size-[72px] group-hover:scale-105 transition-all duration-300 drop-shadow-sm" />
              <div className="select-none flex flex-col justify-center">
                <h1 
                  className="font-extrabold tracking-tight leading-none group-hover:text-emerald-700 transition-colors"
                  style={{ fontSize: "30px", color: "#0e744c" }}
                >
                  MGMP PAI SMP
                </h1>
                <p 
                  className="font-bold tracking-tight mt-1 leading-snug"
                  style={{ fontSize: "15px", fontFamily: "system-ui", color: "#000000" }}
                >
                  Musyawarah Guru Mata Pelajaran Pendidikan Agama Islam
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 sm:gap-x-2 text-slate-500 font-semibold leading-none mt-1">
                  <span className="text-[#030303]" style={{ fontSize: "12px" }}>
                    Tingkat Sekolah Menengah Pertama
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span 
                    className="text-emerald-700 font-extrabold tracking-wide uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/60 w-max"
                    style={{ fontSize: "12px" }}
                  >
                    Kabupaten Subang
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Menu Action Toggle Button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none transition-colors"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Desktop Navigation Menu - Placed below the logo/portal name for PC layout */}
          <nav id="desktop-nav" className="hidden lg:flex items-center gap-1.5 pb-2 pt-1 border-t border-slate-100">
            {tabsConfig.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedNews(null);
                    setIsArtikelFormOpen(false);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100/30" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile menu panel dropdown */}
        {isMobileMenuOpen && (
          <div id="mobile-nav-panel" className="lg:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 shadow-inner animate-slide-down">
            {tabsConfig.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedNews(null);
                    setIsMobileMenuOpen(false);
                    setIsArtikelFormOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                    isSelected 
                      ? "bg-emerald-50 text-emerald-800" 
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN BODY WRAPPER CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {selectedNews ? (
          /* Immersion News Details Screen Mode */
          <article id="news-immersion" className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <button
              onClick={() => setSelectedNews(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Sebelumnya
            </button>

            {/* News Header details */}
            <div className="space-y-3">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest">
                {selectedNews.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                {selectedNews.title}
              </h1>
              <p className="text-xs text-slate-400">
                Dipublikasikan pada: <strong className="text-slate-600">{selectedNews.date}</strong> | Pengurus MGMP PAI SMP
              </p>
            </div>

            {/* Main Picture illustration card */}
            <div className="rounded-3xl overflow-hidden h-64 md:h-96 bg-slate-100 shadow border border-slate-100">
              <img 
                src={selectedNews.image} 
                alt={selectedNews.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* News content body text */}
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-150/50 shadow-sm">
              {/* Splitting content lines for nice paragraph layout */}
              {selectedNews.content.split("\n\n").map((para, index) => (
                <p key={index} className="text-slate-600 text-sm md:text-base leading-relaxed mb-4 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </article>
        ) : (
          /* Standard Navigation Tabs Switcher view logic */
          <div>
            {activeTab === "beranda" && (
              <BerandaTab 
                news={newsList} 
                onSelectNews={(item) => setSelectedNews(item)}
                onChangeTab={(tabId) => {
                  setActiveTab(tabId);
                  setIsArtikelFormOpen(false);
                }}
                articles={articlesList}
                onOpenArticle={(article) => {
                  setSelectedArticle(article);
                  setActiveTab("artikel");
                  setSelectedNews(null);
                  setIsArtikelFormOpen(false);
                }}
                onWriteArticle={() => {
                  setSelectedArticle(null);
                  setActiveTab("artikel");
                  setSelectedNews(null);
                  setIsArtikelFormOpen(true);
                }}
              />
            )}
            {activeTab === "profil" && <ProfilTab />}
            {activeTab === "informasi" && (
              <InformasiTab 
                news={newsList} 
                onSelectNews={(item) => setSelectedNews(item)}
                onChangeTab={(tabId) => setActiveTab(tabId)}
              />
            )}
            {activeTab === "kegiatan" && <KegiatanTab />}
            {activeTab === "perangkat" && <PerangkatAjarTab />}
            {activeTab === "artikel" && (
              <ArtikelTab 
                selectedArticle={selectedArticle}
                setSelectedArticle={setSelectedArticle}
                initialFormOpen={isArtikelFormOpen}
                formPreset={artikelFormPreset}
                onClearPreset={() => setArtikelFormPreset(null)}
              />
            )}
            {activeTab === "ai-sobat" && (
              <AISobatGuruTab 
                onShareToArticles={(title, content) => {
                  setArtikelFormPreset({ title, content });
                  setIsArtikelFormOpen(true);
                  setActiveTab("artikel");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
            {activeTab === "admin" && (
              <AdminTab 
                onLogout={() => {
                  setShowAdminTab(false);
                  setActiveTab("beranda");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
              />
            )}
          </div>
        )}
      </main>

      {/* FOOTER BAR SECTION */}
      <footer id="main-footer" className="bg-slate-900 text-slate-300 border-t border-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Footer column 1: Organization brand about */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <LogoMGMP size={44} className="bg-white rounded-full p-0.5" />
                <h3 className="font-extrabold text-white text-sm md:text-base tracking-wide uppercase">
                  MGMP PAI SMP KAB. SUBANG
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Musyawarah Guru Mata Pelajaran Pendidikan Agama Islam Sekolah Menengah Pertama Kabupaten Subang. 
                Forum silaturahim GPAI Kabupaten untuk merawat akidah mutawashith (moderat) bermanhaj rahmatan lil 'alamin.
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Sinergi • Berbagi • Menginspirasi • Berakhlak Mulia
              </p>
            </div>

            {/* Footer column 2: Fast navigation links */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigasi Portal</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {tabsConfig.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSelectedNews(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer column 3: Contact & Sekretariat */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sekretariat:</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                SMP Negeri 6 Subang, Jl. Otto Iskandardinata Wesel-Subang, Jawa Barat, Indonesia.
              </p>
              <div className="pt-2 text-[11px] text-slate-500">
                <p>Email: sekretariatan.mgmppaisubang@gmail.com</p>
                <p>Jam kerja: Senin - Jumat 08.00 - 14.00 WIB</p>
              </div>
            </div>

          </div>

          {/* Under footer license line */}
          <div className="pt-5 mt-5 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} Portal WEB MGMP PAI SMP Kab. Subang. Hak Cipta Dilindungi Undang-Undang.
            </p>
            <p className="text-[10px] text-emerald-600 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/30">
              🇮🇩 Didukung oleh Dinas Pendidikan Kab. Subang & Kementerian Agama Kab. Subang
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
