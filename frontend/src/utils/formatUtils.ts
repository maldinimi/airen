export function formatIndonesianDateTime(date = new Date()): string {
  return `${date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} WIB`;
}

export function formatDateInputValue(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatFileSize(sizeInBytes: number, decimalPlaces = 1): string {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(decimalPlaces)} MB`;
}