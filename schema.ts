import {
  pgTable,
  serial,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  text,
} from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id", { length: 32 }).notNull().unique(),
  gender: varchar("gender", { length: 16 }).notNull(),
  seniorCitizen: boolean("senior_citizen").notNull(),
  partner: boolean("partner").notNull(),
  dependents: boolean("dependents").notNull(),
  tenure: integer("tenure").notNull(),
  phoneService: boolean("phone_service").notNull(),
  multipleLines: varchar("multiple_lines", { length: 32 }).notNull(),
  internetService: varchar("internet_service", { length: 32 }).notNull(),
  onlineSecurity: varchar("online_security", { length: 32 }).notNull(),
  onlineBackup: varchar("online_backup", { length: 32 }).notNull(),
  deviceProtection: varchar("device_protection", { length: 32 }).notNull(),
  techSupport: varchar("tech_support", { length: 32 }).notNull(),
  streamingTv: varchar("streaming_tv", { length: 32 }).notNull(),
  streamingMovies: varchar("streaming_movies", { length: 32 }).notNull(),
  contract: varchar("contract", { length: 32 }).notNull(),
  paperlessBilling: boolean("paperless_billing").notNull(),
  paymentMethod: varchar("payment_method", { length: 64 }).notNull(),
  monthlyCharges: real("monthly_charges").notNull(),
  totalCharges: real("total_charges").notNull(),
  churn: boolean("churn").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id", { length: 32 }).notNull(),
  probability: real("probability").notNull(),
  prediction: boolean("prediction").notNull(),
  riskLevel: varchar("risk_level", { length: 16 }).notNull(),
  confidence: real("confidence").notNull(),
  topPositiveFactors: jsonb("top_positive_factors").notNull().$type<
    { feature: string; contribution: number }[]
  >(),
  topNegativeFactors: jsonb("top_negative_factors").notNull().$type<
    { feature: string; contribution: number }[]
  >(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
