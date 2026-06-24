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

