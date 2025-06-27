-- DropIndex
DROP INDEX "Exercise_type_idx";

-- DropIndex
DROP INDEX "ExerciseSet_created_at_idx";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "timer_active" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExerciseSet" ADD COLUMN     "timer_active" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "set_number" SET DEFAULT 1,
ALTER COLUMN "duration" SET DEFAULT '00:00:00';

-- AlterTable
ALTER TABLE "Workouts" ADD COLUMN     "timer_active" BOOLEAN NOT NULL DEFAULT false;
