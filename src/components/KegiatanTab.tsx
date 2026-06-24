import React, { useState, useEffect } from "react";
import { MGMPEvent } from "../types";
import { 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  CheckCircle,
  Clock,
  Ticket,
  AlertOctagon,
  X,
  Printer,
  FileCheck
} from "lucide-react";

const INITIAL_EVENTS: MGMPEvent[] = [
  {
    id: "evt-1",
    title: "Workshop Nasional: Penyusunan Modul Ajar Paradigma Kurikulum Merdeka",
    description: "Pembimbingan mandiri dan kolaboratif menyusun perangkat ajar Fase D Pendidikan Agama Islam (PAI) untuk semester ganjil tahun pelajaran baru. Dilengkapi dengan e-sertifikat 32 JP.",
    date: "Sabtu, 11 Juli 2026",
    time: "08:00 - 15:00 WIB",
    location: "Aula Dinas Pendidikan / Meeting room (Zoom)",
    speaker: "Prof. Dr. H. Muhaimin, M.A. (Pelatih Nasional Pusdiklat Kemenag)",
    quota: 100,
    registeredCount: 84,
    status: "Mendatang",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400",
    category: "Workshop"
  },
  {
    id: "evt-2",
    title: "Silahturahmi Akbar & Launching Platform Digital Edu-PAI SMP",
    description: "Kegiatan rutin sosialiasi program kerja tahunan kepengurusan MGMP baru, sekaligus peluncuran fitur asisten kecerdasan buatan 'AI Sobat Guru' untuk pembantu asesmen kelas.",
    date: "Rabu, 24 Juni 2026",
    time: "09:00 - 12:00 WIB",
    location: "Gedung Serbaguna Masjid Agung Al-Akbar",
    speaker: "Drs. H. M. Yusuf, M.Pd.I. (Kakanwil Kemenag Provinsi)",
    quota: 250,
    registeredCount: 247,
    status: "Mendatang",
    banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400",
    category: "Agenda Lainnya"
  },
  {
    id: "evt-3",
    title: "Bimtek Pemanfaatan Canva & AI dalam Pembuatan Media Syiar Kelas VII",
    description: "Bimbingan teknik intensif bagi guru-guru bidang IT untuk merangkai video interaktif kisah sahabat nabi dan sejarah peradaban islam yang menarik minat generasi milenial.",
    date: "Kamis, 09 Juli 2026",
    time: "13:00 - 16:30 WIB",
    location: "Laboratorium Komputer SMAN / Virtual Meet",
    speaker: "Zainal Abidin, S.Pd.I. (Kabid Media & IT MGMP)",
    quota: 50,
    registeredCount: 50,
    status: "Penuh",
    banner: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400",
    category: "Workshop"
  },
  {
    id: "evt-4",
    title: "Lomba MAPSI (Seni Pidato & Kaligrafi) Tingkat SMP Se-Kota",
    description: "Penyelenggaraan festival akbar tahunan Musabaqah Azan, Kaligrafi, Pidato Islami, dan Tilawah Qur'an bagi siswa/siswi utusan SMP negeri maupun swasta sebagai tolak ukur prestasi keislaman.",
    date: "Sabtu, 30 Mei 2026",
    time: "07:30 - selesai",
    location: "Kampus SMP Swasta Terpadu Khairul Ummah",
    speaker: "Panitia Pelaksana Bidang Kesiswaan MGMP",
    quota: 300,
    registeredCount: 300,
    status: "Selesai",
    banner: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=400",
    category: "Pentas PAI"
  },
  {
    id: "evt-5",
    title: "Pentas PAI Tingkat Kabupaten Subang - Festival Keterampilan & Seni Islam",
    description: "Perlombaan seni rebana, cerdas cermat islam, kaligrafi, pidato dai cilik, dan musabaqah hifdzil qur'an (MHQ) antar SMP se-Kabupaten Subang.",
    date: "Sabtu, 18 Juli 2026",
    time: "07:00 - 17:00 WIB",
    location: "Aula Kankemenag Kabupaten Subang",
    speaker: "Tim Juri Kesiswaan & Kasi PAIS Kemenag",
    quota: 150,
    registeredCount: 110,
    status: "Mendatang",
    banner: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=400",
    category: "Pentas PAI"
  }
];

export default function KegiatanTab() {
  const [events, setEvents] = useState<MGMPEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState<"Semua" | "Pentas PAI" | "Workshop" | "Agenda Lainnya">("Semua");
  const [selectedEventUrl, setSelectedEventUrl] = useState<MGMPEvent | null>(null);

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    type: "warning" | "success" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (type: "warning" | "success" | "info", title: string, message: string) => {
    setCustomAlert({ type, title, message });
  };

  // Registration modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerEvent, setRegisterEvent] = useState<MGMPEvent | null>(null);
  const [inputName, setInputName] = useState("");
  const [inputNuptk, setInputNuptk] = useState("");
  const [inputWhatsapp, setInputWhatsapp] = useState("");
  const [inputSchool, setInputSchool] = useState("");

  // Post-registration ticket state
  const [showNotification, setShowNotification] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{
    id: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    participantName: string;
    nuptk: string;
    school: string;
    ticketCode: string;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mgmp_pai_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents(INITIAL_EVENTS);
      }
    } else {
      setEvents(INITIAL_EVENTS);
      localStorage.setItem("mgmp_pai_events", JSON.stringify(INITIAL_EVENTS));
    }
  }, []);

  const handleOpenRegister = (event: MGMPEvent) => {
    if (event.status === "Selesai") {
      showAlert("warning", "Kegiatan Selesai", "Acara ini telah selesai dilaksanakan. Silakan pilih agenda mendatang.");
      return;
    }
    if (event.status === "Penuh" || event.registeredCount >= event.quota) {
      showAlert("warning", "Kuota Penuh", "Maaf, kuota peserta untuk acara ini telah penuh.");
      return;
    }
    setRegisterEvent(event);
    setIsRegisterOpen(true);
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputSchool.trim() || !inputWhatsapp.trim()) {
      showAlert("warning", "Data Belum Lengkap", "Mohon lengkapi formulir pendaftaran.");
      return;
    }

    if (!registerEvent) return;

    // Increment registeredCount and update localStorage
    const updatedEvents = events.map((ev) => {
      if (ev.id === registerEvent.id) {
        const newCount = ev.registeredCount + 1;
        const newStatus = newCount >= ev.quota ? "Penuh" as const : ev.status;
        return { ...ev, registeredCount: newCount, status: newStatus };
      }
      return ev;
    });

    setEvents(updatedEvents);
    localStorage.setItem("mgmp_pai_events", JSON.stringify(updatedEvents));

    // Generate unique ticketing reference for authenticity
    const randomCode = "MGMP-PAI-" + Math.floor(100000 + Math.random() * 900000);
    const generatedTicket = {
      id: "tix-" + Date.now(),
      eventTitle: registerEvent.title,
      eventDate: registerEvent.date,
      eventLocation: registerEvent.location,
      participantName: inputName.trim(),
      nuptk: inputNuptk.trim() || "Tidak Memiliki/GTT",
      school: inputSchool.trim(),
      ticketCode: randomCode
    };

    setCreatedTicket(generatedTicket);
    setIsRegisterOpen(false);

    // Keep ticket data in memory for review
    setShowNotification(true);

    // Reset inputs
    setInputName("");
    setInputNuptk("");
    setInputWhatsapp("");
    setInputSchool("");
  };

  const triggerPrint = () => {
    showAlert("success", "Mencetak Tanda Bukti", `Menginisiasi cetak tanda bukti kepesertaan... Tiket dengan Kode: ${createdTicket?.ticketCode} siap dicetak. Mohon tunjukkan tanda bukti ini pada panitia saat registrasi kehadiran fisik.`);
  };

  const filteredEvents = events.filter((evt) => {
    if (activeCategory === "Semua") return true;
    return evt.category === activeCategory;
  });

  return (
    <div className="space-y-8">
      {/* Tab Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Agenda Kegiatan Guru PAI
          </h1>
          <p className="text-xs text-slate-500">
            Ikuti Bimtek, Rapat Pleno Kerja, Webinar Nasional, dan Seminar Keagamaan terbaru untuk mengasah kompetensi keprofesian
          </p>
        </div>
      </div>

      {/* Category selector row */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto shrink-0 pb-1 sm:pb-0">
          {(["Semua", "Pentas PAI", "Workshop", "Agenda Lainnya"] as const).map((cat) => {
            const isSelected = activeCategory === cat;
            const labelMap: Record<string, string> = {
              "Semua": "SEMUA KEGIATAN",
              "Pentas PAI": "PENTAS PAI",
              "Workshop": "WORKSHOP",
              "Agenda Lainnya": "AGENDA LAINNYA"
            };
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-150 hover:bg-slate-50"
                }`}
              >
                {labelMap[cat] || cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket Notification overlay info box */}
      {showNotification && createdTicket && (
        <section id="proof-panel" className="p-6 rounded-3xl bg-amber-50 border-2 border-dashed border-amber-300 relative space-y-5 animate-fade-in shadow-sm max-w-2xl mx-auto">
          <button 
            onClick={() => {
              setShowNotification(false);
              setCreatedTicket(null);
            }} 
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-850 bg-white p-1 rounded-full shadow border hover:shadow-md transition-colors"
            title="Sembunyikan"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Pendaftaran Berhasil Terkirim!</h3>
              <p className="text-xs text-slate-500">Silakan simpan kartu bukti registrasi Anda di bawah ini.</p>
            </div>
          </div>

          {/* Golden Ticket Layout block representation */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left section: Event Metadata */}
            <div className="p-6 md:w-3/5 space-y-4">
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border bg-clip-text font-bold uppercase tracking-wider">
                Kartu Peserta Resmi
              </span>
              <h4 className="font-bold text-slate-800 leading-tight text-sm md:text-base">
                {createdTicket.eventTitle}
              </h4>
              <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {createdTicket.eventDate}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {createdTicket.eventLocation}
                </p>
              </div>
            </div>

            {/* Right section: User Details & Ticket Code */}
            <div className="p-6 md:w-2/5 flex flex-col justify-between space-y-4 bg-slate-50/55">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">NAMA PESERTA:</p>
                <h5 className="font-extrabold text-slate-800 text-sm leading-tight uppercase">{createdTicket.participantName}</h5>
                <p className="text-xs text-slate-500">{createdTicket.school}</p>
                <p className="text-[10px] text-slate-400">NUPTK/GTT: {createdTicket.nuptk}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-400">KODE REGISTER:</p>
                  <p className="font-mono font-bold text-xs text-emerald-700">{createdTicket.ticketCode}</p>
                </div>
                <button
                  onClick={triggerPrint}
                  className="p-2 rounded-xl bg-white text-slate-600 hover:text-emerald-750 border border-slate-200 hover:border-emerald-250 shadow-sm active:scale-95 transition-all"
                  title="Cetak Tanda Buku"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Events List Row container */}
      <section id="events-feed" className="grid grid-cols-1 gap-6">
        {filteredEvents.map((evt) => {
          const isFull = evt.registeredCount >= evt.quota;
          const leftQuota = evt.quota - evt.registeredCount;

          return (
            <div 
              key={evt.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch"
            >
              {/* Event Image Banner box */}
              <div className="md:w-1/3 relative bg-slate-100 min-h-[180px]">
                <img 
                  src={evt.banner} 
                  alt={evt.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Event Status overlay tag */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                    evt.status === "Mendatang" 
                      ? "bg-emerald-600 text-white border-emerald-555" 
                      : evt.status === "Selesai" 
                      ? "bg-slate-350 text-slate-700 border-slate-200" 
                      : "bg-red-500 text-white border-red-444"
                  }`}>
                    {evt.status}
                  </span>
                </div>
              </div>

              {/* Event details block */}
              <div className="p-6 md:p-8 md:w-2/3 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium select-none">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      {evt.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      {evt.time}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-extrabold text-slate-800 leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="pt-2 text-xs text-slate-500 space-y-1 select-none">
                    <p>
                      🎙️ Narasumber / Pemateri: <strong className="text-slate-700 font-semibold">{evt.speaker}</strong>
                    </p>
                    <p>
                      📍 Tempat Pelaksanaan: <strong className="text-slate-700 font-semibold">{evt.location}</strong>
                    </p>
                  </div>
                </div>

                {/* Quota display statistics & registration action button row */}
                <div className="pt-5 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      Sisa Kuota: <strong className="text-emerald-700 font-bold">{leftQuota} kursi</strong> (dari {evt.quota})
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenRegister(evt)}
                    disabled={evt.status === "Selesai" || isFull}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      evt.status === "Selesai"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                        : isFull
                        ? "bg-red-50 text-red-400 cursor-not-allowed shadow-none"
                        : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-white hover:shadow-md active:scale-95"
                    }`}
                  >
                    {evt.status === "Selesai" 
                      ? "Kegiatan Selesai" 
                      : isFull 
                      ? "Kuota Penuh" 
                      : "Daftar Kegiatan Gratis"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Interactive registration form modal overlay */}
      {isRegisterOpen && registerEvent && (
        <div id="register-modal" className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between">
            {/* Modal header info */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-amber-50/20 flex items-center justify-between">
              <div className="space-y-0.5 select-none">
                <h3 className="font-extrabold text-base text-slate-800 inline-flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-600" />
                  Formulir Pendaftaran
                </h3>
                <p className="text-[11px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[320px]">
                  Agenda: {registerEvent.title}
                </p>
              </div>
              <button 
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-807"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registration Input Form elements */}
            <form onSubmit={submitRegister} className="p-6 space-y-4">
              {/* Participant Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap dan Gelar *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Muhammad Ruslan, S.Ag., M.Pd."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* School Instansi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Instansi / Unit Kerja SMP *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: SMP Negeri 2 Kota Baru"
                  value={inputSchool}
                  onChange={(e) => setInputSchool(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* Whatsapp */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nomor Whatsapp (Aktif) *</label>
                <input 
                  type="tel" 
                  placeholder="Contoh: 081234567890"
                  value={inputWhatsapp}
                  onChange={(e) => setInputWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* NUPTK */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">NUPTK atau Peg.ID (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Masukkan NUPTK (Kosongi jika guru honorer/GTT)"
                  value={inputNuptk}
                  onChange={(e) => setInputNuptk(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 bg-slate-50/50"
                />
              </div>

              {/* Notice conditions disclaimer */}
              <p className="text-[10px] text-slate-400 italic bg-amber-50/30 p-2.5 rounded-lg border border-amber-100/40">
                💡 Dengan mendaftar, panitia sekretariat MGMP PAI berwenang mengirimkan rincian tautan ruang virtual (Zoom) atau surat koordinasi resmi ke instansi kepala sekolah Anda.
              </p>

              {/* Footer control actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-500 hover:text-slate-800"
                >
                  Urungkan
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                >
                  Klaim Kursi Kepesertaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Dialogue */}
      {customAlert && (
        <div id="custom-alert-dialog" className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-2xl text-white shrink-0 ${
                customAlert.type === "warning" ? "bg-amber-500" : "bg-emerald-600"
              }`}>
                {customAlert.type === "warning" ? (
                  <AlertOctagon className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm md:text-base">{customAlert.title}</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold">
                  {customAlert.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="bg-slate-800 hover:bg-slate-900 active:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Dipahami
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
