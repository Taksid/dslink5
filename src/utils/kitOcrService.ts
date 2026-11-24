export function formatStarlinkKitNumber(kitNum: string): string {
  if (!kitNum) return '';
  const cleaned = kitNum.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  return cleaned.startsWith('KIT') ? cleaned : `KIT${cleaned}`;
}

export function isValidKitNumber(kitNum: string): boolean {
  if (!kitNum) return false;
  const formatted = formatStarlinkKitNumber(kitNum);
  return /^KIT[A-Z0-9]{6,20}$/i.test(formatted);
}

export async function scanKitNumberFromImage(_file: File | Blob | string): Promise<string> {
  return '';
}

export async function scanKitNumber(file: File | Blob | string): Promise<string> {
  return scanKitNumberFromImage(file);
}
