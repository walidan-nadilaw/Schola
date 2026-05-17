import { FileText, Clock, HelpCircle } from 'lucide-react';

export interface GuideItem {
  id: string;
  title: string;
  steps: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Initial mock guides
export const mockGuides: GuideItem[] = [
  {
    id: 'G01',
    title: 'Cara Mengajukan Surat',
    steps: [
      'Login ke sistem menggunakan akun IPB Anda',
      'Pilih menu Pengajuan → Ajuan',
      'Pilih jenis surat yang ingin diajukan',
      'Isi formulir dengan lengkap dan benar',
      'Upload dokumen pendukung jika diperlukan',
      'Pilih verifikator yang sesuai',
      'Klik tombol Submit Pengajuan',
      'Tunggu proses verifikasi dari verifikator'
    ]
  },
  {
    id: 'G02',
    title: 'Cara Melacak Status Pengajuan',
    steps: [
      'Login ke sistem',
      'Pilih menu Pengajuan → Riwayat Pengajuan',
      'Lihat daftar pengajuan Anda',
      'Status akan ditampilkan untuk setiap pengajuan',
      'Klik icon mata untuk melihat detail',
      'Download surat jika sudah disetujui'
    ]
  }
];

// Initial mock FAQs
export const mockFAQs: FAQItem[] = [
  {
    id: 'F01',
    question: 'Berapa lama proses verifikasi?',
    answer: 'Proses verifikasi biasanya memakan waktu 2-7 hari kerja tergantung jenis surat yang diajukan dan jumlah verifikator yang harus menyetujui.'
  },
  {
    id: 'F02',
    question: 'Bagaimana jika pengajuan ditolak?',
    answer: 'Anda akan menerima notifikasi beserta alasan penolakan dari verifikator. Anda dapat mengajukan kembali dengan memperbaiki kekurangan yang ada.'
  },
  {
    id: 'F03',
    question: 'Apakah bisa mengedit pengajuan yang sudah disubmit?',
    answer: 'Pengajuan yang berstatus "Draft" atau "Ditolak" dapat diedit. Namun pengajuan yang sudah dalam proses verifikasi tidak dapat diedit lagi.'
  },
  {
    id: 'F04',
    question: 'Bagaimana cara memilih verifikator?',
    answer: 'Pada langkah "Pilih Verifikator", Anda dapat mencari dan memilih verifikator yang sesuai dengan kebutuhan surat Anda. Sistem juga menyediakan opsi verifikasi parallel atau berurutan.'
  }
];
