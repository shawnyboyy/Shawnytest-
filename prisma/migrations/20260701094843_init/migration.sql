-- CreateEnum
CREATE TYPE "CardLevel" AS ENUM ('WARMUP', 'REAL_TALK', 'GO_DEEP', 'CURVEBALL');

-- CreateEnum
CREATE TYPE "CardPack" AS ENUM ('MAIN', 'EXPANSION', 'CURVEBALL');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING_FOR_PARTNER', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "Partner" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "PoolCardStatus" AS ENUM ('AVAILABLE', 'DRAWN', 'DISCARDED');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" TEXT,
    "level" "CardLevel" NOT NULL,
    "pack" "CardPack" NOT NULL,
    "text" TEXT NOT NULL,
    "curveballNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING_FOR_PARTNER',
    "currentLevel" "CardLevel" NOT NULL DEFAULT 'WARMUP',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "partnerASecret" TEXT,
    "partnerBSecret" TEXT,
    "partnerAJoinedAt" TIMESTAMP(3),
    "partnerBJoinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolCard" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "pool" "CardLevel" NOT NULL,
    "status" "PoolCardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "PoolCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawnCard" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "playDate" DATE NOT NULL,
    "partner" "Partner" NOT NULL,
    "pool" "CardLevel" NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "passedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawnCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionLog" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "drawnCardId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "PoolCard_roomId_pool_status_sortOrder_idx" ON "PoolCard"("roomId", "pool", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PoolCard_roomId_cardId_key" ON "PoolCard"("roomId", "cardId");

-- CreateIndex
CREATE INDEX "DrawnCard_roomId_playDate_idx" ON "DrawnCard"("roomId", "playDate");

-- CreateIndex
CREATE UNIQUE INDEX "DrawnCard_roomId_playDate_partner_pool_key" ON "DrawnCard"("roomId", "playDate", "partner", "pool");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionLog_drawnCardId_key" ON "DecisionLog"("drawnCardId");

-- CreateIndex
CREATE INDEX "DecisionLog_roomId_idx" ON "DecisionLog"("roomId");

-- AddForeignKey
ALTER TABLE "PoolCard" ADD CONSTRAINT "PoolCard_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolCard" ADD CONSTRAINT "PoolCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawnCard" ADD CONSTRAINT "DrawnCard_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawnCard" ADD CONSTRAINT "DrawnCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionLog" ADD CONSTRAINT "DecisionLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionLog" ADD CONSTRAINT "DecisionLog_drawnCardId_fkey" FOREIGN KEY ("drawnCardId") REFERENCES "DrawnCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
