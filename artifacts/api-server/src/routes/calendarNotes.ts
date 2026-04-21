import { Router } from "express";
import { db } from "@workspace/db";
import { calendarNotesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/calendar-notes", async (_req, res) => {
  try {
    const notes = await db
      .select()
      .from(calendarNotesTable)
      .orderBy(calendarNotesTable.date);
    return res.json(notes);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/calendar-notes", async (req, res) => {
  try {
    const { date, note } = req.body;
    if (!date || !note?.trim()) {
      return res.status(400).json({ error: "date e note são obrigatórios." });
    }
    const [existing] = await db
      .select()
      .from(calendarNotesTable)
      .where(eq(calendarNotesTable.date, date))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(calendarNotesTable)
        .set({ note: note.trim(), updatedAt: new Date() })
        .where(eq(calendarNotesTable.date, date))
        .returning();
      return res.json(updated);
    }

    const [created] = await db
      .insert(calendarNotesTable)
      .values({ date, note: note.trim() })
      .returning();
    return res.status(201).json(created);
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/calendar-notes/:date", async (req, res) => {
  try {
    await db
      .delete(calendarNotesTable)
      .where(eq(calendarNotesTable.date, req.params.date));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
