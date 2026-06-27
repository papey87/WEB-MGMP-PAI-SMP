import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { seedTeachersIfEmpty, TeacherData } from "../lib/firebaseSeeder";
import { 
  Users, 
  ShieldCheck, 
  Briefcase, 
  MapPin, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Building2, 
  IdCard, 
  Download, 
  X,
  Smartphone,
  Check,
  AlertCircle
} from "lucide-react";

interface SiladikDashboardProps {
  onOpenApkInfo?: () => void;
}

export default function SiladikDashboard({ onOpenApkInfo }: SiladikDashboardProps) {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic global announcement
  const [announcement, setAnnouncement] = useState<{
    text: string;
    badgeText: string;
    actionUrl: string;
    actionType: "apk" | "link" | "none";
    blinking: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("mgmp_pai_announcement");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      text: "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.",
      badgeText: "INFO PENTING",
      actionUrl: "",
      actionType: "apk",
      blinking: true
    };
  });
  
  // Custom alert/notification inside Siladik
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Trigger notification
  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Listen to custom announcement settings
  useEffect(() => {
    const announcementDoc = doc(db, "settings", "announcement");
    const unsubAnnouncement = onSnapshot(announcementDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = {
          text: data.text || "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.",
          badgeText: data.badgeText || "INFO PENTING",
          actionUrl: data.actionUrl || "",
          actionType: data.actionType || "apk",
          blinking: data.blinking !== undefined ? data.blinking : true
        };
        setAnnouncement(updated);
        localStorage.setItem("mgmp_pai_announcement", JSON.stringify(updated));
      }
    }, (err) => {
      console.error("Firestore listening to announcement error:", err);
    });

    return () => {
      unsubAnnouncement();
    };
  }, []);

  // Seed data & listen to Firestore changes
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initFirebase = async () => {
      try {
        setLoading(true);
        // Ensure some initial records exist in database
        await seedTeachersIfEmpty();

        if (!isMounted) return;

        const q = query(
          collection(db, "users"),
          orderBy("nama", "asc")
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          const list: TeacherData[] = [];
          snapshot.forEach((doc) => {
            list.push({
              id: doc.id,
              ...doc.data()
            } as TeacherData);
          });
          setTeachers(list);
          setLoading(false);
        }, (err) => {
          if (!isMounted) return;
          console.error("Firestore listening error in SiladikDashboard:", err);
          setError("Gagal memuat data dari database real-time.");
          setLoading(false);
        });
      } catch (e: any) {
        if (!isMounted) return;
        console.error("Error initializing Database in SiladikDashboard:", e);
        setError("Gagal meluncurkan sistem integrasi database SILADIK.");
        setLoading(false);
      }
    };

    initFirebase();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Recalculate statistics
  const totalGuru = teachers.length;

  const countByStatus = {
    PNS: teachers.filter(t => t && t.status === "PNS").length,
    PPPK: teachers.filter(t => t && t.status === "PPPK").length,
    NonASN: teachers.filter(t => t && t.status === "Non ASN").length
  };

  // 6 Komisariats specified by user
  const komisariatKeys = [
    { key: "jalancagak", name: "Komisariat Jalancagak", color: "from-teal-500 to-emerald-600", bgLight: "bg-teal-50" },
    { key: "subang", name: "Komisariat Subang", color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50" },
    { key: "kalijati", name: "Komisariat Kalijati", color: "from-lime-500 to-green-600", bgLight: "bg-lime-50" },
    { key: "pagaden", name: "Komisariat Pagaden", color: "from-green-500 to-teal-600", bgLight: "bg-green-50" },
    { key: "pamanukan", name: "Komisariat Pamanukan", color: "from-sky-500 to-blue-600", bgLight: "bg-sky-50" },
    { key: "ciasem", name: "Komisariat Ciasem", color: "from-indigo-500 to-teal-600", bgLight: "bg-indigo-50" }
  ];

  const countByKomisariat = komisariatKeys.reduce((acc, current) => {
    const listForKomisariat = teachers.filter(t => t && t.komisariat === current.key);
    const pns = listForKomisariat.filter(t => t && t.status === "PNS").length;
    const pppk = listForKomisariat.filter(t => t && t.status === "PPPK").length;
    const nonAsn = listForKomisariat.filter(t => t && t.status === "Non ASN").length;
    
    acc[current.key] = {
      total: listForKomisariat.length,
      PNS: pns,
      PPPK: pppk,
      NonASN: nonAsn
    };
    return acc;
  }, {} as Record<string, { total: number; PNS: number; PPPK: number; NonASN: number }>);

  return (
    <div id="siladik-system" className="space-y-4 pt-2">
      <style>{`
        @keyframes blink-accent {
          0%, 100% { opacity: 1; color: #facc15; }
          50% { opacity: 0.3; color: #ffffff; }
        }
        .blink-text {
          animation: blink-accent 1.2s infinite;
        }
      `}</style>
      {/* Tab Select & Header bar */}
      <div 
        id="siladik-header" 
        onClick={() => {
          if (announcement.actionType === "apk") {
            if (onOpenApkInfo) onOpenApkInfo();
          } else if (announcement.actionType === "link" && announcement.actionUrl) {
            window.open(announcement.actionUrl, "_blank", "noopener,noreferrer");
          }
        }}
        className={`bg-[#0e744c] hover:bg-[#0c6341] active:bg-[#0a5236] text-white rounded-3xl p-4 md:p-5 shadow-md border border-emerald-800 flex flex-col justify-between items-start gap-3 transition-all ${
          announcement.actionType !== "none" ? "cursor-pointer group" : ""
        }`}
      >
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 font-black text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-amber-300/40 uppercase">
              {announcement.badgeText}
            </span>
            <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase font-mono animate-pulse">
              URGENT
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black tracking-tight leading-tight select-none">
            <span className={`${announcement.blinking ? "blink-text animate-pulse" : "text-amber-400"} font-black mr-2`}>
              INFO PENTING:
            </span> 
            <span className={`${announcement.actionType !== "none" ? "group-hover:underline" : ""} text-white font-bold`}>
              {announcement.text}
            </span>
          </h2>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {notification && (
        <div id="siladik-toast" className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up border ${
          notification.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {notification.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.text}</span>
        </div>
      )}

      {/* State: LOADING */}
      {loading && (
        <div className="p-12 text-center bg-white border border-slate-100/80 rounded-3xl shadow-sm flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <h3 className="font-bold text-slate-700 text-sm">Menghubungkan ke Database Firestore...</h3>
          <p className="text-xs text-slate-400">Sinkronisasi data kepegawaian SILADIK Kabupaten Subang</p>
        </div>
      )}

      {/* State: ERROR */}
      {error && !loading && (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-100 rounded-3xl shadow-sm flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600" />
          <h3 className="font-bold text-rose-800">Koneksi Database Terputus</h3>
          <p className="text-xs text-rose-500 max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl border border-rose-500 active:scale-95 transition-all"
          >
            Hubungkan Kembali
          </button>
        </div>
      )}

      {/* State: LOADED & READY */}
      {!loading && !error && (
        <div className="space-y-4">
          
          {/* VIEW: STATS MODE Only (Lists and Forms are Deleted for Public Privacy) */}
          <div className="space-y-4 pointer-events-auto">
            
            {/* Rasio Teritorial (Professional Vertical Column Chart / Diagram Batang Vertikal) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col justify-between space-y-4">
              
              <div className="flex flex-col pb-3 border-b border-slate-100 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                      Database Terintegrasi Live
                    </h3>
                  </div>
                  <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Real-time Sync
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Sistem Layanan Terpadu Musyawarah Guru Mata Pelajaran Agama Islam SMP Kabupaten Subang.
                </p>
              </div>

              {/* Professional Vertical Bars Stage with Y-Axis Guidelines in the background */}
              <div className="relative h-72 w-full flex items-end justify-around pt-8 pb-3 px-2 sm:px-6 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto">
                
                {/* Grid Lines Overlay */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none px-4 py-10">
                  <div className="border-t border-slate-100 w-full relative">
                    <span className="absolute -top-2 left-0 text-[8px] font-bold text-slate-300 uppercase tracking-widest bg-white/80 px-1 rounded">Rasio Maks</span>
                  </div>
                  <div className="border-t border-slate-100 w-full relative">
                    <span className="absolute -top-2 left-0 text-[8px] font-bold text-slate-300 uppercase tracking-widest bg-white/80 px-1 rounded">75%</span>
                  </div>
                  <div className="border-t border-slate-100 w-full relative">
                    <span className="absolute -top-2 left-0 text-[8px] font-bold text-slate-300 uppercase tracking-widest bg-white/80 px-1 rounded">50%</span>
                  </div>
                  <div className="border-t border-slate-100 w-full relative">
                    <span className="absolute -top-2 left-0 text-[8px] font-bold text-slate-300 uppercase tracking-widest bg-white/80 px-1 rounded">25%</span>
                  </div>
                  <div className="border-b border-slate-200 w-full"></div>
                </div>

                {/* Vertical Bars mapping */}
                {komisariatKeys.map((komi) => {
                  const data = countByKomisariat[komi.key] || { total: 0, PNS: 0, PPPK: 0, NonASN: 0 };
                  const percentOfTotal = totalGuru ? Math.round((data.total / totalGuru) * 100) : 0;
                  
                  // Calculate heights based on maximum komisariat total
                  const totalsArray = komisariatKeys.map(k => countByKomisariat[k.key]?.total || 0);
                  const maxKomiVal = Math.max(...totalsArray, 1);
                  const heightPercent = Math.round((data.total / maxKomiVal) * 100);

                  return (
                    <div key={komi.key} className="flex flex-col items-center gap-3 w-1/6 min-w-[70px] z-10 group relative">
                      {/* Floating Tooltip Indicator */}
                      <div className="transition-all bg-slate-900 border border-slate-800 text-white font-mono text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-md absolute -top-4 whitespace-nowrap text-center">
                        {data.total} Guru
                      </div>

                      {/* Column Pillar Bar container */}
                      <div className="w-8 sm:w-12 h-40 bg-slate-150/40 rounded-t-xl relative overflow-hidden flex items-end shadow-inner border border-slate-200/20">
                        {/* Colored bar pillar */}
                        <div 
                          className={`w-full bg-gradient-to-t ${komi.color} rounded-t-lg transition-all duration-1000 ease-out relative shadow-md`}
                          style={{ height: `${Math.max(6, heightPercent)}%` }}
                        >
                          {/* Inner soft glow sheen for premium look */}
                          <div className="absolute inset-y-0 left-0.5 w-0.5 sm:w-1 bg-white/15 rounded-full"></div>
                        </div>
                      </div>

                      {/* Label metadata */}
                      <div className="text-center space-y-1">
                        <span className="block font-sans font-bold text-[10px] text-slate-700 leading-tight truncate max-w-[65px] sm:max-w-none" title={komi.name}>
                          {komi.name.replace("Komisariat ", "")}
                        </span>
                        <span className="block font-mono text-[9px] font-extrabold text-emerald-700 leading-none">
                          {percentOfTotal}%
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* Compact Stats Row - Placed directly below the bar chart to save space */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                {/* Mini Card 1: Total Guru */}
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Guru</p>
                    <p className="text-xs font-black text-slate-850">{totalGuru} Guru</p>
                  </div>
                </div>

                {/* Mini Card 2: PNS */}
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status PNS</p>
                    <p className="text-xs font-black text-slate-850">
                      {countByStatus.PNS} 
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded ml-1">
                        {totalGuru ? Math.round((countByStatus.PNS / totalGuru) * 100) : 0}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Mini Card 3: PPPK */}
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-sm">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status PPPK</p>
                    <p className="text-xs font-black text-slate-850">
                      {countByStatus.PPPK} 
                      <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1 rounded ml-1">
                        {totalGuru ? Math.round((countByStatus.PPPK / totalGuru) * 100) : 0}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Mini Card 4: Non ASN */}
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-700 text-white shadow-sm">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Non ASN</p>
                    <p className="text-xs font-black text-slate-850">
                      {countByStatus.NonASN} 
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-150 px-1 rounded ml-1">
                        {totalGuru ? Math.round((countByStatus.NonASN / totalGuru) * 100) : 0}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* System source tag */}
              <div className="text-center text-[10px] text-[#000000] italic pt-2 border-t border-slate-50 font-medium">
                Sumber data: Database Sistem Layanan Terpadu SILADIK Kemdikbudristek Kemenag Kabupaten Subang.
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
