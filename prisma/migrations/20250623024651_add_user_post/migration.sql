/*
  Warnings:

  - Added the required column `content` to the `PostComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "image_publicId" TEXT,
ADD COLUMN     "video_publicId" TEXT,
ALTER COLUMN "is_featured" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "UserFollow" (
    "_id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "PostComment"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
