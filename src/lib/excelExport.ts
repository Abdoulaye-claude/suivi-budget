import ExcelJS from 'exceljs';
import type { Category, Expense } from '../types';
import type { CapturedImage } from './captureElement';

const TYPE_STYLE = {
  depense: { fill: 'FFFDE8E8', font: 'FFB23B3B' },
  revenu: { fill: 'FFE6F7EF', font: 'FF1BA870' },
};

function hexToArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

function textColorForBackground(hex: string): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? 'FF1A1A1A' : 'FFFFFFFF';
}

const DEFAULT_ROW_HEIGHT_PX = 20;

export async function buildExpensesWorkbook(
  expenses: Expense[],
  categories: Category[],
  currency: string,
  chartImages: (CapturedImage | null)[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Suivi de Budget';
  workbook.created = new Date();

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const sheet = workbook.addWorksheet('Suivi de Budget', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Catégorie', key: 'category', width: 20 },
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Montant', key: 'amount', width: 14 },
    { header: 'Statut', key: 'status', width: 12 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A78D6' } };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 20;

  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));

  for (const expense of sorted) {
    const category = categoryById.get(expense.categoryId);
    const row = sheet.addRow({
      date: expense.date,
      type: expense.type === 'revenu' ? 'Revenu' : 'Dépense',
      category: category?.name ?? 'Sans catégorie',
      description: expense.description,
      amount: expense.amount,
      status: expense.status === 'reel' ? 'Réalisée' : 'Prévue',
    });

    const typeStyle = TYPE_STYLE[expense.type];
    const typeCell = row.getCell('type');
    typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: typeStyle.fill } };
    typeCell.font = { color: { argb: typeStyle.font }, bold: true };

    if (category) {
      const categoryCell = row.getCell('category');
      categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(category.color) } };
      categoryCell.font = { color: { argb: textColorForBackground(category.color) } };
    }

    row.getCell('amount').numFmt = `#,##0.00" ${currency}"`;
  }

  sheet.autoFilter = { from: 'A1', to: 'F1' };

  let nextImageRow = 0;
  for (const chartImage of chartImages) {
    if (!chartImage) continue;
    const imageId = workbook.addImage({ base64: chartImage.base64, extension: 'png' });
    sheet.addImage(imageId, {
      tl: { col: 7, row: nextImageRow },
      ext: { width: chartImage.width, height: chartImage.height },
    });
    nextImageRow += Math.ceil(chartImage.height / DEFAULT_ROW_HEIGHT_PX) + 1;
  }

  return workbook;
}

export async function downloadWorkbook(filename: string, workbook: ExcelJS.Workbook): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
