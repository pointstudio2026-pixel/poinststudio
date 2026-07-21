-- CreateEnum
CREATE TYPE "admin_tier" AS ENUM ('super_admin', 'manager', 'support');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_tier" "admin_tier",
ADD COLUMN     "last_login_at" TIMESTAMPTZ,
ADD COLUMN     "suspended_at" TIMESTAMPTZ;
