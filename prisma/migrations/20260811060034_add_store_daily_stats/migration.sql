-- CreateTable
CREATE TABLE `studio_daily_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studioId` BIGINT NOT NULL,
    `statDate` DATE NOT NULL,
    `ratingRank` INTEGER NOT NULL,
    `reservationCount` INTEGER NOT NULL,
    `reservationRank` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `studio_daily_stats_studioId_statDate_key`(`studioId`, `statDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
