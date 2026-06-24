import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ArticleItem } from "../types";
import { 
  FileText, 
  User, 
  School, 
  Calendar, 
  PenTool, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  ArrowRight,
  ChevronRight,
  BookMarked,
  Sparkles,
  ChevronLeft,
  Plus,
  X
} from "lucide-react";

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
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial seed articles in Indonesian to make the screen look populated and interesting on first load
export const SEED_ARTICLES: ArticleItem[] = [
  {
    id: "seed-1",
    nama: "Hj. Siti Aminah, S.Ag.",
    asalSekolah: "SMP Negeri 1 Subang",
    tanggalPenulisan: "2026-06-24",
    judul: "Membangun Karakter Qur'ani Melalui Pembiasaan Literasi Pagi",
    isi: "Menanamkan kecintaan pada Al-Qur'an tidak cukup hanya melalui jam pelajaran PAI yang terbatas di kelas. Di SMP Negeri 1 Subang, kami menginisiasi gerakan 'Literasi Qur'an Pagi' selama 15 menit sebelum kegiatan belajar mengajar dimulai.\n\nSetiap siswa dibimbing untuk membaca satu halaman Al-Qur'an beserta artinya, dilanjutkan dengan ulasan singkat mengenai kandungan ayat oleh guru kelas atau perwakilan siswa secara bergantian. Hasilnya sangat luar biasa; suasana belajar menjadi lebih tenang, konsentrasi siswa meningkat, dan yang terpenting, kedisiplinan serta akhlak mulia tumbuh secara natural di kalangan siswa.\n\nBagi rekan-rekan guru yang ingin memulai, mulailah dari hal kecil, konsisten (istiqomah), dan berikan teladan terbaik.",
    createdAt: new Date()
  },
  {
    id: "seed-2",
    nama: "Feri Gunawan, M.Pd.I.",
    asalSekolah: "SMP Al-Islam Subang",
    tanggalPenulisan: "2026-06-20",
    judul: "Pemanfaatan Media Pembelajaran Interaktif untuk Meningkatkan Minat Belajar Tarikh",
    isi: "Pelajaran Sejarah Peradaban Islam (Tarikh) seringkali dianggap membosankan oleh sebagian siswa karena metode penyampaian yang cenderung monoton dan hafalan.\n\nUntuk mengatasi hal ini, kami mencoba mengemas kisah-kisah keteladanan para Nabi dan sahabat menggunakan media interaktif seperti garis waktu digital, peta perjalanan interaktif, dan kuis gamifikasi interaktif. Ketika siswa diajak 'berpetualang' menelusuri rute hijrah Rasulullah secara visual melalui peta interaktif, antusiasme mereka meningkat pesat.\n\nMari kita ubah cara pandang siswa terhadap Tarikh. Sejarah bukan sekadar masa lalu, melainkan lentera berharga untuk melangkah ke masa depan.",
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: "seed-3",
    nama: "Drs. Ahmad Hidayat",
    asalSekolah: "SMP Negeri 2 Jalancagak",
    tanggalPenulisan: "2026-06-15",
    judul: "Pentingnya Sinergi Guru PAI dan Orang Tua dalam Mengawal Ibadah Siswa di Rumah",
    isi: "Pendidikan Agama Islam tidak boleh berhenti di gerbang sekolah. Apa yang dipelajari siswa tentang shalat, kejujuran, dan kesantunan harus teraplikasikan di rumah.\n\nOleh karena itu, kami di SMP Negeri 2 Jalancagak merancang 'Jurnal Kemitraan Ibadah digital' sederhana. Melalui jurnal ini, orang tua dapat mengonfirmasi aktivitas ibadah harian anak, sementara guru memberikan apresiasi serta bimbingan berkala.\n\nSinergi yang erat antara sekolah dan rumah adalah kunci utama kesuksesan pembentukan karakter anak didik kita.",
    createdAt: new Date(Date.now() - 86400000 * 2)
  }
];

interface ArtikelTabProps {
  selectedArticle?: ArticleItem | null;
  setSelectedArticle?: (article: ArticleItem | null) => void;
  initialFormOpen?: boolean;
  formPreset?: { title: string; content: string } | null;
  onClearPreset?: () => void;
}

export default function ArtikelTab({ 
  selectedArticle: propSelectedArticle, 
  setSelectedArticle: propSetSelectedArticle,
  initialFormOpen,
  formPreset,
  onClearPreset
}: ArtikelTabProps = {}) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedArticle, setLocalSelectedArticle] = useState<ArticleItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(initialFormOpen ?? false);

  const selectedArticle = propSelectedArticle !== undefined ? propSelectedArticle : localSelectedArticle;
  const setSelectedArticle = propSetSelectedArticle !== undefined ? propSetSelectedArticle : setLocalSelectedArticle;

  useEffect(() => {
    if (initialFormOpen !== undefined) {
      setIsFormOpen(initialFormOpen);
    }
  }, [initialFormOpen]);

  // Smooth scroll to form when opened
  useEffect(() => {
    if (isFormOpen) {
      setTimeout(() => {
        const element = document.getElementById("write-article-form-container");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);
    }
  }, [isFormOpen]);

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    asalSekolah: "",
    tanggalPenulisan: new Date().toISOString().split('T')[0],
    judul: "",
    isi: ""
  });

  useEffect(() => {
    if (formPreset) {
      setFormData((prev) => ({
        ...prev,
        judul: formPreset.title,
        isi: formPreset.content
      }));
      setIsFormOpen(true);
      if (onClearPreset) {
        onClearPreset();
      }
    }
  }, [formPreset, onClearPreset]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load articles from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: ArticleItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ArticleItem);
      });
      // Fallback to seed articles if Firestore collection is empty
      if (list.length > 0) {
        setArticles(list);
      } else {
        setArticles(SEED_ARTICLES);
      }
    }, (err) => {
      console.warn("Firestore listen to articles failed, using seed data:", err);
      setArticles(SEED_ARTICLES);
    });

    return () => unsub();
  }, []);

  // Handle article submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.asalSekolah || !formData.tanggalPenulisan || !formData.judul || !formData.isi) {
      setSubmitError("Harap isi semua kolom formulir dengan lengkap.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const payload = {
        nama: formData.nama.trim(),
        asalSekolah: formData.asalSekolah.trim(),
        tanggalPenulisan: formData.tanggalPenulisan,
        judul: formData.judul.trim(),
        isi: formData.isi.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "articles"), payload);

      setSubmitSuccess(true);
      setFormData({
        nama: "",
        asalSekolah: "",
        tanggalPenulisan: new Date().toISOString().split('T')[0],
        judul: "",
        isi: ""
      });

      // Clear success alert after 4 seconds
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError("Gagal mengirimkan artikel. Silakan coba kembali beberapa saat lagi.");
      handleFirestoreError(err, OperationType.WRITE, "articles");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter articles based on search query
  const filteredArticles = articles.filter(article => 
    article.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.asalSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.isi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="articles-section" className="space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <section id="articles-hero" className="relative overflow-hidden rounded-3xl bg-[#0e744c] text-white shadow-xl border border-emerald-800 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500 rounded-full opacity-10 blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative max-w-4xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Kolom Berbagi Nasihat & Literasi Guru PAI
          </span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            Berbagi Nasihat & Belajar Menulis Artikel
          </h1>
          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-medium">
            Wadah belajar menuangkan pemikiran, ide kreatif, praktik baik (best practices) pembelajaran, dan nasihat hikmah kebaikan untuk kemajuan guru PAI SMP se-Kabupaten Subang.
          </p>
        </div>
      </section>

      {/* 2. Main Split View Layout */}
      {selectedArticle ? (
        /* Reading Full Article Mode */
        <article id="article-reader" className="max-w-3xl mx-auto space-y-6 bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
          <button
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-all hover:bg-slate-100 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Daftar Artikel
          </button>

          <div className="border-b border-slate-100 pb-6 space-y-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {selectedArticle.judul}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>{selectedArticle.nama}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <School className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedArticle.asalSekolah}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedArticle.tanggalPenulisan}</span>
              </div>
            </div>
          </div>

          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
            {selectedArticle.isi}
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/60 mt-8 flex items-start gap-3.5">
            <BookMarked className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Hikmah Literasi Guru</h4>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                "Mengikat ilmu dengan tulisan adalah bukti kepedulian guru terhadap keberlanjutan peradaban umat. Terima kasih atas nasihat dan inspirasi yang telah dibagikan."
              </p>
            </div>
          </div>
        </article>
      ) : (
        /* Grid Layout: Left Feed, Right Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Feed Column */}
          <div className={`${isFormOpen ? "lg:col-span-7" : "lg:col-span-12"} space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    Kumpulan Nasihat & Karya Tulis
                  </h2>
                  {!isFormOpen && (
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ml-1 animate-pulse"
                      title="Berbagi Nasihat"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Berbagi Nasihat</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#000000]">Mutiara ilmu dan gagasan kreatif dari para guru PAI</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Cari artikel/penulis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white shadow-sm transition-all text-slate-700"
                />
              </div>
            </div>

            {/* List of Articles */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <PenTool className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm font-medium">Belum ada artikel yang cocok dengan pencarian Anda.</p>
                <p className="text-xs text-slate-400">Jadilah yang pertama menulis nasihat kebaikan di kolom kanan!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id || Math.random().toString()}
                    onClick={() => setSelectedArticle(article)}
                    className="group bg-white p-6 rounded-2xl border border-slate-150/50 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100/60 uppercase tracking-wider">
                          Kolom Guru
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{article.tanggalPenulisan}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base md:text-lg group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                        {article.judul}
                      </h3>

                      <p className="text-slate-500 text-xs md:text-sm line-clamp-3 leading-relaxed font-normal">
                        {article.isi}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {article.nama.charAt(0)}
                        </div>
                        <div className="leading-tight">
                          <p className="font-semibold text-slate-700">{article.nama}</p>
                          <p className="text-[10px] text-slate-400">{article.asalSekolah}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                        Baca Selengkapnya
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Column */}
          {isFormOpen && (
            <div id="write-article-form-container" className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-150/50 p-6 md:p-8 shadow-sm space-y-6 sticky top-28 animate-fade-in">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Berbagi Nasihat</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Salurkan ide inspiratif Anda untuk dipelajari dan dibaca oleh seluruh guru PAI SMP di Kabupaten Subang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                    title="Tutup Formulir"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Submit Feedback Alerts */}
                  {submitSuccess && (
                    <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Artikel Berhasil Dikirim!</p>
                        <p className="text-[11px] text-emerald-700">Terima kasih telah berbagi nasihat dan inspirasi kebaikan.</p>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="font-medium">{submitError}</p>
                    </div>
                  )}

                  {/* Nama Guru */}
                  <div className="space-y-1">
                    <label htmlFor="nama" className="block text-xs font-bold text-slate-700">
                      Nama Lengkap Penulis <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="nama"
                        required
                        placeholder="Contoh: Ahmad Fauzi, S.Pd.I."
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Asal Sekolah */}
                  <div className="space-y-1">
                    <label htmlFor="asalSekolah" className="block text-xs font-bold text-slate-700">
                      Asal Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <School className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="asalSekolah"
                        required
                        placeholder="Contoh: SMP Negeri 1 Subang"
                        value={formData.asalSekolah}
                        onChange={(e) => setFormData({ ...formData, asalSekolah: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Tanggal Penulisan */}
                  <div className="space-y-1">
                    <label htmlFor="tanggalPenulisan" className="block text-xs font-bold text-slate-700">
                      Tanggal Penulisan <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="date"
                        id="tanggalPenulisan"
                        required
                        value={formData.tanggalPenulisan}
                        onChange={(e) => setFormData({ ...formData, tanggalPenulisan: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 font-sans"
                      />
                    </div>
                  </div>

                  {/* Judul Artikel */}
                  <div className="space-y-1">
                    <label htmlFor="judul" className="block text-xs font-bold text-slate-700">
                      Judul Nasihat / Artikel <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FileText className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        id="judul"
                        required
                        placeholder="Contoh: Mengembangkan Akhlak Mulia Siswa"
                        value={formData.judul}
                        onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Isi Nasihat */}
                  <div className="space-y-1">
                    <label htmlFor="isi" className="block text-xs font-bold text-slate-700">
                      Isi Nasihat / Artikel <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="isi"
                      required
                      rows={6}
                      placeholder="Tulis artikel atau nasihat Anda secara rinci dan terstruktur di sini..."
                      value={formData.isi}
                      onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                      className="w-full p-4 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0e744c] hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sedang Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <PenTool className="w-4 h-4" />
                        <span>Publikasikan Nasihat</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
