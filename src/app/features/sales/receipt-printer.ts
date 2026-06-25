import { PAYMENT_METHOD_LABELS, ReceiptDto } from '../../core/models/sale';

// Impresión del recibo de una venta en una ventana aparte (ticket de 300px).
// Compartido entre el cobro (payment-modal) y "Reimprimir recibo" del detalle de venta.

// Escapa texto que se inyecta en la ventana de impresión del recibo.
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function buildReceiptHtml(receipt: ReceiptDto): string {
  const money = (value: number) => '$' + value.toFixed(2);
  const lines = receipt.lines
    .map(
      (line) =>
        `<tr><td>${line.quantity}x ${escapeHtml(line.product)}</td>` +
        `<td style="text-align:right">${money(line.lineTotal)}</td></tr>`,
    )
    .join('');
  const payments = receipt.payments
    .map(
      (payment) =>
        `<tr><td>${escapeHtml(PAYMENT_METHOD_LABELS[payment.method])}</td>` +
        `<td style="text-align:right">${money(payment.amount)}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(
    receipt.folio,
  )}</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;width:300px;margin:0 auto;padding:8px;color:#000}
      h1{font-size:14px;text-align:center;margin:4px 0}
      p{margin:2px 0}
      .muted{color:#555;text-align:center}
      table{width:100%;border-collapse:collapse}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between}
      .total{font-size:14px;font-weight:bold}
    </style></head><body>
      <h1>${escapeHtml(receipt.businessName)}</h1>
      ${receipt.address ? `<p class="muted">${escapeHtml(receipt.address)}</p>` : ''}
      ${receipt.phone ? `<p class="muted">Tel: ${escapeHtml(receipt.phone)}</p>` : ''}
      ${receipt.taxId ? `<p class="muted">RFC: ${escapeHtml(receipt.taxId)}</p>` : ''}
      <hr>
      <p>Folio: ${escapeHtml(receipt.folio)}</p>
      <p>Fecha: ${new Date(receipt.date).toLocaleString('es-MX')}</p>
      <p>Cajero: ${escapeHtml(receipt.cashier)}</p>
      <p>Cliente: ${escapeHtml(receipt.customerName)}</p>
      <hr>
      <table>${lines}</table>
      <hr>
      <div class="row"><span>Subtotal</span><span>${money(receipt.subtotal)}</span></div>
      <div class="row"><span>IVA</span><span>${money(receipt.taxes)}</span></div>
      <div class="row total"><span>TOTAL</span><span>${money(receipt.total)}</span></div>
      <hr>
      <table>${payments}</table>
      <div class="row"><span>Recibido</span><span>${money(receipt.amountReceived)}</span></div>
      <div class="row"><span>Cambio</span><span>${money(receipt.change)}</span></div>
      <hr>
      <p class="muted">¡Gracias por su compra!</p>
    </body></html>`;
}

// Abre la ventana de impresión con el recibo. Devuelve un mensaje de error si el
// navegador bloqueó la ventana emergente, o null si se imprimió correctamente.
export function printReceipt(receipt: ReceiptDto): string | null {
  const win = window.open('', '_blank', 'width=380,height=640');
  if (!win) {
    return 'No se pudo abrir la ventana de impresión. Revise el bloqueador de ventanas emergentes.';
  }
  win.document.write(buildReceiptHtml(receipt));
  win.document.close();
  win.focus();
  win.print();
  return null;
}
