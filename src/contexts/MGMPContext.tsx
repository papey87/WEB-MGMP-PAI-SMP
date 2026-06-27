import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { NewsItem, ArticleItem, MGMPEvent } from "../types";

// Type definitions for context
interface MGMPContextType {
  // News
  news: NewsItem[];
  newsLoading: boolean;
  addNews: (data: Omit<NewsItem, "id">) => Promise<void>;
  updateNews: (id: string, data: Partial<NewsItem>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;

  // Articles
  articles: ArticleItem[];
  articlesLoading: boolean;
  addArticle: (data: Omit<ArticleItem, "id">) => Promise<void>;
  updateArticle: (id: string, data: Partial<ArticleItem>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;

  // Events
  events: MGMPEvent[];
  eventsLoading: boolean;
  updateEvent: (id: string, data: Partial<MGMPEvent>) => Promise<void>;

  // Layout
  layoutConfig: {
    tabs: any[];
    homeSections: any[];
    customSections: any[];
  };
  layoutLoading: boolean;
  updateLayout: (data: Partial<any>) => Promise<void>;

  // Announcement
  announcement: {
    text: string;
    badgeText: string;
    actionUrl: string;
    actionType: "apk" | "link" | "none";
    blinking: boolean;
  };
  updateAnnouncement: (data: Partial<any>) => Promise<void>;

  // Refresh functions
  refreshNews: () => void;
  refreshArticles: () => void;
  refreshEvents: () => void;
}

const defaultAnnouncement = {
  text: "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.",
  badgeText: "INFO PENTING",
  actionUrl: "",
  actionType: "apk" as const,
  blinking: true
};

const defaultLayoutConfig = {
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
  customSections: []
};

// Create context with default values
const MGMPContext = createContext<MGMPContextType | null>(null);

// Provider component
export function MGMPProvider({ children }: { children: ReactNode }) {
  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsVersion, setNewsVersion] = useState(0);

  // Articles state
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesVersion, setArticlesVersion] = useState(0);

  // Events state
  const [events, setEvents] = useState<MGMPEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsVersion, setEventsVersion] = useState(0);

  // Layout state
  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);
  const [layoutLoading, setLayoutLoading] = useState(true);

  // Announcement state
  const [announcement, setAnnouncement] = useState(defaultAnnouncement);

  // News real-time listener
  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: NewsItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as NewsItem);
      });

      if (list.length > 0) {
        setNews(list);
        // Cache to localStorage
        try {
          localStorage.setItem("mgmp_pai_news_cache", JSON.stringify(list));
        } catch (e) {}
      } else {
        // Load from cache if empty
        const cached = localStorage.getItem("mgmp_pai_news_cache");
        if (cached) {
          setNews(JSON.parse(cached));
        }
      }
      setNewsLoading(false);
    }, (err) => {
      console.error("News sync error:", err);
      setNewsLoading(false);

      // Fallback to cache
      const cached = localStorage.getItem("mgmp_pai_news_cache");
      if (cached) {
        setNews(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, [newsVersion]);

  // Articles real-time listener
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
          localStorage.setItem("mgmp_pai_articles_cache", JSON.stringify(list));
        } catch (e) {}
      } else {
        const cached = localStorage.getItem("mgmp_pai_articles_cache");
        if (cached) {
          setArticles(JSON.parse(cached));
        }
      }
      setArticlesLoading(false);
    }, (err) => {
      console.error("Articles sync error:", err);
      setArticlesLoading(false);

      const cached = localStorage.getItem("mgmp_pai_articles_cache");
      if (cached) {
        setArticles(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, [articlesVersion]);

  // Events real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const list: MGMPEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MGMPEvent);
      });

      // Sort by id
      list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

      if (list.length > 0) {
        setEvents(list);
        try {
          localStorage.setItem("mgmp_pai_events_cache", JSON.stringify(list));
        } catch (e) {}
      } else {
        const cached = localStorage.getItem("mgmp_pai_events_cache");
        if (cached) {
          setEvents(JSON.parse(cached));
        }
      }
      setEventsLoading(false);
    }, (err) => {
      console.error("Events sync error:", err);
      setEventsLoading(false);

      const cached = localStorage.getItem("mgmp_pai_events_cache");
      if (cached) {
        setEvents(JSON.parse(cached));
      }
    });

    return () => unsub();
  }, [eventsVersion]);

  // Layout settings listener
  useEffect(() => {
    const docRef = doc(db, "settings", "layout");

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLayoutConfig((prev) => ({
          tabs: data.tabs || prev.tabs,
          homeSections: data.homeSections || prev.homeSections,
          customSections: data.customSections || prev.customSections
        }));

        try {
          localStorage.setItem("custom_layout_config", JSON.stringify({
            tabs: data.tabs || defaultLayoutConfig.tabs,
            homeSections: data.homeSections || defaultLayoutConfig.homeSections,
            customSections: data.customSections || []
          }));
        } catch (e) {}
      }
      setLayoutLoading(false);
    }, (err) => {
      console.error("Layout settings sync error:", err);
      setLayoutLoading(false);

      // Load from cache
      const cached = localStorage.getItem("custom_layout_config");
      if (cached) {
        const parsed = JSON.parse(cached);
        setLayoutConfig((prev) => ({ ...prev, ...parsed }));
      }
    });

    return () => unsub();
  }, []);

  // Announcement listener
  useEffect(() => {
    const docRef = doc(db, "settings", "announcement");

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = {
          text: data.text || defaultAnnouncement.text,
          badgeText: data.badgeText || defaultAnnouncement.badgeText,
          actionUrl: data.actionUrl || "",
          actionType: data.actionType || "apk",
          blinking: data.blinking !== undefined ? data.blinking : true
        };
        setAnnouncement(updated);

        try {
          localStorage.setItem("mgmp_pai_announcement", JSON.stringify(updated));
        } catch (e) {}
      }
    }, (err) => {
      console.error("Announcement sync error:", err);

      const cached = localStorage.getItem("mgmp_pai_announcement");
      if (cached) {
        setAnnouncement({ ...defaultAnnouncement, ...JSON.parse(cached) });
      }
    });

    return () => unsub();
  }, []);

  // CRUD operations
  const addNews = async (data: Omit<NewsItem, "id">) => {
    await addDoc(collection(db, "news"), { ...data, createdAt: serverTimestamp() });
  };

  const updateNews = async (id: string, data: Partial<NewsItem>) => {
    await updateDoc(doc(db, "news", id), data);
  };

  const deleteNews = async (id: string) => {
    await deleteDoc(doc(db, "news", id));
  };

  const addArticle = async (data: Omit<ArticleItem, "id">) => {
    await addDoc(collection(db, "articles"), { ...data, createdAt: serverTimestamp() });
  };

  const updateArticle = async (id: string, data: Partial<ArticleItem>) => {
    await updateDoc(doc(db, "articles", id), data);
  };

  const deleteArticle = async (id: string) => {
    await deleteDoc(doc(db, "articles", id));
  };

  const updateEvent = async (id: string, data: Partial<MGMPEvent>) => {
    await updateDoc(doc(db, "events", id), data);
  };

  const updateLayout = async (data: Partial<any>) => {
    await setDoc(doc(db, "settings", "layout"), data, { merge: true });
  };

  const updateAnnouncement = async (data: Partial<any>) => {
    await setDoc(doc(db, "settings", "announcement"), data, { merge: true });
  };

  // Refresh functions (trigger re-fetch by incrementing version)
  const refreshNews = () => setNewsVersion((v) => v + 1);
  const refreshArticles = () => setArticlesVersion((v) => v + 1);
  const refreshEvents = () => setEventsVersion((v) => v + 1);

  const value: MGMPContextType = {
    news,
    newsLoading,
    addNews,
    updateNews,
    deleteNews,

    articles,
    articlesLoading,
    addArticle,
    updateArticle,
    deleteArticle,

    events,
    eventsLoading,
    updateEvent,

    layoutConfig,
    layoutLoading,
    updateLayout,

    announcement,
    updateAnnouncement,

    refreshNews,
    refreshArticles,
    refreshEvents
  };

  return (
    <MGMPContext.Provider value={value}>
      {children}
    </MGMPContext.Provider>
  );
}

// Custom hook to use the context
export function useMGMP() {
  const context = useContext(MGMPContext);
  if (!context) {
    throw new Error("useMGMP must be used within an MGMPProvider");
  }
  return context;
}

// Convenience hooks for specific data
export function useNewsData() {
  const { news, newsLoading, addNews, updateNews, deleteNews, refreshNews } = useMGMP();
  return { news, loading: newsLoading, addNews, updateNews, deleteNews, refreshNews };
}

export function useArticlesData() {
  const { articles, articlesLoading, addArticle, updateArticle, deleteArticle, refreshArticles } = useMGMP();
  return { articles, loading: articlesLoading, addArticle, updateArticle, deleteArticle, refreshArticles };
}

export function useEventsData() {
  const { events, eventsLoading, updateEvent, refreshEvents } = useMGMP();
  return { events, loading: eventsLoading, updateEvent, refreshEvents };
}

export function useLayoutData() {
  const { layoutConfig, layoutLoading, updateLayout } = useMGMP();
  return { layoutConfig, loading: layoutLoading, updateLayout };
}

export function useAnnouncementData() {
  const { announcement, updateAnnouncement } = useMGMP();
  return { announcement, updateAnnouncement };
}
