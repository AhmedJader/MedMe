import { pgTable, uuid, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
  medication: text("medication").notNull(),
  nextRefillDate: timestamp("next_refill_date", { withTimezone: true }).notNull(),
  lastShipmentIssue: text("last_shipment_issue"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  vendorCallId: varchar("vendor_call_id", { length: 96 }).notNull(),
  transport: varchar("transport", { length: 12 }).notNull(), // "web" | "pstn"
  status: varchar("status", { length: 20 }).notNull().default("in_progress"),
  transcript: jsonb("transcript"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const outcomes = pgTable("outcomes", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull().unique(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  availabilityWindow: text("availability_window").notNull(),
  medChange: text("med_change").notNull(), // "none|skipped|paused|delayed|other:..."
  shipmentIssue: text("shipment_issue"),
  summary: text("summary").notNull(),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
