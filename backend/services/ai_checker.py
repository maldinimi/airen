import json
import os
from io import BytesIO
from typing import Any

from openai import APIConnectionError, APIStatusError, OpenAI, OpenAIError
from pypdf import PdfReader
from pypdf.errors import PdfReadError


class AIServiceError(RuntimeError):
    pass


RAB_CRITERIA = [
    ("Bagan Akun Standar (BAS 6 digit)", "Kesesuaian Akun"),
    ("Belanja Bahan (521211) sesuai SBM", "Kesesuaian Akun"),
    ("Belanja Konsumsi Rapat (521219)", "Kesesuaian Akun"),
    ("Belanja Honor Output Kegiatan (521213)", "Kesesuaian Akun"),
    ("Belanja Jasa Profesi Narasumber (522151)", "Kesesuaian Akun"),
    ("Belanja Sewa Gedung/Ruangan (522141)", "Kesesuaian Akun"),
    ("Belanja Langganan Daya & Jasa (522111)", "Kesesuaian Akun"),
    ("Belanja Pemeliharaan Peralatan (523121)", "Kesesuaian Akun"),
    ("Biaya Perjalanan Dinas Dalam Negeri (524111)", "Kesesuaian Akun"),
    ("Transportasi Lokal & Uang Harian SBM", "Kepatuhan Standar Biaya"),
    ("Kesesuaian Volume & Satuan Ukur", "Kepatuhan Standar Biaya"),
    ("Kejelasan Komponen Biaya Rinci", "Efisiensi Anggaran"),
    ("Pemisahan Biaya Pokok & Biaya Pendukung", "Efisiensi Anggaran"),
    ("Perhitungan Matematis Perkalian Akurat", "Kalkulasi Matematis"),
    ("Perlakuan Pajak PPN / PPh Pasal 21/23", "Kalkulasi Matematis"),
    ("Rasionalitas Harga Pasar & Tidak Pemborosan", "Kewajaran Harga"),
    ("Tidak Terdapat Duplikasi Anggaran", "Integritas Anggaran"),
    ("Total Biaya Tidak Melampaui Batas Pagu", "Batas Pagu"),
    ("Rekapitulasi Rincian Sinkron dengan Total Akhir", "Kalkulasi Matematis"),
    ("Lembar Pengesahan PPK Bertanda Tangan & NIP", "Pengesahan Pejabat"),
]

TOR_CRITERIA = [
    ("Identitas kegiatan dan keselarasan Program, Kegiatan, KRO, dan RO", "Kelengkapan Administratif"),
    ("Latar belakang, urgensi, dan permasalahan yang terukur", "Substansi"),
    ("Dasar hukum dan kesesuaian dengan kebijakan/regulasi", "Kepatuhan Regulasi"),
    ("Tujuan kegiatan spesifik dan konsisten dengan latar belakang", "Substansi"),
    ("Keluaran, hasil, indikator, target, dan satuan ukur terdefinisi", "Kinerja"),
    ("Ruang lingkup dan batasan pekerjaan dijelaskan secara jelas", "Ruang Lingkup"),
    ("Metode, tahapan, dan mekanisme pelaksanaan dapat dilaksanakan", "Metode Pelaksanaan"),
    ("Jadwal dan durasi kegiatan realistis serta terukur", "Jadwal"),
    ("Lokasi, sasaran, dan jumlah peserta/penerima manfaat dijelaskan", "Sasaran"),
    ("Kebutuhan tenaga ahli/personel dan pembagian peran relevan", "Sumber Daya"),
    ("Spesifikasi teknis dan kriteria penerimaan keluaran jelas", "Keluaran"),
    ("Rencana monitoring, evaluasi, dan pengendalian risiko tersedia", "Pengendalian"),
    ("Ruang lingkup, keluaran, dan kebutuhan biaya selaras dengan RAB pendamping", "Konsistensi TOR/RAB"),
    ("Volume, satuan, dan asumsi biaya dapat ditelusuri serta wajar", "Kewajaran Anggaran"),
    ("Pengesahan/penanggung jawab dan kelengkapan administratif tersedia", "Pengesahan"),
]


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract selectable text from a PDF; scanned PDFs require OCR before review."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        return "\n\n".join(
            text.strip() for page in reader.pages if (text := page.extract_text()) and text.strip()
        ).strip()
    except (OSError, PdfReadError) as exc:
        raise ValueError(f"Gagal membaca PDF: {exc}") from exc


def _validate_result(result: Any, criteria: list[tuple[str, str]]) -> dict[str, Any]:
    if not isinstance(result, dict):
        raise AIServiceError("Model mengembalikan format hasil yang bukan objek JSON.")

    required_fields = ("aiReason", "aiRecommendation", "criteriaResults")
    if any(not result.get(field) for field in required_fields):
        raise AIServiceError("Hasil model tidak memiliki ringkasan, rekomendasi, atau daftar kriteria.")

    results = result["criteriaResults"]
    if not isinstance(results, list) or len(results) != len(criteria):
        raise AIServiceError(f"Hasil model harus memuat tepat {len(criteria)} kriteria.")

    normalized = []
    for index, item in enumerate(results):
        if not isinstance(item, dict) or item.get("status") not in ("passed", "failed"):
            raise AIServiceError(f"Status kriteria ke-{index + 1} tidak valid.")
        normalized.append({
            "id": index + 1,
            "text": criteria[index][0],
            "category": criteria[index][1],
            "status": item["status"],
            "notes": str(item.get("notes") or "Model tidak memberikan catatan bukti."),
            "verifierStatus": "Lolos" if item["status"] == "passed" else "Ditolak",
            "verifierNotes": "",
        })

    score = round(sum(item["status"] == "passed" for item in normalized) / len(normalized) * 100)
    result["aiScore"] = score
    result["aiStatus"] = "LOLOS" if score == 100 else "TIDAK LOLOS"
    result["criteriaResults"] = normalized
    return result


def analyze_document(
    pdf_bytes: bytes,
    file_name: str,
    document_type: str,
    regulation_text: str | None = None,
    regulation_title: str | None = None,
    companion_text: str | None = None,
    companion_file_name: str | None = None,
) -> dict[str, Any]:
    doc_type = document_type.upper()
    if doc_type not in ("RAB", "TOR"):
        raise ValueError("Jenis dokumen harus RAB atau TOR.")

    extracted_text = extract_pdf_text(pdf_bytes)
    if not extracted_text:
        raise AIServiceError(
            "PDF tidak memiliki teks yang dapat dibaca. Jalankan OCR pada dokumen hasil pemindaian, lalu unggah ulang."
        )

    criteria = RAB_CRITERIA if doc_type == "RAB" else TOR_CRITERIA
    regulation_title = regulation_title or "Peraturan dan pedoman pemerintah yang berlaku"
    criteria_text = "\n".join(f"{index}. {name} ({category})" for index, (name, category) in enumerate(criteria, 1))
    document_limit = 12000
    regulation_limit = 5000
    document_text = extracted_text[:document_limit]
    regulation_excerpt = (regulation_text or "Tidak ada dokumen regulasi acuan yang disediakan.")[:regulation_limit]
    if len(extracted_text) > document_limit:
        document_text += "\n[Dokumen dipotong karena batas konteks; bagian lanjutan belum ditelaah.]"
    if regulation_text and len(regulation_text) > regulation_limit:
        regulation_excerpt += "\n[Regulasi dipotong karena batas konteks.]"
    companion_excerpt = (companion_text or "")[:6000]
    if companion_text and len(companion_text) > 6000:
        companion_excerpt += "\n[Dokumen pembanding dipotong karena batas konteks.]"

    prompt = f"""
Anda adalah asisten telaah dokumen perencanaan dan anggaran pemerintah Indonesia.
Tinjau dokumen {doc_type} "{file_name}" dengan cermat. Gunakan hanya bukti yang tersedia;
jangan mengarang angka, isi regulasi, kutipan, tanda tangan, atau kepatuhan. Jika bukti tidak
cukup atau persyaratan tidak dapat diverifikasi, beri status "failed" dan jelaskan keterbatasannya.
Bandingkan dengan regulasi acuan berikut jika teksnya tersedia: {regulation_title}.
Untuk tarif, pajak, dan ketentuan hukum, jangan menyimpulkan melanggar tanpa dasar eksplisit
dalam dokumen yang diberikan. Catat halaman atau kutipan singkat jika tersedia.

Kriteria yang wajib dinilai:
{criteria_text}

Teks regulasi acuan:
{regulation_excerpt}

Teks hasil ekstraksi {doc_type}:
{document_text}

Dokumen pembanding {companion_file_name or ""} (gunakan untuk cek konsistensi jika tersedia):
{companion_excerpt or "Tidak ada dokumen pembanding."}

Balas hanya JSON valid dengan bentuk:
{{
  "aiReason": "ringkasan temuan",
  "aiRecommendation": "rekomendasi tindak lanjut",
  "criteriaResults": [
    {{"id": 1, "status": "passed atau failed", "notes": "alasan dan bukti"}}
  ]
}}
Isi criteriaResults tepat {len(criteria)} item sesuai urutan kriteria.
"""

    try:
        client = OpenAI(
            base_url=os.getenv("VLLM_BASE_URL", "http://localhost:8001/v1"),
            api_key=os.getenv("VLLM_API_KEY", "EMPTY"),
            timeout=float(os.getenv("VLLM_TIMEOUT_SECONDS", "300")),
        )
        response = client.chat.completions.create(
            model=os.getenv("VLLM_MODEL", "Qwen/Qwen2.5-3B-Instruct-AWQ"),
            messages=[
                {"role": "system", "content": "Anda menelaah dokumen pemerintah secara faktual dan berhati-hati."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2500,
        )
    except APIConnectionError as exc:
        raise AIServiceError(
            "Tidak dapat terhubung ke vLLM. Pastikan server vLLM aktif pada VLLM_BASE_URL."
        ) from exc
    except APIStatusError as exc:
        raise AIServiceError(f"vLLM mengembalikan HTTP {exc.status_code}: {exc.message}") from exc
    except OpenAIError as exc:
        raise AIServiceError(f"Panggilan OpenAI-compatible ke vLLM gagal: {exc}") from exc

    raw_text = response.choices[0].message.content
    if not raw_text:
        raise AIServiceError("vLLM mengembalikan respons kosong.")
    try:
        result = _validate_result(json.loads(raw_text), criteria)
    except json.JSONDecodeError as exc:
        raise AIServiceError("vLLM tidak mengembalikan JSON valid.") from exc

    result["activeRegulationTitle"] = regulation_title
    result["extractedText"] = extracted_text
    return result
