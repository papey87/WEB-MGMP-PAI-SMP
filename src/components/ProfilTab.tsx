import React, { useState, useEffect } from "react";
import { Users, Shield, Target, Award, MapPin, BadgeCheck, Plus, Trash2, Edit3, X, Check, User as LucideUser, Upload } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const STRUKTUR_ORGANISASI: any[] = [];

/*
const MOCK_STRUKTUR_ORGANISASI_MIGRATED = [
  {
    name: "H. Ahmad Fauzi, S.Ag., M.Pd.I.",
    role: "Ketua MGMP PAI SMP",
    school: "SMP Negeri 1 Subang",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    phone: "0812-3456-xxxx",
    specialty: "Pengembangan Kurikulum"
  },
  {
    name: "Dr. Lailatul Badriyah, M.Pd.",
    role: "Wakil Ketua I",
    school: "SMP Negeri 2 Subang",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    phone: "0813-9876-xxxx",
    specialty: "Metodologi Pembelajaran"
  },
  {
    name: "Nur Hidayat, S.Th.I., M.Pd.",
    role: "Sekretaris Jenderal",
    school: "SMP Negeri 1 Jalancagak",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    phone: "0856-4231-xxxx",
    specialty: "Administrasi & Humas"
  },
  {
    name: "Dra. Siti Aminah, M.A.",
    role: "Bendahara Umum",
    school: "SMP Negeri 1 Pagaden",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    phone: "0852-1122-xxxx",
    specialty: "Pengelolaan Anggaran & Sosial"
  },
  {
    name: "Zainal Abidin, S.Pd.I.",
    role: "Kabid Media & IT",
    school: "SMP Negeri 1 Kalijati",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    phone: "0899-7788-xxxx",
    specialty: "Platform Digital & Gamifikasi"
  },
  {
    name: "Fatimah Az-Zahra, S.Sos.I., M.Pd.",
    role: "Kabid Pengembangan Mutu Guru",
    school: "SMP Negeri 3 Subang",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    phone: "0812-1122-xxxx",
    specialty: "Penyusunan Silabus & Kisi ASAS"
  }
];
*/

const INITIAL_VISI = "Menjadi wadah guru Pendidikan Agama Islam SMP yang profesional, inovatif, solid, dan berintegritas tinggi dalam mencetak figur pendidik teladan guna melahirkan peserta didik yang bertakwa, berakhlak mulia, cerdas luhur, dan moderat.";

const INITIAL_MISI = [
  "Meningkatkan kompetensi pedagogik, kepribadian, sosial, dan profesional guru PAI melalui forum berkala bimbingan teknis.",
  "Mengembangkan media inovatif dan perangkat pembelajaran berbasis IT (Digitalisasi PAI) yang kontekstual dan adaptif.",
  "Membangun koordinasi yang kuat dengan Kemenag, Dinas Pendidikan, serta organisasi mitra demi mendukung pilar moderasi beragama.",
  "Menyelenggarakan lomba keterampilan dan seni budaya Islam (MAPSI) secara merata untuk menggali bakat terpendam siswa SMP."
];

const INITIAL_TUJUAN = [
  { title: "Standardisasi Mutu", desc: "Menyamakan persepsi materi krusial PAI di seluruh satuan pendidikan SMP." },
  { title: "Sertifikasi & PKB", desc: "Mendampingi pemenuhan angka kredit guru dan kelengkapan portofolio sertifikasi." },
  { title: "Moderasi Beragama", desc: "Menanamkan 4 pilar kebangsaan dan ukhuwah islamiyah, wathaniyah, basyariyah." }
];

export default function ProfilTab() {
  const [activeTab, setActiveTab] = useState<"visimisi" | "struktur">("visimisi");

  // Admin Detection State
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("admin_portal_access") === "true");

  // Local Editable States
  const [profileVisi, setProfileVisi] = useState("");
  const [profileMisi, setProfileMisi] = useState<string[]>([]);
  const [profileTujuan, setProfileTujuan] = useState<any[]>([]);
  const [structureList, setStructureList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modals States
  const [isVisiModalOpen, setIsVisiModalOpen] = useState(false);
  const [tempVisi, setTempVisi] = useState("");

  const [isMisiModalOpen, setIsMisiModalOpen] = useState(false);
  const [editingMisiIdx, setEditingMisiIdx] = useState<number | null>(null);
  const [tempMisiText, setTempMisiText] = useState("");

  const [isTujuanModalOpen, setIsTujuanModalOpen] = useState(false);
  const [editingTujuanIdx, setEditingTujuanIdx] = useState<number | null>(null);
  const [tempTujuanTitle, setTempTujuanTitle] = useState("");
  const [tempTujuanDesc, setTempTujuanDesc] = useState("");

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructureIdx, setEditingStructureIdx] = useState<number | null>(null);
  const [structureName, setStructureName] = useState("");
  const [structureRole, setStructureRole] = useState("");
  const [structureSchool, setStructureSchool] = useState("");
  const [structureAvatar, setStructureAvatar] = useState("");
  const [structurePhone, setStructurePhone] = useState("");
  const [structureSpecialty, setStructureSpecialty] = useState("");

  // Storage updates listening
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(localStorage.getItem("admin_portal_access") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Firebase Real-time Synchronization for Profile
  useEffect(() => {
    let isMounted = true;
    const docRef = doc(db, "settings", "profile");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.visi !== undefined) {
          setProfileVisi(data.visi);
          setTempVisi(data.visi);
          localStorage.setItem("mgmp_profile_visi", data.visi);
        }
        if (data.misi !== undefined) {
          setProfileMisi(data.misi);
          localStorage.setItem("mgmp_profile_misi", JSON.stringify(data.misi));
        }
        if (data.tujuan !== undefined) {
          setProfileTujuan(data.tujuan);
          localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(data.tujuan));
        }
        if (data.structure !== undefined) {
          setStructureList(data.structure);
          localStorage.setItem("mgmp_profile_structure", JSON.stringify(data.structure));
        }
      } else {
        // Document doesn't exist yet, reset states to empty
        setProfileVisi("");
        setProfileMisi([]);
        setProfileTujuan([]);
        setStructureList([]);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to profile settings in ProfilTab:", err);
      if (isMounted) {
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const syncProfileToFirestore = async (
    updatedVisi?: string,
    updatedMisi?: string[],
    updatedTujuan?: any[],
    updatedStructure?: any[]
  ) => {
    try {
      const docRef = doc(db, "settings", "profile");
      const payload: any = {};
      if (updatedVisi !== undefined) payload.visi = updatedVisi;
      if (updatedMisi !== undefined) payload.misi = updatedMisi;
      if (updatedTujuan !== undefined) payload.tujuan = updatedTujuan;
      if (updatedStructure !== undefined) payload.structure = updatedStructure;
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error("Failed to sync profile to Firebase:", err);
    }
  };

  // Save Visi
  const handleSaveVisi = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileVisi(tempVisi);
    localStorage.setItem("mgmp_profile_visi", tempVisi);
    syncProfileToFirestore(tempVisi);
    setIsVisiModalOpen(false);
  };

  // Add / Edit Misi
  const handleSaveMisi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempMisiText.trim()) return;

    let updated: string[];
    if (editingMisiIdx !== null) {
      updated = [...profileMisi];
      updated[editingMisiIdx] = tempMisiText.trim();
    } else {
      updated = [...profileMisi, tempMisiText.trim()];
    }

    setProfileMisi(updated);
    localStorage.setItem("mgmp_profile_misi", JSON.stringify(updated));
    syncProfileToFirestore(undefined, updated);
    setIsMisiModalOpen(false);
    setEditingMisiIdx(null);
    setTempMisiText("");
  };

  // Delete Misi
  const handleDeleteMisi = (idx: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus butir misi ini?")) {
      const updated = profileMisi.filter((_, i) => i !== idx);
      setProfileMisi(updated);
      localStorage.setItem("mgmp_profile_misi", JSON.stringify(updated));
      syncProfileToFirestore(undefined, updated);
    }
  };

  // Add / Edit Tujuan
  const handleSaveTujuan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTujuanTitle.trim() || !tempTujuanDesc.trim()) return;

    let updated: any[];
    if (editingTujuanIdx !== null) {
      updated = [...profileTujuan];
      updated[editingTujuanIdx] = { title: tempTujuanTitle.trim(), desc: tempTujuanDesc.trim() };
    } else {
      updated = [...profileTujuan, { title: tempTujuanTitle.trim(), desc: tempTujuanDesc.trim() }];
    }

    setProfileTujuan(updated);
    localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(updated));
    syncProfileToFirestore(undefined, undefined, updated);
    setIsTujuanModalOpen(false);
    setEditingTujuanIdx(null);
    setTempTujuanTitle("");
    setTempTujuanDesc("");
  };

  // Delete Tujuan
  const handleDeleteTujuan = (idx: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus sasaran/tujuan strategis ini?")) {
      const updated = profileTujuan.filter((_, i) => i !== idx);
      setProfileTujuan(updated);
      localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(updated));
      syncProfileToFirestore(undefined, undefined, updated);
    }
  };

  // Save / Add Board Member
  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureName.trim() || !structureRole.trim()) return;

    const record = {
      name: structureName.trim(),
      role: structureRole.trim(),
      school: structureSchool.trim() || "SMP Negeri Terkait",
      avatar: structureAvatar.trim(),
      phone: structurePhone.trim() || "0812-xxxx-xxxx",
      specialty: structureSpecialty.trim() || "Pendidikan Agama Islam"
    };

    let updated: any[];
    if (editingStructureIdx !== null) {
      updated = [...structureList];
      updated[editingStructureIdx] = record;
    } else {
      updated = [...structureList, record];
    }

    setStructureList(updated);
    localStorage.setItem("mgmp_profile_structure", JSON.stringify(updated));
    syncProfileToFirestore(undefined, undefined, undefined, updated);
    setIsStructureModalOpen(false);
    setEditingStructureIdx(null);
    setStructureName("");
    setStructureRole("");
    setStructureSchool("");
    setStructureAvatar("");
    setStructurePhone("");
    setStructureSpecialty("");
  };

  // Delete Board Member
  const handleDeleteStructure = (idx: number) => {
    const updated = structureList.filter((_, i) => i !== idx);
    setStructureList(updated);
    localStorage.setItem("mgmp_profile_structure", JSON.stringify(updated));
    syncProfileToFirestore(undefined, undefined, undefined, updated);
  };

  return (
    <div className="space-y-6">
      {/* Upper banner section */}
      <section id="profil-intro" className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
          Profil MGMP PAI SMP
        </h1>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          Musyawarah Guru Mata Pelajaran (MGMP) Pendidikan Agama Islam Sekolah Menengah Pertama (SMP) adalah asosiasi resmi guru agama Islam tingkat nasional, wilayah, dan daerah, yang berfungsi mengoptimalkan profesionalisme guru demi menciptakan generasi penerus bangsa berjiwa Qur'ani.
        </p>

        {/* Local Admin Status Badge indicator */}
        {isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-800 font-bold mx-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Mode Admin Aktif - Akses Edit Profil & Struktur Terbuka
          </div>
        )}

        {/* Local sub-navigation selector */}
        <div id="sub-tabs" className="block sm:inline-flex p-1.5 rounded-xl bg-slate-100/80 border border-slate-200/50 mt-4 mx-auto">
          <button
            onClick={() => setActiveTab("visimisi")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "visimisi" 
                ? "bg-white text-emerald-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Visi, Misi & Tujuan
          </button>
          <button
            onClick={() => setActiveTab("struktur")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "struktur" 
                ? "bg-white text-emerald-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Struktur Organisasi
          </button>
        </div>
      </section>

      {/* Tab Panel Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-bold">Menghubungkan ke Real-time Database SILADIK...</p>
        </div>
      ) : (
        <>
          {/* Visimisi Tab Panel Content */}
          {activeTab === "visimisi" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card: Visi */}
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 hover:border-emerald-100 transition-all relative">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Visi Kami</h3>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              {profileVisi ? `"${profileVisi}"` : "Visi belum dikonfigurasi. Silakan Admin menginisialisasi default melalui Admin Panel."}
            </p>
            {isAdmin && (
              <button 
                onClick={() => {
                  setTempVisi(profileVisi);
                  setIsVisiModalOpen(true);
                }}
                className="absolute top-3 right-3 p-1.5 bg-slate-100 hover:bg-emerald-550 hover:text-white rounded-lg text-slate-500 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Visi
              </button>
            )}
          </div>

          {/* Card: Misi */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/20 border border-slate-100 shadow-sm space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Misi MGMP PAI</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Implementasi program keprofesian berkelanjutan</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => {
                    setEditingMisiIdx(null);
                    setTempMisiText("");
                    setIsMisiModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] sm:text-xs shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Misi
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileMisi.length > 0 ? (
                profileMisi.map((misi, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-xl relative group">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {i+1}
                    </span>
                    <div className="pr-12">
                      <p className="text-xs text-slate-600 leading-relaxed">{misi}</p>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingMisiIdx(i);
                            setTempMisiText(misi);
                            setIsMisiModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-emerald-800 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMisi(i)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-400 italic">
                  Belum ada misi yang ditambahkan.
                </div>
              )}
            </div>
          </div>

          {/* Section: Tujuan Organisasi (Middle Full Row) */}
          <div className="md:col-span-3 p-5 rounded-3xl bg-slate-50 border border-slate-200/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 pb-3">
              <div className="space-y-1">
                <span className="text-[11px] text-amber-600 font-bold uppercase tracking-widest">Tujuan MGMP</span>
                <h3 className="text-lg font-bold text-slate-800">Dasar Pijak Kerja Kami</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tujuan strategis didirikannya MGMP PAI meliputi pengayaan materi ajaran lurus untuk mencegah paham ekstremisme.
                </p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => {
                    setEditingTujuanIdx(null);
                    setTempTujuanTitle("");
                    setTempTujuanDesc("");
                    setIsTujuanModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Sasaran / Tujuan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profileTujuan.length > 0 ? (
                profileTujuan.map((item, i) => (
                  <div key={i} className="p-5 bg-white rounded-xl border border-slate-100 space-y-3 shadow-sm relative group">
                    <div className="p-2 w-max rounded-lg bg-emerald-50 text-emerald-700">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingTujuanIdx(i);
                            setTempTujuanTitle(item.title);
                            setTempTujuanDesc(item.desc);
                            setIsTujuanModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-emerald-800 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTujuan(i)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-400 italic">
                  Belum ada sasaran / tujuan strategis yang ditambahkan.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Struktur Tab Panel Content */}
      {activeTab === "struktur" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-3">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-800">Dewan Pengurus Harian MGMP</h3>
              <p className="text-xs text-slate-500">Masa Bakti Anggota Pengurus Periode 2024 - 2027</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingStructureIdx(null);
                  setStructureName("");
                  setStructureRole("");
                  setStructureSchool("");
                  setStructureAvatar("");
                  setStructurePhone("");
                  setStructureSpecialty("");
                  setIsStructureModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Anggota Pengurus
              </button>
            )}
          </div>

              {structureList.length > 0 ? (
                <div id="committee-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                  {structureList.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:border-emerald-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
                    >
                      <div className="p-4 flex gap-3.5 items-start">
                        <div className="relative shrink-0">
                          {item.avatar ? (
                            <img 
                              src={item.avatar} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-100"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center ring-2 ring-emerald-100">
                              <LucideUser className="w-7 h-7" />
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-600 text-white shadow" title="Pengurus Terverifikasi">
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="space-y-1 pr-4">
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            {item.role}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight pt-1">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 font-semibold">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            {item.school}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium">
                          Keahlian: <strong className="text-emerald-700 font-bold">{item.specialty}</strong>
                        </span>
                        <span className="text-slate-450 font-mono">
                          {item.phone}
                        </span>
                      </div>

                      {/* Local Card Controls for Admin sessions */}
                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingStructureIdx(index);
                              setStructureName(item.name);
                              setStructureRole(item.role);
                              setStructureSchool(item.school);
                              setStructureAvatar(item.avatar);
                              setStructurePhone(item.phone);
                              setStructureSpecialty(item.specialty);
                              setIsStructureModalOpen(true);
                            }}
                            className="p-1.5 bg-white border shadow-sm hover:bg-slate-100 text-emerald-800 rounded-lg cursor-pointer"
                            title="Edit Pengurus"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStructure(index)}
                            className="p-1.5 bg-white border shadow-sm hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                            title="Hapus Pengurus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-white border border-slate-100 rounded-2xl p-6">
                  <div className="p-3 w-max rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-3">
                    <LucideUser className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Susunan Pengurus Kosong</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Silakan Admin melakukan inisialisasi default melalui tombol "Inisialisasi Data Default" di Admin Panel, atau tambah pengurus secara manual.
                  </p>
                </div>
              )}
              
              <div className="p-6 rounded-xl bg-amber-50/40 border border-amber-200/30 text-center text-xs text-slate-500 max-w-xl mx-auto">
                📞 Apakah Anda anggota baru dan belum terdaftar dalam grup WhatsApp Resmi MGMP? <br />
                Silakan hubungi pengurus terkait untuk mendaftarkan NUPTK Anda ke dinas.
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: Edit Visi */}
      {isVisiModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Edit Visi MGMP PAI</h3>
              <button onClick={() => setIsVisiModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVisi} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teks Pernyataan Visi *</label>
                <textarea 
                  rows={4}
                  value={tempVisi}
                  onChange={(e) => setTempVisi(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsVisiModalOpen(false)} className="px-4 py-2 border rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Misi */}
      {isMisiModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {editingMisiIdx !== null ? "Edit Butir Misi" : "Tambah Misi Baru"}
              </h3>
              <button onClick={() => setIsMisiModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMisi} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teks Pernyataan Misi *</label>
                <textarea 
                  rows={3}
                  value={tempMisiText}
                  onChange={(e) => setTempMisiText(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  placeholder="Contoh: Mengembangkan media pembelajaran digital berbasis ukhuwah lurus..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsMisiModalOpen(false)} className="px-4 py-2 border rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Tujuan */}
      {isTujuanModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl border">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {editingTujuanIdx !== null ? "Edit Butir Sasaran" : "Tambah Sasaran / Tujuan Baru"}
              </h3>
              <button onClick={() => setIsTujuanModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTujuan} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Sasaran / Judul Tujuan *</label>
                <input 
                  type="text"
                  value={tempTujuanTitle}
                  onChange={(e) => setTempTujuanTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Contoh: Peningkatan Literasi Qur'ani"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Penjelasan Ringkas Tujuan *</label>
                <textarea 
                  rows={3}
                  value={tempTujuanDesc}
                  onChange={(e) => setTempTujuanDesc(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                  placeholder="Contoh: Menyelenggarakan kajian tilawah untuk menyamakan qira'at guru sekabupaten."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsTujuanModalOpen(false)} className="px-4 py-2 border rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Board Member */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl border overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {editingStructureIdx !== null ? "Edit Data Pengurus" : "Tambah Pengurus Baru"}
              </h3>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStructure} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Lengkap & Gelar *</label>
                <input 
                  type="text"
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  placeholder="Contoh: H. Ahmad Fauzi, S.Ag., M.Pd.I."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Jabatan / Peran Pengurus *</label>
                  <input 
                    type="text"
                    value={structureRole}
                    onChange={(e) => setStructureRole(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: Sekbid Humas & IT"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Instansi / Unit Kerja Sekolah *</label>
                  <input 
                    type="text"
                    value={structureSchool}
                    onChange={(e) => setStructureSchool(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: SMP Negeri 1 Subang"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nomor Kontak / WA *</label>
                  <input 
                    type="text"
                    value={structurePhone}
                    onChange={(e) => setStructurePhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Bidang Keahlian Pokok *</label>
                  <input 
                    type="text"
                    value={structureSpecialty}
                    onChange={(e) => setStructureSpecialty(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: Kurikulum / Gamifikasi"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 block text-left">
                <label className="text-xs font-bold text-slate-700 block mb-1">Upload Foto Pengurus</label>
                {structureAvatar ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <img src={structureAvatar} alt="Profile preview" className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">Foto terpilih</p>
                      <p className="text-[9px] text-slate-400">Siap disimpan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStructureAvatar("")}
                      className="text-[10px] text-red-650 hover:text-red-700 font-bold hover:bg-red-50 px-2.5 py-1 rounded-lg bg-white border border-red-100 cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all rounded-xl p-4 text-center relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Ukuran file maksimal adalah 2MB!");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setStructureAvatar(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors mx-auto" />
                      <span className="text-[11px] font-semibold text-slate-600">Pilih atau Seret Foto</span>
                      <span className="text-[9px] text-slate-400">Format PNG, JPG (maksimal 2MB)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsStructureModalOpen(false)} className="px-4 py-2 border rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">Simpan Aggota</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
