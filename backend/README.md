# 🚀 Schola IPB Backend Setup & Developer Guide

Backend untuk **Schola: IPB Academic Help Center** telah selesai dikonfigurasi secara lengkap mencakup seluruh **Milestone 1, 2, 3, dan 4**.

Sistem ini dilengkapi skema PostgreSQL relasional modular, otentikasi JWT terenkripsi bcrypt murni, alur draf & pengajuan dinamis berformat penomoran resmi IPB (`{Prefix}/{Tahun}/{Serial_4_Digit}`), sistem upload berkas KTM/KHS, dan **Verification Pipeline** beruntun (*sequential verification flow*) serta **Tanda Tangan Digital Kriptografis (Digital E-Signature)** resmi.

---

## 📋 Langkah Inisialisasi

### Langkah 1: Persiapan Virtual Environment
Buka terminal/shell Anda di folder `backend/` dan jalankan perintah berikut untuk mengisolasi dependensi Python Anda:

```bash
# Pindah ke direktori backend (jika belum berada di sana)
cd backend

# Membuat virtual environment baru bernama 'venv'
python -m venv venv

# Mengaktifkan virtual environment
# Di Windows (Command Prompt):
venv\Scripts\activate
# Di Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Di Linux/macOS:
source venv/bin/activate
```

---

### Langkah 2: Instalasi Dependensi
Pastikan virtual environment Anda telah aktif, lalu pasang seluruh paket pustaka Python yang dibutuhkan:

```bash
pip install -r requirements.txt
```

---

### Langkah 3: Konfigurasi Database PostgreSQL
1. Pastikan Anda memiliki database PostgreSQL lokal yang sedang menyala.
2. Buat sebuah database kosong di PostgreSQL Anda bernama `schola_db`.
3. Buka file **`.env`** di direktori `backend/` dan sesuaikan kredensial koneksi database Anda pada variabel `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@localhost:5432/schola_db
   ```
   *(Contoh default: `postgresql://postgres:postgres@localhost:5432/schola_db`)*

---

### Langkah 4: Jalankan Database Seeding
Jalankan script Python pembuat tabel dan pengisi data awal (*seeding*) berikut:

```bash
python seed.py
```

---

### Langkah 5: Menjalankan Server API FastAPI (Uvicorn)
Untuk meluncurkan server lokal FastAPI Anda, jalankan perintah berikut:

```bash
# Menjalankan server menggunakan Uvicorn
python -m uvicorn app.main:app --reload
```

Server Anda akan aktif secara langsung di alamat: **`http://127.0.0.1:8000`**

---

## 🌐 Dokumentasi API Interaktif (FastAPI Swagger UI)

FastAPI secara otomatis menghasilkan dokumentasi API interaktif yang bisa Anda gunakan untuk menguji seluruh modul sistem:
1. Buka browser Anda dan navigasikan ke alamat: **`http://127.0.0.1:8000/docs`**
2. Anda akan disuguhkan dashboard **Swagger UI** interaktif.
3. Anda dapat menguji modul-modul berikut:
   * **`Authentication`**: Sesi login, logout, dan profile me (Mahasiswa & Verifikator/Dosen).
   * **`Form Templates`**: Melihat format isian formulir dinamis per jenis surat.
   * **`Submissions`**: Membuat draf pengajuan surat, mengunggah lampiran pendukung, serta memfinalisasikan surat ke verifikator.
   * **`File Attachments`**: Mengunggah KTM/KHS maksimal 5MB secara aman dan streaming dokumen terproteksi.
   * **`Verification Pipeline`**: Dosen melihat antrean surat pending (khusus giliran mereka jika sequential), menyetujui, menolak, dan menghasilkan Tanda Tangan Digital.

---

## 🔑 Akun Uji Coba Terdaftar (Demo Accounts)

Setelah melakukan *seeding*, akun-akun berikut akan langsung aktif dan dapat Anda gunakan untuk login:

| Peran (Role) | Email | Password | Nama Lengkap | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `rina.kusuma@ipb.ac.id` | `admin123` | Rina Kusuma (Admin) | Bagian Akademik, NIP terdaftar |
| **Mahasiswa** | `naufal@apps.ipb.ac.id` | `mahasiswa123` | Naufal Akmal | S1 Ilmu Komputer, NIM, Fak, Sem terdaftar |
| **Verifier/Dosen** | `siti.rahayu@ipb.ac.id` | `verifier123` | Dr. Siti Rahayu | Departemen Agronomi, NIP terdaftar |

---

## 📂 Peta File Backend Lengkap

*   [requirements.txt](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/requirements.txt): Daftar pustaka utama (FastAPI, SQLAlchemy, Passlib, JWT, Alembic).
*   [.env](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/.env): Kredensial lokal sistem database dan JWT secret.
*   [seed.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/seed.py): Script instan untuk menginisiasi skema tabel fisik dan menyemai data tiruan awal.
*   `app/`:
    *   [main.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/main.py): Entrypoint FastAPI, konfigurasi CORS, dan registry router lengkap.
    *   [auth.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/auth.py): Algoritma enkripsi bcrypt, token JWT generator, middleware protection, dan role checker.
    *   [config.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/config.py): Pengurai konfigurasi env otomatis menggunakan Pydantic Settings.
    *   [database.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/database.py): Pengelola sesi pool SQLAlchemy engine and dependency injection `get_db`.
    *   [models.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/models.py): Model ORM database yang memetakan seluruh tabel relasional secara presisi.
    *   `routers/`:
        *   [auth.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/routers/auth.py): Endpoint API untuk `/login`, `/logout`, dan `/me`.
        *   [templates.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/routers/templates.py): Endpoint API pengelola template formulir dinamis surat.
        *   [submissions.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/routers/submissions.py): Endpoint pengolah alur hidup surat pengajuan mahasiswa.
        *   [files.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/routers/files.py): Endpoint pengelola unggahan KTM/KHS terproteksi.
        *   [verification.py](file:///d:/naufalarizq/ipb/kuliah/depart/sem-6/ads/projek/academic-helper-system/backend/app/routers/verification.py): Endpoint pipeline persetujuan bertingkat dosen dan e-signature.


