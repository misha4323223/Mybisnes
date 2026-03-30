import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Project, TaxPayment } from "@/context/AppContext";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const SOURCE_LABELS: Record<string, string> = {
  project: "Проект",
  subscription: "Подписка",
  "one-time": "Разовая",
  other: "Другое",
};

function fmt(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

export interface PdfReportOptions {
  projects: Project[];
  taxPayments: TaxPayment[];
  taxRate: number;
  userName?: string;
  period: "month" | "year" | "all";
  month?: number;
  year?: number;
}

export async function generateAndSharePdf(opts: PdfReportOptions) {
  const now = new Date();
  const year = opts.year ?? now.getFullYear();
  const month = opts.month ?? now.getMonth();

  let filtered = opts.projects;
  let periodLabel = "За всё время";

  if (opts.period === "month") {
    filtered = opts.projects.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    periodLabel = `${MONTHS[month]} ${year}`;
  } else if (opts.period === "year") {
    filtered = opts.projects.filter((p) => new Date(p.date).getFullYear() === year);
    periodLabel = `${year} год`;
  }

  const paid = filtered.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const unpaid = filtered.filter((p) => !p.isPaid).reduce((s, p) => s + p.amount, 0);
  const total = paid + unpaid;
  const tax = Math.round(paid * opts.taxRate);
  const yearlyTotal = opts.projects
    .filter((p) => new Date(p.date).getFullYear() === year)
    .reduce((s, p) => s + p.amount, 0);
  const limitPct = Math.min(100, Math.round((yearlyTotal / 2400000) * 100));
  const limitColor = limitPct >= 90 ? "#E53935" : limitPct >= 70 ? "#FB8C00" : "#2E7D32";

  const sortedProjects = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const taxRows = opts.taxPayments
    .filter((t) => {
      if (opts.period === "all") return true;
      const [tYear, tMonth] = t.period.split("-").map(Number);
      if (opts.period === "year") return tYear === year;
      return tYear === year && tMonth - 1 === month;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const projectRows = sortedProjects
    .map(
      (p, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td class="center">${fmtDate(p.date)}</td>
        <td><strong>${p.clientName || "—"}</strong></td>
        <td>${p.name || "—"}</td>
        <td class="center tag">${SOURCE_LABELS[p.source] ?? p.source}</td>
        <td class="right amount">${fmt(p.amount)}</td>
        <td class="center ${p.isPaid ? "status-paid" : "status-unpaid"}">${p.isPaid ? "Получен" : "Ожидается"}</td>
        <td class="center ${p.receiptSent ? "receipt-yes" : "receipt-no"}">${p.receiptSent ? "✓" : "—"}</td>
      </tr>`
    )
    .join("");

  const taxRowsHtml =
    taxRows.length > 0
      ? taxRows
          .map(
            (t, i) => `
        <tr class="${i % 2 === 0 ? "even" : "odd"}">
          <td class="center">${t.period}</td>
          <td class="center">${fmtDate(t.date)}</td>
          <td class="right amount">${fmt(t.amount)}</td>
          <td class="center ${t.isPaid ? "status-paid" : "status-unpaid"}">${t.isPaid ? "Оплачен" : "Ожидает"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="center" style="color:#999;padding:16px">Нет записей</td></tr>`;

  const userName = opts.userName ? opts.userName : "Самозанятый";
  const generatedAt = now.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1A6B45; }
  .logo-block { }
  .logo { font-size: 22px; font-weight: 800; color: #1A6B45; letter-spacing: -0.5px; }
  .logo-sub { font-size: 11px; color: #777; margin-top: 2px; }
  .header-right { text-align: right; }
  .report-title { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .report-period { font-size: 13px; color: #1A6B45; font-weight: 600; margin-top: 2px; }
  .report-meta { font-size: 10px; color: #999; margin-top: 6px; }

  .summary-grid { display: flex; gap: 12px; margin-bottom: 24px; }
  .summary-card { flex: 1; border: 1px solid #e0e0e0; border-radius: 10px; padding: 14px; background: #fafafa; }
  .summary-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .summary-value { font-size: 18px; font-weight: 800; color: #1a1a1a; }
  .summary-card.green { border-color: #a5d6a7; background: #f1f8f1; }
  .summary-card.green .summary-value { color: #2E7D32; }
  .summary-card.orange { border-color: #ffcc80; background: #fff8f0; }
  .summary-card.orange .summary-value { color: #E65100; }
  .summary-card.blue { border-color: #90caf9; background: #f0f7ff; }
  .summary-card.blue .summary-value { color: #1565C0; }
  .summary-card.red { border-color: #ef9a9a; background: #fff5f5; }
  .summary-card.red .summary-value { color: #B71C1C; }

  .limit-block { border: 1px solid #e0e0e0; border-radius: 10px; padding: 14px; margin-bottom: 24px; background: #fafafa; }
  .limit-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .limit-label { font-size: 11px; color: #555; font-weight: 600; }
  .limit-val { font-size: 11px; color: #555; }
  .limit-bar-bg { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
  .limit-bar-fill { height: 8px; border-radius: 4px; background: ${limitColor}; width: ${limitPct}%; }
  .limit-note { font-size: 10px; color: #999; margin-top: 6px; }

  .section-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #1A6B45; color: #fff; padding: 8px 10px; font-size: 10px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  th.center, td.center { text-align: center; }
  th.right, td.right { text-align: right; }
  td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  tr.even td { background: #fff; }
  tr.odd td { background: #f9f9f9; }

  .amount { font-weight: 700; font-size: 12px; }
  .tag { font-size: 10px; color: #555; }
  .status-paid { color: #2E7D32; font-weight: 700; }
  .status-unpaid { color: #E65100; font-weight: 600; }
  .receipt-yes { color: #2E7D32; font-weight: 700; }
  .receipt-no { color: #bbb; }

  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
</style>
</head>
<body>

<div class="header">
  <div class="logo-block">
    <div class="logo">Мой Доход</div>
    <div class="logo-sub">Учёт доходов самозанятого</div>
  </div>
  <div class="header-right">
    <div class="report-title">${userName}</div>
    <div class="report-period">Отчёт: ${periodLabel}</div>
    <div class="report-meta">Сформирован ${generatedAt}</div>
  </div>
</div>

<div class="summary-grid">
  <div class="summary-card">
    <div class="summary-label">Всего доходов</div>
    <div class="summary-value">${fmt(total)}</div>
  </div>
  <div class="summary-card green">
    <div class="summary-label">Получено</div>
    <div class="summary-value">${fmt(paid)}</div>
  </div>
  <div class="summary-card orange">
    <div class="summary-label">Ожидается</div>
    <div class="summary-value">${fmt(unpaid)}</div>
  </div>
  <div class="summary-card red">
    <div class="summary-label">Налог НПД ${(opts.taxRate * 100).toFixed(0)}%</div>
    <div class="summary-value">${fmt(tax)}</div>
  </div>
</div>

<div class="limit-block">
  <div class="limit-header">
    <span class="limit-label">Годовой лимит самозанятого (${year})</span>
    <span class="limit-val">${fmt(yearlyTotal)} из 2 400 000 ₽ &nbsp;·&nbsp; ${limitPct}%</span>
  </div>
  <div class="limit-bar-bg"><div class="limit-bar-fill"></div></div>
  <div class="limit-note">Остаток: ${fmt(Math.max(0, 2400000 - yearlyTotal))}</div>
</div>

<div class="section-title">Доходы (${sortedProjects.length} записей)</div>
<table>
  <thead>
    <tr>
      <th class="center">Дата</th>
      <th>Клиент</th>
      <th>Описание</th>
      <th class="center">Тип</th>
      <th class="right">Сумма</th>
      <th class="center">Статус</th>
      <th class="center">Чек ФНС</th>
    </tr>
  </thead>
  <tbody>
    ${projectRows || `<tr><td colspan="7" class="center" style="color:#999;padding:16px">Нет записей за выбранный период</td></tr>`}
  </tbody>
</table>

<div class="section-title">Налоговые платежи (${taxRows.length} записей)</div>
<table>
  <thead>
    <tr>
      <th class="center">Период</th>
      <th class="center">Дата оплаты</th>
      <th class="right">Сумма</th>
      <th class="center">Статус</th>
    </tr>
  </thead>
  <tbody>${taxRowsHtml}</tbody>
</table>

<div class="footer">
  <span>Мой Доход · Учёт НПД для самозанятых РФ</span>
  <span>Ставка НПД: ${(opts.taxRate * 100).toFixed(0)}% · Лимит: 2 400 000 ₽/год</span>
</div>

</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing недоступен на этом устройстве");
  }

  const fileName = `Мой_Доход_${periodLabel.replace(/\s/g, "_")}.pdf`;
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: fileName,
    UTI: "com.adobe.pdf",
  });
}
