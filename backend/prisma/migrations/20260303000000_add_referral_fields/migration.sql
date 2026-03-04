-- AlterTable: Add referral fields to users
ALTER TABLE "users" ADD COLUMN "referral_code" TEXT;
ALTER TABLE "users" ADD COLUMN "referred_by_code" TEXT;
ALTER TABLE "users" ADD COLUMN "referral_spins_awarded" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "channel_bonus_claimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
