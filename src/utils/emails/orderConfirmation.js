/**
 * Builds the subject / html / text for an order-confirmation email.
 * Inline CSS is required for consistent rendering across mail clients.
 */

const APP_NAME = "VRS Water Purifiers";
const BRAND = "#0f7fbf";
const INK = "#052a4a";

const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const rupee = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

function itemRow(it) {
  const line = (Number(it.price) || 0) * (it.qty || 1);
  return `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eef4f8;font-size:14px;color:${INK};">
        ${escape(it.name)}
      </td>
      <td align="center" style="padding:12px 8px;border-bottom:1px solid #eef4f8;font-size:14px;color:${INK};">
        ${it.qty}
      </td>
      <td align="right" style="padding:12px 8px;border-bottom:1px solid #eef4f8;font-size:14px;color:${INK};font-weight:600;">
        ${rupee(line)}
      </td>
    </tr>`;
}

function addressBlock(a) {
  if (!a) return "";
  const line2 = a.line2 ? `, ${escape(a.line2)}` : "";
  const landmark = a.landmark
    ? `<div style="margin-top:4px;color:#6b7c88;font-size:13px;">Landmark: ${escape(a.landmark)}</div>`
    : "";
  return `
    <div style="color:${INK};font-size:14px;line-height:1.55;">
      ${a.fullName ? `<div style="font-weight:600;">${escape(a.fullName)}</div>` : ""}
      ${a.phone ? `<div style="color:#6b7c88;">+91 ${escape(a.phone)}</div>` : ""}
      <div style="margin-top:6px;">
        ${escape(a.line1 || "")}${line2}<br />
        ${escape(a.city || "")}, ${escape(a.state || "")} — ${escape(a.pincode || "")}
      </div>
      ${landmark}
    </div>`;
}

export function renderOrderConfirmation({ order, user }) {
  const orderCode = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
  const greeting = user?.name ? `Hi ${escape(user.name.split(" ")[0])},` : "Hi,";
  const items = (order.items || []).map(itemRow).join("");
  const subject = `Order confirmed — ${orderCode} · ${APP_NAME}`;

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4fafd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -20px rgba(4,27,48,0.15);">

        <!-- header -->
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,${BRAND},#14c9a1);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;">${escape(APP_NAME)}</div>
            <div style="font-size:24px;font-weight:700;margin-top:6px;">Your order is confirmed</div>
            <div style="font-size:14px;margin-top:4px;opacity:0.9;">Order ${escape(orderCode)}</div>
          </td>
        </tr>

        <!-- greeting -->
        <tr>
          <td style="padding:26px 32px 8px;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 12px;">${greeting}</p>
            <p style="margin:0;color:#3a556b;">
              Thanks for shopping with us — we've received your payment and your
              order is being prepared. Details are below for your records.
            </p>
          </td>
        </tr>

        <!-- items -->
        <tr>
          <td style="padding:22px 32px 4px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7c88;margin-bottom:8px;">Items</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef4f8;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#f7fbfe;">
                  <th align="left" style="padding:10px 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7c88;">Item</th>
                  <th align="center" style="padding:10px 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7c88;">Qty</th>
                  <th align="right" style="padding:10px 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7c88;">Line</th>
                </tr>
              </thead>
              <tbody>${items}</tbody>
            </table>
          </td>
        </tr>

        <!-- totals -->
        <tr>
          <td style="padding:16px 32px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#6b7c88;">Subtotal</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:${INK};">${rupee(order.subtotal)}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#6b7c88;">Discount${order.promoCode ? ` (${escape(order.promoCode)})` : ""}</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:#0f8f6b;">− ${rupee(order.discount)}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#6b7c88;">Delivery</td>
                <td align="right" style="padding:4px 0;font-size:14px;color:${INK};">${order.delivery === 0 ? "FREE" : rupee(order.delivery)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 4px;border-top:1px solid #eef4f8;font-size:15px;font-weight:700;color:${INK};">Total paid</td>
                <td align="right" style="padding:10px 0 4px;border-top:1px solid #eef4f8;font-size:17px;font-weight:700;color:${INK};">${rupee(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- shipping -->
        ${order.shippingAddress ? `
        <tr>
          <td style="padding:20px 32px 4px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7c88;margin-bottom:8px;">Shipping to</div>
            ${addressBlock(order.shippingAddress)}
          </td>
        </tr>` : ""}

        <!-- footer -->
        <tr>
          <td style="padding:28px 32px 32px;background:#f7fbfe;color:#6b7c88;font-size:13px;line-height:1.6;">
            You'll receive another update when your order ships.<br />
            Questions? Reply to this email or reach us at
            <a href="mailto:hello@vrswaterpurifiers.in" style="color:${BRAND};text-decoration:none;">hello@vrswaterpurifiers.in</a>.
          </td>
        </tr>

      </table>
      <div style="color:#8a99a5;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ${escape(APP_NAME)}</div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    ``,
    `Thanks for shopping with us — your payment was received and your order is being prepared.`,
    ``,
    `Order: ${orderCode}`,
    `Total paid: ${rupee(order.total)}`,
    ``,
    `Items:`,
    ...(order.items || []).map(
      (i) => `  • ${i.name} × ${i.qty}  —  ${rupee((Number(i.price) || 0) * (i.qty || 1))}`
    ),
    ``,
    order.shippingAddress
      ? `Shipping to: ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}, ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}`
      : ``,
    ``,
    `Questions? Reply to this email or reach us at hello@vrswaterpurifiers.in.`,
  ].join("\n");

  return { subject, html, text };
}
