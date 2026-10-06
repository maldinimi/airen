# Review-PDF-AI-Concept

## Aplikasi Verifikasi RAB AI

Aplikasi terdiri dari frontend React/Vite, backend FastAPI, dan database PostgreSQL. Backend menggunakan SDK OpenAI untuk memanggil endpoint kompatibel OpenAI dari vLLM lokal. Isi dokumen PDF tetap diproses di komputer/server lokal; aplikasi mendukung penelaahan RAB dan TOR, serta regulasi sebagai acuan.

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

4. Isi `DATABASE_URL` dan konfigurasi vLLM pada environment backend, lalu jalankan:

   ```powershell
   $env:VLLM_BASE_URL = "http://localhost:8001/v1"
   $env:VLLM_API_KEY = "EMPTY"
   $env:VLLM_MODEL = "Qwen/Qwen2.5-3B-Instruct-AWQ"
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Frontend lokal memakai API `http://localhost:8000` secara default. Untuk mengganti alamat backend, set `VITE_API_URL` sebelum menjalankan atau membangun frontend.

## Menjalankan model AI lokal

RTX 3050 laptop tersedia dalam konfigurasi VRAM yang berbeda. Untuk konfigurasi 4 GB, titik awal yang relatif realistis adalah **Qwen2.5-3B-Instruct-AWQ**; 7B tidak disarankan untuk GPU ini. Model 3B tetap perlu diverifikasi hasilnya oleh petugas, dan tidak menggantikan keputusan pejabat. vLLM berjalan di Linux/WSL2 (bukan Windows native); gunakan versi PyTorch/CUDA dan vLLM yang sesuai dengan driver NVIDIA:

```bash
vllm serve Qwen/Qwen2.5-3B-Instruct-AWQ \
  --host 0.0.0.0 \
  --port 8001 \
  --max-model-len 8192 \
  --max-num-seqs 1 \
  --gpu-memory-utilization 0.85
```

Backend FastAPI tetap berjalan pada port `8000`, sedangkan vLLM pada `8001`. Jika model kehabisan VRAM, turunkan `--max-model-len` (misalnya `4096`) atau gunakan GPU dengan VRAM lebih besar. Untuk laptop dengan 6 GB VRAM, model instruksi 7B versi AWQ dapat dicoba dengan konteks dan jumlah sequence rendah, tetapi performanya tidak dijamin. Ubah `VLLM_MODEL` agar sama dengan nama model yang disajikan vLLM. PDF hasil pemindaian tanpa lapisan teks harus di-OCR terlebih dahulu; aplikasi memberi pesan kesalahan bila teks tidak dapat diekstrak.

## Deploy frontend ke Vercel

Konfigurasi Vercel di `vercel.json` membangun frontend Vite sebagai situs statis dan mengarahkan rute aplikasi ke `index.html`.

1. Push perubahan frontend dan `vercel.json` ke branch GitHub yang akan dideploy.
2. Buka [vercel.com/new](https://vercel.com/new), masuk/daftar, lalu import repository GitHub ini.
3. Biarkan Root Directory di root repository. Vercel akan memakai framework Vite, perintah `npm run build`, dan output directory `frontend/dist` dari `vercel.json`.
4. Klik **Deploy**. Setelah selesai, Vercel memberikan URL publik untuk frontend.

Deploy ini hanya meng-host frontend. API FastAPI dan PostgreSQL tidak ikut dideploy, sehingga fitur yang membutuhkan backend belum tersedia untuk pengguna publik. Jika API nanti sudah di-host, tambahkan `VITE_API_URL` pada Vercel Project Settings → Environment Variables dengan origin API (contoh `https://<domain-api>`), lalu redeploy.

Jangan commit file `.env` atau kredensial database. `VLLM_API_KEY` hanya digunakan jika endpoint lokal dikonfigurasi memerlukannya; `VITE_API_URL` bukan secret.
