import ExcelJS from 'exceljs';
import type { RedditPost } from '@pain-point-hunter/shared';

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: { header: string; key: keyof RedditPost | 'date'; width: number }[] = [
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Subreddit', key: 'subreddit', width: 18 },
  { header: 'Keyword détecté', key: 'matchedKeyword', width: 28 },
  { header: 'Titre', key: 'title', width: 50 },
  { header: 'Contenu', key: 'selftext', width: 70 },
  { header: 'URL', key: 'url', width: 50 },
  { header: 'Score', key: 'score', width: 10 },
  { header: 'Commentaires', key: 'numComments', width: 14 },
  { header: 'Auteur', key: 'author', width: 20 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function applyHeaderStyle(sheet: ExcelJS.Worksheet, fillColor: string): void {
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fillColor}` } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function addPostRow(sheet: ExcelJS.Worksheet, post: RedditPost): void {
  const row = sheet.addRow({
    date: formatDate(post.createdAt),
    subreddit: `r/${post.subreddit}`,
    matchedKeyword: post.matchedKeyword,
    title: post.title,
    selftext: post.selftext,
    url: post.url,
    score: post.score,
    numComments: post.numComments,
    author: post.author,
  });

  row.height = 60;
  row.eachCell((cell, colNumber) => {
    cell.alignment = { wrapText: true, vertical: 'top' };
    // Make URL clickable
    if (colNumber === 6 && typeof cell.value === 'string') {
      cell.value = { text: cell.value, hyperlink: cell.value };
      cell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }
    // Alternate row shading
    if (row.number % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    }
  });
}

function configureSheet(sheet: ExcelJS.Worksheet, fillColor: string): void {
  sheet.columns = COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));
  applyHeaderStyle(sheet, fillColor);
}

// ── Main export function ──────────────────────────────────────────────────────

/**
 * Generates an Excel workbook from scraped Reddit posts and returns it as a Buffer.
 *
 * Sheets:
 *  1. "Tous les résultats" — every post (dark blue header)
 *  2. One sheet per subreddit (red header)
 */
export async function exportToExcel(posts: RedditPost[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pain Point Hunter';
  workbook.created = new Date();

  // ── Sheet 1: All results ──────────────────────────────────────────────────
  const allSheet = workbook.addWorksheet('Tous les résultats');
  configureSheet(allSheet, '1a1a2e');

  // ── One sheet per subreddit ───────────────────────────────────────────────
  const subreddits = [...new Set(posts.map((p) => p.subreddit))];
  const subSheets = new Map<string, ExcelJS.Worksheet>();

  for (const sub of subreddits) {
    const sheet = workbook.addWorksheet(sub); // no r/ prefix — slash is forbidden in sheet names
    configureSheet(sheet, 'e94560');
    subSheets.set(sub, sheet);
  }

  // ── Write rows ────────────────────────────────────────────────────────────
  // Sort by score descending so best posts appear first
  const sorted = [...posts].sort((a, b) => b.score - a.score);

  for (const post of sorted) {
    addPostRow(allSheet, post);
    const subSheet = subSheets.get(post.subreddit);
    if (subSheet) addPostRow(subSheet, post);
  }

  // ── Auto-filters ──────────────────────────────────────────────────────────
  const lastCol = String.fromCharCode(64 + COLUMNS.length); // e.g. "I" for 9 cols
  allSheet.autoFilter = `A1:${lastCol}${allSheet.rowCount}`;
  for (const sheet of subSheets.values()) {
    sheet.autoFilter = `A1:${lastCol}${sheet.rowCount}`;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
