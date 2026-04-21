import { Router } from "express";
import { db } from "@workspace/db";
import { budgetsTable, usersTable, servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const budgetWithDetails = async (clientId?: number) => {
  const rows = await db
    .select({
      id: budgetsTable.id,
      clientId: budgetsTable.clientId,
      serviceId: budgetsTable.serviceId,
      baseValue: budgetsTable.baseValue,
      profitMargin: budgetsTable.profitMargin,
      finalValue: budgetsTable.finalValue,
      observations: budgetsTable.observations,
      status: budgetsTable.status,
      createdAt: budgetsTable.createdAt,
      clientName: usersTable.name,
      clientPhone: usersTable.phone,
      serviceName: servicesTable.name,
    })
    .from(budgetsTable)
    .leftJoin(usersTable, eq(budgetsTable.clientId, usersTable.id))
    .leftJoin(servicesTable, eq(budgetsTable.serviceId, servicesTable.id))
    .where(clientId !== undefined ? eq(budgetsTable.clientId, clientId) : undefined as any)
    .orderBy(budgetsTable.createdAt);
  return rows;
};

router.get("/budgets", async (req, res) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const rows = await budgetWithDetails(clientId);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/budgets/:id", async (req, res) => {
  try {
    const [budget] = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, Number(req.params.id)))
      .limit(1);
    if (!budget) return res.status(404).json({ error: "Orçamento não encontrado." });
    return res.json(budget);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    const { clientId, serviceId, baseValue, profitMargin = 0, observations } = req.body;
    if (!clientId || !serviceId || baseValue == null) {
      return res.status(400).json({ error: "clientId, serviceId e baseValue são obrigatórios." });
    }
    const base = Number(baseValue);
    const margin = Number(profitMargin);
    const finalValue = base + base * (margin / 100);

    const [budget] = await db
      .insert(budgetsTable)
      .values({
        clientId: Number(clientId),
        serviceId: Number(serviceId),
        baseValue: String(base),
        profitMargin: String(margin),
        finalValue: String(finalValue.toFixed(2)),
        observations: observations ?? null,
        status: "pending",
      })
      .returning();
    return res.status(201).json(budget);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/budgets/:id", async (req, res) => {
  try {
    const { status, baseValue, profitMargin, finalValue, observations } = req.body;

    let computedFinal = finalValue;
    if (baseValue !== undefined && profitMargin !== undefined) {
      const base = Number(baseValue);
      const margin = Number(profitMargin);
      computedFinal = String((base + base * (margin / 100)).toFixed(2));
    }

    const [budget] = await db
      .update(budgetsTable)
      .set({
        ...(status !== undefined && { status }),
        ...(baseValue !== undefined && { baseValue: String(baseValue) }),
        ...(profitMargin !== undefined && { profitMargin: String(profitMargin) }),
        ...(computedFinal !== undefined && { finalValue: String(computedFinal) }),
        ...(observations !== undefined && { observations }),
      })
      .where(eq(budgetsTable.id, Number(req.params.id)))
      .returning();
    if (!budget) return res.status(404).json({ error: "Orçamento não encontrado." });
    return res.json(budget);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
