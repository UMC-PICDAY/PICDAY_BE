-- AlterTable
ALTER TABLE `studio` ADD COLUMN `rating_rank` INTEGER NULL,
    ADD COLUMN `rating_score` DOUBLE NULL,
    ADD COLUMN `reservation_count` INTEGER NULL,
    ADD COLUMN `reservation_rank` INTEGER NULL;

-- CreateTable
CREATE TABLE `recent_studio_view` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `studio_id` BIGINT NOT NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recent_studio_view_user_id_viewed_at_idx`(`user_id`, `viewed_at`),
    UNIQUE INDEX `recent_studio_view_user_id_studio_id_key`(`user_id`, `studio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `studio_rating_rank_idx` ON `studio`(`rating_rank`);

-- CreateIndex
CREATE INDEX `studio_reservation_rank_idx` ON `studio`(`reservation_rank`);

-- AddForeignKey
ALTER TABLE `recent_studio_view` ADD CONSTRAINT `recent_studio_view_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recent_studio_view` ADD CONSTRAINT `recent_studio_view_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
