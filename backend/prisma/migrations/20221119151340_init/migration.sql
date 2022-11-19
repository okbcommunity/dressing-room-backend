/*
  Warnings:

  - You are about to drop the column `number` on the `Bear` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[index]` on the table `Bear` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `index` to the `Bear` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Bear_number_key";

-- AlterTable
ALTER TABLE "Bear" DROP COLUMN "number",
ADD COLUMN     "index" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bear_index_key" ON "Bear"("index");
