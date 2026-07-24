-- AlterTable
ALTER TABLE `reservation`
    CHANGE COLUMN `phone_number`
    `reservee_phone` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `refresh_token` VARCHAR(512) NULL;