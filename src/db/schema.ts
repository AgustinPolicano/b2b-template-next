import type { AdapterAccount } from '@auth/core/adapters';
import { boolean, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  lastName: text('last_name'),
  gender: text('gender'),
  birthDate: timestamp('birth_date', { mode: 'date' }),
  phone: text('phone'),
  email: text('email').notNull().unique(),
  planId: text('planId').references(() => plans.id, { onDelete: 'set null' }),
  planName: text('planName'),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  credits: integer('credits').default(0).notNull(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    planId: text('planId').references(() => plans.id, { onDelete: 'set null' }),
    planName: text('planName'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const plans = pgTable('plan', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  credits: integer('credits').notNull(),
  durationInDays: integer('duration_in_days').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  features: text('features').array().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla para Pagos
export const payments = pgTable('payment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  paymentMethod: text('payment_method'),
  status: text('status').default('pending').notNull(), // e.g., pending, completed, failed
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  paymentDate: timestamp('payment_date', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla para la suscripción actual de un usuario
export const subscriptions = pgTable('subscription', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date', { mode: 'date' }).defaultNow().notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  creditsRemaining: integer('credits_remaining').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
});

// Historial de uso de créditos del usuario
export const creditUsageHistory = pgTable('credit_usage_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  creditsUsed: integer('credits_used').notNull(),
  action: text('action').notNull(), // describe qué acción consumió créditos
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Historial de análisis de CV
export const analysisHistory = pgTable('analysis_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobTitle: text('job_title').notNull(),
  finalScore: integer('final_score').notNull(),
  analysisData: jsonb('analysis_data'), // Para guardar el resultado completo
  createdAt: timestamp('created_at').defaultNow().notNull(),
});