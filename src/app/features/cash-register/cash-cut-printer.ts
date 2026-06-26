import { CashSessionSummaryDto } from '../../core/models/cash-register';
import { PAYMENT_METHOD_LABELS } from '../../core/models/sale';

// Impresión del corte de caja en una ventana aparte (ticket de 300px), mismo
// patrón que receipt-printer.ts de ventas.

// Escapa texto que se inyecta en la ventana de impresión.
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function buildCashCutHtml(summary: CashSessionSummaryDto): string {
  const money = (value: number) => '$' + value.toFixed(2);
  const period =
    new Date(summary.openedAt).toLocaleString('es-MX') +
    (summary.closedAt ? ' — ' + new Date(summary.closedAt).toLocaleString('es-MX') : ' — (abierto)');

  const byMethod = summary.salesByPaymentMethod
    .map(
      (row) =>
        `<tr><td>${escapeHtml(PAYMENT_METHOD_LABELS[row.method])}</td>` +
        `<td style="text-align:right">${money(row.total)}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Corte ${escapeHtml(
    String(summary.id),
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
      <h1>CORTE DE CAJA</h1>
      <p class="muted">Turno #${escapeHtml(String(summary.id))}</p>
      <hr>
      <p>Cajero: ${escapeHtml(summary.cashier)}</p>
      <p>Periodo: ${escapeHtml(period)}</p>
      <p>Estado: ${summary.isClosed ? 'Cerrado' : 'Abierto'}</p>
      <hr>
      <p>Fondo inicial: ${money(summary.openingFund)}</p>
      <hr>
      <p>Ventas por método</p>
      <table>${byMethod}</table>
      <div class="row"><span>Tickets</span><span>${summary.ticketCount}</span></div>
      <div class="row"><span>Descuentos</span><span>${money(summary.totalDiscounts)}</span></div>
      <div class="row"><span>Total ventas</span><span>${money(summary.totalSales)}</span></div>
      <div class="row"><span>Devoluciones (${summary.returnsCount})</span><span>-${money(
        summary.totalReturns,
      )}</span></div>
      <div class="row total"><span>Ventas netas</span><span>${money(summary.netSales)}</span></div>
      <hr>
      <div class="row"><span>Depósitos</span><span>${money(summary.deposits)}</span></div>
      <div class="row"><span>Retiros</span><span>-${money(summary.withdrawals)}</span></div>
      <div class="row"><span>Gastos</span><span>-${money(summary.expenses)}</span></div>
      <hr>
      <div class="row"><span>Efectivo esperado</span><span>${money(summary.expectedCash)}</span></div>
      <div class="row"><span>Efectivo contado</span><span>${money(summary.declaredAmount)}</span></div>
      <div class="row total"><span>Diferencia</span><span>${money(summary.difference)}</span></div>
      ${
        summary.closingNotes
          ? `<hr><p>Observaciones: ${escapeHtml(summary.closingNotes)}</p>`
          : ''
      }
      <hr>
      <p class="muted">${new Date().toLocaleString('es-MX')}</p>
    </body></html>`;
}

// Abre la ventana de impresión con el corte. Devuelve un mensaje de error si el
// navegador bloqueó la ventana emergente, o null si se imprimió correctamente.
export function printCashCut(summary: CashSessionSummaryDto): string | null {
  const win = window.open('', '_blank', 'width=380,height=640');
  if (!win) {
    return 'No se pudo abrir la ventana de impresión. Revise el bloqueador de ventanas emergentes.';
  }
  win.document.write(buildCashCutHtml(summary));
  win.document.close();
  win.focus();
  win.print();
  return null;
}
