/*
  Warnings:

  - You are about to drop the `account_addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deliveries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `districts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `genres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provinces` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reply_feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_addresses" DROP CONSTRAINT "account_addresses_account_id_fkey";

-- DropForeignKey
ALTER TABLE "account_addresses" DROP CONSTRAINT "account_addresses_district_id_fkey";

-- DropForeignKey
ALTER TABLE "account_addresses" DROP CONSTRAINT "account_addresses_province_id_fkey";

-- DropForeignKey
ALTER TABLE "account_addresses" DROP CONSTRAINT "account_addresses_ward_id_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "districts" DROP CONSTRAINT "districts_province_id_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_account_id_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_addresses" DROP CONSTRAINT "order_addresses_district_id_fkey";

-- DropForeignKey
ALTER TABLE "order_addresses" DROP CONSTRAINT "order_addresses_province_id_fkey";

-- DropForeignKey
ALTER TABLE "order_addresses" DROP CONSTRAINT "order_addresses_ward_id_fkey";

-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_discount_id_fkey";

-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_account_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_delivery_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_order_address_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_discount_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_genre_id_fkey";

-- DropForeignKey
ALTER TABLE "reply_feedbacks" DROP CONSTRAINT "reply_feedbacks_account_id_fkey";

-- DropForeignKey
ALTER TABLE "reply_feedbacks" DROP CONSTRAINT "reply_feedbacks_feedback_id_fkey";

-- DropForeignKey
ALTER TABLE "wards" DROP CONSTRAINT "wards_district_id_fkey";

-- DropTable
DROP TABLE "account_addresses";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "brands";

-- DropTable
DROP TABLE "contacts";

-- DropTable
DROP TABLE "deliveries";

-- DropTable
DROP TABLE "discounts";

-- DropTable
DROP TABLE "districts";

-- DropTable
DROP TABLE "feedbacks";

-- DropTable
DROP TABLE "genres";

-- DropTable
DROP TABLE "order_addresses";

-- DropTable
DROP TABLE "order_details";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "product_images";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "provinces";

-- DropTable
DROP TABLE "reply_feedbacks";

-- DropTable
DROP TABLE "wards";

-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "Email" VARCHAR(100) NOT NULL,
    "password" TEXT,
    "Name" VARCHAR(50) NOT NULL,
    "Phone" VARCHAR(10) NOT NULL,
    "Avatar" TEXT,
    "Role" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1),
    "Requestcode" VARCHAR(100),
    "create_by" VARCHAR(100),
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100),
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "brand_id" SERIAL NOT NULL,
    "brand_name" VARCHAR(50) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "genre_id" SERIAL NOT NULL,
    "genre_name" VARCHAR(50) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "disscount_id" SERIAL NOT NULL,
    "discount_name" VARCHAR(100) NOT NULL,
    "discount_star" TIMESTAMP(3) NOT NULL,
    "discount_end" TIMESTAMP(3) NOT NULL,
    "discount_price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount_code" VARCHAR(10),
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("disscount_id")
);

-- CreateTable
CREATE TABLE "Product" (
    "product_id" SERIAL NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "disscount_id" INTEGER,
    "product_name" VARCHAR(200) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "view" BIGINT NOT NULL DEFAULT 0,
    "buyturn" BIGINT NOT NULL DEFAULT 0,
    "quantity" VARCHAR(10),
    "status" CHAR(1),
    "Type" INTEGER,
    "specifications" TEXT,
    "image" TEXT,
    "description" TEXT,
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100),
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "ProductImages" (
    "product_img_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "image" VARCHAR(500),

    CONSTRAINT "ProductImages_pkey" PRIMARY KEY ("product_img_id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "payment_id" SERIAL NOT NULL,
    "payment_name" VARCHAR(50) NOT NULL,
    "status" CHAR(1),
    "create_by" VARCHAR(20) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "delivery_id" SERIAL NOT NULL,
    "delivery_name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" CHAR(1),
    "create_by" VARCHAR(20) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "Order" (
    "order_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "oder_date" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" CHAR(1),
    "order_note" VARCHAR(200),
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "Oder_Detail" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transection" VARCHAR(50) NOT NULL,
    "status" CHAR(1),
    "create_by" VARCHAR(20) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oder_Detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedback_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "content" TEXT,
    "rate_star" INTEGER NOT NULL,
    "stastus" CHAR(1),
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "ReplyFeedback" (
    "rep_feedback_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "content" TEXT,
    "stastus" VARCHAR(1),
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplyFeedback_pkey" PRIMARY KEY ("rep_feedback_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_Email_key" ON "Account"("Email");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_disscount_id_fkey" FOREIGN KEY ("disscount_id") REFERENCES "Discount"("disscount_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "Genre"("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImages" ADD CONSTRAINT "ProductImages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "Delivery"("delivery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oder_Detail" ADD CONSTRAINT "Oder_Detail_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oder_Detail" ADD CONSTRAINT "Oder_Detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyFeedback" ADD CONSTRAINT "ReplyFeedback_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyFeedback" ADD CONSTRAINT "ReplyFeedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "Feedback"("feedback_id") ON DELETE RESTRICT ON UPDATE CASCADE;
