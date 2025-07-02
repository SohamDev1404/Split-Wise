CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"paid_by" text NOT NULL,
	"split_with" text[] DEFAULT '{}' NOT NULL,
	"split_type" text DEFAULT 'equal' NOT NULL,
	"split_details" json,
	"category" text DEFAULT 'Other' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
