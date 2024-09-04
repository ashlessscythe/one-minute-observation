-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "siteId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "siteId" INTEGER;

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
