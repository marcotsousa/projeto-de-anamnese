import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const professionals = sqliteTable('professionals', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  crp: text('crp').notNull(),
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, t => [uniqueIndex('idx_professionals_email').on(t.email), uniqueIndex('idx_professionals_crp').on(t.crp)]);

export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(), birthDate: text('birth_date').notNull(),
  document: text('document').notNull(), phone: text('phone').notNull(), email: text('email').notNull(),
  status: text('status').notNull().default('active'), createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, t => [index('idx_patients_professional_name').on(t.professionalId, t.fullName)]);

export const anamneses = sqliteTable('anamneses', {
  id: integer('id').primaryKey({ autoIncrement: true }), patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  initialComplaint: text('initial_complaint').notNull(), context: text('context').notNull(), treatmentPlan: text('treatment_plan').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, t => [uniqueIndex('idx_anamneses_patient').on(t.patientId)]);

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }), patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(), notes: text('notes').notNull(), nextSteps: text('next_steps').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, t => [index('idx_sessions_patient_date').on(t.patientId, t.occurredAt)]);

export const assessments = sqliteTable('assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }), patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  instrument: text('instrument', { enum: ['ASSIST','PHQ-9','ASRS-v1.1','SNAP-IV','M-CHAT-R','AQ-10'] }).notNull(),
  answersJson: text('answers_json').notNull(), scoreJson: text('score_json').notNull(), classification: text('classification').notNull(),
  observations: text('observations').notNull().default(''), appliedAt: integer('applied_at', { mode: 'timestamp' }).notNull(),
}, t => [index('idx_assessments_patient_date').on(t.patientId, t.appliedAt)]);
