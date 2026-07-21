-- AlterTable
ALTER TABLE `studio_product`
    ADD COLUMN `base_people` INTEGER UNSIGNED NOT NULL DEFAULT 1;

-- Preserve the backfilled value for existing rows without keeping an application default.
ALTER TABLE `studio_product`
    ALTER COLUMN `base_people` DROP DEFAULT;

-- Enforce the domain rule that the base people count must be at least one.
ALTER TABLE `studio_product`
    ADD CONSTRAINT `studio_product_base_people_check` CHECK (`base_people` >= 1);
