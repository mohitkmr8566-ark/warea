import PDFDocument from "pdfkit";
import path from "path";
import { format } from "date-fns";

export async function generateInvoiceBuffer(order, orderId) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: false });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // 🧭 Constants
    const LEFT = 50;
    const RIGHT = 550;
    const WIDTH = RIGHT - LEFT;
    const GOLD = "#C6A664";
    const ROW_H = 20;
    const PAGE_HEIGHT = doc.page.height;
    const FOOTER_Y = PAGE_HEIGHT - 130;

    // 🖋 Fonts
    try {
      const fontPath = path.join(process.cwd(), "public", "fonts");
      doc.registerFont("Regular", path.join(fontPath, "Poppins-Regular.ttf"));
      doc.registerFont("Bold", path.join(fontPath, "Poppins-Bold.ttf"));
    } catch {
      console.warn("⚠️ Fonts not found, using default");
    }

    // 🟡 Header with Logo + Gold Accent
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      doc.image(logoPath, LEFT, 40, { width: 70 });
    } catch {}
    doc.font("Bold").fontSize(22).text("Warea Jewellery Invoice", 0, 50, { align: "center" });
    doc.save().fillColor(GOLD).rect(LEFT, 80, WIDTH, 3).fill().restore();

    // 💧 Watermark
    const cx = doc.page.width / 2;
    const cy = doc.page.height / 2;
    doc.save();
    doc.font("Bold").fontSize(90).fillColor("#E8E0C5").opacity(0.1);
    doc.rotate(-30, { origin: [cx, cy] });
    doc.text("WAREA", cx - 200, cy, { align: "center" });
    doc.rotate(30, { origin: [cx, cy] });
    doc.opacity(1).fillColor("#000");
    doc.restore();

    // 🧾 Invoice Meta
    const createdAtDate =
      order?.createdAt?.toDate?.() ?? (order?.createdAt instanceof Date ? order.createdAt : new Date());
    doc.font("Regular").fontSize(10);
    doc.text(`Invoice No: ${orderId}`, LEFT, 100);
    doc.text(`Date: ${format(createdAtDate, "dd MMM yyyy")}`, LEFT, 115);
    doc.text(`Payment: ${order?.payment?.type || "Unknown"}`, LEFT, 130);
    doc.moveTo(LEFT, 150).lineTo(RIGHT, 150).stroke();

    let y = 165;

    // 📦 Billing Box — Overlap FIXED here ✅
    const BILLING_TOP = y;
    doc.font("Bold").fontSize(12).text("Billing Details", LEFT + 10, y);
    y += 20;
    const textOptions = { width: WIDTH - 20 };
    doc.font("Regular").fontSize(10);

    doc.text(`Name: ${order?.customer?.name || ""}`, LEFT + 10, y, textOptions);
    y = doc.y + 5;

    doc.text(`Phone: ${order?.customer?.phone || ""}`, LEFT + 10, y, textOptions);
    y = doc.y + 5;

    doc.text(`Address: ${order?.customer?.address || ""}`, LEFT + 10, y, textOptions);
    y = doc.y + 5;

    doc.text(
      `City: ${order?.customer?.city || ""}, State: ${order?.customer?.state || ""}`,
      LEFT + 10,
      y,
      textOptions
    );
    y = doc.y + 5;

    doc.text(`Pincode: ${order?.customer?.pincode || ""}`, LEFT + 10, y, textOptions);
    y = doc.y + 5;

    const BILLING_BOTTOM = y + 5;
    doc.rect(LEFT, BILLING_TOP, WIDTH, BILLING_BOTTOM - BILLING_TOP).stroke();
    y = BILLING_BOTTOM + 25;

    // 🪙 Table Header
    const drawTableHeader = () => {
      doc.font("Bold").fontSize(10);
      doc.text("No.", LEFT + 10, y);
      doc.text("Item", LEFT + 50, y);
      doc.text("Qty", LEFT + 250, y);
      doc.text("Price", LEFT + 310, y);
      doc.text("Total", LEFT + 400, y);
      y += 12;
      doc.moveTo(LEFT, y).lineTo(RIGHT, y).dash(1, { space: 2 }).stroke().undash();
      y += 8;
    };

    drawTableHeader();

    const rows = Array.isArray(order?.items) ? order.items : [];
    rows.forEach((item, idx) => {
      const qty = Math.max(1, Number(item?.qty || 1));
      const price = Number(item?.price || 0);
      const total = qty * price;

      doc.font("Regular");
      doc.text(String(idx + 1), LEFT + 10, y);
      doc.text(item?.name || "Item", LEFT + 50, y, { width: 180 });
      doc.text(String(qty), LEFT + 250, y);
      doc.text(`₹${price}`, LEFT + 310, y);
      doc.text(`₹${total}`, LEFT + 400, y);
      y += ROW_H;

      doc.moveTo(LEFT, y - 5).lineTo(RIGHT, y - 5).dash(1, { space: 2 }).stroke().undash();
    });

    // 📊 Table border
    const tableTop = BILLING_BOTTOM + 35;
    doc.rect(LEFT, tableTop, WIDTH, y - tableTop + 10).stroke();

    // 🪙 Total + Authorized Signatory
    doc.font("Bold").fontSize(12).text(`Total Amount: ₹${Number(order?.total || 0)}`, RIGHT - 150, y + 15);

    const signBoxY = y + 45;
    doc.rect(RIGHT - 150, signBoxY, 100, 50).stroke();
    doc.font("Regular").fontSize(9).text("Authorized Signatory", RIGHT - 145, signBoxY + 55);

    // 🦶 Footer (draw once, not looped)
    doc.save();
    doc.strokeColor(GOLD).moveTo(LEFT, FOOTER_Y).lineTo(RIGHT, FOOTER_Y).stroke();
    doc.fillColor("#777").font("Regular").fontSize(10);
    doc.text("Thank you for your purchase!", 0, FOOTER_Y + 12, { align: "center" });
    doc.text("Support: support@warea.in  |  +91 98765 43210", 0, FOOTER_Y + 26, { align: "center" });
    doc.text("Warea Creations  |  GSTIN: 09FNAPB5029Q1ZO", 0, FOOTER_Y + 40, { align: "center" });
    doc.text(
      "120 D1, 2nd Floor, SK Medical Store, Nauraiya Khera, Kanpur Nagar, Uttar Pradesh – 208022",
      0,
      FOOTER_Y + 54,
      { align: "center" }
    );
    doc.fillColor("#999").fontSize(9).text(
      "Registered under GST Act, Government of India",
      0,
      FOOTER_Y + 70,
      { align: "center" }
    );
    doc.fillColor("#777").fontSize(9).text(
      `Page 1 of 1`,
      RIGHT - 100,
      FOOTER_Y + 12,
      { width: 100, align: "right" }
    );
    doc.restore();

    doc.end();
  });
}
