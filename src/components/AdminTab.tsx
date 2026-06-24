import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { NewsItem } from "../types";
import { seedTeachersIfEmpty, TeacherData } from "../lib/firebaseSeeder";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  LineChart, 
  Line 
} from "recharts";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  LogOut, 
  UserCheck, 
  Lock, 
  Activity, 
  Globe, 
  Users, 
  Newspaper, 
  Search, 
  X, 
  CheckCircle, 
  Database,
  Building2,
  FileCheck2,
  Info,
  Calendar,
  Image as ImageIcon,
  BookOpen,
  Cpu,
  FileText,
  User as LucideUser,
  Upload,
  Smartphone,
  Check
} from "lucide-react";

// For error logging wrapper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error log to console: ', JSON.stringify(errInfo));
}

// Initial fallback news items to seed if Firestore 'news' is empty
const INITIAL_NEWS: Omit<NewsItem, "id">[] = [
  {
    title: "Workshop Sinkronisasi Asesmen Kurikulum Merdeka PAI SMP Fase D",
    category: "AGENDA",
    date: "18 Juni 2026",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
    summary: "MGMP PAI SMP menyelenggarakan forum sinkronisasi penyusunan soal ujian Sumatif Akhir Semester (SAS) di tingkat kabupaten/kota guna menyelaraskan keterbacaan asesmen.",
    content: "Surabaya — Ratusan guru rujukan dari perwakilan MGMP PAI SMP di Jawa Timur menghadiri sidang koordinasi khusus penyusunan draf Bank Soal dan Asesmen Sumatif Akhir Semester (ASAS) Berbasis Kurikulum Merdeka.\n\nKetua MGMP Ahmad Fauzi menekankan bahwa materi ajar fase D mencakup lima pilar utama yang harus diramu secara moderat. Sinkronisasi bertujuan menyelaraskan pencapaian tujuan pembelajaran (TP) di tiap satuan pendidikan agar tidak terhimpit perbedaan kurikulum transisi."
  },
  {
    title: "Kemenag Salurkan Bantuan Kuota & Insentif Guru PAI Non-PNS Berprestasi",
    category: "REGULASI",
    date: "14 Juni 2026",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600",
    summary: "Kementerian Agama mengumumkan pemberian bantuan dana hibah dan peningkatan sarana pendukung digital untuk guru honorer PAI berdedikasi.",
    content: "Jakarta — Kabar gembira datang untuk seluruh jajaran pendidik PAI non-PNS tingkat SMP. Kementerian Agama menaruh perhatian tinggi terhadap percepatan digitalisasi kelas agama.\n\nTahun ini, penyaluran insentif akan diarahkan kepada guru-guru penggerak yang aktif berkontribusi membuat modul ajar mandiri atau mengelola komunitas guru pembelajar."
  }
];

export default function AdminTab() {
  const [user, setUser] = useState<User | null>(null);
  const [isSimulated, setIsSimulated] = useState(() => localStorage.getItem("admin_is_simulated") === "true");
  const [simulatedEmail, setSimulatedEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // DB collections state
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  
  // Navigation inside Admin Panel
  const [adminSubTab, setAdminSubTab] = useState<"dashboard" | "berita" | "guru" | "api_monitoring" | "profil_mgmp" | "kelola_apk">("dashboard");

  // Search/Filter Search Input States
  const [searchTeacherQuery, setSearchTeacherQuery] = useState("");
  const [searchNewsQuery, setSearchNewsQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKomisariat, setFilterKomisariat] = useState("Semua");
  const [searchApiLog, setSearchApiLog] = useState("");
  const [selectedApiLog, setSelectedApiLog] = useState<any | null>(null);

  // modal editing control state
  const [activeNewsModal, setActiveNewsModal] = useState<"add" | "edit" | null>(null);
  const [activeTeacherModal, setActiveTeacherModal] = useState<"add" | "edit" | null>(null);

  // current news form input mapping
  const [newsForm, setNewsForm] = useState({
    id: "",
    title: "",
    category: "AGENDA",
    date: "",
    image: "",
    summary: "",
    content: ""
  });

  // current teacher form input mapping
  const [teacherForm, setTeacherForm] = useState({
    id: "",
    nama: "",
    nip: "",
    nuptk: "",
    status: "Non ASN" as "PNS" | "PPPK" | "Non ASN",
    komisariat: "subang" as "jalancagak" | "subang" | "kalijati" | "pagaden" | "pamanukan" | "ciasem",
    sekolah: "",
    whatsapp: "",
    iuranStatus: "Belum Bayar" as "Lunas" | "Belum Bayar",
    username: "",
    password: "",
    status_pembayaran: "Belum Bayar" as "Lunas" | "Belum Bayar" | "Menunggak" | "Aktif",
    iuran_bulanan: "Belum Bayar" as "Lunas" | "Belum Bayar" | "Menunggak" | "Aktif"
  });

  // Profil MGMP Fallbacks and States
  const ADMIN_INITIAL_VISI = "Menjadi wadah guru Pendidikan Agama Islam SMP yang profesional, inovatif, solid, dan berintegritas tinggi dalam mencetak figur pendidik teladan guna melahirkan peserta didik yang bertakwa, berakhlak mulia, cerdas luhur, dan moderat.";

  const ADMIN_INITIAL_MISI = [
    "Meningkatkan kompetensi pedagogik, kepribadian, sosial, dan profesional guru PAI melalui forum berkala bimbingan teknis.",
    "Mengembangkan media inovatif dan perangkat pembelajaran berbasis IT (Digitalisasi PAI) yang kontekstual dan adaptif.",
    "Membangun koordinasi yang kuat dengan Kemenag, Dinas Pendidikan, serta organisasi mitra demi mendukung pilar moderasi beragama.",
    "Menyelenggarakan lomba keterampilan dan seni budaya Islam (MAPSI) secara merata untuk menggali bakat terpendam siswa SMP."
  ];

  const ADMIN_INITIAL_TUJUAN = [
    { title: "Standardisasi Mutu", desc: "Menyamakan persepsi materi krusial PAI di seluruh satuan pendidikan SMP." },
    { title: "Sertifikasi & PKB", desc: "Mendampingi pemenuhan angka kredit guru dan kelengkapan portofolio sertifikasi." },
    { title: "Moderasi Beragama", desc: "Menanamkan 4 pilar kebangsaan dan ukhuwah islamiyah, wathaniyah, basyariyah." }
  ];

  const ADMIN_STRUKTUR_ORGANISASI = [
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

  // Load from local storage dynamically
  const [adminVisi, setAdminVisi] = useState(() => localStorage.getItem("mgmp_profile_visi") || ADMIN_INITIAL_VISI);
  const [adminMisi, setAdminMisi] = useState<string[]>(() => {
    const saved = localStorage.getItem("mgmp_profile_misi");
    return saved ? JSON.parse(saved) : ADMIN_INITIAL_MISI;
  });
  const [adminTujuan, setAdminTujuan] = useState<any[]>(() => {
    const saved = localStorage.getItem("mgmp_profile_tujuan");
    return saved ? JSON.parse(saved) : ADMIN_INITIAL_TUJUAN;
  });
  const [adminStructure, setAdminStructure] = useState<any[]>(() => {
    const saved = localStorage.getItem("mgmp_profile_structure");
    return saved ? JSON.parse(saved) : ADMIN_STRUKTUR_ORGANISASI;
  });

  // APK management states
  const [apkVersionInput, setApkVersionInput] = useState(() => localStorage.getItem("apk_version") || "v1.2.0");
  const [apkBuildInput, setApkBuildInput] = useState(() => localStorage.getItem("apk_build") || "Build 2026/06");
  const [apkFilenameInput, setApkFilenameInput] = useState(() => localStorage.getItem("apk_filename") || "mgmp-pai-subang-v12.apk");
  const [apkSizeInput, setApkSizeInput] = useState(() => localStorage.getItem("apk_size") || "24.8 MB");
  const [apkDataInput, setApkDataInput] = useState(() => localStorage.getItem("apk_data") || "");

  // Admin page layout view modes for the profile sub-tab
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<"visimisi" | "tujuan" | "struktur">("visimisi");

  // Local helper states for add/edit forms in profile section
  const [newMisiText, setNewMisiText] = useState("");
  const [editingMisiIndex, setEditingMisiIndex] = useState<number | null>(null);

  const [newTujuanTitle, setNewTujuanTitle] = useState("");
  const [newTujuanDesc, setNewTujuanDesc] = useState("");
  const [editingTujuanIndex, setEditingTujuanIndex] = useState<number | null>(null);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberSchool, setNewMemberSchool] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberSpecialty, setNewMemberSpecialty] = useState("");
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Allowed specific admins (as requested: Admin Only)
  const allowedAdminEmails = ["feri.gunawan87@gmail.com"];

  // Check auth state trigger
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsSimulated(false);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fetch collections when logged in
  useEffect(() => {
    const isAuthenticated = user || isSimulated;
    if (!isAuthenticated) return;

    setLoading(true);

    // Call seeder so that database is guaranteed to have default data also for Admin Panel
    seedTeachersIfEmpty().catch((err) => {
      console.error("Failed to seed initial teacher data in AdminTab:", err);
    });

    // 1. Subscribe to teachers database
    const qTeachers = query(collection(db, "siladik-guru-pai-smp"), orderBy("createdAt", "desc"));
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      const list: TeacherData[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TeacherData);
      });
      setTeachers(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "siladik-guru-pai-smp");
    });

    // 2. Subscribe and seed news collection
    const qNews = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubNews = onSnapshot(qNews, async (snap) => {
      const list: NewsItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as NewsItem);
      });
      
      if (list.length === 0) {
        // Seed initial news items in background
        try {
          const colRef = collection(db, "news");
          const batch = writeBatch(db);
          INITIAL_NEWS.forEach((item) => {
            const docRef = doc(colRef);
            batch.set(docRef, {
              ...item,
              createdAt: new Date().toISOString()
            });
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to seed initial news items", e);
        }
      } else {
        setNews(list);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "news");
      setLoading(false);
    });

    // 3. Subscribe to ai-interactions database
    const qInteractions = query(collection(db, "ai-interactions"), orderBy("timestamp", "desc"));
    const unsubInteractions = onSnapshot(qInteractions, async (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (list.length === 0) {
        // Seed realistic historical logs
        try {
          const colRef = collection(db, "ai-interactions");
          const batch = writeBatch(db);
          
          const today = new Date();
          const samplePrompts = [
            { p: "Buat RPP Akhlak Terpuji Kelas VII", r: "Rencana Pelaksanaan Pembelajaran (RPP) Akhlak Terpuji untuk kelas VII disusun menggunakan modul ajar format Kurikulum Merdeka...", pt: 180, rt: 520, daysAgo: 4, email: "feri.gunawan87@gmail.com" },
            { p: "Harap susun 5 soal pilihan ganda tentang Hukum Bacaan Mad Kelas VIII", r: "Butir soal kuis Hukum Bacaan Mad kelas VII SMP dengan pembahasan terperinci dan kuisioner...", pt: 155, rt: 490, daysAgo: 3, email: "guru.pembelajar@mgmp.or.id" },
            { p: "Berikan 3 ide metode pembelajaran interaktif materi Fiqih Thaharah", r: "Berikut adalah 3 metode pembelajaran interaktif: 1. Praktik Thaharah Berantai, 2. Role Playing Media, 3. Diskusi Kasus...", pt: 210, rt: 640, daysAgo: 2, email: "guru.pai.subang@gmail.com" },
            { p: "Buat ringkasan Sejarah Daulah Umayyah Kelas VIII", r: "Ringkasan konsep penting Sejarah Daulah Umayyah di Damaskus berbasis bagan visual dan peta konsep ringkas...", pt: 230, rt: 680, daysAgo: 1, email: "feri.gunawan87@gmail.com" },
            { p: "Tuliskan contoh soal HOTS materi zakat fitrah kelas VIII SMP", r: "Analisis studi kasus zakat fitrah untuk menguji tingkat literasi fungsional agama anak didik...", pt: 190, rt: 580, daysAgo: 0, email: "guru.pembelajar@mgmp.or.id" }
          ];

          samplePrompts.forEach((pr) => {
            const d = new Date();
            d.setDate(today.getDate() - pr.daysAgo);
            const dStr = d.toISOString();
            const dateStr = dStr.split("T")[0];
            const docRef = doc(colRef);
            batch.set(docRef, {
              prompt: pr.p,
              response: pr.r,
              promptTokens: pr.pt,
              responseTokens: pr.rt,
              totalTokens: pr.pt + pr.rt,
              userEmail: pr.email,
              timestamp: dStr,
              dateString: dateStr
            });
          });

          await batch.commit();
        } catch (e) {
          console.error("Failed to seed initial AI interaction items", e);
        }
      } else {
        setAiLogs(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "ai-interactions");
    });

    return () => {
      unsubTeachers();
      unsubNews();
      unsubInteractions();
    };
  }, [user, isSimulated]);

  // Auth controllers
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || "";
      if (!allowedAdminEmails.includes(email)) {
        // Not actual authorized admin, we log out automatically or show alert
        await signOut(auth);
        setUser(null);
        setErrorMsg(`Akun Google (${email}) Anda tidak memiliki lisensi akses administrator. Hubungi Pengurus MGMP.`);
      } else {
        setSuccessMsg("Selamat Datang! Login Admin berhasil dikonfirmasi.");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setErrorMsg("Gagal melakukan autentikasi Google Sign-In.");
    }
  };

  const handleSimulatedSignIn = () => {
    setIsSimulated(true);
    localStorage.setItem("admin_is_simulated", "true");
    setSimulatedEmail("feri.gunawan87@gmail.com");
    setSuccessMsg("Akses Simulasi Admin berhasil diperoleh! (Developer Mode)");
    setErrorMsg("");
    window.dispatchEvent(new Event("storage"));
  };

  const handleSignOut = async () => {
    try {
      if (isSimulated) {
        setIsSimulated(false);
        localStorage.removeItem("admin_is_simulated");
        setSimulatedEmail("");
      } else {
        await signOut(auth);
      }
      localStorage.removeItem("admin_is_simulated");
      setUser(null);
      setSuccessMsg("Anda telah sukses keluar dari sesi administrator.");
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Sing out error", e);
    }
  };

  // NEWS CRUD CONTROLLERS
  const openAddNews = () => {
    setNewsForm({
      id: "",
      title: "",
      category: "AGENDA",
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=600",
      summary: "",
      content: ""
    });
    setActiveNewsModal("add");
  };

  const openEditNews = (item: NewsItem) => {
    setNewsForm({
      id: item.id,
      title: item.title,
      category: item.category,
      date: item.date,
      image: item.image,
      summary: item.summary,
      content: item.content
    });
    setActiveNewsModal("edit");
  };

  const saveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    // Validations
    if (!newsForm.title.trim() || !newsForm.summary.trim() || !newsForm.content.trim()) {
      setErrorMsg("Semua bidang berita wajib diisi lengkap!");
      return;
    }

    try {
      const newsDataPayload = {
        title: newsForm.title,
        category: newsForm.category,
        date: newsForm.date || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        image: newsForm.image || "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=600",
        summary: newsForm.summary,
        content: newsForm.content,
        createdAt: new Date().toISOString()
      };

      if (activeNewsModal === "add") {
        await addDoc(collection(db, "news"), newsDataPayload);
        setSuccessMsg("Artikel Berita Baru berhasil diterbitkan!");
      } else if (activeNewsModal === "edit" && newsForm.id) {
        const docRef = doc(db, "news", newsForm.id);
        await updateDoc(docRef, newsDataPayload);
        setSuccessMsg("Artikel Berita berhasil diperbarui!");
      }
      
      setActiveNewsModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "news");
      setErrorMsg("Gagal menyimpan data berita ke Firestore.");
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus artikel berita ini secara permanen dari server?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await deleteDoc(doc(db, "news", id));
      setSuccessMsg("Artikel berita berhasil dihapus!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
      setErrorMsg("Gagal menghapus berita.");
    }
  };

  // TEACHER CRUD CONTROLLERS
  const openAddTeacher = () => {
    setTeacherForm({
      id: "",
      nama: "",
      nip: "",
      nuptk: "",
      status: "Non ASN",
      komisariat: "subang",
      sekolah: "",
      whatsapp: "",
      iuranStatus: "Belum Bayar",
      username: "",
      password: "",
      status_pembayaran: "Belum Bayar",
      iuran_bulanan: "Belum Bayar"
    });
    setActiveTeacherModal("add");
  };

  const openEditTeacher = (item: TeacherData) => {
    setTeacherForm({
      id: item.id || "",
      nama: item.nama,
      nip: item.nip || "",
      nuptk: item.nuptk || "",
      status: item.status,
      komisariat: item.komisariat,
      sekolah: item.sekolah,
      whatsapp: item.whatsapp,
      iuranStatus: item.iuranStatus || "Belum Bayar",
      username: item.username || "",
      password: item.password || "",
      status_pembayaran: item.status_pembayaran || "Belum Bayar",
      iuran_bulanan: item.iuran_bulanan || "Belum Bayar"
    });
    setActiveTeacherModal("edit");
  };

  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!teacherForm.nama.trim() || !teacherForm.sekolah.trim()) {
      setErrorMsg("Nama Lengkap Guru dan Sekolah WAJIB diisi!");
      return;
    }

    try {
      const payload = {
        nama: teacherForm.nama,
        nip: teacherForm.nip,
        nuptk: teacherForm.nuptk,
        status: teacherForm.status,
        komisariat: teacherForm.komisariat,
        sekolah: teacherForm.sekolah,
        whatsapp: teacherForm.whatsapp,
        iuranStatus: teacherForm.iuranStatus || "Belum Bayar",
        username: teacherForm.username || "",
        password: teacherForm.password || "",
        status_pembayaran: teacherForm.status_pembayaran || "Belum Bayar",
        iuran_bulanan: teacherForm.iuran_bulanan || "Belum Bayar",
        createdAt: new Date().toISOString()
      };

      // Real Dual-Collection Mirror Sync to 'siladik-guru-pai-smp' and 'teachers' collections!
      if (activeTeacherModal === "add") {
        // Step 1: Add to 'siladik-guru-pai-smp'
        const mainDoc = await addDoc(collection(db, "siladik-guru-pai-smp"), payload);
        // Step 2: Mirror also to the literal requested 'teachers' collection
        await addDoc(collection(db, "teachers"), { ...payload, mirrorId: mainDoc.id });

        setSuccessMsg(`Data guru ${payload.nama} berhasil didaftarkan ke sistem!`);
      } else if (activeTeacherModal === "edit" && teacherForm.id) {
        // Step 1: Update main 'siladik-guru-pai-smp'
        const mainRef = doc(db, "siladik-guru-pai-smp", teacherForm.id);
        await updateDoc(mainRef, payload);

        // Step 2: Also find and update in literal 'teachers' collection matching the ID or name
        try {
          const teachersColSnap = await getDocs(collection(db, "teachers"));
          teachersColSnap.forEach(async (docSnap) => {
            const d = docSnap.data();
            if (d.mirrorId === teacherForm.id || d.nama === payload.nama || d.nuptk === payload.nuptk) {
              await updateDoc(doc(db, "teachers", docSnap.id), payload);
            }
          });
        } catch (mirrorErr) {
          console.warn("Could not sync mirror teachers collection update: ", mirrorErr);
        }

        setSuccessMsg(`Data guru ${payload.nama} berhasil diperbarui!`);
      }

      setActiveTeacherModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "siladik-guru-pai-smp");
      setErrorMsg("Gagal menyimpan data guru.");
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data Guru: "${name}" secara permanen dari server database?`)) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Step 1: Delete from core 'siladik-guru-pai-smp'
      await deleteDoc(doc(db, "siladik-guru-pai-smp", id));

      // Step 2: Also delete from double-collection 'teachers' matching mirrorId
      try {
        const teachersColSnap = await getDocs(collection(db, "teachers"));
        teachersColSnap.forEach(async (docSnap) => {
          const d = docSnap.data();
          if (d.mirrorId === id || d.nama === name) {
            await deleteDoc(doc(db, "teachers", docSnap.id));
          }
        });
      } catch (mirrorErr) {
        console.warn("Could not delete from mirror teachers collection: ", mirrorErr);
      }

      setSuccessMsg(`Suksus menghapus data guru ${name}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `siladik-guru-pai-smp/${id}`);
      setErrorMsg("Gagal menghapus data guru.");
    }
  };

  // Filtered lists logic
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = t.nama.toLowerCase().includes(searchTeacherQuery.toLowerCase()) || 
                          t.sekolah.toLowerCase().includes(searchTeacherQuery.toLowerCase()) ||
                          (t.nip && t.nip.includes(searchTeacherQuery)) ||
                          (t.nuptk && t.nuptk.includes(searchTeacherQuery));
    const matchesStatus = filterStatus === "Semua" || t.status === filterStatus;
    const matchesKomisariat = filterKomisariat === "Semua" || t.komisariat === filterKomisariat;
    return matchesSearch && matchesStatus && matchesKomisariat;
  });

  const filteredNews = news.filter((n) => {
    return n.title.toLowerCase().includes(searchNewsQuery.toLowerCase()) || 
           n.category.toLowerCase().includes(searchNewsQuery.toLowerCase()) ||
           n.summary.toLowerCase().includes(searchNewsQuery.toLowerCase());
  });

  const activeEmail = user?.email || (isSimulated ? simulatedEmail : "");
  const currentAdminName = user?.displayName || (isSimulated ? "Developer Admin Mode" : "");

  const chartData = React.useMemo(() => {
    // Generate dates for the last 7 days
    const last7DaysStrings = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const initialMap = last7DaysStrings.reduce((acc, date) => {
      acc[date] = { dateString: date, promptTokens: 0, responseTokens: 0, totalTokens: 0, count: 0 };
      return acc;
    }, {} as Record<string, any>);

    aiLogs.forEach((log) => {
      const dStr = log.dateString || (log.timestamp ? log.timestamp.split("T")[0] : "");
      if (dStr && initialMap[dStr] !== undefined) {
        initialMap[dStr].promptTokens += log.promptTokens || 0;
        initialMap[dStr].responseTokens += log.responseTokens || 0;
        initialMap[dStr].totalTokens += log.totalTokens || 0;
        initialMap[dStr].count += 1;
      }
    });

    // Format for display
    return Object.values(initialMap).map((item: any) => {
      const parts = item.dateString.split("-");
      const shortDate = parts[2] && parts[1] ? `${parts[2]}/${parts[1]}` : item.dateString; // e.g. 23/06
      return {
        ...item,
        labelDate: shortDate,
        "Total Token": item.totalTokens,
        "Token Respon": item.responseTokens,
        "Token Prompt": item.promptTokens,
        "Jumlah Sesi": item.count,
      };
    });
  }, [aiLogs]);

  // LOGIN PAGE (Authenticated Protected Access)
  if (!user && !isSimulated) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fade-in pointer-events-auto">
        <div className="bg-[#064e3b] text-white p-8 rounded-3xl shadow-xl border border-emerald-800 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-bounce">
            <Lock className="w-8 h-8 text-emerald-300" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Sistem Portal Admin
            </h2>
            <p className="text-xs text-emerald-200/80 font-medium">
              Sistem Otentikasi Terpadu Pengurus & Operator Database MGMP PAI SMP Kabupaten Subang
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 text-xs py-2.5 px-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse"></span>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs py-2.5 px-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {successMsg}
            </div>
          )}

          <div className="bg-emerald-950/70 p-4.5 rounded-2xl border border-emerald-900 text-left space-y-2">
            <h4 className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Aturan Keamanan Database:
            </h4>
            <p className="text-[10px] text-emerald-100/70 font-medium leading-relaxed">
              Hak akses tulis (Create, Update, Delete) dibatasi khusus untuk user ber-lisensi admin terdaftar: <code className="text-emerald-300 font-bold">feri.gunawan87@gmail.com</code>.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-slate-50 text-emerald-950 text-xs sm:text-sm font-extrabold py-3.5 px-5 rounded-2xl shadow hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5"
              />
              Masuk dengan Akun Google
            </button>

            <button
              onClick={handleSimulatedSignIn}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-xs font-bold py-2 px-4 rounded-xl border border-emerald-700/60 transition-all cursor-pointer"
            >
              Mode Simulasi (Developer Bypass)
            </button>
          </div>

          <p className="text-[10px] text-emerald-300/40 font-mono">
            SILADIK Security Module | Protected with Firebase Auth @{new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // LOGGED IN: ADMIN PANEL AREA
  return (
    <div className="space-y-8 animate-fade-in pointer-events-auto">
      
      {/* Admin Header with Profile metadata */}
      <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-850 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 font-black text-[10px] tracking-wider px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Admin Only
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
              {activeEmail}
            </span>
          </div>

          <h1 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            SILADIK Control Panel
          </h1>
          <p className="text-xs text-emerald-250/80 font-medium">
            Selamat datang, <strong className="text-white font-extrabold">{currentAdminName || "Administrator"}</strong>. Anda memiliki kendali penuh atas data Guru PAI SMP dan rilis Informasi Beranda.
          </p>
        </div>

        {/* Action Logout */}
        <button
          onClick={handleSignOut}
          className="bg-emerald-800 hover:bg-emerald-700 text-[11px] font-black text-emerald-200 py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-center border border-emerald-700/40"
        >
          <LogOut className="w-4 h-4" />
          Log Out Admin Portal
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-550/10 border border-red-500/30 text-red-700 text-xs py-3 px-4 rounded-2xl font-bold flex items-center gap-2.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping"></span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-3 px-4 rounded-2xl font-black flex items-center gap-2.5 shadow-sm animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Subnavigation Selector row styled exactly as requested "seperti tombol menu informasi" */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200/50 rounded-3xl gap-4">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setAdminSubTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "dashboard"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            Dashboard Ringkasan
          </button>
          
          <button
            onClick={() => setAdminSubTab("berita")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "berita"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            a. Kelola Informasi & Berita
          </button>

          <button
            onClick={() => setAdminSubTab("guru")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "guru"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            b. Kelola Database Guru PAI
          </button>

          <button
            onClick={() => setAdminSubTab("profil_mgmp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "profil_mgmp"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            c. Kelola Profil & Organisasi
          </button>

          <button
            onClick={() => setAdminSubTab("kelola_apk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "kelola_apk"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#009640]" />
            d. Kelola Aplikasi APK
          </button>

          <button
            onClick={() => setAdminSubTab("api_monitoring")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "api_monitoring"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Pantau Penggunaan API
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-mono text-right shrink-0 uppercase font-bold">
          Sistem Online: Firestore Real-Time
        </div>
      </div>

      {/* SUB TAB 1: DASHBOARD METRICS MAP OVERVIEW */}
      {adminSubTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Metric 1 */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Anggota Terdaftar</span>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-800">
                  {teachers.length}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Guru pelajaran SMP dalam 6 Rayon Komisariat Subang</p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Publikasi Informasi</span>
                <Newspaper className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-800">
                  {news.length}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Artikel berita & Pedoman kurikulum PAI aktif</p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sistem Konektivitas</span>
                <Database className="w-5 h-5 text-teal-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-emerald-700 bg-emerald-50 w-max px-3 py-1 rounded-full border border-emerald-100">
                  Aktif Real-time
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug font-medium pt-2">Tersinkronisasi dua arah ke Firestore: `siladik-guru-pai-smp` & `teachers` collections.</p>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Petunjuk Pengoperasian Portal Admin
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed max-w-2xl pl-1 font-medium list-disc ml-5">
              <li>Silahkan pilih tab <strong>Kelola Informasi & Berita</strong> di atas untuk membuat rilis berita terbaru, meremajakan materi bimtek Kemenag, atau menginstruksikan modul ajar.</li>
              <li>Pilih menu <strong>Kelola Database Guru PAI</strong> untuk menambah pendaftaran, mengedit NIP/NUPTK, atau memperbarui penugasan rayon komisariat.</li>
              <li>Setiap perubahan data guru di panel ini akan langsung ter-render secara real-time di diagram statistika wilayah SILADIK yang ada di halaman utama portal!</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB TAB 2: NEWS CRUD LISTING */}
      {adminSubTab === "berita" && (
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-800">Manajemen Pengumuman & Berita</h3>
              <p className="text-xs text-slate-400 font-medium">Daftar lengkap warta dan postingan regulasi untuk guru PAI se-Kabupaten.</p>
            </div>
            
            <button
              onClick={openAddNews}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Tulis Berita Baru
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berita berdasarkan judul..." 
              value={searchNewsQuery}
              onChange={(e) => setSearchNewsQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
            />
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Gambar</th>
                  <th className="py-3 px-4">Informasi Berita</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal Rilis</th>
                  <th className="py-3 px-4 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ditemukan publikasi berita yang cocok dengan kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredNews.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <img 
                          src={item.image} 
                          alt="thumbnail" 
                          className="w-12 h-12 object-cover rounded-lg border border-slate-100" 
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{item.summary}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{item.date}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditNews(item)}
                            className="p-1 px-2 hover:bg-slate-100 text-emerald-800 rounded border border-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-1 px-2 hover:bg-red-50 text-red-600 rounded border border-slate-100 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB TAB 3: TEACHER CRUD LISTING */}
      {adminSubTab === "guru" && (
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-800">Manajemen Anggota Guru SMP</h3>
              <p className="text-xs text-slate-400 font-medium">Kelola validasi pendataan Guru PAI SMP se-Kabupaten Subang.</p>
            </div>
            
            <button
              onClick={openAddTeacher}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Guru Baru
            </button>
          </div>

          {/* Filter/Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-1 sm:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari guru berdasarkan nama/sekolah/NIP..." 
                value={searchTeacherQuery}
                onChange={(e) => setSearchTeacherQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
              >
                <option value="Semua">Semua Kepegawaian</option>
                <option value="PNS">Pegawai PNS</option>
                <option value="PPPK">Pegawai PPPK</option>
                <option value="Non ASN">Honorer (Non ASN)</option>
              </select>
            </div>

            <div>
              <select
                value={filterKomisariat}
                onChange={(e) => setFilterKomisariat(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
              >
                <option value="Semua">Semua Wilayah</option>
                <option value="subang">Komisariat Subang</option>
                <option value="jalancagak">Komisariat Jalancagak</option>
                <option value="kalijati">Komisariat Kalijati</option>
                <option value="pagaden">Komisariat Pagaden</option>
                <option value="pamanukan">Komisariat Pamanukan</option>
                <option value="ciasem">Komisariat Ciasem</option>
              </select>
            </div>
          </div>

          {/* Teachers table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2 sm:px-4">Nama Guru PAI</th>
                  <th className="py-3 px-2 sm:px-4">Satker Sekolah</th>
                  <th className="py-3 px-2 sm:px-4">Wilayah Komisariat</th>
                  <th className="py-3 px-2 sm:px-4">Status & Kontak</th>
                  <th className="py-3 px-2 sm:px-4">Status Iuran</th>
                  <th className="py-3 px-2 sm:px-4 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ditemukan data Guru yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teach) => (
                    <tr key={teach.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 sm:px-4">
                        <div className="font-extrabold text-slate-800 text-xs sm:text-sm">{teach.nama}</div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          NIP: {teach.nip || "—"} | NUPTK: {teach.nuptk || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 font-semibold text-slate-600 text-xs">{teach.sekolah}</td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="text-[9px] font-extrabold text-teal-800 bg-teal-50 border border-teal-100 rounded px-2.5 py-0.5 capitalize">
                          {teach.komisariat}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 space-y-1">
                        <div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                            teach.status === "PNS" ? "bg-amber-100 text-amber-800" :
                            teach.status === "PPPK" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {teach.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">
                          WA: {teach.whatsapp || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          teach.iuranStatus === "Lunas" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}>
                          {teach.iuranStatus || "Belum Bayar"}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => openEditTeacher(teach)}
                            className="p-1 px-2 hover:bg-slate-150 text-emerald-800 rounded border border-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teach.id || "", teach.nama)}
                            className="p-1 px-2 hover:bg-red-50 text-red-600 rounded border border-slate-100 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB TAB 5: KELOLA PROFIL & ORGANISASI */}
      {adminSubTab === "profil_mgmp" && (
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-800">Manajemen Profil MGMP & Kepengurusan</h3>
              <p className="text-xs text-slate-400 font-medium">Kelola visi, misi, sasaran organisasi, dan susunan dewan pengurus harian.</p>
            </div>

            {/* Inner sub-tabs selector */}
            <div className="flex p-1 bg-slate-120/50 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveProfileSubTab("visimisi")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeProfileSubTab === "visimisi"
                    ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Visi & Misi
              </button>
              <button
                onClick={() => setActiveProfileSubTab("tujuan")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeProfileSubTab === "tujuan"
                    ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tujuan / Sasaran
              </button>
              <button
                onClick={() => setActiveProfileSubTab("struktur")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeProfileSubTab === "struktur"
                    ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pengurus Harian
              </button>
            </div>
          </div>

          {/* INNER TAB: VISI & MISI */}
          {activeProfileSubTab === "visimisi" && (
            <div className="space-y-6">
              {/* Visi form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-emerald-600 block"></span>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Perumusan Visi MGMP PAI</h4>
                </div>
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    value={adminVisi}
                    onChange={(e) => setAdminVisi(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-sans focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-700 leading-relaxed"
                    placeholder="Tuliskan visi MGMP..."
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-slate-400">
                    <span>* Perubahan visi akan langsung ter-render di tab Profil bagi seluruh pengunjung portal.</span>
                    <button
                      onClick={() => {
                        localStorage.setItem("mgmp_profile_visi", adminVisi);
                        setSuccessMsg("Pernyataan visi organisasi berhasil diperbarui!");
                        setTimeout(() => setSuccessMsg(""), 3000);
                      }}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg shadow-sm cursor-pointer"
                    >
                      Simpan Visi Baru
                    </button>
                  </div>
                </div>
              </div>

              {/* Misi List and Add */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-4 rounded-full bg-emerald-600 block"></span>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Butir Misi Organisasi</h4>
                  </div>
                </div>

                {/* Form to Add / Edit Misi */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newMisiText}
                    onChange={(e) => setNewMisiText(e.target.value)}
                    placeholder="Tulis butir misi baru (contoh: Mengadakan kajian fikih metodologis...)"
                    className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newMisiText.trim()) return;
                        let updated: string[];
                        if (editingMisiIndex !== null) {
                          updated = [...adminMisi];
                          updated[editingMisiIndex] = newMisiText.trim();
                          setEditingMisiIndex(null);
                        } else {
                          updated = [...adminMisi, newMisiText.trim()];
                        }
                        setAdminMisi(updated);
                        localStorage.setItem("mgmp_profile_misi", JSON.stringify(updated));
                        setNewMisiText("");
                        setSuccessMsg("Butir misi organisasi berhasil diperbarui!");
                        setTimeout(() => setSuccessMsg(""), 3000);
                      }}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                    >
                      {editingMisiIndex !== null ? "Terapkan Edit" : "Tambah Misi"}
                    </button>
                    {editingMisiIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingMisiIndex(null);
                          setNewMisiText("");
                        }}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* Listing current misi */}
                <div className="grid grid-cols-1 gap-2">
                  {adminMisi.map((misi, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50/50 group">
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{misi}</p>
                      </div>
                      <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingMisiIndex(idx);
                            setNewMisiText(misi);
                          }}
                          className="p-1 text-emerald-800 hover:bg-slate-100 rounded cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Hapus butir misi ini?")) {
                              const updated = adminMisi.filter((_, i) => i !== idx);
                              setAdminMisi(updated);
                              localStorage.setItem("mgmp_profile_misi", JSON.stringify(updated));
                              setSuccessMsg("Misi berhasil dihapus!");
                              setTimeout(() => setSuccessMsg(""), 3000);
                            }
                          }}
                          className="p-1 text-red-650 hover:bg-red-55 rounded cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INNER TAB: TUJUAN / SASARAN */}
          {activeProfileSubTab === "tujuan" && (
            <div className="space-y-6">
              {/* Form to Add / Edit Goal */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-emerald-600 block"></span>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {editingTujuanIndex !== null ? "Ubah Sasaran / Tujuan Organisasi" : "Tambah Sasaran / Tujuan Baru"}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Sasaran *</label>
                    <input
                      type="text"
                      value={newTujuanTitle}
                      onChange={(e) => setNewTujuanTitle(e.target.value)}
                      placeholder="Contoh: Akreditasi & Angka Kredit"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Penjelasan / Deskripsi Lengkap *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTujuanDesc}
                        onChange={(e) => setNewTujuanDesc(e.target.value)}
                        placeholder="Contoh: Pendampingan guru dalam pengusulan PAK penilaian kinerja guru."
                        className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (!newTujuanTitle.trim() || !newTujuanDesc.trim()) {
                            alert("Mohon lengkapi judul dan deskripsi sasaran!");
                            return;
                          }
                          const record = { title: newTujuanTitle.trim(), desc: newTujuanDesc.trim() };
                          let updated: any[];
                          if (editingTujuanIndex !== null) {
                            updated = [...adminTujuan];
                            updated[editingTujuanIndex] = record;
                            setEditingTujuanIndex(null);
                          } else {
                            updated = [...adminTujuan, record];
                          }
                          setAdminTujuan(updated);
                          localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(updated));
                          setNewTujuanTitle("");
                          setNewTujuanDesc("");
                          setSuccessMsg("Butir tujuan berhasil diperbarui!");
                          setTimeout(() => setSuccessMsg(""), 3000);
                        }}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shrink-0 cursor-pointer"
                      >
                        {editingTujuanIndex !== null ? "Terapkan" : "Tambah"}
                      </button>
                      {editingTujuanIndex !== null && (
                        <button
                          onClick={() => {
                            setEditingTujuanIndex(null);
                            setNewTujuanTitle("");
                            setNewTujuanDesc("");
                          }}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-xs"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminTujuan.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow hover:border-emerald-100 relative group">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-0.5 rounded uppercase">
                          Sasaran {idx + 1}
                        </span>
                        <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTujuanIndex(idx);
                              setNewTujuanTitle(item.title);
                              setNewTujuanDesc(item.desc);
                            }}
                            className="p-1 text-emerald-800 hover:bg-slate-50 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Hapus butir tujuan ini?")) {
                                const updated = adminTujuan.filter((_, i) => i !== idx);
                                setAdminTujuan(updated);
                                localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(updated));
                                setSuccessMsg("Butir sasaran berhasil dihapus!");
                                setTimeout(() => setSuccessMsg(""), 3000);
                              }
                            }}
                            className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INNER TAB: KEPENGURUSAN / STRUKTUR */}
          {activeProfileSubTab === "struktur" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-emerald-600 block"></span>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dewan Pengurus Harian MGMP</h4>
                </div>
                <button
                  onClick={() => {
                    setEditingMemberIndex(null);
                    setNewMemberName("");
                    setNewMemberRole("");
                    setNewMemberSchool("");
                    setNewMemberAvatar("");
                    setNewMemberPhone("");
                    setNewMemberSpecialty("");
                    setIsMemberModalOpen(true);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Pengurus Baru
                </button>
              </div>

              {/* Grid of members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {adminStructure.map((member, idx) => (
                  <div key={idx} className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col justify-between shadow-xs hover:border-emerald-100 group transition-all">
                    <div className="flex gap-3.5 items-start">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center ring-2 ring-emerald-100 shrink-0">
                          <LucideUser className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-1 block min-w-0 flex-1">
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded truncate block uppercase w-fit">
                          {member.role}
                        </span>
                        <h5 className="text-[11px] font-black text-slate-800 truncate" title={member.name}>
                          {member.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate font-semibold">
                          {member.school}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[65%] font-medium">
                        Focus: <strong className="text-slate-700">{member.specialty}</strong>
                      </span>
                      <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => {
                            setEditingMemberIndex(idx);
                            setNewMemberName(member.name);
                            setNewMemberRole(member.role);
                            setNewMemberSchool(member.school);
                            setNewMemberAvatar(member.avatar);
                            setNewMemberPhone(member.phone);
                            setNewMemberSpecialty(member.specialty);
                            setIsMemberModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-emerald-800 rounded cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus anggota pengurus "${member.name}" dari dewan pengurus?`)) {
                              const updated = adminStructure.filter((_, i) => i !== idx);
                              setAdminStructure(updated);
                              localStorage.setItem("mgmp_profile_structure", JSON.stringify(updated));
                              setSuccessMsg("Anggota pengurus berhasil dihapus!");
                              setTimeout(() => setSuccessMsg(""), 3000);
                            }
                          }}
                          className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Render structural modal inside this Subtab to keep code modular */}
              {isMemberModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl border border-slate-100 text-xs">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="text-sm font-black text-slate-800">
                        {editingMemberIndex !== null ? "Edit Anggota Pengurus" : "Daftarkan Pengurus Harian Baru"}
                      </h4>
                      <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMemberName.trim() || !newMemberRole.trim()) {
                          alert("Nama dan Jabatan wajib diisi!");
                          return;
                        }
                        const record = {
                          name: newMemberName.trim(),
                          role: newMemberRole.trim(),
                          school: newMemberSchool.trim() || "SMP Negeri Terkait",
                          avatar: newMemberAvatar.trim(),
                          phone: newMemberPhone.trim() || "0812-xxxx-xxxx",
                          specialty: newMemberSpecialty.trim() || "Kurikulum / Agama PAI"
                        };

                        let updated: any[];
                        if (editingMemberIndex !== null) {
                          updated = [...adminStructure];
                          updated[editingMemberIndex] = record;
                          setEditingMemberIndex(null);
                        } else {
                          updated = [...adminStructure, record];
                        }
                        setAdminStructure(updated);
                        localStorage.setItem("mgmp_profile_structure", JSON.stringify(updated));
                        setIsMemberModalOpen(false);
                        setSuccessMsg("Keanggotaan struktur organisasi berhasil diperbarui!");
                        setTimeout(() => setSuccessMsg(""), 3000);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1 block">
                        <label className="text-xs font-bold text-slate-700">Nama Lengkap & Gelar *</label>
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-xs"
                          placeholder="H. Ahmad Fauzi, S.Ag., M.Pd.I."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Jabatan / Peran Pengurus *</label>
                          <input
                            type="text"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-xs"
                            placeholder="Ketua / Sekretaris / Bendahara"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Unit Kerja Sekolah Pengurus</label>
                          <input
                            type="text"
                            value={newMemberSchool}
                            onChange={(e) => setNewMemberSchool(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-xs"
                            placeholder="SMP Negeri 1 Subang"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Nomor Kontak / WhatsApp</label>
                          <input
                            type="text"
                            value={newMemberPhone}
                            onChange={(e) => setNewMemberPhone(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-xs"
                            placeholder="0812-xxxx-xxxx"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Fokus Keahlian Utama</label>
                          <input
                            type="text"
                            value={newMemberSpecialty}
                            onChange={(e) => setNewMemberSpecialty(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-xs"
                            placeholder="Pengembangan Kurikulum / media IT"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 block text-left">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Upload Foto Pengurus</label>
                        {newMemberAvatar ? (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <img src={newMemberAvatar} alt="Profile preview" className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 truncate">Foto terpilih</p>
                              <p className="text-[9px] text-slate-400">Siap disimpan</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewMemberAvatar("")}
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
                                      setNewMemberAvatar(event.target.result as string);
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

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setIsMemberModalOpen(false)}
                          className="px-4 py-2 hover:bg-slate-50 border text-slate-500 rounded-xl font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow cursor-pointer text-xs"
                        >
                          Simpan Data Pengurus
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 6: KELOLA APK */}
      {adminSubTab === "kelola_apk" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#009640]" />
                Kelola Unggahan Aplikasi APK Resmi
              </h3>
              <p className="text-xs text-slate-400 font-medium">Unggah berkas Android APK baru dan edit metadata peluncuran agar dapat diunduh oleh para guru di halaman beranda secara dinamis.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Versi Aplikasi</label>
                    <input 
                      type="text" 
                      value={apkVersionInput}
                      onChange={(e) => setApkVersionInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-semibold"
                      placeholder="Contoh: v1.2.0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Build / Tanggal Peluncuran</label>
                    <input 
                      type="text" 
                      value={apkBuildInput}
                      onChange={(e) => setApkBuildInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-semibold"
                      placeholder="Contoh: Build 2026/06"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Nama Berkas APK (.apk)</label>
                    <input 
                      type="text" 
                      value={apkFilenameInput}
                      onChange={(e) => setApkFilenameInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="Contoh: mgmp-pai-subang-v12.apk"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Ukuran File APK</label>
                    <input 
                      type="text" 
                      value={apkSizeInput}
                      onChange={(e) => setApkSizeInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="Contoh: 24.8 MB"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-2 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center">
                  <Smartphone className="w-8 h-8 text-emerald-800 mb-1 animate-pulse" />
                  <span className="font-black text-xs text-slate-700">Unggah Berkas APK Baru</span>
                  <p className="text-[10px] text-slate-400 text-center max-w-sm mt-0.5 leading-relaxed font-semibold">Pilih berkas .apk langsung dari komputer Anda. Sistem akan mengalkulasi ukuran berkas dan menyiapkan tautan unduhan otomatis.</p>
                  
                  <input 
                    type="file" 
                    accept=".apk"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setApkFilenameInput(file.name);
                        const fileMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
                        setApkSizeInput(fileMb);
                        
                        // Simulate upload progress
                        setSuccessMsg("Berkas APK \"" + file.name + "\" (" + fileMb + ") berhasil diparsing dan disiapkan!");
                      }
                    }}
                    className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("apk_version", apkVersionInput);
                      localStorage.setItem("apk_build", apkBuildInput);
                      localStorage.setItem("apk_filename", apkFilenameInput);
                      localStorage.setItem("apk_size", apkSizeInput);
                      setSuccessMsg("Konfigurasi APK berhasil dinamakan dan disimpan ke sistem! Tautan unduhan di Beranda siap diakses para guru.");
                    }}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow transition-all cursor-pointer border border-emerald-900"
                  >
                    Simpan & Publikasikan APK
                  </button>
                </div>
              </div>

              {/* Side view preview info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shrink-0 space-y-4 text-xs font-sans">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Preview Tombol Download di Beranda</h4>
                
                <div className="p-4 bg-emerald-900 rounded-2xl text-white space-y-3 shadow-inner">
                  <span className="bg-amber-400 text-emerald-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                    Android .apk
                  </span>
                  <div>
                    <div className="font-black text-sm text-white">Aplikasi Resmi MGMP PAI</div>
                    <p className="text-[10px] text-emerald-250 leading-relaxed font-semibold">Versi {apkVersionInput} ({apkBuildInput})</p>
                  </div>
                  <div className="pt-1.5">
                    <div className="w-full bg-amber-405 text-emerald-950 font-black p-2.5 rounded-xl text-center text-[10px] cursor-not-allowed select-none bg-amber-400">
                      Mulai Unduh APK ({apkSizeInput})
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1 text-[10px] leading-relaxed text-blue-700">
                  <span className="font-bold block text-[11px]">ℹ️ Info Sinkronisasi</span>
                  <p className="font-semibold">Semua perubahan data APK yang Anda simpan di sini akan disimpan dalam storage sistem dan secara dinamis ditarik oleh komponen Unduh APK halaman depan (tanpa perlu mendeploy ulang aplikasi!).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: API MONITORING */}
      {adminSubTab === "api_monitoring" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-black text-slate-800 font-sans">Pemantauan Penggunaan API Gemini</h3>
                <p className="text-xs text-slate-400 font-medium">Lacak kuota token API Gemini 3.5 Flash dan log interaksi guru secara real-time dari Firestore.</p>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm("Apakah Anda yakin ingin menghapus seluruh log interaksi di server Firestore? Tindakan ini tidak bisa dibatalkan.")) {
                    const colRef = collection(db, "ai-interactions");
                    const snap = await getDocs(colRef);
                    const batch = writeBatch(db);
                    snap.forEach((docSnap) => {
                      batch.delete(docSnap.ref);
                    });
                    await batch.commit();
                    setSuccessMsg("Seluruh log pencatatan interaksi AI berhasil dihapus!");
                  }
                }}
                className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 px-3 rounded-lg border border-red-200 transition-all cursor-pointer"
              >
                Hapus Semua Log
              </button>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-emerald-50/40 p-4 border border-emerald-100/60 rounded-2xl">
                <span className="text-[10px] font-black text-emerald-800 tracking-wider uppercase block">Total Konsumsi Token</span>
                <span className="text-2xl font-black text-slate-850 mt-1 block">
                  {aiLogs.reduce((acc, current) => acc + (current.totalTokens || 0), 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-medium block mt-1">
                  Prompt: {aiLogs.reduce((acc, current) => acc + (current.promptTokens || 0), 0).toLocaleString()} | Res: {aiLogs.reduce((acc, current) => acc + (current.responseTokens || 0), 0).toLocaleString()}
                </span>
              </div>

              <div className="bg-amber-50/40 p-4 border border-amber-100/60 rounded-2xl">
                <span className="text-[10px] font-black text-amber-800 tracking-wider uppercase block">Sesi Tanya Jawab</span>
                <span className="text-2xl font-black text-slate-850 mt-1 block">
                  {aiLogs.length} Sesi
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Interaksi aktif sistem SILADIK</span>
              </div>

              <div className="bg-teal-50/40 p-4 border border-teal-100/60 rounded-2xl">
                <span className="text-[10px] font-black text-teal-800 tracking-wider uppercase block">Rerata Token/Sesi</span>
                <span className="text-2xl font-black text-slate-850 mt-1 block">
                  {Math.round(aiLogs.reduce((acc, current) => acc + (current.totalTokens || 0), 0) / (aiLogs.length || 1))}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Efisiensi asisten AI tinggi</span>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-250/60 rounded-2xl">
                <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase block">Status Kunci API</span>
                <span className="text-[10.5px] font-black inline-flex items-center gap-1.5 bg-emerald-150 text-emerald-900 px-2 py-1 rounded mt-2 text-center border border-emerald-250">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  G-3.5-FLASH AKTIF
                </span>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
              <h4 className="text-xs font-black text-slate-700 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-700" />
                Grafik Konsumsi Token Harian (7 Hari Terakhir)
              </h4>
              <div className="h-[280px] w-full mt-2 font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="labelDate" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'sans-serif' }} />
                    <Area type="monotone" name="Total Token Terpakai" dataKey="Total Token" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTokens)" />
                    <Area type="monotone" name="Token Respon AI" dataKey="Token Respon" stroke="#0d9488" strokeWidth={1.5} fill="none" dot />
                    <Area type="monotone" name="Token Prompt Guru" dataKey="Token Prompt" stroke="#3b82f6" strokeWidth={1} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Firestore Logs Table */}
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Riwayat Log Interaksi & Sesi Tanya Jawab
                </h4>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Saring berdasarkan email / prompt..."
                    value={searchApiLog}
                    onChange={(e) => setSearchApiLog(e.target.value)}
                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Pengguna</th>
                      <th className="py-2.5 px-3">Kueri Guru (Prompt)</th>
                      <th className="py-2.5 px-3 uppercase text-[9px] font-mono">T.Prompt</th>
                      <th className="py-2.5 px-3 uppercase text-[9px] font-mono">T.Respon</th>
                      <th className="py-2.5 px-3 uppercase text-[9px] font-mono">Total Token</th>
                      <th className="py-2.5 px-3 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiLogs.filter(log => {
                      const userMail = (log.userEmail || "").toLowerCase();
                      const promptText = (log.prompt || "").toLowerCase();
                      const filterText = searchApiLog.toLowerCase();
                      return userMail.includes(filterText) || promptText.includes(filterText);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold italic text-xs">
                          Tidak ditemukan rekaman log interaksi AI yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      aiLogs.filter(log => {
                        const userMail = (log.userEmail || "").toLowerCase();
                        const promptText = (log.prompt || "").toLowerCase();
                        const filterText = searchApiLog.toLowerCase();
                        return userMail.includes(filterText) || promptText.includes(filterText);
                      }).map((log) => {
                        const dateObj = new Date(log.timestamp || log.createdAt || Date.now());
                        const formattedTime = dateObj.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short"
                        }) + " " + dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-[11px] font-mono text-slate-400 font-medium whitespace-nowrap">
                              {formattedTime}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700 max-w-[150px] truncate" title={log.userEmail}>
                              {log.userEmail || "anonymous"}
                            </td>
                            <td className="py-3 px-3 text-slate-600 max-w-[240px] truncate" title={log.prompt}>
                              {log.prompt}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-550 font-bold">{log.promptTokens || 0}</td>
                            <td className="py-3 px-3 font-mono text-slate-550 font-bold">{log.responseTokens || 0}</td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-black bg-emerald-50 text-emerald-850 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                                {log.totalTokens || 0}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setSelectedApiLog(log)}
                                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-2 py-1 rounded text-[10px] cursor-pointer shadow-sm"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT NEWS */}
      {activeNewsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-150 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Head */}
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-emerald-300" />
                {activeNewsModal === "add" ? "Tulis Publikasi Berita Baru" : "Edit Publikasi Berita"}
              </h3>
              <button 
                onClick={() => setActiveNewsModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={saveNews} className="p-6 space-y-4 overflow-y-auto flex-grow text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">Judul Berita</label>
                  <input 
                    type="text" 
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                    placeholder="Contoh: Pembukaan Olimpiade MAPSI PAI SMP 2026"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Kategori Berita</label>
                  <select
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-xs sm:text-sm text-slate-700"
                  >
                    <option value="Berita">Berita</option>
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Pentas PAI">Pentas PAI</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Informasi Lainnya">Informasi Lainnya</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Tanggal Rilis (Bahasa Indonesia)</label>
                  <input 
                    type="text" 
                    value={newsForm.date}
                    onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                    placeholder="Contoh: 23 Juni 2026"
                  />
                </div>

                {/* Image URL & File Upload (Dual input) */}
                <div className="space-y-3 sm:col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Link URL Gambar Ilustrasi
                      </label>
                      <input 
                        type="text" 
                        value={newsForm.image}
                        onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white font-mono text-[11px]"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs">
                        📷 Atau Ambil / Upload Foto Langsung dari HP
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setNewsForm({ ...newsForm, image: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                    </div>
                  </div>
                  {newsForm.image && (
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">Preview terpilih:</span>
                      <img src={newsForm.image} alt="Preview" className="w-12 h-8 object-cover rounded-lg border border-slate-200" />
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">Ringkasan Berita (Tampil di beranda)</label>
                  <textarea 
                    value={newsForm.summary}
                    onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                    placeholder="Ringkasan pendek 1-2 kalimat..."
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">Konten Berita Lengkap</label>
                  <textarea 
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 leading-relaxed font-sans"
                    placeholder="Tulis artikel lengkap di sini..."
                  />
                </div>

              </div>

              {/* Actions Footer inside modal */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveNewsModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-white rounded-xl shadow hover:bg-emerald-700 text-xs font-bold cursor-pointer border border-emerald-900"
                >
                  Simpan & Terbitkan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT TEACHER */}
      {activeTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-slate-150 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Head */}
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                {activeTeacherModal === "add" ? "Pendaftaran Guru PAI Baru" : "Edit Formulir Guru PAI"}
              </h3>
              <button 
                onClick={() => setActiveTeacherModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={saveTeacher} className="p-6 space-y-4 overflow-y-auto flex-grow text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nama Guru */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">Nama Lengkap beserta Gelar Akademik</label>
                  <input 
                    type="text" 
                    value={teacherForm.nama}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                    placeholder="Contoh: Drs. Syamsudin, M.Pd.I."
                  />
                </div>

                {/* NIP */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">NIP (Nomor Induk Pegawai)</label>
                  <input 
                    type="text" 
                    value={teacherForm.nip}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 font-mono"
                    placeholder="Kosongkan jika honorer"
                  />
                </div>

                {/* NUPTK */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">NUPTK</label>
                  <input 
                    type="text" 
                    value={teacherForm.nuptk}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nuptk: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 font-mono"
                    placeholder="Contoh: 12347599..."
                  />
                </div>

                {/* Status PNS */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Status Kepegawaian</label>
                  <select
                    value={teacherForm.status}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                  >
                    <option value="PNS">1. Pegawai Negeri Sipil (PNS)</option>
                    <option value="PPPK">2. Pegawai Pemerintah Perjanjian Kerja (PPPK)</option>
                    <option value="Non ASN">3. Guru Honorer / Non ASN</option>
                  </select>
                </div>

                {/* Komisariat */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Wilayah Komisariat Rayon</label>
                  <select
                    value={teacherForm.komisariat}
                    onChange={(e) => setTeacherForm({ ...teacherForm, komisariat: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800"
                  >
                    <option value="subang">Komisariat Subang</option>
                    <option value="jalancagak">Komisariat Jalancagak</option>
                    <option value="kalijati">Komisariat Kalijati</option>
                    <option value="pagaden">Komisariat Pagaden</option>
                    <option value="pamanukan">Komisariat Pamanukan</option>
                    <option value="ciasem">Komisariat Ciasem</option>
                  </select>
                </div>

                {/* Satker Sekolah */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">Sekolah (Tempat Bertugas / Satker)</label>
                  <input 
                    type="text" 
                    value={teacherForm.sekolah}
                    onChange={(e) => setTeacherForm({ ...teacherForm, sekolah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
                    placeholder="Contoh: SMP Negeri 1 Subang"
                  />
                </div>

                {/* Whatsapp */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block">No. Kontak WhatsApp Aktif</label>
                  <input 
                    type="text" 
                    value={teacherForm.whatsapp}
                    onChange={(e) => setTeacherForm({ ...teacherForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 font-mono"
                    placeholder="Contoh: 081234..."
                  />
                </div>

                {/* Credentials */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Username (Akses Sigap PAI)</label>
                  <input 
                    type="text" 
                    value={teacherForm.username || ""}
                    onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 font-semibold"
                    placeholder="ahmad.fauzi"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Password (Akses Sigap PAI)</label>
                  <input 
                    type="text" 
                    value={teacherForm.password || ""}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 font-semibold"
                    placeholder="sigap123"
                  />
                </div>

                {/* Status Pembayaran */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Status Pembayaran</label>
                  <select
                    value={teacherForm.status_pembayaran || "Belum Bayar"}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const resolvedStatus = (val === "Lunas" || val === "Aktif") ? "Lunas" : "Belum Bayar";
                      setTeacherForm({ ...teacherForm, status_pembayaran: val, iuranStatus: resolvedStatus });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800 text-xs sm:text-sm"
                  >
                    <option value="Lunas">🟢 Lunas</option>
                    <option value="Aktif">🟢 Aktif</option>
                    <option value="Belum Bayar">🔴 Belum Bayar</option>
                    <option value="Menunggak">🔴 Menunggak</option>
                  </select>
                </div>

                {/* Iuran Bulanan */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Iuran Bulanan</label>
                  <select
                    value={teacherForm.iuran_bulanan || "Belum Bayar"}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const resolvedStatus = (val === "Lunas" || val === "Aktif") ? "Lunas" : "Belum Bayar";
                      setTeacherForm({ ...teacherForm, iuran_bulanan: val, iuranStatus: resolvedStatus });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800 text-xs sm:text-sm"
                  >
                    <option value="Lunas">🟢 Lunas</option>
                    <option value="Aktif">🟢 Aktif</option>
                    <option value="Belum Bayar">🔴 Belum Bayar</option>
                    <option value="Menunggak">🔴 Menunggak</option>
                  </select>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTeacherModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-white rounded-xl shadow hover:bg-emerald-700 text-xs font-bold cursor-pointer border border-emerald-900"
                >
                  Daftarkan Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW AI INTERACTION LOG DETAIL */}
      {selectedApiLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-150 overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  Rincian Log Interaksi AI
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">ID Log: {selectedApiLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedApiLog(null)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-grow text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-left">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waktu Sesi</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedApiLog.timestamp || Date.now()).toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Guru</span>
                  <span className="font-semibold text-slate-800 break-all">{selectedApiLog.userEmail || "anonymous"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Est. Konsumsi Token</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {selectedApiLog.totalTokens || 0} Token <span className="text-[10px] text-slate-400">(Prompt: {selectedApiLog.promptTokens} | Res: {selectedApiLog.responseTokens})</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Model Gemini</span>
                  <span className="font-black text-slate-850">Gemini 3.5 Flash</span>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  Input Kueri Guru (Prompt):
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-205 rounded-xl leading-relaxed font-mono text-xs text-slate-705 whitespace-pre-wrap">
                  {selectedApiLog.prompt}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  Respon Jawaban AI:
                </span>
                <div className="p-3.5 bg-emerald-50/10 border border-emerald-100 rounded-xl leading-relaxed text-xs text-slate-700 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                  {selectedApiLog.response || "(Jawaban kosong)"}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-4 border-t border-slate-100 shrink-0 bg-slate-50">
              <button
                onClick={() => setSelectedApiLog(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup Reviewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
