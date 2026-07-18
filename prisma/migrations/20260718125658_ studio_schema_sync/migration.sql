/*
  Warnings:

  - You are about to drop the column `description` on the `studio` table. All the data in the column will be lost.
  - You are about to drop the column `facility_description` on the `studio` table. All the data in the column will be lost.
  - You are about to alter the column `station_detail` on the `studio_location` table. The data in that column could be lost. The data in that column will be cast from `VarChar(150)` to `Json`.
  - Added the required column `base_people` to the `studio_product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `studio` DROP COLUMN `description`,
    DROP COLUMN `facility_description`,
    ADD COLUMN `introduction` TEXT NULL,
    ADD COLUMN `notice` TEXT NULL;

-- AlterTable
ALTER TABLE `studio_location` MODIFY `station_detail` JSON NULL;

-- AlterTable
ALTER TABLE `studio_product` ADD COLUMN `base_people` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `studio_service` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_id` BIGINT NOT NULL,
    `service_code` ENUM('HAIR_MAKEUP', 'PARKING', 'COSTUME', 'WIFI') NOT NULL,

    INDEX `studio_service_service_code_idx`(`service_code`),
    UNIQUE INDEX `studio_service_studio_id_service_code_key`(`studio_id`, `service_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studio_hair_makeup_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_service_id` BIGINT NOT NULL,
    `partner_name` VARCHAR(40) NOT NULL,
    `additional_price` INTEGER NOT NULL,
    `display_order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `info_section` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studio_info_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_id` BIGINT NOT NULL,
    `info_section_id` BIGINT NOT NULL,
    `content` TEXT NOT NULL,

    UNIQUE INDEX `studio_info_item_studio_id_info_section_id_key`(`studio_id`, `info_section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `studio_service` ADD CONSTRAINT `studio_service_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studio_hair_makeup_detail` ADD CONSTRAINT `studio_hair_makeup_detail_studio_service_id_fkey` FOREIGN KEY (`studio_service_id`) REFERENCES `studio_service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studio_info_item` ADD CONSTRAINT `studio_info_item_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studio_info_item` ADD CONSTRAINT `studio_info_item_info_section_id_fkey` FOREIGN KEY (`info_section_id`) REFERENCES `info_section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
