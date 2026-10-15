CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_code" varchar(40) NOT NULL,
	"actor_id" uuid,
	"actor_name" text NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" text NOT NULL,
	"action" varchar(50) NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"notes" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_audit_code_unique" UNIQUE("audit_code")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "business_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_key" varchar(50) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"current_value" integer DEFAULT 1000 NOT NULL,
	"padding" integer DEFAULT 4 NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_sequences_sequence_key_unique" UNIQUE("sequence_key")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_code" varchar(50),
	"entity_type" varchar(20) NOT NULL,
	"customer_id" uuid,
	"supplier_id" uuid,
	"name" text NOT NULL,
	"name_en" text,
	"job_title" text,
	"department" varchar(60),
	"phone" varchar(40) NOT NULL,
	"mobile" varchar(40),
	"whatsapp" varchar(40),
	"wechat" varchar(60),
	"email" varchar(120),
	"is_primary" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_code" varchar(50) NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"customer_type" varchar(50) DEFAULT 'commercial' NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"phone" varchar(40) NOT NULL,
	"secondary_phone" varchar(40),
	"whatsapp" varchar(40),
	"email" varchar(120),
	"website" text,
	"tax_number" varchar(60),
	"commercial_register" varchar(60),
	"national_id_or_passport" varchar(60),
	"country" varchar(80) DEFAULT 'السودان' NOT NULL,
	"city" varchar(80) DEFAULT 'بورتسودان' NOT NULL,
	"address" text,
	"delivery_address" text,
	"payment_terms" text,
	"credit_limit" integer DEFAULT 0,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"assigned_sales_rep_id" uuid,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_customer_code_unique" UNIQUE("customer_code")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text,
	"description_ar" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "party_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"customer_id" uuid,
	"supplier_id" uuid,
	"title" text NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_number" varchar(80),
	"expiry_date" timestamp with time zone,
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"uploaded_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"name_ar" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"description_ar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_code" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_code_pk" PRIMARY KEY("role_id","permission_code")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text,
	"description_ar" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"trade_name_en" text,
	"supplier_type" varchar(50) DEFAULT 'manufacturer' NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"country" varchar(80) DEFAULT 'الصين' NOT NULL,
	"city" varchar(80) NOT NULL,
	"address" text,
	"phone" varchar(40) NOT NULL,
	"secondary_phone" varchar(40),
	"whatsapp" varchar(40),
	"wechat" varchar(60),
	"email" varchar(120),
	"website" text,
	"tax_number" varchar(60),
	"business_license" varchar(80),
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payment_terms" text,
	"default_currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"bank_name" text,
	"bank_account_name" text,
	"bank_account_number" text,
	"bank_iban_swift" text,
	"bank_branch" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"tier" varchar(10) DEFAULT 'B' NOT NULL,
	"lead_time_days" integer DEFAULT 15,
	"notes" text,
	"compliance_notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_supplier_code_unique" UNIQUE("supplier_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(30),
	"department_id" uuid,
	"role_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp with time zone,
	"firebase_uid" text,
	"allowed_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_sales_rep_id_users_id_fk" FOREIGN KEY ("assigned_sales_rep_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_documents" ADD CONSTRAINT "party_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_documents" ADD CONSTRAINT "party_documents_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_documents" ADD CONSTRAINT "party_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "contacts_entity_idx" ON "contacts" USING btree ("entity_type","customer_id","supplier_id");--> statement-breakpoint
CREATE INDEX "contacts_customer_id_idx" ON "contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "contacts_supplier_id_idx" ON "contacts" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_is_primary_idx" ON "contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "customers_code_idx" ON "customers" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "customers_company_name_idx" ON "customers" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customers_type_idx" ON "customers" USING btree ("customer_type");--> statement-breakpoint
CREATE INDEX "customers_city_idx" ON "customers" USING btree ("city");--> statement-breakpoint
CREATE INDEX "customers_sales_rep_idx" ON "customers" USING btree ("assigned_sales_rep_id");--> statement-breakpoint
CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "party_docs_entity_idx" ON "party_documents" USING btree ("entity_type","customer_id","supplier_id");--> statement-breakpoint
CREATE INDEX "party_docs_customer_idx" ON "party_documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "party_docs_supplier_idx" ON "party_documents" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "party_docs_type_idx" ON "party_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "suppliers_code_idx" ON "suppliers" USING btree ("supplier_code");--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "suppliers_type_idx" ON "suppliers" USING btree ("supplier_type");--> statement-breakpoint
CREATE INDEX "suppliers_country_idx" ON "suppliers" USING btree ("country");--> statement-breakpoint
CREATE INDEX "suppliers_city_idx" ON "suppliers" USING btree ("city");--> statement-breakpoint
CREATE INDEX "suppliers_phone_idx" ON "suppliers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "suppliers_wechat_idx" ON "suppliers" USING btree ("wechat");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "suppliers_rating_idx" ON "suppliers" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "suppliers_tier_idx" ON "suppliers" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_department_id_idx" ON "users" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");