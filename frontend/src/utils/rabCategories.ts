export interface RabCategoryOption {
  value: string;
  label: string;
  description: string;
}

export const RAB_CATEGORY_OPTIONS: RabCategoryOption[] = [
  {
    value: "Kategori 1 (K1) : RO Wajib",
    label: "Kategori 1 (K1) : RO Wajib",
    description:
      "Kategori ini merupakan RO yang bersifat wajib, mengikat, ditetapkan melalui kebijakan penganggaran nasional, dan harus tetap berjalan secara berkelanjutan. Penilaian terhadap RO pada kategori ini tidak ditujukan untuk menilai perlu atau tidaknya RO, melainkan untuk memvalidasi kesesuaian ruang lingkup, kejelasan kebutuhan dasar, dan keterkaitan komponen dengan RO yang diusulkan",
  },
  {
    value: "Kategori 2 (K2): RO Prioritas Strategis",
    label: "Kategori 2 (K2): RO Prioritas Strategis",
    description:
      "Kategori ini merupakan RO prioritas yang ditetapkan secara resmi oleh Menteri, dan/atau penguatan layanan esensial. Penilaian RO terhadap kategori ini dilaksanakan secara penuh sesuai parameter penilaian substansi",
  },
  {
    value: "Kategori 3 (K3): RO Strategis/Diskresioner",
    label: "Kategori 3 (K3): RO Strategis/Diskresioner",
    description:
      "Kategori ini merupakan RO yang memiliki keterkaitan dengan prioritas pembangunan nasional dan pencapaian sasaran kementerian, serta mendukung tugas dan fungsi Satker, namun tidak memenuhi kriteria Kategori 1 maupun Kategori 2",
  },
  {
    value: "Kategori 4 (K4): RO Non-Strategis",
    label: "Kategori 4 (K4): RO Non-Strategis",
    description:
      "Kategori ini merupakan RO yang tidak memenuhi kriteria Kategori 1, Kategori 2, maupun Kategori 3, serta tidak memiliki keterkaitan dengan tugas dan fungsi Satker pengusul, maupun pencapaian sasaran strategis kementerian. Terhadap RO yang masuk ke dalam kategori ini tidak diteruskan ke tahap berikutnya",
  },
];

export function findRabCategory(categoryName?: string): RabCategoryOption | undefined {
  if (!categoryName) return undefined;
  const normalizedName = categoryName.toLowerCase().trim();

  return RAB_CATEGORY_OPTIONS.find((category) => {
    const normalizedValue = category.value.toLowerCase();
    const normalizedLabel = category.label.toLowerCase();

    return (
      normalizedValue === normalizedName ||
      normalizedLabel === normalizedName ||
      normalizedName.includes(normalizedValue) ||
      normalizedValue.includes(normalizedName) ||
      (normalizedName.includes("1") && normalizedValue.includes("wajib")) ||
      (normalizedName.includes("2") && normalizedValue.includes("prioritas")) ||
      (normalizedName.includes("3") && normalizedValue.includes("diskresioner")) ||
      (normalizedName.includes("4") && normalizedValue.includes("non-strategis"))
    );
  });
}