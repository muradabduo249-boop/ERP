CREATE TABLE "request_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"title" text NOT NULL,
	"department_id" uuid,
	"assigned_user_id" uuid,
	"assigned_by_user_id" uuid,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_name" text NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"from_status" varchar(40),
	"to_status" varchar(40),
	"from_user_id" uuid,
	"to_user_id" uuid,
	"decision" varchar(40),
	"notes" text,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_code" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"department_id" uuid,
	"request_type" varchar(60) NOT NULL,
	"title" text NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(40) DEFAULT 'new' NOT NULL,
	"approval_status" varchar(40) DEFAULT 'none' NOT NULL,
	"assigned_user_id" uuid,
	"assigned_at" timestamp with time zone,
	"ready_for_processing_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"country_origin" varchar(80) DEFAULT 'الصين' NOT NULL,
	"country_destination" varchar(80) DEFAULT 'السودان' NOT NULL,
	"city_destination" varchar(80) DEFAULT 'بورتسودان' NOT NULL,
	"estimated_budget" integer DEFAULT 0,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requests_request_code_unique" UNIQUE("request_code")
);
--> statement-breakpoint
ALTER TABLE "party_documents" ALTER COLUMN "entity_type" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "party_documents" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_timeline" ADD CONSTRAINT "request_timeline_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_timeline" ADD CONSTRAINT "request_timeline_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_timeline" ADD CONSTRAINT "request_timeline_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_timeline" ADD CONSTRAINT "request_timeline_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "req_assignments_req_idx" ON "request_assignments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "req_assignments_user_idx" ON "request_assignments" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "req_assignments_dept_idx" ON "request_assignments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "req_assignments_status_idx" ON "request_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "request_timeline_req_idx" ON "request_timeline" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_timeline_actor_idx" ON "request_timeline" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "request_timeline_event_idx" ON "request_timeline" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "request_timeline_timestamp_idx" ON "request_timeline" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "requests_code_idx" ON "requests" USING btree ("request_code");--> statement-breakpoint
CREATE INDEX "requests_customer_idx" ON "requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "requests_dept_idx" ON "requests" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "requests_approval_idx" ON "requests" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "requests_priority_idx" ON "requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "requests_type_idx" ON "requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "requests_assigned_idx" ON "requests" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "party_docs_request_idx" ON "party_documents" USING btree ("request_id");