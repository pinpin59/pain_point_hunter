import ExcelJS from 'exceljs';
import type { TrustpilotReview } from '@pain-point-hunter/shared';

const COLUMNS: { header: string; key: keyof TrustpilotReview; width: number }[] = [
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Entreprise', key: 'company', width: 22 },
  { header: 'Note (étoiles)', key: 'stars', width: 14 },
  { header: 'Titre', key: 'title', width: 45 },
  { header: 'Avis', key: 'body', width: 70 },
  { header: 'URL', key: 'url', width: 45 },
];

function applyHeaderStyle(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0f3460' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function configureSheet(sheet: ExcelJS.Worksheet): void {
  sheet.columns = COLUMNS.map((col) => ({ header: col.header, key: col.key, width: col.width }));
  applyHeaderStyle(sheet);
}

function addReviewRow(sheet: ExcelJS.Worksheet, review: TrustpilotReview): void {
  const row = sheet.addRow(review);
  row.height = 60;
  row.eachCell((cell, colNumber) => {
    cell.alignment = { wrapText: true, vertical: 'top' };
    if (colNumber === 6 && typeof cell.value === 'string') {
      cell.value = { text: cell.value, hyperlink: cell.value };
      cell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }
    if (row.number % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    }
  });
}

/**
 * Generates an Excel workbook from Trustpilot reviews.
 *
 * Sheets:
 *  1. "Tous les avis" — every review sorted by date (newest first)
 *  2. One sheet per company
 */
export async function exportTrustpilotToExcel(reviews: TrustpilotReview[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pain Point Hunter';
  workbook.created = new Date();

  const allSheet = workbook.addWorksheet('Tous les avis');
  configureSheet(allSheet);

  const companies = [...new Set(reviews.map((r) => r.company))];
  const companySheets = new Map<string, ExcelJS.Worksheet>();

  for (const company of companies) {
    const sheet = workbook.addWorksheet(company);
    configureSheet(sheet);
    companySheets.set(company, sheet);
  }

  const sorted = [...reviews].sort((a, b) => b.date.localeCompare(a.date));

  for (const review of sorted) {
    addReviewRow(allSheet, review);
    const companySheet = companySheets.get(review.company);
    if (companySheet) addReviewRow(companySheet, review);
  }

  const lastCol = String.fromCharCode(64 + COLUMNS.length);
  allSheet.autoFilter = `A1:${lastCol}${allSheet.rowCount}`;
  for (const sheet of companySheets.values()) {
    sheet.autoFilter = `A1:${lastCol}${sheet.rowCount}`;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
