/*
  Warnings:

  - The primary key for the `Workouts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `_id   ` on the `Workouts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workout_id]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Workouts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('strength', 'cardio');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "workout_id" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workouts" DROP CONSTRAINT "Workouts_pkey",
DROP COLUMN "_id   ",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "post_id" TEXT,
ADD CONSTRAINT "Workouts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "admin" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "Exercise" (
    "_id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "distance_km" DOUBLE PRECISION,
    "duration" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "Exercise_workout_id_idx" ON "Exercise"("workout_id");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_type_idx" ON "Exercise"("type");

-- CreateIndex
CREATE INDEX "ExerciseSet_exercise_id_idx" ON "ExerciseSet"("exercise_id");

-- CreateIndex
CREATE INDEX "ExerciseSet_set_number_idx" ON "ExerciseSet"("set_number");

-- CreateIndex
CREATE INDEX "ExerciseSet_created_at_idx" ON "ExerciseSet"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Post_workout_id_key" ON "Post"("workout_id");

-- CreateIndex
CREATE INDEX "Workouts_user_id_idx" ON "Workouts"("user_id");

-- CreateIndex
CREATE INDEX "Workouts_template_id_idx" ON "Workouts"("template_id");

-- CreateIndex
CREATE INDEX "Workouts_post_id_idx" ON "Workouts"("post_id");

-- CreateIndex
CREATE INDEX "Workouts_title_idx" ON "Workouts"("title");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
