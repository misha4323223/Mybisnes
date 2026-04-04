import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export interface InvoicePdfOptions {
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  userInn: string;
  userSbp: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  projectName: string;
  projectDescription?: string;
  amount: number;
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}

export async function generateAndShareInvoicePdf(opts: InvoicePdfOptions) {
  const {
    invoiceNumber,
    invoiceDate,
    userName,
    userInn,
    userSbp,
    clientName,
    clientEmail,
    clientPhone,
    projectName,
    projectDescription,
    amount,
  } = opts;

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    background: #fff;
    padding: 40px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 3px solid #4F46E5;
  }
  .logo { font-size: 20px; font-weight: 800; color: #4F46E5; letter-spacing: -0.5px; }
  .logo-sub { font-size: 10px; color: #888; margin-top: 3px; }
  .invoice-title-block { text-align: right; }
  .invoice-title { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: 1px; text-transform: uppercase; }
  .invoice-number { font-size: 13px; color: #4F46E5; font-weight: 600; margin-top: 4px; }
  .invoice-date { font-size: 11px; color: #888; margin-top: 2px; }

  .parties {
    display: flex;
    gap: 0;
    margin-bottom: 28px;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
  }
  .party-block {
    flex: 1;
    padding: 18px 20px;
    background: #fafafa;
  }
  .party-block:first-child {
    border-right: 1px solid #e8e8e8;
  }
  .party-label {
    font-size: 9px;
    font-weight: 700;
    color: #4F46E5;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .party-name { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .party-detail { font-size: 11px; color: #555; margin-bottom: 2px; }
  .party-badge {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    background: #EEF2FF;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    color: #4F46E5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .services-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .services-table thead tr th {
    background: #4F46E5;
    color: #fff;
    padding: 10px 14px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    text-align: left;
  }
  .services-table thead tr th:last-child { text-align: right; }
  .services-table tbody tr td {
    padding: 14px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;
    color: #1a1a1a;
    vertical-align: top;
    background: #fff;
  }
  .services-table tbody tr td:last-child { text-align: right; font-weight: 700; font-size: 14px; }
  .service-name { font-weight: 600; font-size: 13px; }
  .service-desc { font-size: 11px; color: #888; margin-top: 3px; }

  .totals-block {
    display: flex;
    justify-content: flex-end;
    margin-top: 0;
    border: 1px solid #e8e8e8;
    border-top: none;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    overflow: hidden;
  }
  .totals-inner {
    width: 260px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    font-size: 11px;
    color: #555;
    border-top: 1px solid #f0f0f0;
  }
  .total-final {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #4F46E5;
  }
  .total-final-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .total-final-amount {
    font-size: 20px;
    font-weight: 800;
    color: #fff;
  }

  .services-wrapper {
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .payment-block {
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 24px;
    background: #fafafa;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .payment-icon {
    width: 36px;
    height: 36px;
    background: #EEF2FF;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .payment-label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .payment-method { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
  .payment-detail { font-size: 12px; color: #4F46E5; font-weight: 600; }

  .footer-note {
    text-align: center;
    font-size: 10px;
    color: #aaa;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    font-style: italic;
    margin-top: 24px;
  }
</style>
</head>
<body>

<div class="page-header">
  <div>
    <div class="logo">Мой Доход</div>
    <div class="logo-sub">Учёт доходов самозанятого</div>
  </div>
  <div class="invoice-title-block">
    <div class="invoice-title">Счёт на оплату</div>
    <div class="invoice-number">${invoiceNumber}</div>
    <div class="invoice-date">${invoiceDate}</div>
  </div>
</div>

<div class="parties">
  <div class="party-block">
    <div class="party-label">Исполнитель</div>
    <div class="party-name">${userName || "Не указано"}</div>
    ${userInn ? `<div class="party-detail">ИНН: ${userInn}</div>` : ""}
    <div class="party-badge">Самозанятый · НПД</div>
  </div>
  <div class="party-block">
    <div class="party-label">Заказчик</div>
    <div class="party-name">${clientName || "Не указано"}</div>
    ${clientEmail ? `<div class="party-detail">${clientEmail}</div>` : ""}
    ${clientPhone ? `<div class="party-detail">${clientPhone}</div>` : ""}
  </div>
</div>

<div class="services-wrapper">
  <table class="services-table">
    <thead>
      <tr>
        <th>Услуга / Работа</th>
        <th style="text-align:right;width:140px">Стоимость</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="service-name">${projectName}</div>
          ${projectDescription ? `<div class="service-desc">${projectDescription}</div>` : ""}
        </td>
        <td>${fmt(amount)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals-block">
    <div class="totals-inner">
      <div class="total-final">
        <div class="total-final-label">Итого к оплате</div>
        <div class="total-final-amount">${fmt(amount)}</div>
      </div>
    </div>
  </div>
</div>

${
  userSbp
    ? `
<div class="payment-block">
  <div class="payment-icon">📱</div>
  <div>
    <div class="payment-label">Реквизиты для оплаты</div>
    <div class="payment-method">СБП — Система быстрых платежей</div>
    <div class="payment-detail">${userSbp}</div>
  </div>
</div>
`
    : ""
}

<div class="footer-note">
  Чек будет выдан через приложение «Мой налог» после получения оплаты · НДС не облагается (ст. 346.11 НК РФ)
</div>

</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Отправка файлов недоступна на этом устройстве");
  }

  const safeName = invoiceNumber.replace(/[^a-zA-Zа-яА-Я0-9_-]/g, "_");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Счёт ${invoiceNumber}`,
    UTI: "com.adobe.pdf",
  });
}
