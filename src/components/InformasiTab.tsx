import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { NewsItem, MGMPEvent } from "../types";
import {
  Megaphone,
  Clock,
  ArrowRight,
  Bell,
  Calendar,
  Search,
  Sparkles,
  Award,
  BookOpen
} from "lucide-react";

interface InformasiTabProps {
  news: NewsItem[];
  onSelectNews: (item: NewsItem) => void;
  onChangeTab: (tabId: string) => void;
}

export default function InformasiTab({ news, onSelectNews, onChangeTab }: InformasiTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("Semua");
  const [latestEvents, setLatestEvents] = useState<MGMPEvent[]>([]);

  // Real-time sync events from Firestore - ensures synchronization with KegiatanTab
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const list: MGMPEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MGMPEvent);
      });

      // Sort by id
      list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

      if (list.length > 0) {
        setLatestEvents(list);
        // Update localStorage for caching
        try {
          localStorage.setItem("mgmp_pai_events", JSON.stringify(list));
        } catch (e) {}
      } else {
        // Fallback to localStorage cache
        const cached = localStorage.getItem("mgmp_pai_events");
        if (cached) {
          setLatestEvents(JSON.parse(cached));
        }
      }
    }, (err) => {
      console.error("Events sync error in InformasiTab:", err);
      // Fallback to cache on error
      const cached = localStorage.getItem("mgmp_pai_events");
      if (cached) {
        setLatestEvents(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, []);

  // Filter news items
  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "Semua") return matchesSearch;

    const itemCategory = item.category.toLowerCase().trim();
    const filterLower = activeFilter.toLowerCase().trim();

    // Normalizing legacy categories
    let normalized = itemCategory;
    if (itemCategory === "regulasi") {
      normalized = "pengumuman";
    } else if (itemCategory === "edukasi") {
      normalized = "workshop";
    } else if (itemCategory === "kesiswaan") {
      normalized = "pentas pai";
    }

    return matchesSearch && normalized === filterLower;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Informasi & Pusat Berita
        </h1>
        <p className="text-xs text-slate-500">
          Ikuti rilis berita, pengumuman keorganisasian, serta pembaruan status agenda kegiatan MGMP PAI SMP Kabupaten Subang
        </p>
      </div>

      {/* Grid Layout: Main News feed and Side Agenda updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: news feed with filters */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
            {/* Search input */}
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita atau pengumuman..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto shrink-0 pb-1 sm:pb-0 max-w-full">
              {(["Semua", "Berita", "Pengumuman", "Agenda", "Pentas PAI", "Workshop", "Seminar", "Informasi Lainnya"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === filter
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-50"
                  }`}
                >
                  {filter === "Semua" ? "Semua Informasi" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* News List */}
          <div id="informasi-feed" className="grid grid-cols-1 gap-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectNews(item)}
                  className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-stretch"
                >
                  <div className="md:w-2/5 min-h-[160px] relative bg-slate-100">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-emerald-800 text-white shadow-sm border border-emerald-900/10">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-4.5 md:w-3/5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors text-sm md:text-base line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                    <div className="pt-1.5 text-xs text-emerald-800 font-black inline-flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      Baca Rincian Informasi
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-450 space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Megaphone className="w-12 h-12 text-slate-350 mx-auto" />
                <h3 className="font-bold text-slate-600">Tidak ada pengumuman</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Belum ada rilisan berita atau pengumuman yang cocok dengan filter atau kata kunci terpilih saat ini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Pembaruan Agenda / Live Activities Status */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-emerald-500 rounded-full opacity-10 blur-2xl"></div>
            <div className="space-y-3 relative">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-extrabold text-sm md:text-base">Pembaruan Agenda Kegiatan</h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Pembaruan waktu, narasumber, status kuota, dan kepesertaan Bimtek atau festival Pentas PAI ditampilkan secara otomatis di bawah ini:
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Pemberitahuan Sistem</h4>
            
            <div className="space-y-4 divide-y divide-slate-50">
              {latestEvents.length > 0 ? (
                latestEvents.slice(0, 4).map((evt, idx) => {
                  const leftPercentage = evt.quota ? Math.round(((evt.quota - evt.registeredCount) / evt.quota) * 100) : 0;
                  return (
                    <div key={evt.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {evt.category || "Agenda"} Update
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Live Status</span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-xs leading-tight hover:text-emerald-700 cursor-pointer transition-colors" onClick={() => onChangeTab("kegiatan")}>
                        {evt.title}
                      </h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Ketersediaan Kuota</span>
                          <span>{evt.quota - evt.registeredCount} / {evt.quota} Sisa Kursi</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${leftPercentage < 15 ? 'bg-red-500' : 'bg-emerald-600'} transition-all`} 
                            style={{ width: `${leftPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Tidak ada pembaruan agenda aktif saat ini.</p>
              )}
            </div>

            <button
              onClick={() => onChangeTab("kegiatan")}
              className="w-full mt-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1.5 group transition-colors cursor-pointer"
            >
              Lihat Detail Kegiatan Lengkap
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
