/*
  Warnings:

  - You are about to drop the column `phone_number` on the `reservation` table. All the data in the column will be lost.
  - Added the required column `reservee_Phone` to the `reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `reservation` DROP COLUMN `phone_number`,
    ADD COLUMN `reservee_Phone` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `refresh_token` VARCHAR(512) NULL;
