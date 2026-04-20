import { Router } from "express";
import { db } from "@workspace/db";
import { serviceOrdersTable, usersTable, servicesTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/orders", async (req, res) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;

    const rows = await db
      .select({
        id: serviceOrdersTable.id,
        budgetId: serviceOrdersTable.budgetId,
        clientId: serviceOrdersTable.clientId,
        serviceId: serviceOrdersTable.serviceId,
        description: serviceOrdersTable.description,
        status: serviceOrdersTable.status,
        preferredDate: serviceOrdersTable.preferredDate,
        preferredTime: serviceOrdersTable.preferredTime,
        paymentMethod: serviceOrdersTable.paymentMethod,
        amountPaid: serviceOrdersTable.amountPaid,
        createdAt: serviceOrdersTable.createdAt,
        updatedAt: serviceOrdersTable.updatedAt,
        clientName: usersTable.name,
        serviceName: servicesTable.name,
        serviceBasePrice: servicesTable.basePrice,
        serviceProfitMargin: servicesTable.profitMargin,
      })
      .from(serviceOrdersTable)
      .leftJoin(usersTable, eq(serviceOrdersTable.clientId, usersTable.id))
      .leftJoin(servicesTable, eq(serviceOrdersTable.serviceId, servicesTable.id))
      .where(clientId !== undefined ? eq(serviceOrdersTable.clientId, clientId) : undefined as any)
      .orderBy(serviceOrdersTable.createdAt);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { budgetId, clientId, serviceId, description, preferredDate, preferredTime } = req.body;
    if (!clientId || !serviceId) {
      return res.status(400).json({ error: "clientId e serviceId são obrigatórios." });
    }
    const [order] = await db
      .insert(serviceOrdersTable)
      .values({
        budgetId: budgetId ?? null,
        clientId: Number(clientId),
        serviceId: Number(serviceId),
        description: description ?? null,
        preferredDate: preferredDate ?? null,
        preferredTime: preferredTime ?? null,
        status: "pending",
      })
      .returning();
    return res.status(201).json(order);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const { status, description, paymentMethod, amountPaid } = req.body;
    const [order] = await db
      .update(serviceOrdersTable)
      .set({
        ...(status !== undefined && { status }),
        ...(description !== undefined && { description }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(amountPaid !== undefined && { amountPaid: String(amountPaid) }),
        updatedAt: sql`now()`,
      })
      .where(eq(serviceOrdersTable.id, Number(req.params.id)))
      .returning();
    if (!order) return res.status(404).json({ error: "Ordem não encontrada." });
    return res.json(order);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
