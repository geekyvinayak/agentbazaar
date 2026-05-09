const nodemailer = require('nodemailer');

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function buildHtml(order) {
  const itemRows = order.items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.name} (${i.brand})</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">Size ${i.size}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">×${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatINR(i.line_total_inr)}</td>
    </tr>`).join('');

  const { name, address, city, pincode, phone } = order.shipping;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Order Confirmed</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px">

        <tr><td style="background:#111;padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:22px">AgentBazaar</h1>
          <p style="margin:4px 0 0;color:#aaa;font-size:14px">Agent-friendly shoe store</p>
        </td></tr>

        <tr><td style="padding:32px">
          <h2 style="margin:0 0 8px;font-size:20px">Order confirmed ✓</h2>
          <p style="margin:0;color:#555;font-size:14px">Order ID: <strong>${order.order_id}</strong></p>
          <p style="margin:4px 0 0;color:#555;font-size:14px">Estimated delivery: <strong>${order.estimated_delivery}</strong></p>
        </td></tr>

        <tr><td style="padding:0 32px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px">
            <tr style="background:#f8f8f8">
              <th style="padding:10px 12px;text-align:left;font-size:13px">Item</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px">Size</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px">Total</th>
            </tr>
            ${itemRows}
            <tr>
              <td colspan="3" style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Subtotal</td>
              <td style="padding:8px 12px;text-align:right;font-size:13px">${formatINR(order.total_paid_inr - (order.shipping_inr || 0))}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:4px 12px;text-align:right;font-size:13px;color:#555">Shipping</td>
              <td style="padding:4px 12px;text-align:right;font-size:13px">${order.shipping_inr === 0 ? 'Free' : formatINR(order.shipping_inr)}</td>
            </tr>
            <tr style="background:#f8f8f8">
              <td colspan="3" style="padding:10px 12px;text-align:right;font-weight:bold">Total paid</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold">${formatINR(order.total_paid_inr)}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 24px">
          <h3 style="margin:0 0 8px;font-size:15px">Shipping to</h3>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.6">
            ${name}<br>${address}<br>${city} – ${pincode}<br>${phone}
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 32px">
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:16px">
            <p style="margin:0;font-size:13px;color:#78350f;font-weight:bold">Demo store — no real transaction</p>
            <p style="margin:6px 0 0;font-size:13px;color:#92400e">
              This is a demo store. No real charge was made and no shoe will ship.
              AgentBazaar is an open-source template for agentic commerce.
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(order) {
  const items = order.items.map(i =>
    `  ${i.name} (${i.brand}) · Size ${i.size} · ×${i.quantity} · ${formatINR(i.line_total_inr)}`
  ).join('\n');
  const { name, address, city, pincode, phone } = order.shipping;

  return `AgentBazaar — Order Confirmed
==============================

Order ID: ${order.order_id}
Estimated delivery: ${order.estimated_delivery}

ITEMS
${items}

Shipping: ${order.shipping_inr === 0 ? 'Free' : formatINR(order.shipping_inr)}
Total paid: ${formatINR(order.total_paid_inr)}

SHIPPING ADDRESS
${name}
${address}
${city} – ${pincode}
${phone}

---
DEMO STORE — NO REAL TRANSACTION
This is a demo store. No real charge was made and no shoe will ship.
AgentBazaar is an open-source template for agentic commerce.
`;
}

async function sendOrderConfirmation(order) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping confirmation email');
    return { skipped: true };
  }

  const toEmail = order.shipping && order.shipping.email;
  if (!toEmail) {
    console.warn(`[email] No email on order ${order.order_id} — skipping`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });

  try {
    await transporter.sendMail({
      from: `"AgentBazaar" <${user}>`,
      to: toEmail,
      subject: `Order confirmed: ${order.order_id} — AgentBazaar`,
      html: buildHtml(order),
      text: buildText(order)
    });
    console.log(`[email] Confirmation sent for ${order.order_id} → ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send for ${order.order_id}:`, err.message);
    return { error: err.message };
  }
}

module.exports = { sendOrderConfirmation };
