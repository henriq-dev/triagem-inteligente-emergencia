CREATE TABLE `attendanceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`urgencyLevelAtCheckIn` enum('crítico','urgente','pouco urgente','não urgente') NOT NULL,
	`urgencyScoreAtCheckIn` int NOT NULL,
	`checkInTime` timestamp NOT NULL,
	`attendanceStartTime` timestamp,
	`attendanceEndTime` timestamp,
	`waitingTimeMinutes` int,
	`attendanceTimeMinutes` int,
	`outcome` enum('atendido','encaminhado','cancelado','não compareceu') NOT NULL,
	`attendingDoctor` varchar(255),
	`diagnosis` text,
	`treatment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`age` int NOT NULL,
	`gender` enum('M','F','O') NOT NULL,
	`cpf` varchar(14),
	`heartRate` int NOT NULL,
	`systolicBP` int NOT NULL,
	`diastolicBP` int NOT NULL,
	`temperature` decimal(5,2) NOT NULL,
	`oxygenSaturation` int NOT NULL,
	`painLevel` int NOT NULL,
	`urgencyLevel` enum('crítico','urgente','pouco urgente','não urgente') NOT NULL,
	`urgencyScore` int NOT NULL,
	`status` enum('aguardando','em atendimento','concluído','cancelado') NOT NULL DEFAULT 'aguardando',
	`queuePosition` int,
	`checkInTime` timestamp NOT NULL DEFAULT (now()),
	`attendanceStartTime` timestamp,
	`attendanceEndTime` timestamp,
	`symptoms` text,
	`medicalHistory` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `queueMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotTime` timestamp NOT NULL DEFAULT (now()),
	`totalPatientsInQueue` int NOT NULL,
	`averageWaitingTimeMinutes` decimal(8,2) NOT NULL,
	`criticalCount` int NOT NULL,
	`urgentCount` int NOT NULL,
	`lowUrgencyCount` int NOT NULL,
	`nonUrgentCount` int NOT NULL,
	`estimatedWaitTimeWithoutTriage` decimal(8,2) NOT NULL,
	`actualWaitTimeWithTriage` decimal(8,2) NOT NULL,
	`patientsAttendedToday` int NOT NULL,
	`averageAttendanceTimeMinutes` decimal(8,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queueMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','doctor','triager') NOT NULL DEFAULT 'user';