import { Router } from "express";
import { db } from "@workspace/db";
import { budgetsTable, usersTable, servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { COMPANY } from "../config/company";

const router = Router();

const BRAND_BLUE = `#${COMPANY.pdfColorPrimary}`;
const BRAND_ORANGE = `#${COMPANY.pdfColorAccent}`;
const COMPANY_NAME = COMPANY.name;
const COMPANY_CNPJ = `CNPJ: ${COMPANY.cnpj}`;
const COMPANY_CITY = COMPANY.city;
const COMPANY_PHONE = COMPANY.phone;
const COMPANY_EMAIL = COMPANY.email;

function fmtBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

interface ItemRow {
  qty: string;
  desc: string;
  unitPrice: number | null;
  lineTotal: number | null;
}

function parseObsLine(line: string): ItemRow {
  // "2 câmeras intelbras R$500" or "2 câmeras R$500,00"
  let m = line.match(/^(\d+(?:[.,]\d+)?)\s+(.+?)\s+R\$\s*([\d.]+(?:,\d{1,2})?)\s*$/i);
  if (m) {
    const qty = parseFloat(m[1].replace(",", "."));
    const price = parseFloat(m[3].replace(/\./g, "").replace(",", "."));
    return { qty: m[1], desc: m[2].trim(), unitPrice: price, lineTotal: qty * price };
  }
  // "cabos e conectores R$500"
  m = line.match(/^(.+?)\s+R\$\s*([\d.]+(?:,\d{1,2})?)\s*$/i);
  if (m) {
    const price = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
    return { qty: "1", desc: m[1].trim(), unitPrice: price, lineTotal: price };
  }
  return { qty: "1", desc: line, unitPrice: null, lineTotal: null };
}

function buildItemRows(
  serviceName: string,
  observations: string | null | undefined,
  finalValue: number
): ItemRow[] {
  const lines = (observations ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [{ qty: "1", desc: serviceName || "Serviço", unitPrice: finalValue, lineTotal: finalValue }];
  }

  const parsed = lines.map(parseObsLine);
  const hasPrices = parsed.some((i) => i.unitPrice !== null);

  if (!hasPrices) {
    // No prices detected: show service row + obs lines as descriptions
    return [
      { qty: "1", desc: serviceName || "Serviço", unitPrice: finalValue, lineTotal: finalValue },
      ...parsed,
    ];
  }

  return parsed;
}

router.get("/orcamentos/:id/pdf", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        id: budgetsTable.id,
        clientId: budgetsTable.clientId,
        serviceId: budgetsTable.serviceId,
        baseValue: budgetsTable.baseValue,
        profitMargin: budgetsTable.profitMargin,
        finalValue: budgetsTable.finalValue,
        observations: budgetsTable.observations,
        paymentConditions: budgetsTable.paymentConditions,
        status: budgetsTable.status,
        createdAt: budgetsTable.createdAt,
        clientName: usersTable.name,
        clientPhone: usersTable.phone,
        clientDocument: usersTable.document,
        clientAddress: usersTable.address,
        clientEmail: usersTable.email,
        serviceName: servicesTable.name,
      })
      .from(budgetsTable)
      .leftJoin(usersTable, eq(budgetsTable.clientId, usersTable.id))
      .leftJoin(servicesTable, eq(budgetsTable.serviceId, servicesTable.id))
      .where(eq(budgetsTable.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Orçamento não encontrado." });

    const finalValue = Number(row.finalValue);
    const baseValue = Number(row.baseValue);
    const discount = 0;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="orcamento_${row.id}_${(row.clientName ?? "cliente").replace(/\s+/g, "_")}.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const W = 595.28;
    const MARGIN = 40;
    const COL = W - MARGIN * 2;

    // ── HEADER BAND ─────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill(BRAND_BLUE);

    // Title
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("ORÇAMENTO", MARGIN, 20, { width: COL / 2 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#BBDEFB")
      .text(`Nº ${String(row.id).padStart(4, "0")}`, MARGIN, 55)
      .text(`Data: ${fmtDate(new Date(row.createdAt))}`, MARGIN, 70);

    // Company info on right side of header
    const RX = MARGIN + COL / 2;
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(COMPANY_NAME, RX, 18, { width: COL / 2, align: "right" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#BBDEFB")
      .text(COMPANY_CNPJ, RX, 36, { width: COL / 2, align: "right" })
      .text(COMPANY_CITY, RX, 48, { width: COL / 2, align: "right" })
      .text(`Tel: ${COMPANY_PHONE}`, RX, 60, { width: COL / 2, align: "right" })
      .text(COMPANY_EMAIL, RX, 72, { width: COL / 2, align: "right" });

    // Orange accent bar
    doc.rect(0, 110, W, 6).fill(BRAND_ORANGE);

    let Y = 135;

    // ── CLIENT SECTION ───────────────────────────────────────────────────────
    doc
      .fillColor(BRAND_BLUE)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("DADOS DO CLIENTE", MARGIN, Y);

    Y += 18;

    doc.rect(MARGIN, Y, COL, 0.5).fill("#E3F2FD");
    Y += 8;

    function labelValue(label: string, value: string, x: number, y: number, w: number) {
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#546E7A").text(label, x, y, { width: w });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#212121")
        .text(value || "—", x, y + 12, { width: w });
    }

    const halfCol = (COL - 10) / 2;
    labelValue("Cliente:", row.clientName ?? "", MARGIN, Y, halfCol);
    labelValue("CPF / CNPJ:", row.clientDocument ?? "", MARGIN + halfCol + 10, Y, halfCol);

    Y += 34;
    labelValue("Endereço:", row.clientAddress ?? "", MARGIN, Y, halfCol);
    labelValue("Telefone:", row.clientPhone ?? "", MARGIN + halfCol + 10, Y, halfCol);

    Y += 40;

    // ── SERVICES TABLE ───────────────────────────────────────────────────────
    doc
      .fillColor(BRAND_BLUE)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("DESCRIÇÃO DOS SERVIÇOS", MARGIN, Y);

    Y += 16;

    // Column widths
    const COL_DESC = COL * 0.52;
    const COL_QTY  = COL * 0.08;
    const COL_UNIT = COL * 0.20;
    const COL_TOTAL = COL * 0.20;

    // Header row
    doc.rect(MARGIN, Y, COL, 22).fill(BRAND_BLUE);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIÇÃO DO SERVIÇO", MARGIN + 6,                              Y + 7, { width: COL_DESC - 6 });
    doc.text("QTD",                  MARGIN + COL_DESC + 2,                   Y + 7, { width: COL_QTY,   align: "center" });
    doc.text("UNIT. (R$)",           MARGIN + COL_DESC + COL_QTY + 2,        Y + 7, { width: COL_UNIT,  align: "right" });
    doc.text("TOTAL (R$)",           MARGIN + COL_DESC + COL_QTY + COL_UNIT + 2, Y + 7, { width: COL_TOTAL - 6, align: "right" });
    Y += 22;

    // Build item rows from observations
    const items = buildItemRows(row.serviceName ?? "", row.observations, finalValue);

    // Compute grand total from items if all have prices; else use finalValue
    const itemsTotal = items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
    const grandTotal = itemsTotal > 0 ? itemsTotal : finalValue;

    // Render each item row
    items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? "#F5F9FF" : "#FFFFFF";
      const textH = Math.max(
        18,
        (doc as any).heightOfString(item.desc, { width: COL_DESC - 12, font: "Helvetica", fontSize: 9 }) + 8
      );
      const rowH = textH + 8;

      doc.rect(MARGIN, Y, COL, rowH).fill(rowBg).stroke("#D1E8FF");

      const midY = Y + rowH / 2 - 5;

      doc.fillColor("#212121").font("Helvetica").fontSize(9);
      // Description — allow wrap
      doc.text(item.desc || "—", MARGIN + 6, Y + 6, { width: COL_DESC - 12, lineBreak: true });
      // Qty
      doc.text(item.qty, MARGIN + COL_DESC + 2, midY, { width: COL_QTY, align: "center" });
      // Unit price
      if (item.unitPrice !== null) {
        doc.text(fmtBrl(item.unitPrice), MARGIN + COL_DESC + COL_QTY + 2, midY, { width: COL_UNIT, align: "right" });
        doc.text(fmtBrl(item.lineTotal!), MARGIN + COL_DESC + COL_QTY + COL_UNIT + 2, midY, { width: COL_TOTAL - 6, align: "right" });
      } else {
        doc.fillColor("#94a3b8").text("—", MARGIN + COL_DESC + COL_QTY + 2, midY, { width: COL_UNIT, align: "right" });
        doc.text("—", MARGIN + COL_DESC + COL_QTY + COL_UNIT + 2, midY, { width: COL_TOTAL - 6, align: "right" });
      }

      Y += rowH;
    });

    Y += 10;

    // ── TOTALS ───────────────────────────────────────────────────────────────
    const totalBoxW = 200;
    const TX = W - MARGIN - totalBoxW;

    doc.rect(TX, Y, totalBoxW, 72).fill("#F5F9FF").stroke("#D1E8FF");

    doc.fillColor("#546E7A").font("Helvetica").fontSize(9);
    doc.text("Subtotal:", TX + 10, Y + 10, { width: 90 });
    doc.text("Desconto:", TX + 10, Y + 26, { width: 90 });

    doc.fillColor(BRAND_BLUE).font("Helvetica-Bold").fontSize(10);
    doc.text("Total Geral:", TX + 10, Y + 44, { width: 90 });

    doc.fillColor("#212121").font("Helvetica").fontSize(9);
    doc.text(fmtBrl(grandTotal), TX + 100, Y + 10, { width: 90, align: "right" });
    doc.text(fmtBrl(discount), TX + 100, Y + 26, { width: 90, align: "right" });

    doc.fillColor(BRAND_BLUE).font("Helvetica-Bold").fontSize(11);
    doc.text(fmtBrl(grandTotal), TX + 100, Y + 42, { width: 90, align: "right" });

    Y += 90;

    // ── PAYMENT CONDITIONS ────────────────────────────────────────────────────
    const paymentKeys = (row.paymentConditions ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (paymentKeys.length > 0) {
      const PAYMENT_LABELS: Record<string, string> = {
        pix: "PIX",
        debit: "Cartão de Débito",
        credit: "Parcelamento no Crédito",
      };

      doc
        .fillColor(BRAND_BLUE)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("CONDIÇÕES DE PAGAMENTO", MARGIN, Y);

      Y += 16;
      doc.rect(MARGIN, Y, COL, 0.5).fill("#E3F2FD");
      Y += 10;

      const chipW = 160;
      const chipH = 26;
      const chipGap = 10;
      let chipX = MARGIN;

      paymentKeys.forEach((key) => {
        const label = PAYMENT_LABELS[key] ?? key;
        doc.roundedRect(chipX, Y, chipW, chipH, 4).fill("#EFF6FF");
        doc.roundedRect(chipX, Y, chipW, chipH, 4).stroke(BRAND_BLUE);
        doc
          .fillColor(BRAND_BLUE)
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(label, chipX + 8, Y + 8, { width: chipW - 16, align: "center" });
        chipX += chipW + chipGap;
      });

      Y += chipH + 20;
    }

    // ── OBSERVATIONS ─────────────────────────────────────────────────────────
    doc
      .fillColor(BRAND_BLUE)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("OBSERVAÇÕES", MARGIN, Y);

    Y += 16;
    doc.rect(MARGIN, Y, COL, 0.5).fill("#E3F2FD");
    Y += 8;

    const obs = [
      "1. Este orçamento é válido por 30 dias a partir da data de emissão.",
      "2. O prazo de entrega será combinado após aprovação do orçamento.",
      "3. Em caso de desistência após início do serviço, será cobrado o valor proporcional.",
    ];

    doc.fillColor("#424242").font("Helvetica").fontSize(9);
    obs.forEach((line) => {
      doc.text(line, MARGIN, Y, { width: COL });
      Y += 14;
    });

    Y += 20;

    // ── SIGNATURES ───────────────────────────────────────────────────────────
    doc
      .fillColor("#546E7A")
      .font("Helvetica")
      .fontSize(9)
      .text(`Data: _____ / _____ / _____________`, MARGIN, Y);

    Y += 30;

    const sigW = (COL - 20) / 2;

    doc.rect(MARGIN, Y + 20, sigW, 0.8).fill("#546E7A");
    doc
      .fillColor("#546E7A")
      .font("Helvetica")
      .fontSize(8.5)
      .text("Assinatura do Cliente", MARGIN, Y + 24, { width: sigW, align: "center" });

    doc.rect(MARGIN + sigW + 20, Y + 20, sigW, 0.8).fill("#546E7A");
    doc
      .fillColor("#546E7A")
      .font("Helvetica")
      .fontSize(8.5)
      .text("Assinatura do Técnico", MARGIN + sigW + 20, Y + 24, { width: sigW, align: "center" });

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const pageH = 841.89;
    doc.rect(0, pageH - 30, W, 30).fill(BRAND_BLUE);
    doc
      .fillColor("#BBDEFB")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `${COMPANY_NAME}  •  ${COMPANY_PHONE}  •  ${COMPANY_EMAIL}`,
        MARGIN,
        pageH - 18,
        { width: COL, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({ error: "Erro ao gerar PDF." });
  }
});

export default router;
