import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, budgetsTable, serviceOrdersTable, servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ── HELPERS ─────────────────────────────────────────────────────────────────
function esc(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | boolean | null | undefined)[]) {
  return cells.map(esc).join(",");
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmtBrl(v: number | null | undefined) {
  if (v == null) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sendCsv(res: any, filename: string, lines: string[]) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  // BOM for Excel / Numbers to detect UTF-8 correctly
  res.end("\uFEFF" + lines.join("\r\n"));
}

// ── CLIENTES ─────────────────────────────────────────────────────────────────
router.get("/export/clientes.csv", async (_req, res) => {
  try {
    const clients = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "client"))
      .orderBy(usersTable.name);

    const lines = [
      row("ID", "Nome", "E-mail", "Telefone", "Cadastrado em"),
      ...clients.map((c) =>
        row(c.id, c.name, c.email, c.phone ?? "", fmtDate(c.createdAt))
      ),
    ];
    const today = new Date().toISOString().slice(0, 10);
    sendCsv(res, `clientes_servcontrol_${today}.csv`, lines);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar exportação." });
  }
});

// ── ORÇAMENTOS ───────────────────────────────────────────────────────────────
router.get("/export/orcamentos.csv", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: budgetsTable.id,
        clientName: usersTable.name,
        serviceName: servicesTable.name,
        baseValue: budgetsTable.baseValue,
        profitMargin: budgetsTable.profitMargin,
        finalValue: budgetsTable.finalValue,
        status: budgetsTable.status,
        observations: budgetsTable.observations,
        createdAt: budgetsTable.createdAt,
      })
      .from(budgetsTable)
      .leftJoin(usersTable, eq(budgetsTable.clientId, usersTable.id))
      .leftJoin(servicesTable, eq(budgetsTable.serviceId, servicesTable.id))
      .orderBy(budgetsTable.createdAt);

    const STATUS: Record<string, string> = {
      // Portuguese (legacy)
      aguardando: "Aguardando",
      aprovado: "Aprovado",
      recusado: "Recusado",
      // English (current DB values)
      pending: "Aguardando",
      approved: "Aprovado",
      rejected: "Recusado",
    };

    const lines = [
      row(
        "ID", "Cliente", "Serviço", "Valor base (R$)", "Margem (%)",
        "Valor final (R$)", "Status", "Observações", "Data"
      ),
      ...rows.map((b) =>
        row(
          b.id,
          b.clientName ?? "",
          b.serviceName ?? "",
          fmtBrl(b.baseValue ?? 0),
          `${b.profitMargin ?? 0}%`,
          fmtBrl(b.finalValue ?? b.baseValue ?? 0),
          STATUS[b.status ?? ""] ?? (b.status ?? ""),
          b.observations ?? "",
          fmtDate(b.createdAt)
        )
      ),
    ];
    const today = new Date().toISOString().slice(0, 10);
    sendCsv(res, `orcamentos_servcontrol_${today}.csv`, lines);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar exportação." });
  }
});

// ── ORDENS DE SERVIÇO ─────────────────────────────────────────────────────────
router.get("/export/ordens.csv", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: serviceOrdersTable.id,
        clientName: usersTable.name,
        serviceName: servicesTable.name,
        basePrice: servicesTable.basePrice,
        profitMargin: servicesTable.profitMargin,
        description: serviceOrdersTable.description,
        status: serviceOrdersTable.status,
        paymentMethod: serviceOrdersTable.paymentMethod,
        amountPaid: serviceOrdersTable.amountPaid,
        preferredDate: serviceOrdersTable.preferredDate,
        createdAt: serviceOrdersTable.createdAt,
      })
      .from(serviceOrdersTable)
      .leftJoin(usersTable, eq(serviceOrdersTable.clientId, usersTable.id))
      .leftJoin(servicesTable, eq(serviceOrdersTable.serviceId, servicesTable.id))
      .orderBy(serviceOrdersTable.createdAt);

    const STATUS: Record<string, string> = {
      // Portuguese
      pendente: "Pendente",
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
      // English
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    const PAYMENT: Record<string, string> = {
      pix: "PIX",
      cash: "Dinheiro",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      transfer: "Transferência",
    };

    const lines = [
      row(
        "ID", "Cliente", "Serviço", "Descrição", "Status",
        "Preço (R$)", "Custo (R$)", "Lucro (R$)",
        "Forma Pagto", "Valor Pago (R$)",
        "Data Agendada", "Criado em"
      ),
      ...rows.map((o) => {
        const base = Number(o.basePrice ?? 0);
        const margin = Number(o.profitMargin ?? 0);
        const preco = base * (1 + margin / 100);
        const lucro = base * (margin / 100);
        return row(
          o.id,
          o.clientName ?? "",
          o.serviceName ?? "",
          o.description ?? "",
          STATUS[o.status ?? ""] ?? (o.status ?? ""),
          fmtBrl(preco),
          fmtBrl(base),
          fmtBrl(lucro),
          PAYMENT[o.paymentMethod ?? ""] ?? (o.paymentMethod ?? "Não informado"),
          fmtBrl(Number(o.amountPaid ?? 0)),
          fmtDate(o.preferredDate),
          fmtDate(o.createdAt)
        );
      }),
    ];
    const today = new Date().toISOString().slice(0, 10);
    sendCsv(res, `ordens_servcontrol_${today}.csv`, lines);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar exportação." });
  }
});

export default router;
