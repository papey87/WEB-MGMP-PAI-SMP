export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  summary: string;
  content: string;
}

export interface TeacherResource {
  id: string;
  title: string;
  category: "Al-Qur'an Hadis" | "Aqidah Akhlak" | "Fiqih" | "Sejarah Peradaban Islam (Tarikh)" | "Umum / Kurikulum";
  grade: "7" | "8" | "9" | "Semua";
  type: "RPP/Modul Ajar" | "Silabus/Prota" | "LKPD" | "Media PPT" | "Kuis/Asesmen";
  fileSize: string;
  downloads: number;
  author: string;
  createdDate: string;
  isCustom?: boolean;
  fileUrl?: string;
}

export interface MGMPEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  quota: number;
  registeredCount: number;
  status: "Mendatang" | "Selesai" | "Penuh";
  banner: string;
  category?: "Pentas PAI" | "Workshop" | "Agenda Lainnya";
}

export interface ForumMessage {
  id: string;
  username: string;
  role: string;
  school: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface ArticleItem {
  id?: string;
  nama: string;
  asalSekolah: string;
  tanggalPenulisan: string;
  judul: string;
  isi: string;
  createdAt?: any;
}

// === Supabase Relational Schema Types ===

export interface SupabaseSettings {
  key: string;      // e.g. "profile"
  value: any;       // JSON structure with { visi, misi, tujuan, structure }
  updated_at?: string;
}

export interface SupabaseTeacher {
  id: string;       // Primary Key (UUID or text)
  nama: string;
  nip: string;
  nuptk: string;
  status: string;   // "PNS" | "PPPK" | "Non ASN"
  komisariat: string;
  sekolah: string;
  whatsapp: string;
  username?: string;
  password?: string;
  status_pembayaran?: string;
  iuran_bulanan?: string;
  iuranStatus?: string;
  created_at?: string;
}

/*
-- SQL DDL FOR SUPABASE (POSTGRESQL)
-- Salin dan jalankan script ini di SQL Editor Supabase Anda:

-- 1. Tabel Settings (Untuk menyimpan Visi, Misi, Tujuan, & Struktur Pengurus)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Guru PAI (Akses SIGAP PAI)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nip TEXT,
    nuptk TEXT,
    status TEXT NOT NULL,
    komisariat TEXT NOT NULL,
    sekolah TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    username TEXT UNIQUE,
    password TEXT,
    status_pembayaran TEXT DEFAULT 'Belum Bayar',
    iuran_bulanan TEXT DEFAULT 'Belum Bayar',
    "iuranStatus" TEXT DEFAULT 'Belum Bayar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Publikasi Berita / Pengumuman
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    image TEXT,
    summary TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Perangkat Ajar / Teacher Resource
CREATE TABLE IF NOT EXISTS public.teacher_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    grade TEXT NOT NULL,
    type TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    downloads INTEGER DEFAULT 0 NOT NULL,
    author TEXT NOT NULL,
    "createdDate" TEXT NOT NULL,
    "isCustom" BOOLEAN DEFAULT false,
    "fileUrl" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Agenda Kegiatan MGMP
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    speaker TEXT NOT NULL,
    quota INTEGER DEFAULT 100 NOT NULL,
    "registeredCount" INTEGER DEFAULT 0 NOT NULL,
    status TEXT NOT NULL,
    banner TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabel Pesan Forum Diskusi
CREATE TABLE IF NOT EXISTS public.forum_messages (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT,
    school TEXT,
    avatar TEXT,
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    likes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Artikel Karya Tulis Guru
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    "asalSekolah" TEXT NOT NULL,
    "tanggalPenulisan" TEXT NOT NULL,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
*/

