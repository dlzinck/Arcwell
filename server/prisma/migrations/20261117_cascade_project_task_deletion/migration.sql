-- Remove the existing foreign key constraint.
-- This does not delete any existing tasks or projects.
ALTER TABLE "Task"
DROP CONSTRAINT "Task_projectId_fkey";

-- Recreate the relationship with cascading deletion.
-- When a project is deleted, PostgreSQL will also delete its tasks.
ALTER TABLE "Task"
ADD CONSTRAINT "Task_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;