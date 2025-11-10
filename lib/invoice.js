// warea/lib/invoice.js
import PDFDocument from "pdfkit";
import path from "path";
import { format } from "date-fns";

/**
 * Business constants (kept here to avoid sprinkling magic strings)
 * If any of these change, update once and rebuild.
 */
const BUSINESS = {
  brand: "Warea Creations",
  legalName: "Sarmistha Biswas",
  gstin: "09FNAPB5029Q1ZO",
  addressLine1: "120 D1, 2nd Floor, SK Medical Store, Nauraiya Khera",
  addressLine2: "Kanpur Nagar, Uttar Pradesh – 208022",
  country: "India",
  phone: "+91 98765 43210",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "warea.notifications@gmail.com",
};

const THEME = {
  gold: "#C6A664",
  text: "#111111",
  muted: "#666666",
  light: "#999999",
  hairline: "#EAE7DD",
  watermark: "#E8E0C5",
};

const LAYOUT = {
  margin: 50,
  left: 50,
  right: 545, // page width ~595pt
  rowH: 22,
  tableHeaderH: 30,
  pageFooterH: 120,
};

/**
 * Helpers
 */
const px = (n) => Math.round(n);
const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const inr = (n) =>
  `₹${(safeNum(n) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

const asDate = (v) => {
  // Firestore Timestamp => JS Date
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  const dt = new Date(v);
  return Number.isFinite(dt.getTime()) ? dt : new Date();
};

function drawWatermark(doc) {
  const cx = doc.page.width / 2;
  const cy = doc.page.height / 2;
  doc.save();
  doc.font("Bold").fontSize(90).fillColor(THEME.watermark).opacity(0.08);
  doc.rotate(-30, { origin: [cx, cy] });
  doc.text("WAREA", cx - 200, cy - 60, { align: "center" });
  doc.rotate(30, { origin: [cx, cy] });
  doc.opacity(1).fillColor(THEME.text);
  doc.restore();
}

function tryRegisterFonts(doc) {
  try {
    const fontDir = path.resolve(process.cwd(), "public", "fonts");

    const fonts = [
      ["Regular", "Poppins-Regular.ttf"],
      ["Medium", "Poppins-Medium.ttf"],
      ["Bold", "Poppins-Bold.ttf"],
    ];

    for (const [name, file] of fonts) {
      const fontPath = path.join(fontDir, file);
      doc.registerFont(name, fontPath);
      console.log(`✅ Registered font: ${fontPath}`);
    }

    return true;
  } catch (err) {
    console.error("⚠️  Font registration failed:", err.message);
    // Fall back to built-in fonts
    return false;
  }
}

function drawHeader(doc, order, orderId) {
  const { left, right } = LAYOUT;

  // Logo
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    doc.image(logoPath, left, 40, { width: 70 });
  } catch {
    // ignore if missing
  }

  // Business info
  doc
    .fillColor(THEME.text)
    .font("Bold")
    .fontSize(20)
    .text("Warea Jewellery Invoice", left + 90, 42, { continued: false });

  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(THEME.muted)
    .text(BUSINESS.brand, left + 90, 68)
    .text(BUSINESS.legalName, left + 90, 82)
    .text(`GSTIN: ${BUSINESS.gstin}`, left + 90, 96)
    .text(BUSINESS.addressLine1, left + 90, 110, { width: 330 })
    .text(BUSINESS.addressLine2, left + 90, 124, { width: 330 });

  // Invoice meta (right aligned block)
  const createdAt = asDate(order?.createdAt);
  const paidAt = order?.payment?.capturedAt ? asDate(order.payment.capturedAt) : null;
  const paymentType = order?.payment?.type || order?.paymentMethod || "Unknown";
  const status = (order?.status || "pending").toString().toUpperCase();

  const metaX = right - 180;
  doc
    .fillColor(THEME.text)
    .font("Medium")
    .fontSize(12)
    .text("Invoice Details", metaX, 40, { width: 180, align: "right" });

  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(THEME.muted)
    .text(`Invoice No: ${orderId}`, metaX, 60, { width: 180, align: "right" })
    .text(`Date: ${format(createdAt, "dd MMM yyyy")}`, metaX, 74, { width: 180, align: "right" })
    .text(`Payment: ${paymentType}`, metaX, 88, { width: 180, align: "right" })
    .text(`Status: ${status}`, metaX, 102, { width: 180, align: "right" });
  if (paidAt) {
    doc.text(`Paid On: ${format(paidAt, "dd MMM yyyy")}`, metaX, 116, {
      width: 180,
      align: "right",
    });
  }

  // Gold accent rule
  doc
    .save()
    .fillColor(THEME.gold)
    .rect(left, 142, right - left, 3)
    .fill()
    .restore();
}

function drawBillingBox(doc, order, topY) {
  const { left, right } = LAYOUT;
  const width = right - left;

  const c = order?.customer || {};
  const name = c.name || "";
  const phone = c.phone || "";
  const email = c.email || "";
  const address = c.address || "";
  const city = c.city || "";
  const state = c.state || "";
  const pincode = c.pincode || "";

  let y = topY;

  // Box outer
  const boxTop = y;
  doc
    .font("Bold")
    .fontSize(12)
    .fillColor(THEME.text)
    .text("Billing Details", left + 10, y);
  y += 18;

  doc.font("Regular").fontSize(10).fillColor(THEME.text);
  const opts = { width: width - 20 };

  doc.text(`Name: ${name}`, left + 10, y, opts);
  y = doc.y + 4;

  if (phone) {
    doc.text(`Phone: ${phone}`, left + 10, y, opts);
    y = doc.y + 4;
  }
  if (email) {
    doc.text(`Email: ${email}`, left + 10, y, opts);
    y = doc.y + 4;
  }

  doc.text(`Address: ${address}`, left + 10, y, opts);
  y = doc.y + 4;

  doc.text(`City: ${city}   State: ${state}`, left + 10, y, opts);
  y = doc.y + 4;

  doc.text(`Pincode: ${pincode}`, left + 10, y, opts);
  y = doc.y + 8;

  const boxBottom = y;
  doc.rect(left, boxTop, width, boxBottom - boxTop).strokeColor(THEME.hairline).stroke();

  return boxBottom + 18; // next Y
}

function tableHeaders(doc, y) {
  const { left, right } = LAYOUT;
  const col = {
    no: left + 10,
    item: left + 50,
    qty: left + 300,
    price: left + 360,
    total: left + 450,
  };

  doc.font("Medium").fontSize(10).fillColor(THEME.text);
  doc.text("No.", col.no, y);
  doc.text("Item", col.item, y);
  doc.text("Qty", col.qty, y, { width: 40, align: "right" });
  doc.text("Price", col.price, y, { width: 70, align: "right" });
  doc.text("Total", col.total, y, { width: 80, align: "right" });

  y += 14;
  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .dash(1, { space: 2 })
    .strokeColor(THEME.hairline)
    .stroke()
    .undash();

  return y + 8;
}

function maybeAddPage(doc, nextY) {
  const bottomLimit = doc.page.height - LAYOUT.pageFooterH;
  if (nextY > bottomLimit) {
    doc.addPage();
    drawWatermark(doc);
    return LAYOUT.margin + 10; // reset y near top for next page
  }
  return nextY;
}

function drawItemsTable(doc, order, startY) {
  const { left, right, rowH } = LAYOUT;

  let y = tableHeaders(doc, startY);
  const items = Array.isArray(order?.items) ? order.items : [];

  items.forEach((raw, i) => {
    // Normalize item shape
    const name = raw.name || raw.title || "Item";
    const qty = Math.max(1, safeNum(raw.qty || raw.quantity || 1));
    const price = safeNum(raw.price || raw.unitPrice || 0);
    const lineTotal = qty * price;

    // Columns
    const col = {
      no: left + 10,
      item: left + 50,
      qty: left + 300,
      price: left + 360,
      total: left + 450,
    };

    doc.font("Regular").fontSize(10).fillColor(THEME.text);
    doc.text(String(i + 1), col.no, y);
    doc.text(name, col.item, y, { width: 230 }); // wrap long names
    doc.text(String(qty), col.qty, y, { width: 40, align: "right" });
    doc.text(inr(price), col.price, y, { width: 70, align: "right" });
    doc.text(inr(lineTotal), col.total, y, { width: 80, align: "right" });

    // row delimiter
    y += rowH;
    doc
      .moveTo(left, y - 6)
      .lineTo(right, y - 6)
      .dash(1, { space: 2 })
      .strokeColor(THEME.hairline)
      .stroke()
      .undash();

    // pagination
    y = maybeAddPage(doc, y + 2);
    if (y < 60) {
      // on a new page, redraw header row
      y = tableHeaders(doc, y);
    }
  });

  // Table border
  const tableTop = startY - 8;
  doc.rect(left, tableTop, right - left, y - tableTop + 6).strokeColor(THEME.hairline).stroke();

  return y + 10;
}

function drawTotals(doc, order, yStart) {
  const { right } = LAYOUT;

  // Calculate safe totals
  const items = Array.isArray(order?.items) ? order.items : [];
  const subTotal = items.reduce(
    (sum, it) => sum + safeNum(it.price) * Math.max(1, safeNum(it.qty || it.quantity || 1)),
    0
  );

  const shipping = safeNum(order?.shipping || order?.shippingFee || 0);
  const discount = safeNum(order?.discount || order?.couponDiscount || 0);

  // Optional tax structure (if present)
  const tax = order?.tax || {};
  const cgst = safeNum(tax.cgst);
  const sgst = safeNum(tax.sgst);
  const igst = safeNum(tax.igst);

  // Grand total: priority to server-computed `order.total`
  const computed = subTotal + shipping - discount + cgst + sgst + igst;
  const grandTotal = safeNum(order?.total, computed);

  let y = yStart + 6;

  const labelX = right - 220;
  const valueX = right - 40;

  const row = (label, value) => {
    doc.font("Regular").fontSize(10).fillColor(THEME.muted).text(label, labelX, y, {
      width: 160,
      align: "right",
    });
    doc.font("Medium").fontSize(11).fillColor(THEME.text).text(inr(value), valueX, y, {
      width: 80,
      align: "right",
    });
    y += 16;
  };

  row("Subtotal", subTotal);
  if (discount > 0) row("Discount", -discount);
  if (shipping > 0) row("Shipping", shipping);
  if (cgst > 0) row("CGST", cgst);
  if (sgst > 0) row("SGST", sgst);
  if (igst > 0) row("IGST", igst);

  // Bold total box
  y += 6;
  doc
    .save()
    .rect(right - 240, y - 6, 240, 34)
    .strokeColor(THEME.hairline)
    .stroke()
    .restore();

  doc.font("Bold").fontSize(12).fillColor(THEME.text).text("Total Amount", labelX, y, {
    width: 160,
    align: "right",
  });
  doc.font("Bold").fontSize(13).fillColor(THEME.text).text(inr(grandTotal), valueX, y, {
    width: 80,
    align: "right",
  });

  // Seal/signature box (optional aesthetic)
  const signY = y + 46;
  doc.rect(right - 150, signY, 110, 48).strokeColor(THEME.hairline).stroke();
  doc.font("Regular").fontSize(9).fillColor(THEME.muted).text("Authorized Signatory", right - 145, signY + 54);

  return signY + 64;
}

function drawFooter(doc) {
  const y = doc.page.height - 86;

  // Gold hairline
  doc
    .save()
    .strokeColor(THEME.gold)
    .moveTo(LAYOUT.left, y)
    .lineTo(LAYOUT.right, y)
    .stroke()
    .restore();

  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(THEME.muted)
    .text("Thank you for your purchase!", 0, y + 10, { align: "center" });

  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(THEME.muted)
    .text(
      `Support: ${BUSINESS.email}  |  ${BUSINESS.phone}`,
      0,
      y + 24,
      { align: "center" }
    );

  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(THEME.muted)
    .text(`GSTIN: ${BUSINESS.gstin}`, 0, y + 38, { align: "center" });

  doc
    .font("Regular")
    .fontSize(9)
    .fillColor(THEME.light)
    .text(`${BUSINESS.addressLine1}`, 0, y + 52, { align: "center" })
    .text(`${BUSINESS.addressLine2}`, 0, y + 64, { align: "center" });
}

/**
 * Main generator (returns Buffer)
 * @param {object} order - Firestore order object
 * @param {string} orderId - Document ID / invoice number
 */
export async function generateInvoiceBuffer(order, orderId) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: LAYOUT.margin,
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Fonts
    const haveCustomFonts = tryRegisterFonts(doc);
    if (!haveCustomFonts) {
      // Use built-in fonts if custom missing
      doc.font("Helvetica");
      doc.registerFont("Regular", "Helvetica");
      doc.registerFont("Medium", "Helvetica-Bold");
      doc.registerFont("Bold", "Helvetica-Bold");
    }

    // Page 1 visuals
    drawWatermark(doc);
    drawHeader(doc, order, orderId);

    // Billing
    let y = drawBillingBox(doc, order, 160);

    // Items table (auto-paginates)
    y = drawItemsTable(doc, order, y);

    // Totals
    y = maybeAddPage(doc, y + 6);
    y = drawTotals(doc, order, y);

    // Footer on the last page
    drawFooter(doc);

    doc.end();
  });
}
