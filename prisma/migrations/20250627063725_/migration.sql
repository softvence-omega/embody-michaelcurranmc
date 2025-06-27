/*
  Warnings:

  - The primary key for the `Workouts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Workouts` table. All the data in the column will be lost.
  - The required column `_id` was added to the `Workouts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_workout_id_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_workout_id_fkey";

-- AlterTable
ALTER TABLE "Workouts" DROP CONSTRAINT "Workouts_pkey",
DROP COLUMN "id",
ADD COLUMN     "_id" TEXT NOT NULL,
ADD CONSTRAINT "Workouts_pkey" PRIMARY KEY ("_id");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
