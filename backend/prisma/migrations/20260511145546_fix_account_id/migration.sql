/*
  Warnings:

  - You are about to alter the column `password` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - The primary key for the `accountaddress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `brand` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `contact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `delivery` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `discount` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `districts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `feedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `genre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `orderaddress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `productimages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `provinces` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `replyfeedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `wards` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `isDefault` on the `accountaddress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `price` on the `delivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "accountaddress" DROP CONSTRAINT "accountaddress_account_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_account_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_account_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_delivery_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_disscount_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_genre_id_fkey";

-- DropForeignKey
ALTER TABLE "productimages" DROP CONSTRAINT "productimages_product_id_fkey";

-- DropForeignKey
ALTER TABLE "replyfeedback" DROP CONSTRAINT "replyfeedback_account_id_fkey";

-- DropForeignKey
ALTER TABLE "replyfeedback" DROP CONSTRAINT "replyfeedback_feedback_id_fkey";

-- DropForeignKey
ALTER TABLE "wards" DROP CONSTRAINT "wards_district_id_fkey";

-- DropIndex
DROP INDEX "account_email_key";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "password" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(1),
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "Name" DROP NOT NULL,
ALTER COLUMN "Phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "accountaddress" DROP CONSTRAINT "accountaddress_pkey",
ALTER COLUMN "account_address_id" DROP DEFAULT,
DROP COLUMN "isDefault",
ADD COLUMN     "isDefault" BIT(1) NOT NULL;
DROP SEQUENCE "accountaddress_account_address_id_seq";

-- AlterTable
ALTER TABLE "brand" DROP CONSTRAINT "brand_pkey",
ALTER COLUMN "brand_id" DROP DEFAULT,
ALTER COLUMN "brand_name" DROP NOT NULL,
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "brand_brand_id_seq";

-- AlterTable
ALTER TABLE "contact" DROP CONSTRAINT "contact_pkey",
ALTER COLUMN "contact_id" DROP DEFAULT,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR,
ALTER COLUMN "email" SET DATA TYPE VARCHAR,
ALTER COLUMN "content" SET DATA TYPE VARCHAR,
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "contact_contact_id_seq";

-- AlterTable
ALTER TABLE "delivery" DROP CONSTRAINT "delivery_pkey",
ALTER COLUMN "delivery_id" DROP DEFAULT,
ALTER COLUMN "delivery_name" DROP NOT NULL,
DROP COLUMN "price",
ADD COLUMN     "price" MONEY NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(1),
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "delivery_delivery_id_seq";

-- AlterTable
ALTER TABLE "discount" DROP CONSTRAINT "discount_pkey",
ALTER COLUMN "disscount_id" DROP DEFAULT,
ALTER COLUMN "discount_name" DROP NOT NULL,
ALTER COLUMN "discount_star" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "discount_end" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "discount_disscount_id_seq";

-- AlterTable
ALTER TABLE "districts" DROP CONSTRAINT "districts_pkey",
ALTER COLUMN "district_id" DROP DEFAULT,
ALTER COLUMN "district_name" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;
DROP SEQUENCE "districts_district_id_seq";

-- AlterTable
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_pkey",
ALTER COLUMN "feedback_id" DROP DEFAULT,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "stastus" SET DATA TYPE VARCHAR(1),
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "content" SET DATA TYPE VARCHAR;
DROP SEQUENCE "feedback_feedback_id_seq";

-- AlterTable
ALTER TABLE "genre" DROP CONSTRAINT "genre_pkey",
ALTER COLUMN "genre_id" DROP DEFAULT,
ALTER COLUMN "genre_name" DROP NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "genre_genre_id_seq";

-- AlterTable
ALTER TABLE "orderaddress" DROP CONSTRAINT "orderaddress_pkey",
ALTER COLUMN "orderAddressId" DROP DEFAULT;
DROP SEQUENCE "orderaddress_orderAddressId_seq";

-- AlterTable
ALTER TABLE "payment" DROP CONSTRAINT "payment_pkey",
ALTER COLUMN "payment_id" DROP DEFAULT,
ALTER COLUMN "payment_name" DROP NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(1),
ALTER COLUMN "update_by" DROP NOT NULL,
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "payment_payment_id_seq";

-- AlterTable
ALTER TABLE "product" DROP CONSTRAINT "product_pkey",
ALTER COLUMN "product_id" DROP DEFAULT,
ALTER COLUMN "product_name" DROP NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(1),
ALTER COLUMN "create_by" DROP NOT NULL,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "update_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "specifications" SET DATA TYPE VARCHAR,
ALTER COLUMN "image" SET DATA TYPE VARCHAR,
ALTER COLUMN "description" SET DATA TYPE VARCHAR;
DROP SEQUENCE "product_product_id_seq";

-- AlterTable
ALTER TABLE "productimages" DROP CONSTRAINT "productimages_pkey",
ALTER COLUMN "product_img_id" DROP DEFAULT;
DROP SEQUENCE "productimages_product_img_id_seq";

-- AlterTable
ALTER TABLE "provinces" DROP CONSTRAINT "provinces_pkey",
ALTER COLUMN "province_id" DROP DEFAULT,
ALTER COLUMN "province_name" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;
DROP SEQUENCE "provinces_province_id_seq";

-- AlterTable
ALTER TABLE "replyfeedback" DROP CONSTRAINT "replyfeedback_pkey",
ALTER COLUMN "rep_feedback_id" DROP DEFAULT,
ALTER COLUMN "content" SET DATA TYPE VARCHAR,
ALTER COLUMN "create_at" SET DATA TYPE TIMESTAMP(6);
DROP SEQUENCE "replyfeedback_rep_feedback_id_seq";

-- AlterTable
ALTER TABLE "wards" DROP CONSTRAINT "wards_pkey",
ALTER COLUMN "ward_id" DROP DEFAULT,
ALTER COLUMN "ward_name" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;
DROP SEQUENCE "wards_ward_id_seq";

-- DropTable
DROP TABLE "order";

-- CreateTable
CREATE TABLE "Order" (
    "order_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "oder_date" TIMESTAMP(6) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "account_id" INTEGER NOT NULL,
    "status" VARCHAR(1),
    "create_at" TIMESTAMP(6) NOT NULL,
    "create_by" VARCHAR(100),
    "update_by" VARCHAR(100),
    "update_at" TIMESTAMP(6) NOT NULL,
    "order_note" VARCHAR(200),
    "orderAddressId" INTEGER
);

-- CreateTable
CREATE TABLE "__migrationhistory" (
    "migrationid" VARCHAR(150),
    "contextkey" VARCHAR(300),
    "model" BYTEA NOT NULL,
    "productversion" VARCHAR(32)
);

-- CreateTable
CREATE TABLE "oder_detail" (
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "disscount_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(1),
    "transection" VARCHAR(50),
    "create_by" VARCHAR(20),
    "create_at" TIMESTAMP(6) NOT NULL,
    "update_by" VARCHAR(20),
    "update_at" TIMESTAMP(6) NOT NULL,
    "quantity" INTEGER NOT NULL
);
