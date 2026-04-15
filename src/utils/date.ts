export function parseDate(input: string): Date | null {
  // Try YYYY-MM-DD
  let match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD.MM.YYYY
  match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD/MM/YYYY
  match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}
