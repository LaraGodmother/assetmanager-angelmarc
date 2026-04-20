import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/services", async (_req, res) => {
  try {
    const services = await db
      .select()
      .from(servicesTable)
      .orderBy(servicesTable.name);
    return res.json(services);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/services/:id", async (req, res) => {
  try {
    const [service] = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, Number(req.params.id)))
      .limit(1);
    if (!service) return res.status(404).json({ error: "Serviço não encontrado." });
    return res.json(service);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/services", async (req, res) => {
  try {
    const { name, description, basePrice, profitMargin, rules, active } = req.body;
    if (!name || !description || basePrice == null) {
      return res.status(400).json({ error: "name, description e basePrice são obrigatórios." });
    }
    const [service] = await db
      .insert(servicesTable)
      .values({
        name,
        description,
        basePrice: String(basePrice),
        profitMargin: profitMargin != null ? String(profitMargin) : "0",
        rules,
        active: active ?? true,
      })
      .returning();
    return res.status(201).json(service);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/services/:id", async (req, res) => {
  try {
    const { name, description, basePrice, profitMargin, rules, active } = req.body;
    const [service] = await db
      .update(servicesTable)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice: String(basePrice) }),
        ...(profitMargin !== undefined && { profitMargin: String(profitMargin) }),
        ...(rules !== undefined && { rules }),
        ...(active !== undefined && { active }),
      })
      .where(eq(servicesTable.id, Number(req.params.id)))
      .returning();
    if (!service) return res.status(404).json({ error: "Serviço não encontrado." });
    return res.json(service);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    await db
      .delete(servicesTable)
      .where(eq(servicesTable.id, Number(req.params.id)));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
