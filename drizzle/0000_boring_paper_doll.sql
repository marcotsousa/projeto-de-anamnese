CREATE TABLE `anamneses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`initial_complaint` text NOT NULL,
	`context` text NOT NULL,
	`treatment_plan` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_anamneses_patient` ON `anamneses` (`patient_id`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`instrument` text NOT NULL,
	`answers_json` text NOT NULL,
	`score_json` text NOT NULL,
	`classification` text NOT NULL,
	`observations` text DEFAULT '' NOT NULL,
	`applied_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_assessments_patient_date` ON `assessments` (`patient_id`,`applied_at`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`professional_id` text NOT NULL,
	`full_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`document` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_patients_professional_name` ON `patients` (`professional_id`,`full_name`);--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`crp` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_professionals_email` ON `professionals` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_professionals_crp` ON `professionals` (`crp`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	`notes` text NOT NULL,
	`next_steps` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_patient_date` ON `sessions` (`patient_id`,`occurred_at`);