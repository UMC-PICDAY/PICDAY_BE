/*
  Warnings:

  - Added the required column `scope` to the `terms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `terms` ADD COLUMN `scope` ENUM('SIGNUP', 'RESERVATION') NOT NULL,
    MODIFY `type` ENUM('REFUND_POLICY', 'PRIVACY_COLLECTION', 'THIRD_PARTY', 'PAYMENT_AGENCY', 'SERVICE', 'AGE_OVER_14', 'MARKETING') NOT NULL;

-- CreateTable
CREATE TABLE `review_keyword` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `review_id` BIGINT NOT NULL,
    `keyword` ENUM('KIND_SERVICE', 'DETAILED_RETOUCH', 'ON_TIME', 'COMFORTABLE_MOOD', 'REASONABLE_PRICE', 'SATISFYING_RESULT') NOT NULL,

    UNIQUE INDEX `review_keyword_review_id_keyword_key`(`review_id`, `keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `review_keyword` ADD CONSTRAINT `review_keyword_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
