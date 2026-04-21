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

// ── DASHBOARD FINANCEIRO ──────────────────────────────────────────────────────
router.get("/export/financeiro.csv", async (req, res) => {
  try {
    const period = (req.query.period as string) || "total";

    // Fetch all data
    const [allBudgets, allOrders] = await Promise.all([
      db
        .select({
          id: budgetsTable.id,
          clientId: budgetsTable.clientId,
          clientName: usersTable.name,
          serviceName: servicesTable.name,
          baseValue: budgetsTable.baseValue,
          profitMargin: budgetsTable.profitMargin,
          finalValue: budgetsTable.finalValue,
          status: budgetsTable.status,
          createdAt: budgetsTable.createdAt,
        })
        .from(budgetsTable)
        .leftJoin(usersTable, eq(budgetsTable.clientId, usersTable.id))
        .leftJoin(servicesTable, eq(budgetsTable.serviceId, servicesTable.id)),
      db
        .select({
          id: serviceOrdersTable.id,
          clientId: serviceOrdersTable.clientId,
          clientName: usersTable.name,
          serviceName: servicesTable.name,
          basePrice: servicesTable.basePrice,
          profitMargin: servicesTable.profitMargin,
          status: serviceOrdersTable.status,
          paymentMethod: serviceOrdersTable.paymentMethod,
          amountPaid: serviceOrdersTable.amountPaid,
          createdAt: serviceOrdersTable.createdAt,
        })
        .from(serviceOrdersTable)
        .leftJoin(usersTable, eq(serviceOrdersTable.clientId, usersTable.id))
        .leftJoin(servicesTable, eq(serviceOrdersTable.serviceId, servicesTable.id)),
    ]);

    // Period filter
    const now = new Date();
    const start = new Date();
    if (period === "mes") { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else if (period === "trimestre") { start.setMonth(now.getMonth() - 2, 1); start.setHours(0, 0, 0, 0); }
    else if (period === "ano") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }

    const filterDate = (d: string | Date | null) => {
      if (period === "total" || !d) return true;
      return new Date(d) >= start;
    };

    const budgets = allBudgets.filter((b) => filterDate(b.createdAt));
    const orders = allOrders.filter((o) => filterDate(o.createdAt));

    // Status maps (bilingual)
    const BSTATUS: Record<string, string> = {
      aguardando: "Aguardando", aprovado: "Aprovado", recusado: "Recusado",
      pending: "Aguardando", approved: "Aprovado", rejected: "Recusado",
    };
    const OSTATUS: Record<string, string> = {
      pendente: "Pendente", em_andamento: "Em Andamento", concluido: "Concluído", cancelado: "Cancelado",
      pending: "Pendente", in_progress: "Em Andamento", completed: "Concluído", cancelled: "Cancelado",
    };
    const PAYMENT: Record<string, string> = {
      pix: "PIX", cash: "Dinheiro", credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito", transfer: "Transferência",
    };

    const isApproved = (s: string | null) => s === "aprovado" || s === "approved";
    const isRejected = (s: string | null) => s === "recusado" || s === "rejected";

    const approved = budgets.filter((b) => isApproved(b.status));
    const faturamento = approved.reduce((s, b) => s + Number(b.finalValue ?? b.baseValue ?? 0), 0);
    const lucro = approved.reduce((s, b) => s + Number(b.baseValue ?? 0) * (Number(b.profitMargin ?? 0) / 100), 0);
    const custo = faturamento - lucro;
    const totalRecebido = orders.reduce((s, o) => s + Number(o.amountPaid ?? 0), 0);
    const totalAReceber = Math.max(0, faturamento - totalRecebido);
    const ticketMedio = approved.length > 0 ? faturamento / approved.length : 0;
    const margemMedia = approved.length > 0
      ? approved.reduce((s, b) => s + Number(b.profitMargin ?? 0), 0) / approved.length
      : 0;
    const rejected = budgets.filter((b) => isRejected(b.status));
    const totalRejected = rejected.reduce((s, b) => s + Number(b.finalValue ?? b.baseValue ?? 0), 0);
    const totalAll = budgets.reduce((s, b) => s + Number(b.finalValue ?? b.baseValue ?? 0), 0);
    const inadimplencia = totalAll > 0 ? (totalRejected / totalAll) * 100 : 0;

    // Order status counts
    const oStatus = { concluidos: 0, emAndamento: 0, pendentes: 0, cancelados: 0 };
    orders.forEach((o) => {
      const s = o.status ?? "";
      if (s === "concluido" || s === "completed") oStatus.concluidos++;
      else if (s === "em_andamento" || s === "in_progress") oStatus.emAndamento++;
      else if (s === "pendente" || s === "pending") oStatus.pendentes++;
      else if (s === "cancelado" || s === "cancelled") oStatus.cancelados++;
    });

    // Budget status counts
    const bStatus = { aprovados: 0, aguardando: 0, recusados: 0 };
    budgets.forEach((b) => {
      if (isApproved(b.status)) bStatus.aprovados++;
      else if (isRejected(b.status)) bStatus.recusados++;
      else bStatus.aguardando++;
    });

    // Top clients
    const clientMap: Record<number, { name: string; total: number; count: number }> = {};
    approved.forEach((b) => {
      const id = b.clientId ?? 0;
      if (!clientMap[id]) clientMap[id] = { name: b.clientName ?? "–", total: 0, count: 0 };
      clientMap[id].total += Number(b.finalValue ?? b.baseValue ?? 0);
      clientMap[id].count++;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 10);

    // Revenue by service
    const serviceMap: Record<string, number> = {};
    approved.forEach((b) => {
      const name = b.serviceName ?? "Outros";
      serviceMap[name] = (serviceMap[name] ?? 0) + Number(b.finalValue ?? b.baseValue ?? 0);
    });
    const byService = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]);

    // Payment methods
    const payMap: Record<string, number> = {};
    orders.forEach((o) => {
      const m = o.paymentMethod ?? "nao_informado";
      payMap[m] = (payMap[m] ?? 0) + 1;
    });
    const totalPay = orders.length || 1;
    const payments = Object.entries(payMap)
      .sort((a, b) => b[1] - a[1])
      .map(([m, count]) => ({ label: PAYMENT[m] ?? m, count, pct: (count / totalPay) * 100 }));

    const PERIOD_LABEL: Record<string, string> = {
      mes: "Mês atual", trimestre: "Trimestre", ano: "Ano atual", total: "Todo o período",
    };
    const today = new Date().toISOString().slice(0, 10);

    const lines = [
      // ─── KPIs ───────────────────────────────────────────────────────────
      row("RESUMO FINANCEIRO", ""),
      row("Período", PERIOD_LABEL[period] ?? period),
      row("Data de geração", today),
      row(""),
      row("INDICADOR", "VALOR"),
      row("Faturamento aprovado", fmtBrl(faturamento)),
      row("Lucro líquido", fmtBrl(lucro)),
      row("Custo total", fmtBrl(custo)),
      row("Total recebido", fmtBrl(totalRecebido)),
      row("A receber", fmtBrl(totalAReceber)),
      row("Ticket médio", fmtBrl(ticketMedio)),
      row("Margem média", `${margemMedia.toFixed(1)}%`),
      row("Inadimplência", `${inadimplencia.toFixed(1)}%`),
      row(""),
      // ─── STATUS ORDENS ──────────────────────────────────────────────────
      row("STATUS DAS ORDENS", "Qtd"),
      row("Concluídas", oStatus.concluidos),
      row("Em andamento", oStatus.emAndamento),
      row("Pendentes", oStatus.pendentes),
      row("Canceladas", oStatus.cancelados),
      row(""),
      // ─── STATUS ORÇAMENTOS ──────────────────────────────────────────────
      row("STATUS DOS ORÇAMENTOS", "Qtd"),
      row("Aprovados", bStatus.aprovados),
      row("Aguardando", bStatus.aguardando),
      row("Recusados", bStatus.recusados),
      row(""),
      // ─── TOP CLIENTES ────────────────────────────────────────────────────
      row("TOP CLIENTES", "Total (R$)", "Qtd orçamentos"),
      ...topClients.map((c) => row(c.name, fmtBrl(c.total), c.count)),
      row(""),
      // ─── RECEITA POR SERVIÇO ─────────────────────────────────────────────
      row("RECEITA POR TIPO DE SERVIÇO", "Total (R$)"),
      ...byService.map(([name, val]) => row(name, fmtBrl(val))),
      row(""),
      // ─── FORMAS DE PAGAMENTO ─────────────────────────────────────────────
      row("FORMAS DE PAGAMENTO", "Qtd", "%"),
      ...payments.map((p) => row(p.label, p.count, `${p.pct.toFixed(1)}%`)),
    ];

    sendCsv(res, `financeiro_servcontrol_${period}_${today}.csv`, lines);
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar exportação financeira." });
  }
});

export default router;
