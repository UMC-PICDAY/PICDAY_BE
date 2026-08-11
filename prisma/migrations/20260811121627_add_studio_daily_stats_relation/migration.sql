-- AddForeignKey
ALTER TABLE `studio_daily_stats` ADD CONSTRAINT `studio_daily_stats_studioId_fkey` FOREIGN KEY (`studioId`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
