/**
 * Chuyển một chuỗi ngày giờ bất kỳ (ISO, "YYYY-MM-DDTHH:mm", Date...) sang
 * định dạng MySQL DATETIME "YYYY-MM-DD HH:mm:ss".
 * Trả về null nếu không hợp lệ hoặc rỗng => tránh lỗi "Invalid date" khi lưu.
 */
export function toMysqlDateTime(input: string | null | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/** Kiểm tra một chuỗi ngày giờ có hợp lệ hay không. */
export function isValidDate(input: string | null | undefined): boolean {
  if (!input) return false;
  return !isNaN(new Date(input).getTime());
}

/**
 * Parse an toàn giá trị ngày giờ trả về từ API/MySQL thành Date.
 * MySQL trả về dạng "YYYY-MM-DD HH:mm:ss" (dấu cách) khiến Safari parse lỗi,
 * nên ta thay dấu cách bằng "T". Trả về null nếu không hợp lệ.
 */
export function parseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  // Chuẩn hóa "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  const normalized = input.includes('T') ? input : input.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** Format ngày (vi-VN) an toàn, trả về chuỗi rỗng nếu không hợp lệ. */
export function formatDateVN(
  input: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDate(input);
  if (!d) return '';
  return d.toLocaleDateString('vi-VN', options);
}

/** Format giờ (vi-VN) an toàn. */
export function formatTimeVN(
  input: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  const d = parseDate(input);
  if (!d) return '';
  return d.toLocaleTimeString('vi-VN', options);
}
