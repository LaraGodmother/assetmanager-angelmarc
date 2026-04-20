import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, usersTable, servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/appointments", async (req, res) => {
  try {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;

    const rows = await db
      .select({
        id: appointmentsTable.id,
        clientId: appointmentsTable.clientId,
        serviceId: appointmentsTable.serviceId,
        date: appointmentsTable.date,
        time: appointmentsTable.time,
        status: appointmentsTable.status,
        notes: appointmentsTable.notes,
        createdAt: appointmentsTable.createdAt,
        clientName: usersTable.name,
        serviceName: servicesTable.name,
      })
      .from(appointmentsTable)
      .leftJoin(usersTable, eq(appointmentsTable.clientId, usersTable.id))
      .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
      .where(clientId !== undefined ? eq(appointmentsTable.clientId, clientId) : undefined as any)
      .orderBy(appointmentsTable.date, appointmentsTable.time);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const { clientId, serviceId, date, time, notes } = req.body;
    if (!clientId || !serviceId || !date || !time) {
      return res.status(400).json({ error: "clientId, serviceId, date e time são obrigatórios." });
    }
    const [appt] = await db
      .insert(appointmentsTable)
      .values({
        clientId: Number(clientId),
        serviceId: Number(serviceId),
        date,
        time,
        notes: notes ?? null,
        status: "scheduled",
      })
      .returning();
    return res.status(201).json(appt);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/appointments/:id", async (req, res) => {
  try {
    const { status, date, time, notes } = req.body;
    const [appt] = await db
      .update(appointmentsTable)
      .set({
        ...(status !== undefined && { status }),
        ...(date !== undefined && { date }),
        ...(time !== undefined && { time }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(appointmentsTable.id, Number(req.params.id)))
      .returning();
    if (!appt) return res.status(404).json({ error: "Agendamento não encontrado." });
    return res.json(appt);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    await db
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, Number(req.params.id)));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
