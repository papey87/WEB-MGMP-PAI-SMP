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
  writeBatch,
  setDoc
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
  Megaphone,
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
  Check,
  Sliders,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  PencilLine,
  LayoutGrid,
  RefreshCw
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

interface AdminTabProps {
  onLogout?: () => void;
}

export default function AdminTab({ onLogout }: AdminTabProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [passcode, setPasscode] = useState("");
  const [emailInput, setEmailInput] = useState("feri.gunawan87@gmail.com");

  // DB collections state
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  
  // Navigation inside Admin Panel
  const [adminSubTab, setAdminSubTab] = useState<"dashboard" | "berita" | "guru" | "api_monitoring" | "profil_mgmp" | "kelola_apk" | "integrasi_firebase" | "kelola_pemberitahuan" | "kelola_tata_letak">("dashboard");

  // Layout & Sections management state
  const [layoutTabs, setLayoutTabs] = useState([
    { id: "beranda", label: "Beranda", visible: true },
    { id: "profil", label: "Profil MGMP", visible: true },
    { id: "informasi", label: "Informasi", visible: true },
    { id: "kegiatan", label: "Agenda Kegiatan", visible: true },
    { id: "perangkat", label: "Perangkat Ajar", visible: true },
    { id: "artikel", label: "Artikel", visible: true },
    { id: "ai-sobat", label: "Tanya AI Sobat Guru", visible: true }
  ]);

  const [layoutHomeSections, setLayoutHomeSections] = useState([
    { id: "hero", label: "Hero Banner", visible: true, order: 1, title: "", subtitle: "", description: "", badgeText: "" },
    { id: "siladik", label: "Sistem Informasi SILADIK", visible: true, order: 2, title: "" },
    { id: "advice", label: "Kolom Berbagi Nasihat / Tulisan Guru", visible: true, order: 3, title: "", description: "" },
    { id: "news_quote", label: "Berita, Pengumuman & Ruang Inspirasi", visible: true, order: 4, title: "", description: "", quoteTitle: "", quoteDescription: "" }
  ]);

  const [layoutCustomSections, setLayoutCustomSections] = useState<any[]>([]);

  // Editing forms state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionForm, setEditingSectionForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    badgeText: "",
    quoteTitle: "",
    quoteDescription: ""
  });

  const [isCustomSectionModalOpen, setIsCustomSectionModalOpen] = useState(false);
  const [editingCustomIndex, setEditingCustomIndex] = useState<number | null>(null);
  const [customSectionForm, setCustomSectionForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    visible: true
  });

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
  const [apkDownloadUrlInput, setApkDownloadUrlInput] = useState(() => localStorage.getItem("apk_download_url") || "");
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [isUploadingApk, setIsUploadingApk] = useState(false);

  // Firebase configuration management states
  const [firebaseApiKey, setFirebaseApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.apiKey || "AIzaSyCp4sLgQ00xWa3BBvFRJs1AEnD1EytNUQc";
      }
    } catch (e) {}
    return "AIzaSyCp4sLgQ00xWa3BBvFRJs1AEnD1EytNUQc";
  });

  const [firebaseProjectId, setFirebaseProjectId] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.projectId || "promising-card-0pnh2";
      }
    } catch (e) {}
    return "promising-card-0pnh2";
  });

  const [firebaseAppId, setFirebaseAppId] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.appId || "1:827904139612:web:8da7d60f6e994022a16199";
      }
    } catch (e) {}
    return "1:827904139612:web:8da7d60f6e994022a16199";
  });

  const [firebaseDbId, setFirebaseDbId] = useState(() => {
    return localStorage.getItem("custom_firebase_db_id") || "ai-studio-52c3b800-b7a1-459e-af6e-315e9ae0eb3a";
  });

  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.authDomain || "promising-card-0pnh2.firebaseapp.com";
      }
    } catch (e) {}
    return "promising-card-0pnh2.firebaseapp.com";
  });

  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.storageBucket || "promising-card-0pnh2.firebasestorage.app";
      }
    } catch (e) {}
    return "promising-card-0pnh2.firebasestorage.app";
  });

  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.messagingSenderId || "827904139612";
      }
    } catch (e) {}
    return "827904139612";
  });

  // Dynamic global announcement admin states
  const [announcementText, setAnnouncementText] = useState("Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.");
  const [announcementBadgeText, setAnnouncementBadgeText] = useState("INFO PENTING");
  const [announcementActionType, setAnnouncementActionType] = useState<"apk" | "link" | "none">("apk");
  const [announcementActionUrl, setAnnouncementActionUrl] = useState("");
  const [announcementBlinking, setAnnouncementBlinking] = useState(true);

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

  const saveProfileToFirestore = async (
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

      // Update local storage too as a fallback/mirror
      if (updatedVisi !== undefined) localStorage.setItem("mgmp_profile_visi", updatedVisi);
      if (updatedMisi !== undefined) localStorage.setItem("mgmp_profile_misi", JSON.stringify(updatedMisi));
      if (updatedTujuan !== undefined) localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(updatedTujuan));
      if (updatedStructure !== undefined) localStorage.setItem("mgmp_profile_structure", JSON.stringify(updatedStructure));

      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.error("Error saving profile settings to firestore:", e);
    }
  };

  // Check auth state trigger
  useEffect(() => {
    const savedEmail = localStorage.getItem("admin_logged_in_email");
    const savedName = localStorage.getItem("admin_logged_in_name");
    if (savedEmail && allowedAdminEmails.includes(savedEmail)) {
      setUser({
        uid: "admin-feri-gunawan",
        email: savedEmail,
        displayName: savedName || "Feri Gunawan",
        emailVerified: true
      } as any);
      setIsSimulated(false);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const email = currentUser.email || "";
        if (allowedAdminEmails.includes(email)) {
          setUser(currentUser);
          setIsSimulated(false);
        } else {
          signOut(auth).catch(err => console.error(err));
          setUser(null);
          localStorage.removeItem("admin_portal_access");
          setErrorMsg(`Akun Google (${email}) Anda tidak terdaftar sebagai administrator.`);
        }
      } else {
        if (!localStorage.getItem("admin_logged_in_email")) {
          setUser(null);
        }
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

    // 4. Subscribe to profile settings doc
    const unsubProfile = onSnapshot(doc(db, "settings", "profile"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.visi !== undefined) setAdminVisi(data.visi);
        if (data.misi !== undefined) setAdminMisi(data.misi);
        if (data.tujuan !== undefined) setAdminTujuan(data.tujuan);
        if (data.structure !== undefined) setAdminStructure(data.structure);
      }
    });

    // 5. Subscribe to APK settings doc
    const unsubApk = onSnapshot(doc(db, "settings", "apk"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.version !== undefined) setApkVersionInput(data.version);
        if (data.build !== undefined) setApkBuildInput(data.build);
        if (data.filename !== undefined) setApkFilenameInput(data.filename);
        if (data.size !== undefined) setApkSizeInput(data.size);
        if (data.data !== undefined) setApkDataInput(data.data);
        if (data.downloadUrl !== undefined) {
          setApkDownloadUrlInput(data.downloadUrl);
          localStorage.setItem("apk_download_url", data.downloadUrl);
        }
      }
    });

    // 6. Subscribe to Global Announcement settings doc
    const unsubAnnouncement = onSnapshot(doc(db, "settings", "announcement"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.text !== undefined) setAnnouncementText(data.text);
        if (data.badgeText !== undefined) setAnnouncementBadgeText(data.badgeText);
        if (data.actionType !== undefined) setAnnouncementActionType(data.actionType);
        if (data.actionUrl !== undefined) setAnnouncementActionUrl(data.actionUrl);
        if (data.blinking !== undefined) setAnnouncementBlinking(data.blinking);
      }
    });

    // 7. Subscribe to Layout configurations doc
    const unsubLayout = onSnapshot(doc(db, "settings", "layout"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tabs) setLayoutTabs(data.tabs);
        if (data.homeSections) setLayoutHomeSections(data.homeSections);
        if (data.customSections) setLayoutCustomSections(data.customSections);
      }
    });

    return () => {
      unsubTeachers();
      unsubNews();
      unsubInteractions();
      unsubProfile();
      unsubApk();
      unsubAnnouncement();
      unsubLayout();
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

  const handlePasscodeSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passcode.trim();

    if (!cleanEmail) {
      setErrorMsg("Silakan masukkan email administrator.");
      return;
    }
    if (!cleanPass) {
      setErrorMsg("Silakan masukkan kode akses.");
      return;
    }
    if (!allowedAdminEmails.includes(cleanEmail)) {
      setErrorMsg(`Akun (${cleanEmail}) Anda tidak terdaftar sebagai administrator.`);
      return;
    }

    const validCodes = [
      "subang-juara",
      "siladik-subang",
      "mgmp-subang-juara",
      "admin-mgmp-subang",
      "siladik-2026"
    ];

    if (validCodes.includes(cleanPass)) {
      localStorage.setItem("admin_logged_in_email", cleanEmail);
      localStorage.setItem("admin_logged_in_name", "Feri Gunawan");
      localStorage.setItem("admin_portal_access", "true");
      
      setUser({
        uid: "admin-feri-gunawan",
        email: cleanEmail,
        displayName: "Feri Gunawan",
        emailVerified: true
      } as any);
      setIsSimulated(false);
      setSuccessMsg("Selamat Datang! Login Admin berhasil diverifikasi via Kode Akses.");
      setPasscode("");
      window.dispatchEvent(new Event("storage"));
    } else {
      setErrorMsg("Kode akses salah atau tidak valid. Silakan periksa kembali.");
    }
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
      localStorage.removeItem("admin_logged_in_email");
      localStorage.removeItem("admin_logged_in_name");
      localStorage.removeItem("admin_is_simulated");
      localStorage.removeItem("admin_portal_access");
      setUser(null);
      setSuccessMsg("Anda telah sukses keluar dari sesi administrator.");
      window.dispatchEvent(new Event("storage"));
      if (onLogout) {
        onLogout();
      }
    } catch (e) {
      console.error("Sign out error", e);
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

  // Tata Letak Management Handlers
  const handleToggleTabVisibility = async (tabId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updatedTabs = layoutTabs.map((t) =>
        t.id === tabId ? { ...t, visible: !t.visible } : t
      );
      await setDoc(doc(db, "settings", "layout"), {
        tabs: updatedTabs,
        homeSections: layoutHomeSections,
        customSections: layoutCustomSections
      }, { merge: true });
      setSuccessMsg("Visibilitas tab navigasi berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memperbarui visibilitas tab navigasi.");
    }
  };

  const handleUpdateTabLabel = async (tabId: string, newLabel: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!newLabel.trim()) return;
    try {
      const updatedTabs = layoutTabs.map((t) =>
        t.id === tabId ? { ...t, label: newLabel } : t
      );
      await setDoc(doc(db, "settings", "layout"), {
        tabs: updatedTabs,
        homeSections: layoutHomeSections,
        customSections: layoutCustomSections
      }, { merge: true });
      setSuccessMsg("Nama tab navigasi berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memperbarui nama tab navigasi.");
    }
  };

  const handleToggleSectionVisibility = async (sectId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updatedSections = layoutHomeSections.map((s) =>
        s.id === sectId ? { ...s, visible: !s.visible } : s
      );
      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: updatedSections,
        customSections: layoutCustomSections
      }, { merge: true });
      setSuccessMsg("Visibilitas bagian beranda berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memperbarui visibilitas bagian beranda.");
    }
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    setErrorMsg("");
    setSuccessMsg("");
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layoutHomeSections.length) return;

    try {
      const sectionsCopy = [...layoutHomeSections];
      // Swap order attributes
      const tempOrder = sectionsCopy[index].order;
      sectionsCopy[index].order = sectionsCopy[newIndex].order;
      sectionsCopy[newIndex].order = tempOrder;

      // Swap in list
      const tempObj = sectionsCopy[index];
      sectionsCopy[index] = sectionsCopy[newIndex];
      sectionsCopy[newIndex] = tempObj;

      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: sectionsCopy,
        customSections: layoutCustomSections
      }, { merge: true });
      setSuccessMsg("Urutan tata letak bagian berhasil dipindahkan!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memindahkan urutan tata letak.");
    }
  };

  const handleStartEditSection = (sect: any) => {
    setEditingSectionId(sect.id);
    setEditingSectionForm({
      title: sect.title || "",
      subtitle: sect.subtitle || "",
      description: sect.description || "",
      badgeText: sect.badgeText || "",
      quoteTitle: sect.quoteTitle || "",
      quoteDescription: sect.quoteDescription || ""
    });
  };

  const handleSaveSectionEdits = async () => {
    if (!editingSectionId) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updatedSections = layoutHomeSections.map((s) => {
        if (s.id === editingSectionId) {
          return {
            ...s,
            title: editingSectionForm.title,
            subtitle: editingSectionForm.subtitle,
            description: editingSectionForm.description,
            badgeText: editingSectionForm.badgeText,
            quoteTitle: editingSectionForm.quoteTitle,
            quoteDescription: editingSectionForm.quoteDescription
          };
        }
        return s;
      });

      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: updatedSections,
        customSections: layoutCustomSections
      }, { merge: true });

      setEditingSectionId(null);
      setSuccessMsg("Konten elemen beranda berhasil disimpan!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan konten elemen beranda.");
    }
  };

  const handleSaveCustomSection = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!customSectionForm.title.trim()) {
      setErrorMsg("Judul bagian kustom tidak boleh kosong!");
      return;
    }
    try {
      let updatedCustoms = [...layoutCustomSections];
      if (editingCustomIndex !== null) {
        // Edit existing
        updatedCustoms[editingCustomIndex] = {
          ...updatedCustoms[editingCustomIndex],
          title: customSectionForm.title,
          content: customSectionForm.content,
          imageUrl: customSectionForm.imageUrl,
          visible: customSectionForm.visible
        };
      } else {
        // Create new
        updatedCustoms.push({
          id: "custom_" + Date.now(),
          title: customSectionForm.title,
          content: customSectionForm.content,
          imageUrl: customSectionForm.imageUrl,
          visible: customSectionForm.visible,
          createdAt: new Date().toISOString()
        });
      }

      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: layoutHomeSections,
        customSections: updatedCustoms
      }, { merge: true });

      setIsCustomSectionModalOpen(false);
      setEditingCustomIndex(null);
      setCustomSectionForm({ title: "", content: "", imageUrl: "", visible: true });
      setSuccessMsg("Bagian kustom berhasil disimpan!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan bagian kustom.");
    }
  };

  const handleToggleCustomVisibility = async (index: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updatedCustoms = layoutCustomSections.map((c, i) =>
        i === index ? { ...c, visible: !c.visible } : c
      );
      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: layoutHomeSections,
        customSections: updatedCustoms
      }, { merge: true });
      setSuccessMsg("Visibilitas bagian kustom diperbarui!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memperbarui visibilitas bagian kustom.");
    }
  };

  const handleDeleteCustomSection = async (index: number) => {
    if (!window.confirm("Hapus bagian kustom ini secara permanen?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updatedCustoms = layoutCustomSections.filter((_, i) => i !== index);
      await setDoc(doc(db, "settings", "layout"), {
        tabs: layoutTabs,
        homeSections: layoutHomeSections,
        customSections: updatedCustoms
      }, { merge: true });
      setSuccessMsg("Bagian kustom berhasil dihapus!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghapus bagian kustom.");
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
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-emerald-800/40"></div>
            <span className="flex-shrink mx-3 text-[10px] text-emerald-300/65 font-bold uppercase tracking-wider">Atau Gunakan Kode Akses</span>
            <div className="flex-grow border-t border-emerald-800/40"></div>
          </div>

          <form onSubmit={handlePasscodeSignIn} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-emerald-300 mb-1.5 uppercase tracking-wide">
                Email Administrator:
              </label>
              <input
                type="email"
                placeholder="Contoh: feri.gunawan87@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-emerald-950/80 border border-emerald-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-emerald-600/70 text-xs font-bold py-3 px-4 rounded-xl transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-300 mb-1.5 uppercase tracking-wide">
                Kode Akses Khusus Admin:
              </label>
              <input
                type="password"
                placeholder="Masukkan kode rahasia admin..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-emerald-950/80 border border-emerald-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-emerald-600 text-xs font-bold py-3 px-4 rounded-xl transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-emerald-950 text-xs font-black py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Verifikasi Kode Akses & Email
            </button>
          </form>

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
            onClick={() => setAdminSubTab("integrasi_firebase")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "integrasi_firebase"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            e. Integrasi Firebase
          </button>

          <button
            onClick={() => setAdminSubTab("kelola_pemberitahuan")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "kelola_pemberitahuan"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Megaphone className="w-4 h-4 text-rose-500" />
            f. Kelola Pemberitahuan PENTING
          </button>

          <button
            onClick={() => setAdminSubTab("kelola_tata_letak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === "kelola_tata_letak"
                ? "bg-emerald-800 text-white shadow-md font-black"
                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-500" />
            g. Kelola Tata Letak & Elemen
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
                        saveProfileToFirestore(adminVisi);
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
                        saveProfileToFirestore(undefined, updated);
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
                              saveProfileToFirestore(undefined, updated);
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
                          saveProfileToFirestore(undefined, undefined, updated);
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
                                saveProfileToFirestore(undefined, undefined, updated);
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
                              saveProfileToFirestore(undefined, undefined, undefined, updated);
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
                        saveProfileToFirestore(undefined, undefined, undefined, updated);
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
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Tautan Unduhan Langsung APK (Ditentukan Otomatis / Bisa Kustom)</label>
                    <input 
                      type="text" 
                      value={apkDownloadUrlInput}
                      onChange={(e) => setApkDownloadUrlInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="Contoh: /uploads/mgmp-app.apk atau link Google Drive / Dropbox"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-2 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center">
                  <Smartphone className="w-8 h-8 text-emerald-800 mb-1 animate-pulse" />
                  <span className="font-black text-xs text-slate-700">Unggah Berkas APK Baru</span>
                  <p className="text-[10px] text-slate-400 text-center max-w-sm mt-0.5 leading-relaxed font-semibold">Pilih berkas .apk langsung dari komputer Anda. Sistem akan mengunggah berkas tersebut ke server dan menghasilkan tautan unduhan otomatis secara real-time.</p>
                  
                  <input 
                    type="file" 
                    accept=".apk"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setApkFile(file);
                        setApkFilenameInput(file.name);
                        const fileMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
                        setApkSizeInput(fileMb);
                        setSuccessMsg("Berkas APK \"" + file.name + "\" (" + fileMb + ") siap diunggah. Klik tombol Simpan di bawah untuk memulai proses pengunggahan ke server.");
                      }
                    }}
                    className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {apkFile && (
                    <div className="mt-2 text-xs text-emerald-800 font-bold bg-white px-3 py-1 rounded-full border border-emerald-100">
                      📂 File Terpilih: {apkFile.name} ({apkSizeInput})
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    disabled={isUploadingApk}
                    onClick={async () => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      let finalDownloadUrl = apkDownloadUrlInput;

                      if (apkFile) {
                        setIsUploadingApk(true);
                        setSuccessMsg("Memulai pengunggahan berkas APK (" + apkSizeInput + ")... Mohon tunggu...");
                        try {
                          const res = await fetch("/api/upload-apk", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/octet-stream",
                              "X-Filename": apkFilenameInput,
                            },
                            body: apkFile,
                          });

                          if (!res.ok) {
                            const errData = await res.json();
                            throw new Error(errData.error || "Gagal mengunggah berkas APK ke server.");
                          }

                          const data = await res.json();
                          finalDownloadUrl = data.downloadUrl;
                          setApkDownloadUrlInput(data.downloadUrl);
                          localStorage.setItem("apk_download_url", data.downloadUrl);
                        } catch (err: any) {
                          console.error("Upload failed:", err);
                          setErrorMsg("Gagal mengunggah APK: " + err.message);
                          setIsUploadingApk(false);
                          return;
                        }
                        setIsUploadingApk(false);
                      }

                      localStorage.setItem("apk_version", apkVersionInput);
                      localStorage.setItem("apk_build", apkBuildInput);
                      localStorage.setItem("apk_filename", apkFilenameInput);
                      localStorage.setItem("apk_size", apkSizeInput);

                      try {
                        await setDoc(doc(db, "settings", "apk"), {
                          version: apkVersionInput,
                          build: apkBuildInput,
                          filename: apkFilenameInput,
                          size: apkSizeInput,
                          downloadUrl: finalDownloadUrl
                        }, { merge: true });
                        setSuccessMsg("Konfigurasi dan berkas APK berhasil disimpan ke Firebase dan dipublikasikan! Tautan unduhan di Beranda siap diakses para guru.");
                        setApkFile(null); // Reset file selection after successful save
                      } catch (err: any) {
                        console.error("Failed to sync APK to Firestore:", err);
                        setErrorMsg("Gagal menyimpan metadata APK ke Firebase: " + err.message);
                      }
                    }}
                    className={`bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow transition-all cursor-pointer border border-emerald-900 flex items-center gap-2 ${
                      isUploadingApk ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploadingApk ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengunggah APK...
                      </>
                    ) : (
                      "Simpan & Publikasikan APK"
                    )}
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

      {/* SUB TAB 6: KELOLA PEMBERITAHUAN PENTING */}
      {adminSubTab === "kelola_pemberitahuan" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500 animate-bounce" />
                Kelola Pemberitahuan PENTING Beranda
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Sesuaikan teks pengumuman penting, lencana (badge) atas, efek berkedip, serta tautan ketika teks diklik secara dinamis langsung dari database real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input fields */}
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Lencana Pemberitahuan (Badge)</label>
                    <input 
                      type="text" 
                      value={announcementBadgeText}
                      onChange={(e) => setAnnouncementBadgeText(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-bold"
                      placeholder="e.g. INFO PENTING"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Isi Teks Pemberitahuan PENTING</label>
                    <textarea 
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-semibold"
                      placeholder="Tulis informasi krusial di sini..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Aksi Saat Diklik Pembaca</label>
                    <select
                      value={announcementActionType}
                      onChange={(e) => setAnnouncementActionType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-semibold"
                    >
                      <option value="apk">Membuka Modal Unduh & Panduan APK Android</option>
                      <option value="link">Membuka Tautan URL Kustom (Eksternal)</option>
                      <option value="none">Tidak Melakukan Aksi (Teks Statis Sahaja)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Efek Berkedip-kedip (Blinking)</label>
                    <div className="flex items-center gap-2 h-9">
                      <input 
                        type="checkbox"
                        id="announcementBlinking"
                        checked={announcementBlinking}
                        onChange={(e) => setAnnouncementBlinking(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="announcementBlinking" className="text-xs text-slate-600 font-bold cursor-pointer select-none">
                        Aktifkan efek kedip pada teks lencana
                      </label>
                    </div>
                  </div>

                  {announcementActionType === "link" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-extrabold text-[11px] text-slate-500 block">URL / Tautan Informasi Kustom</label>
                      <input 
                        type="url" 
                        value={announcementActionUrl}
                        onChange={(e) => setAnnouncementActionUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono"
                        placeholder="e.g. https://website-informasi-mgmp.com/artikel-penting"
                      />
                    </div>
                  )}

                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin mengatur ulang pengumuman ke ajakan unduh APK Bawaan?")) {
                        setAnnouncementText("Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.");
                        setAnnouncementBadgeText("INFO PENTING");
                        setAnnouncementActionType("apk");
                        setAnnouncementActionUrl("");
                        setAnnouncementBlinking(true);
                        setSuccessMsg("Kolom diset ke bawaan. Jangan lupa klik tombol Simpan & Publikasikan untuk mengirim perubahan.");
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer border border-slate-200"
                  >
                    Setelan APK Default
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const payload = {
                          text: announcementText.trim(),
                          badgeText: announcementBadgeText.trim(),
                          actionType: announcementActionType,
                          actionUrl: announcementActionUrl.trim(),
                          blinking: announcementBlinking,
                          updatedAt: new Date().toISOString()
                        };
                        
                        await setDoc(doc(db, "settings", "announcement"), payload);
                        setSuccessMsg("Pengumuman berhasil diperbarui dan dipublikasikan secara real-time!");
                      } catch (err: any) {
                        console.error("Failed to update announcement:", err);
                        setSuccessMsg("Gagal menyimpan ke Firestore: " + err.message);
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow transition-all cursor-pointer border border-rose-700"
                  >
                    Simpan & Publikasikan Pengumuman
                  </button>
                </div>
              </div>

              {/* Sidebar Guide */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shrink-0 space-y-4 text-xs font-sans">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">📢 Petunjuk Penggunaan</h4>
                
                <div className="space-y-3 leading-relaxed font-semibold text-slate-600">
                  <p>
                    Kotak hijau di beranda di bawah bagian heros sangat menarik perhatian guru. Melalui sub-tab ini, Anda dapat merubahnya kapan pun:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong className="text-slate-800">Isi Pengumuman:</strong> Gunakan kalimat ringkas, padat, dan jelas.</li>
                    <li><strong className="text-slate-800">Aksi Klik:</strong> Menghubungkan kotak dengan peluncuran APK baru, postingan berita tertentu (masukkan URL), atau nonaktifkan tautan klik.</li>
                    <li><strong className="text-slate-800">Efek Kedip:</strong> Bagus untuk pemberitahuan mendesak.</li>
                  </ul>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-[10px] space-y-1">
                    <span className="font-bold block">💡 Integrasi Instant</span>
                    Semua pengguna yang sedang membuka beranda akan langsung melihat perubahan teks pengumuman dalam 0.1 detik secara real-time tanpa reload!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 5: INTEGRASI FIREBASE */}
      {adminSubTab === "integrasi_firebase" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-500" />
                Integrasi Real-time Database Firebase
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Konfigurasikan kunci API dan koordinat instansi Firebase Anda secara langsung untuk menghubungkan portal MGMP PAI ini dengan database realtime baru Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Config Fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">API Key (Web API Key)</label>
                    <input 
                      type="text" 
                      value={firebaseApiKey}
                      onChange={(e) => setFirebaseApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="AIzaSy..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Project ID</label>
                    <input 
                      type="text" 
                      value={firebaseProjectId}
                      onChange={(e) => setFirebaseProjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. promising-card-0pnh2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">App ID</label>
                    <input 
                      type="text" 
                      value={firebaseAppId}
                      onChange={(e) => setFirebaseAppId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. 1:827904139612:web:..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Database ID (ID Firestore Custom)</label>
                    <input 
                      type="text" 
                      value={firebaseDbId}
                      onChange={(e) => setFirebaseDbId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. (default) atau nama database custom Anda"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Auth Domain</label>
                    <input 
                      type="text" 
                      value={firebaseAuthDomain}
                      onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. project-id.firebaseapp.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Storage Bucket</label>
                    <input 
                      type="text" 
                      value={firebaseStorageBucket}
                      onChange={(e) => setFirebaseStorageBucket(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. project-id.firebasestorage.app"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-extrabold text-[11px] text-slate-500 block">Messaging Sender ID</label>
                    <input 
                      type="text" 
                      value={firebaseMessagingSenderId}
                      onChange={(e) => setFirebaseMessagingSenderId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono text-xs"
                      placeholder="e.g. 827904139612"
                    />
                  </div>

                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin mengatur ulang ke konfigurasi bawaan portal?")) {
                        localStorage.removeItem("custom_firebase_config");
                        localStorage.removeItem("custom_firebase_db_id");
                        setSuccessMsg("Berhasil mereset konfigurasi Firebase ke bawaan portal. Portal akan memuat ulang...");
                        setTimeout(() => {
                          window.location.reload();
                        }, 1500);
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer border border-slate-200"
                  >
                    Reset ke Bawaan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const testConfig = {
                          apiKey: firebaseApiKey.trim(),
                          projectId: firebaseProjectId.trim(),
                          appId: firebaseAppId.trim(),
                          authDomain: firebaseAuthDomain.trim(),
                          storageBucket: firebaseStorageBucket.trim(),
                          messagingSenderId: firebaseMessagingSenderId.trim()
                        };
                        
                        localStorage.setItem("custom_firebase_config", JSON.stringify(testConfig));
                        localStorage.setItem("custom_firebase_db_id", firebaseDbId.trim());
                        
                        setSuccessMsg("Integrasi Firebase berhasil diterapkan! Halaman akan menyegarkan koneksi dalam 1.5 detik...");
                        setTimeout(() => {
                          window.location.reload();
                        }, 1500);
                      } catch (err: any) {
                        console.error("Failed to save config:", err);
                        setSuccessMsg("Gagal menyimpan konfigurasi: " + err.message);
                      }
                    }}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow transition-all cursor-pointer border border-emerald-900"
                  >
                    Simpan & Terapkan Integrasi Firebase
                  </button>
                </div>
              </div>

              {/* Help & Instruction Sidebar */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shrink-0 space-y-4 text-xs font-sans">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">ℹ️ Panduan Integrasi Cepat</h4>
                
                <div className="space-y-3 leading-relaxed font-semibold text-slate-600">
                  <p>
                    Anda tidak perlu lagi mengedit berkas kode HTML atau skrip untuk menyinkronkan database real-time. Ikuti langkah sederhana ini:
                  </p>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>Buka konsol pengelola Anda di <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-black">Firebase Console</a>.</li>
                    <li>Salin parameter dari bagian <strong>Project Settings</strong> &gt; <strong>Your Apps</strong> &gt; <strong>SDK Setup and Configuration</strong>.</li>
                    <li>Tempelkan nilai masing-masing kolom ke kolom konfigurasi di sebelah kiri.</li>
                    <li>Klik <strong>Simpan & Terapkan Integrasi</strong> untuk menerapkan sambungan real-time instan ke seluruh sistem web.</li>
                  </ol>
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[10px] space-y-1">
                    <span className="font-bold block">💡 Catatan Keamanan</span>
                    Konfigurasi disimpan secara aman di peramban dan sinkronisasi. Untuk memulihkan keadaan semula sewaktu-waktu jika terjadi kesalahan pengisian kunci, klik tombol <span className="font-bold text-slate-800">Reset ke Bawaan</span>.
                  </div>
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

      {/* SUB TAB 7: KELOLA TATA LETAK & ELEMEN */}
      {adminSubTab === "kelola_tata_letak" && (
        <div className="space-y-6 animate-fade-in-up text-slate-800 text-xs sm:text-sm">
          
          {/* Card 1: Navigation Tabs Configuration */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-500" />
                a. Kelola Visibilitas & Nama Tab Navigasi Utama
              </h3>
              <p className="text-xs text-slate-400 font-medium">Aktifkan atau nonaktifkan tab menu navigasi utama situs web secara instan serta ubah nama menu sesuai kebutuhan.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">ID Menu</th>
                    <th className="py-3 px-3">Nama Menu Default</th>
                    <th className="py-3 px-3">Nama Menu Kustom (Bisa Diedit)</th>
                    <th className="py-3 px-3">Status Visibilitas</th>
                    <th className="py-3 px-3 text-right">Opsi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {layoutTabs.map((tab) => (
                    <tr key={tab.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{tab.id}</td>
                      <td className="py-3 px-3 text-slate-500">{tab.id === "ai-sobat" ? "Tanya AI Sobat Guru" : tab.id.toUpperCase()}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          defaultValue={tab.label}
                          id={`tab-label-${tab.id}`}
                          placeholder={tab.label}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 w-full max-w-[200px]"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          tab.visible !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tab.visible !== false ? "bg-emerald-600" : "bg-red-500"}`}></span>
                          {tab.visible !== false ? "Aktif & Tampil" : "Disembunyikan"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const val = (document.getElementById(`tab-label-${tab.id}`) as HTMLInputElement)?.value;
                            if (val) handleUpdateTabLabel(tab.id, val);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 border text-slate-700 hover:text-slate-800 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Simpan Nama
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTabVisibility(tab.id)}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            tab.visible !== false
                              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100/50"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                          }`}
                        >
                          {tab.visible !== false ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Home Sections Layout Configuration */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  b. Atur Tata Letak & Urutan Elemen Halaman Beranda
                </h3>
                <p className="text-xs text-slate-400 font-medium">Ubah urutan, ubah visibilitas, atau edit seluruh konten statis yang ada di Halaman Beranda MGMP PAI SMP.</p>
              </div>
            </div>

            {/* List of sections with drag-like controls */}
            <div className="space-y-4">
              {layoutHomeSections.map((sect, index) => {
                const isEditing = editingSectionId === sect.id;

                return (
                  <div key={sect.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 bg-white border border-slate-200 w-7 h-7 rounded-lg flex items-center justify-center shadow-sm select-none">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{sect.label}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ID Elemen: {sect.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Order adjustment buttons */}
                        <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveSection(index, "up")}
                            className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-20 cursor-pointer"
                            title="Naikkan Urutan"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === layoutHomeSections.length - 1}
                            onClick={() => handleMoveSection(index, "down")}
                            className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-20 cursor-pointer"
                            title="Turunkan Urutan"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Visibility and edit toggles */}
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibility(sect.id)}
                          className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer shadow-sm ${
                            sect.visible !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-slate-200 text-slate-400 border-slate-300 hover:bg-slate-250"
                          }`}
                          title={sect.visible !== false ? "Sembunyikan Bagian" : "Tampilkan Bagian"}
                        >
                          {sect.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingSectionId(null);
                            } else {
                              handleStartEditSection(sect);
                            }
                          }}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <PencilLine className="w-3.5 h-3.5" />
                          {isEditing ? "Tutup Editor" : "Edit Konten"}
                        </button>
                      </div>
                    </div>

                    {/* Inline Content Editor Form */}
                    {isEditing && (
                      <div className="bg-white rounded-2xl p-4 border border-slate-150 space-y-4 animate-fade-in text-left">
                        <div className="border-b border-slate-100 pb-2">
                          <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">✏️ Editor Konten {sect.label}</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Title (All except possibly advice if not custom, but let's provide to all) */}
                          {sect.id !== "siladik" && (
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="font-bold text-slate-600 block text-xs">Judul Elemen</label>
                              <input
                                type="text"
                                value={editingSectionForm.title}
                                onChange={(e) => setEditingSectionForm({ ...editingSectionForm, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-bold text-slate-800"
                                placeholder={`Judul default: ${sect.label}`}
                              />
                            </div>
                          )}

                          {sect.id === "hero" && (
                            <>
                              <div className="space-y-1.5">
                                <label className="font-bold text-slate-600 block text-xs">Sub-Judul (Subtitle)</label>
                                <input
                                  type="text"
                                  value={editingSectionForm.subtitle}
                                  onChange={(e) => setEditingSectionForm({ ...editingSectionForm, subtitle: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-semibold"
                                  placeholder="Sub-judul atau tagline heros..."
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-bold text-slate-600 block text-xs">Teks Lencana (Badge Text)</label>
                                <input
                                  type="text"
                                  value={editingSectionForm.badgeText}
                                  onChange={(e) => setEditingSectionForm({ ...editingSectionForm, badgeText: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-bold"
                                  placeholder="e.g. PORTAL DIGITAL RESMI"
                                />
                              </div>
                            </>
                          )}

                          {sect.id === "news_quote" && (
                            <>
                              <div className="space-y-1.5">
                                <label className="font-bold text-slate-600 block text-xs">Judul Kolom Hikmah/Kutipan</label>
                                <input
                                  type="text"
                                  value={editingSectionForm.quoteTitle}
                                  onChange={(e) => setEditingSectionForm({ ...editingSectionForm, quoteTitle: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-bold"
                                  placeholder="e.g. RUANG INSPIRASI MGMP"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-bold text-slate-600 block text-xs">Penjelasan Kolom Hikmah</label>
                                <input
                                  type="text"
                                  value={editingSectionForm.quoteDescription}
                                  onChange={(e) => setEditingSectionForm({ ...editingSectionForm, quoteDescription: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-semibold"
                                  placeholder="Deskripsi kecil di atas box kutipan..."
                                />
                              </div>
                            </>
                          )}

                          {sect.id !== "siladik" && (
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="font-bold text-slate-600 block text-xs">Deskripsi / Teks Penjelasan</label>
                              <textarea
                                value={editingSectionForm.description}
                                onChange={(e) => setEditingSectionForm({ ...editingSectionForm, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs leading-relaxed"
                                placeholder="Teks keterangan tambahan yang terpampang di bawah judul..."
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(null)}
                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveSectionEdits}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow"
                          >
                            Terapkan & Simpan Konten
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Custom Sections Configuration */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  c. Kelola Bagian Halaman Kustom (Custom Sections)
                </h3>
                <p className="text-xs text-slate-400 font-medium">Buat bagian teks, panduan baru, pengumuman eksternal, atau media tambahan di halaman beranda secara bebas.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomIndex(null);
                  setCustomSectionForm({ title: "", content: "", imageUrl: "", visible: true });
                  setIsCustomSectionModalOpen(true);
                }}
                className="bg-emerald-800 hover:bg-emerald-700 duration-200 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Buat Bagian Kustom Baru
              </button>
            </div>

            {/* List of custom sections */}
            {layoutCustomSections.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-semibold italic text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada bagian halaman kustom yang dibuat. Tekan tombol di atas untuk menambahkannya!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layoutCustomSections.map((c, index) => (
                  <div key={c.id || index} className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          c.visible !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-550/10 text-red-650"
                        }`}>
                          {c.visible !== false ? "Tampil" : "Disembunyikan"}
                        </span>
                        
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCustomVisibility(index)}
                            className="p-1 text-slate-500 hover:bg-slate-50 border rounded-lg"
                            title="Tutup/Buka Kunci Tampil"
                          >
                            {c.visible !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomIndex(index);
                              setCustomSectionForm({
                                title: c.title || "",
                                content: c.content || "",
                                imageUrl: c.imageUrl || "",
                                visible: c.visible !== false
                              });
                              setIsCustomSectionModalOpen(true);
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg cursor-pointer"
                            title="Edit Bagian"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomSection(index)}
                            className="p-1 text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg cursor-pointer"
                            title="Hapus Bagian"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{c.title}</h4>
                      {c.imageUrl && (
                        <div className="w-full h-24 rounded-lg bg-slate-100 overflow-hidden border">
                          <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap font-medium">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Section Modals */}
          {isCustomSectionModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-150 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-emerald-900 text-white p-5 flex justify-between items-center shrink-0">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-300" />
                    {editingCustomIndex !== null ? "Edit Bagian Kustom" : "Buat Bagian Kustom Baru"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCustomSectionModalOpen(false)}
                    className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-grow text-left text-xs sm:text-sm">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 block">Judul Bagian Halaman *</label>
                    <input
                      type="text"
                      value={customSectionForm.title}
                      onChange={(e) => setCustomSectionForm({ ...customSectionForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800 font-bold"
                      placeholder="Contoh: Jadwal Pembinaan Agama Triwulanan"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 block">Link URL Gambar Ilustrasi (Opsional)</label>
                    <input
                      type="url"
                      value={customSectionForm.imageUrl}
                      onChange={(e) => setCustomSectionForm({ ...customSectionForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800 font-mono text-xs"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-700 block">Isi Konten Bagian Kustom *</label>
                    <textarea
                      value={customSectionForm.content}
                      onChange={(e) => setCustomSectionForm({ ...customSectionForm, content: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50 text-slate-800 leading-relaxed font-sans"
                      placeholder="Tulis penjelasan lengkap bagian kustom di sini..."
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="customSectionVisible"
                      checked={customSectionForm.visible}
                      onChange={(e) => setCustomSectionForm({ ...customSectionForm, visible: e.target.checked })}
                      className="w-4 h-4 text-emerald-650 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="customSectionVisible" className="text-xs text-slate-600 font-bold cursor-pointer select-none">
                      Tampilkan bagian ini secara publik di Halaman Beranda langsung
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end p-4 border-t border-slate-100 shrink-0 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsCustomSectionModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomSection}
                    className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-black shadow border border-emerald-900"
                  >
                    Simpan & Tampilkan
                  </button>
                </div>
              </div>
            </div>
          )}
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
