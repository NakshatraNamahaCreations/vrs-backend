/**
 * Owner-facing alert fired whenever a customer completes a paid order.
 * Subject leads with the order code so it sorts nicely in the inbox; body
 * highlights customer contact info + item list so ops can act on it fast.
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

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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
  if (!a) return `<div style="color:#6b7c88;font-size:14px;">No address on file.</div>`;
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

export function renderOwnerOrderAlert({ order, user }) {
  const orderCode = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
  const items = (order.items || []).map(itemRow).join("");
  const itemCount = (order.items || []).reduce((n, i) => n + (i.qty || 0), 0);
  const subject = `New paid order ${orderCode} — ${rupee(order.total)} · ${APP_NAME}`;

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4fafd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -20px rgba(4,27,48,0.15);">

        <!-- header -->
        <tr>
          <td style="padding:26px 32px;background:linear-gradient(135deg,${BRAND},#14c9a1);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;">${escape(APP_NAME)} · Ops alert</div>
            <div style="font-size:22px;font-weight:700;margin-top:6px;">New paid order · ${escape(orderCode)}</div>
            <div style="font-size:14px;margin-top:4px;opacity:0.9;">
              ${itemCount} ${itemCount === 1 ? "item" : "items"} · Total ${rupee(order.total)} · Paid via ${escape(order.paymentMethod || "—")}
            </div>
          </td>
        </tr>

        <!-- customer -->
        <tr>
          <td style="padding:24px 32px 8px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7c88;margin-bottom:8px;">Customer</div>
            <div style="font-size:15px;color:${INK};line-height:1.55;">
              ${user?.name ? `<div style="font-weight:600;">${escape(user.name)}</div>` : ""}
              ${user?.email ? `<div><a href="mailto:${escape(user.email)}" style="color:${BRAND};text-decoration:none;">${escape(user.email)}</a></div>` : ""}
              ${user?.phone ? `<div><a href="tel:+91${escape(user.phone)}" style="color:${BRAND};text-decoration:none;">+91 ${escape(user.phone)}</a></div>` : ""}
            </div>
          </td>
        </tr>

        <!-- shipping -->
        <tr>
          <td style="padding:16px 32px 8px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7c88;margin-bottom:8px;">Ship to</div>
            ${addressBlock(order.shippingAddress)}
          </td>
        </tr>

        <!-- items -->
        <tr>
          <td style="padding:20px 32px 4px;">
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
                <td style="padding:10px 0 4px;border-top:1px solid #eef4f8;font-size:15px;font-weight:700;color:${INK};">Total received</td>
                <td align="right" style="padding:10px 0 4px;border-top:1px solid #eef4f8;font-size:17px;font-weight:700;color:${INK};">${rupee(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:26px 32px 30px;background:#f7fbfe;color:#6b7c88;font-size:13px;line-height:1.6;">
            This is an automated notification. Manage the order from the admin console.
          </td>
        </tr>

      </table>
      <div style="color:#8a99a5;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ${escape(APP_NAME)}</div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `New paid order — ${orderCode}`,
    `Total: ${rupee(order.total)} · Paid via ${order.paymentMethod || "—"}`,
    ``,
    `Customer:`,
    user?.name ? `  Name:  ${user.name}` : null,
    user?.email ? `  Email: ${user.email}` : null,
    user?.phone ? `  Phone: +91 ${user.phone}` : null,
    ``,
    `Items:`,
    ...(order.items || []).map(
      (i) => `  • ${i.name} × ${i.qty}  —  ${rupee((Number(i.price) || 0) * (i.qty || 1))}`
    ),
    ``,
    order.shippingAddress
      ? `Ship to: ${order.shippingAddress.fullName || ""} — ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}, ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}`
      : `Ship to: (no address on file)`,
    ``,
    `Subtotal: ${rupee(order.subtotal)}`,
    order.discount > 0 ? `Discount: -${rupee(order.discount)}` : null,
    `Delivery: ${order.delivery === 0 ? "FREE" : rupee(order.delivery)}`,
    `Total:    ${rupee(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
