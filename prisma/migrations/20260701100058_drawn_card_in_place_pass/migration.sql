/*
  Warnings:

  - You are about to drop the column `passed` on the `DrawnCard` table. All the data in the column will be lost.
  - You are about to drop the column `passedAt` on the `DrawnCard` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DrawnCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DrawnCard" DROP COLUMN "passed",
DROP COLUMN "passedAt",
ADD COLUMN     "timesPassed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
