# Review-PDF-AI-Concept

## Aplikasi Verifikasi RAB AI

Aplikasi terdiri dari frontend React/Vite, backend FastAPI, dan database PostgreSQL. Backend menggunakan Gemini untuk menganalisis dokumen RAB; kunci Gemini hanya disimpan di environment backend.

## Menjalankan secara lokal

Source frontend berada di `frontend/`, sedangkan API FastAPI berada di `backend/`. Perintah npm dijalankan dari root repository.

1. Pasang dependency frontend: `npm ci`
2. Jalankan frontend: `npm run dev`
3. Di terminal lain, siapkan backend:

   ```powershell
   cd backend
   py -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

4. Isi `DATABASE_URL` dan `GEMINI_API_KEY` pada environment backend, lalu jalankan:

   ```powershell
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Frontend lokal memakai API `http://localhost:8000` secara default. Untuk mengganti alamat backend, set `VITE_API_URL` sebelum menjalankan atau membangun frontend.

## Deploy frontend ke Vercel

Konfigurasi Vercel di `vercel.json` membangun frontend Vite sebagai situs statis dan mengarahkan rute aplikasi ke `index.html`.

1. Push perubahan frontend dan `vercel.json` ke branch GitHub yang akan dideploy.
2. Buka [vercel.com/new](https://vercel.com/new), masuk/daftar, lalu import repository GitHub ini.
3. Biarkan Root Directory di root repository. Vercel akan memakai framework Vite, perintah `npm run build`, dan output directory `frontend/dist` dari `vercel.json`.
4. Klik **Deploy**. Setelah selesai, Vercel memberikan URL publik untuk frontend.

Deploy ini hanya meng-host frontend. API FastAPI dan PostgreSQL tidak ikut dideploy, sehingga fitur yang membutuhkan backend belum tersedia untuk pengguna publik. Jika API nanti sudah di-host, tambahkan `VITE_API_URL` pada Vercel Project Settings → Environment Variables dengan origin API (contoh `https://<domain-api>`), lalu redeploy.

Jangan commit file `.env` atau API key. `VITE_API_URL` bukan secret; `GEMINI_API_KEY` dan kredensial database hanya boleh disimpan sebagai environment backend.
