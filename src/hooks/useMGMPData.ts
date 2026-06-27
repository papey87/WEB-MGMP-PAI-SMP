import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  query,
  orderBy,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { NewsItem, ArticleItem, MGMPEvent } from "../types";

// News Hook - Real-time sync across all tabs
export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: NewsItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as NewsItem);
      });

      if (list.length > 0) {
        setNews(list);
        // Cache to localStorage for offline fallback
        try {
          localStorage.setItem("mgmp_pai_news", JSON.stringify(list));
        } catch (e) {
          console.warn("Failed to cache news:", e);
        }
      } else {
        // Try to load from localStorage if Firestore is empty
        const cached = localStorage.getItem("mgmp_pai_news");
        if (cached) {
          setNews(JSON.parse(cached));
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("News sync error:", err);
      setError(err.message);
      setLoading(false);

      // Fallback to localStorage on error
      const cached = localStorage.getItem("mgmp_pai_news");
      if (cached) {
        setNews(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, []);

  const addNews = async (newsData: Omit<NewsItem, "id">) => {
    const payload = {
      ...newsData,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "news"), payload);
  };

  const updateNews = async (id: string, newsData: Partial<NewsItem>) => {
    await updateDoc(doc(db, "news", id), newsData);
  };

  const deleteNews = async (id: string) => {
    await deleteDoc(doc(db, "news", id));
  };

  return { news, loading, error, addNews, updateNews, deleteNews };
}

// Articles Hook - Real-time sync across all tabs
export function useArticles() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ArticleItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ArticleItem);
      });

      if (list.length > 0) {
        setArticles(list);
        try {
          localStorage.setItem("mgmp_pai_articles", JSON.stringify(list));
        } catch (e) {
          console.warn("Failed to cache articles:", e);
        }
      } else {
        const cached = localStorage.getItem("mgmp_pai_articles");
        if (cached) {
          setArticles(JSON.parse(cached));
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Articles sync error:", err);
      setError(err.message);
      setLoading(false);

      const cached = localStorage.getItem("mgmp_pai_articles");
      if (cached) {
        setArticles(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, []);

  const addArticle = async (articleData: Omit<ArticleItem, "id">) => {
    const payload = {
      ...articleData,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "articles"), payload);
  };

  const updateArticle = async (id: string, articleData: Partial<ArticleItem>) => {
    await updateDoc(doc(db, "articles", id), articleData);
  };

  const deleteArticle = async (id: string) => {
    await deleteDoc(doc(db, "articles", id));
  };

  return { articles, loading, error, addArticle, updateArticle, deleteArticle };
}

// Events Hook - Real-time sync across all tabs
export function useEvents() {
  const [events, setEvents] = useState<MGMPEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const list: MGMPEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MGMPEvent);
      });

      // Sort by id or date
      list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

      if (list.length > 0) {
        setEvents(list);
        try {
          localStorage.setItem("mgmp_pai_events", JSON.stringify(list));
        } catch (e) {
          console.warn("Failed to cache events:", e);
        }
      } else {
        const cached = localStorage.getItem("mgmp_pai_events");
        if (cached) {
          setEvents(JSON.parse(cached));
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Events sync error:", err);
      setError(err.message);
      setLoading(false);

      const cached = localStorage.getItem("mgmp_pai_events");
      if (cached) {
        setEvents(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, []);

  const updateEvent = async (id: string, eventData: Partial<MGMPEvent>) => {
    await updateDoc(doc(db, "events", id), eventData);
  };

  return { events, loading, error, updateEvent };
}

// Layout Settings Hook - Real-time sync for UI configuration
export function useLayoutSettings() {
  const [layoutConfig, setLayoutConfig] = useState(() => {
    const defaultConfig = {
      tabs: [
        { id: "beranda", label: "Beranda", visible: true },
        { id: "profil", label: "Profil MGMP", visible: true },
        { id: "informasi", label: "Informasi", visible: true },
        { id: "kegiatan", label: "Agenda Kegiatan", visible: true },
        { id: "perangkat", label: "Perangkat Ajar", visible: true },
        { id: "artikel", label: "Artikel", visible: true },
        { id: "ai-sobat", label: "Tanya AI Sobat Guru", visible: true }
      ],
      homeSections: [
        { id: "hero", label: "Hero Banner", visible: true, order: 1, title: "", subtitle: "", description: "", badgeText: "" },
        { id: "siladik", label: "Sistem Informasi SILADIK", visible: true, order: 2, title: "" },
        { id: "advice", label: "Kolom Berbagi Nasihat / Tulisan Guru", visible: true, order: 3, title: "", description: "" },
        { id: "news_quote", label: "Berita, Pengumuman & Ruang Inspirasi", visible: true, order: 4, title: "", description: "", quoteTitle: "", quoteDescription: "" }
      ],
      customSections: [] as any[]
    };

    try {
      const saved = localStorage.getItem("custom_layout_config");
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return defaultConfig;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "settings", "layout");

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLayoutConfig((prev) => {
          const updated = {
            ...prev,
            tabs: data.tabs || prev.tabs,
            homeSections: data.homeSections || prev.homeSections,
            customSections: data.customSections || prev.customSections
          };

          try {
            localStorage.setItem("custom_layout_config", JSON.stringify(updated));
          } catch (e) {
            console.warn("Failed to cache layout:", e);
          }

          return updated;
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("Layout settings sync error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateLayout = async (updates: Partial<typeof layoutConfig>) => {
    await setDoc(doc(db, "settings", "layout"), updates, { merge: true });
  };

  return { layoutConfig, loading, updateLayout };
}

// Announcement Hook - Real-time sync for global announcements
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState(() => {
    const defaults = {
      text: "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.",
      badgeText: "INFO PENTING",
      actionUrl: "",
      actionType: "apk" as "apk" | "link" | "none",
      blinking: true
    };

    try {
      const saved = localStorage.getItem("mgmp_pai_announcement");
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch (e) {}
    return defaults;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "settings", "announcement");

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = {
          text: data.text || announcement.text,
          badgeText: data.badgeText || announcement.badgeText,
          actionUrl: data.actionUrl || "",
          actionType: data.actionType || "apk",
          blinking: data.blinking !== undefined ? data.blinking : true
        };
        setAnnouncement(updated);

        try {
          localStorage.setItem("mgmp_pai_announcement", JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to cache announcement:", e);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Announcement sync error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [announcement.text, announcement.badgeText]);

  const updateAnnouncement = async (updates: Partial<typeof announcement>) => {
    await setDoc(doc(db, "settings", "announcement"), updates, { merge: true });
  };

  return { announcement, loading, updateAnnouncement };
}

// Profile Settings Hook - Real-time sync for MGMP profile
export function useProfileSettings() {
  const [profile, setProfile] = useState({
    visi: "",
    misi: [] as string[],
    tujuan: [] as any[],
    structure: [] as any[]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "settings", "profile");

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile((prev) => ({
          visi: data.visi || prev.visi,
          misi: data.misi || prev.misi,
          tujuan: data.tujuan || prev.tujuan,
          structure: data.structure || prev.structure
        }));

        // Cache to localStorage
        try {
          if (data.visi) localStorage.setItem("mgmp_profile_visi", data.visi);
          if (data.misi) localStorage.setItem("mgmp_profile_misi", JSON.stringify(data.misi));
          if (data.tujuan) localStorage.setItem("mgmp_profile_tujuan", JSON.stringify(data.tujuan));
          if (data.structure) localStorage.setItem("mgmp_profile_structure", JSON.stringify(data.structure));
        } catch (e) {
          console.warn("Failed to cache profile:", e);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Profile settings sync error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateProfile = async (updates: Partial<typeof profile>) => {
    await setDoc(doc(db, "settings", "profile"), updates, { merge: true });
  };

  return { profile, loading, updateProfile };
}

// Teachers Hook - Real-time sync for SILADIK teacher data
export function useTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("nama", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      setTeachers(list);
      setLoading(false);
    }, (err) => {
      console.error("Teachers sync error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateTeacher = async (id: string, data: any) => {
    await updateDoc(doc(db, "users", id), data);
  };

  const addTeacher = async (data: any) => {
    const payload = {
      ...data,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, "users"), payload);
  };

  const deleteTeacher = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
  };

  return { teachers, loading, error, updateTeacher, addTeacher, deleteTeacher };
}
