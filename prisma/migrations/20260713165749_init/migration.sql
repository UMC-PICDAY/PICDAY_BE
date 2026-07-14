-- CreateTable
CREATE TABLE `reservation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `time_slot_id` BIGINT NOT NULL,
    `studio_product_id` BIGINT NOT NULL,
    `reservee_name` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `total_price` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('RESERVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'RESERVED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `canceled_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reservation_id` BIGINT NOT NULL,
    `method` ENUM('KAKAOPAY', 'NAVERPAY', 'TOSSPAY', 'TRANSFER', 'CARD') NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_reservation_id_key`(`reservation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_slot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_id` BIGINT NOT NULL,
    `date` DATE NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `time_slot_studio_id_date_start_time_end_time_key`(`studio_id`, `date`, `start_time`, `end_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `terms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('REFUND_POLICY', 'PRIVACY_COLLECTION', 'THIRD_PARTY', 'PAYMENT_AGENCY') NOT NULL,
    `version` VARCHAR(10) NOT NULL,
    `content` TEXT NOT NULL,
    `is_required` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `terms_type_version_key`(`type`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_terms` (
    `reservation_id` BIGINT NOT NULL,
    `terms_id` BIGINT NOT NULL,
    `is_agreed` BOOLEAN NOT NULL,
    `agreed_at` DATETIME(3) NULL,

    PRIMARY KEY (`reservation_id`, `terms_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `login_id` VARCHAR(12) NULL,
    `password` VARCHAR(255) NULL,
    `name` VARCHAR(10) NULL,
    `nickname` VARCHAR(30) NULL,
    `email` VARCHAR(50) NULL,
    `phone_number` VARCHAR(15) NULL,
    `provider` ENUM('LOCAL', 'KAKAO', 'GOOGLE') NULL DEFAULT 'LOCAL',
    `status` ENUM('ACTIVE', 'WITHDRAWN') NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_login_id_key`(`login_id`),
    UNIQUE INDEX `user_nickname_key`(`nickname`),
    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_account` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `provider` ENUM('LOCAL', 'KAKAO', 'GOOGLE') NOT NULL,
    `provider_id` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `social_account_provider_provider_id_key`(`provider`, `provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_terms` (
    `terms_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `is_agreed` BOOLEAN NULL,
    `agreed_at` DATETIME(3) NULL,

    PRIMARY KEY (`terms_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studio` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `facility_description` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studio_location` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_id` BIGINT NOT NULL,
    `main_address` VARCHAR(100) NOT NULL,
    `sub_address` VARCHAR(255) NOT NULL,
    `location_category` ENUM('HONGDAE', 'GANGNAM', 'SEONGSU', 'YEONNAM', 'KONDAE', 'SINCHON', 'JAMSIL', 'APGUJEONG', 'HYEHWA', 'JONGNO') NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `nearest_station` VARCHAR(50) NOT NULL,
    `walking_minutes` INTEGER NOT NULL,
    `station_detail` VARCHAR(150) NULL,

    UNIQUE INDEX `studio_location_studio_id_key`(`studio_id`),
    INDEX `studio_location_studio_id_idx`(`studio_id`),
    INDEX `studio_location_location_category_idx`(`location_category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studio_product` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_id` BIGINT NOT NULL,
    `shooting_category` ENUM('ID_PHOTO', 'PROFILE', 'PERSONAL_PORTRAIT', 'JOB_PHOTO', 'FAMILY', 'FRIENDSHIP') NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `price` INTEGER NOT NULL,
    `description` TEXT NULL,
    `short_description` TEXT NULL,

    INDEX `studio_product_studio_id_idx`(`studio_id`),
    INDEX `studio_product_shooting_category_idx`(`shooting_category`),
    INDEX `studio_product_studio_id_shooting_category_idx`(`studio_id`, `shooting_category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_image` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `studio_product_id` BIGINT NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `studio_thumbnail_order` INTEGER NULL,

    INDEX `product_image_studio_product_id_idx`(`studio_product_id`),
    INDEX `product_image_studio_thumbnail_order_idx`(`studio_thumbnail_order`),
    UNIQUE INDEX `product_image_studio_product_id_order_key`(`studio_product_id`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reservation_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `studio_id` BIGINT NOT NULL,
    `rating` INTEGER NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `review_reservation_id_key`(`reservation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_image` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `review_id` BIGINT NOT NULL,
    `url` VARCHAR(500) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_like` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `review_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `review_like_review_id_user_id_key`(`review_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlist` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `studio_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wishlist_user_id_studio_id_key`(`user_id`, `studio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_time_slot_id_fkey` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_studio_product_id_fkey` FOREIGN KEY (`studio_product_id`) REFERENCES `studio_product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_slot` ADD CONSTRAINT `time_slot_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_terms` ADD CONSTRAINT `reservation_terms_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_terms` ADD CONSTRAINT `reservation_terms_terms_id_fkey` FOREIGN KEY (`terms_id`) REFERENCES `terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_account` ADD CONSTRAINT `social_account_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_terms` ADD CONSTRAINT `user_terms_terms_id_fkey` FOREIGN KEY (`terms_id`) REFERENCES `terms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_terms` ADD CONSTRAINT `user_terms_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studio_location` ADD CONSTRAINT `studio_location_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studio_product` ADD CONSTRAINT `studio_product_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_image` ADD CONSTRAINT `product_image_studio_product_id_fkey` FOREIGN KEY (`studio_product_id`) REFERENCES `studio_product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_image` ADD CONSTRAINT `review_image_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_like` ADD CONSTRAINT `review_like_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_like` ADD CONSTRAINT `review_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist` ADD CONSTRAINT `wishlist_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist` ADD CONSTRAINT `wishlist_studio_id_fkey` FOREIGN KEY (`studio_id`) REFERENCES `studio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
