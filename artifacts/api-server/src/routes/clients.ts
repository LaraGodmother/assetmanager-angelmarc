import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const CLIENT_FIELDS = {
  id: usersTable.id,
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  phone: usersTable.phone,
  document: usersTable.document,
  address: usersTable.address,
  createdAt: usersTable.createdAt,
};

router.get("/clients", async (_req, res) => {
  try {
    const clients = await db
      .select(CLIENT_FIELDS)
      .from(usersTable)
      .where(eq(usersTable.role, "client"))
      .orderBy(usersTable.name);
    return res.json(clients);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const [client] = await db
      .select(CLIENT_FIELDS)
      .from(usersTable)
      .where(eq(usersTable.id, Number(req.params.id)))
      .limit(1);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado." });
    return res.json(client);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/clients/:id", async (req, res) => {
  try {
    const { name, phone, document, address } = req.body;
    const [client] = await db
      .update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(document !== undefined && { document }),
        ...(address !== undefined && { address }),
      })
      .where(eq(usersTable.id, Number(req.params.id)))
      .returning(CLIENT_FIELDS);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado." });
    return res.json(client);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
