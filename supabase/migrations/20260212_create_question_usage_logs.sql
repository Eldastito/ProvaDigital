-- Create table for tracking question usage per school/tenant
CREATE TABLE IF NOT EXISTS "public"."question_usage_logs" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "school_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "exam_id" UUID,
    "used_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance optimization on filtering
CREATE INDEX IF NOT EXISTS "idx_usage_school_year" ON "public"."question_usage_logs" ("school_id", "used_at");
CREATE INDEX IF NOT EXISTS "idx_usage_question" ON "public"."question_usage_logs" ("question_id");

-- RLS Policies
ALTER TABLE "public"."question_usage_logs" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view usage logs for their assigned schools (or if they are admin)
CREATE POLICY "Users can view usage logs for their schools" ON "public"."question_usage_logs"
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            -- User is directly assigned to this school
            exists (
                select 1 from public.users
                where users.id::text = auth.uid()::text
                and users.school_id::text = question_usage_logs.school_id::text
            )
            OR
            -- User is tenant admin for this school's tenant
            exists (
                select 1 from public.users u
                join public.schools s on s.id::text = question_usage_logs.school_id::text
                where u.id::text = auth.uid()::text
                and u.role = 'TENANT_ADMIN'
                and u.tenant_id::text = s.tenant_id::text
            )
            OR
            -- Super admins see all
            exists (
                select 1 from public.users
                where users.id::text = auth.uid()::text
                and users.role in ('SUPER_ADMIN', 'STATE_ADMIN')
            )
        )
    );

-- Allow authenticated users (teachers/admins) to insert new usage records
CREATE POLICY "Users can register question usage" ON "public"."question_usage_logs"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
