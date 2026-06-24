import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

export interface TeacherData {
  id?: string;
  nama: string;
  nip: string;
  nuptk: string;
  status: "PNS" | "PPPK" | "Non ASN";
  komisariat: "jalancagak" | "subang" | "kalijati" | "pagaden" | "pamanukan" | "ciasem";
  sekolah: string;
  whatsapp: string;
  createdAt?: string;
  iuranStatus?: "Lunas" | "Belum Bayar";
  username?: string;
  password?: string;
  status_pembayaran?: "Lunas" | "Belum Bayar" | "Menunggak" | "Aktif";
  iuran_bulanan?: "Lunas" | "Belum Bayar" | "Menunggak" | "Aktif";
}

const DEFAULT_TEACHERS: TeacherData[] = [
  {
    nama: "H. Ahmad Fauzi, S.Ag., M.Pd.I.",
    nip: "197812052005011002",
    nuptk: "4321745648210032",
    status: "PNS",
    komisariat: "subang",
    sekolah: "SMP Negeri 1 Subang",
    whatsapp: "08123456789",
    username: "ahmad.fauzi",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Dr. Lailatul Badriyah, M.Pd.",
    nip: "198304122009042001",
    nuptk: "9876756658110043",
    status: "PPPK",
    komisariat: "subang",
    sekolah: "SMP Negeri 2 Subang",
    whatsapp: "08139876543",
    username: "lailatul",
    password: "sigap123",
    status_pembayaran: "Belum Bayar",
    iuran_bulanan: "Belum Bayar",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Nur Hidayat, S.Th.I., M.Pd.",
    nip: "198511202011021003",
    nuptk: "7654762263110052",
    status: "PPPK",
    komisariat: "jalancagak",
    sekolah: "SMP Negeri 1 Jalancagak",
    whatsapp: "08564231987",
    username: "nur.hidayat",
    password: "sigap123",
    status_pembayaran: "Menunggak",
    iuran_bulanan: "Menunggak",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Dra. Siti Aminah, M.A.",
    nip: "197108151998032001",
    nuptk: "1234749950110021",
    status: "PNS",
    komisariat: "pagaden",
    sekolah: "SMP Negeri 1 Pagaden",
    whatsapp: "08521122334",
    username: "siti.aminah",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Zainal Abidin, S.Pd.I.",
    nip: "",
    nuptk: "5543765566300012",
    status: "Non ASN",
    komisariat: "kalijati",
    sekolah: "SMP Negeri 1 Kalijati",
    whatsapp: "08997788990",
    username: "zainal.abidin",
    password: "sigap123",
    status_pembayaran: "Belum Bayar",
    iuran_bulanan: "Belum Bayar",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Fatimah Az-Zahra, S.Sos.I., M.Pd.",
    nip: "",
    nuptk: "8872740049210087",
    status: "Non ASN",
    komisariat: "subang",
    sekolah: "SMP Negeri 3 Subang",
    whatsapp: "08121122334",
    username: "fatimah.zahra",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "H. Maman Suparman, M.Ag.",
    nip: "197509142003121001",
    nuptk: "3499748858110098",
    status: "PNS",
    komisariat: "pamanukan",
    sekolah: "SMP Negeri 1 Pamanukan",
    whatsapp: "08123344556",
    username: "maman.suparman",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Siti Masitoh, S.Pd.I.",
    nip: "",
    nuptk: "1122758860220034",
    status: "Non ASN",
    komisariat: "ciasem",
    sekolah: "SMP Negeri 1 Ciasem",
    whatsapp: "08772233445",
    username: "siti.masitoh",
    password: "sigap123",
    status_pembayaran: "Belum Bayar",
    iuran_bulanan: "Belum Bayar",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Yusuf Al-Bantani, S.Ag.",
    nip: "198006222008011014",
    nuptk: "6548749960110034",
    status: "PNS",
    komisariat: "pamanukan",
    sekolah: "SMP Negeri 2 Pamanukan",
    whatsapp: "08134455667",
    username: "yusuf.albantani",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Imas Rohima, S.Pd.",
    nip: "",
    nuptk: "2233761162330045",
    status: "Non ASN",
    komisariat: "ciasem",
    sekolah: "SMP Negeri 2 Ciasem",
    whatsapp: "08522233445",
    username: "imas.rohima",
    password: "sigap123",
    status_pembayaran: "Belum Bayar",
    iuran_bulanan: "Belum Bayar",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Deden Suryana, S.Pd.I.",
    nip: "",
    nuptk: "9982746658110032",
    status: "PPPK",
    komisariat: "kalijati",
    sekolah: "SMP Negeri 1 Purwadadi",
    whatsapp: "08194455667",
    username: "deden.suryana",
    password: "sigap123",
    status_pembayaran: "Menunggak",
    iuran_bulanan: "Menunggak",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Tuti Alawiyah, M.Pd.I.",
    nip: "198802142019032011",
    nuptk: "8832764459110032",
    status: "PPPK",
    komisariat: "pagaden",
    sekolah: "SMP Negeri 2 Pagaden",
    whatsapp: "08534455667",
    username: "tuti.alawiyah",
    password: "sigap123",
    status_pembayaran: "Lunas",
    iuran_bulanan: "Lunas",
    iuranStatus: "Lunas",
    createdAt: new Date().toISOString()
  },
  {
    nama: "Lukman Hakim, S.Th.I.",
    nip: "",
    nuptk: "7763750058220042",
    status: "Non ASN",
    komisariat: "jalancagak",
    sekolah: "SMP Negeri 1 Sagalaherang",
    whatsapp: "08129988776",
    username: "lukman.hakim",
    password: "sigap123",
    status_pembayaran: "Belum Bayar",
    iuran_bulanan: "Belum Bayar",
    iuranStatus: "Belum Bayar",
    createdAt: new Date().toISOString()
  }
];

export async function seedTeachersIfEmpty(): Promise<TeacherData[]> {
  const colRef = collection(db, "siladik-guru-pai-smp");
  const snap = await getDocs(colRef);
  
  if (snap.empty) {
    console.log("Seeding initial teachers data into 'siladik-guru-pai-smp' collection...");
    const batch = writeBatch(db);
    
    DEFAULT_TEACHERS.forEach((teacher) => {
      const docRef = doc(colRef); // Auto-generated ID
      batch.set(docRef, teacher);
    });
    
    await batch.commit();
    
    // Return the list with generated IDs
    const repopulatedSnap = await getDocs(colRef);
    return repopulatedSnap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as TeacherData[];
  }
  
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as TeacherData[];
}
