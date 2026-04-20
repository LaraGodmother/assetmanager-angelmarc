import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "client"]);

export const budgetStatusEnum = pgEnum("budget_status", [
  "pending",
  "approved",
  "rejected",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "cancelled",
  "done",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "in_progress",
  "done",
  "cancelled",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("client"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  rules: text("rules"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => usersTable.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => servicesTable.id),
  baseValue: decimal("base_value", { precision: 10, scale: 2 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  finalValue: decimal("final_value", { precision: 10, scale: 2 }).notNull(),
  observations: text("observations"),
  status: budgetStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => usersTable.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => servicesTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceOrdersTable = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").references(() => budgetsTable.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => usersTable.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => servicesTable.id),
  description: text("description"),
  status: orderStatusEnum("status").notNull().default("pending"),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export const selectUserSchema = createSelectSchema(usersTable).omit({
  passwordHash: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertServiceSchema = createInsertSchema(servicesTable).omit({
  id: true,
  createdAt: true,
});
export const selectServiceSchema = createSelectSchema(servicesTable);
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = z.infer<typeof selectServiceSchema>;

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({
  id: true,
  createdAt: true,
});
export const selectBudgetSchema = createSelectSchema(budgetsTable);
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = z.infer<typeof selectBudgetSchema>;

export const insertAppointmentSchema = createInsertSchema(
  appointmentsTable
).omit({ id: true, createdAt: true });
export const selectAppointmentSchema = createSelectSchema(appointmentsTable);
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = z.infer<typeof selectAppointmentSchema>;

export const insertOrderSchema = createInsertSchema(serviceOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectOrderSchema = createSelectSchema(serviceOrdersTable);
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type ServiceOrder = z.infer<typeof selectOrderSchema>;
