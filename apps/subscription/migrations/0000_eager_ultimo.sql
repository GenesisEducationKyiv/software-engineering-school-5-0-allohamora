CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"frequency" varchar(10) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL
);
