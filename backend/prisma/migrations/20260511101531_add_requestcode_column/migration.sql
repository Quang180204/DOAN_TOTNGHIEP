/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Delivery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Discount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Genre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Oder_Detail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductImages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReplyFeedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Oder_Detail" DROP CONSTRAINT "Oder_Detail_order_id_fkey";

-- DropForeignKey
ALTER TABLE "Oder_Detail" DROP CONSTRAINT "Oder_Detail_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_delivery_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_disscount_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_genre_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductImages" DROP CONSTRAINT "ProductImages_product_id_fkey";

-- DropForeignKey
ALTER TABLE "ReplyFeedback" DROP CONSTRAINT "ReplyFeedback_account_id_fkey";

-- DropForeignKey
ALTER TABLE "ReplyFeedback" DROP CONSTRAINT "ReplyFeedback_feedback_id_fkey";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Brand";

-- DropTable
DROP TABLE "Delivery";

-- DropTable
DROP TABLE "Discount";

-- DropTable
DROP TABLE "Feedback";

-- DropTable
DROP TABLE "Genre";

-- DropTable
DROP TABLE "Oder_Detail";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "ProductImages";

-- DropTable
DROP TABLE "ReplyFeedback";

-- CreateTable
CREATE TABLE "account" (
    "account_id" SERIAL NOT NULL,
    "password" TEXT,
    "create_at" TIMESTAMP(3) NOT NULL,
    "status" CHAR(1),
    "email" VARCHAR(100) NOT NULL,
    "create_by" VARCHAR(100),
    "update_by" VARCHAR(100),
    "update_at" TIMESTAMP(3) NOT NULL,
    "Requestcode" VARCHAR(100),
    "Name" VARCHAR(50) NOT NULL,
    "Phone" VARCHAR(10) NOT NULL,
    "Avatar" TEXT,
    "Role" INTEGER NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "accountaddress" (
    "account_address_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "province_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "accountPhoneNumber" VARCHAR(10),
    "accountUsername" VARCHAR(20),
    "content" VARCHAR(50),
    "isDefault" BOOLEAN NOT NULL,

    CONSTRAINT "accountaddress_pkey" PRIMARY KEY ("account_address_id")
);

-- CreateTable
CREATE TABLE "brand" (
    "brand_id" SERIAL NOT NULL,
    "brand_name" VARCHAR(50) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "contact" (
    "contact_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "create_by" VARCHAR(20) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(1) NOT NULL,
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "contact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "delivery_id" SERIAL NOT NULL,
    "delivery_name" VARCHAR(100) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(20) NOT NULL,
    "status" CHAR(1),
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "discount" (
    "disscount_id" SERIAL NOT NULL,
    "discount_name" VARCHAR(100) NOT NULL,
    "discount_star" TIMESTAMP(3) NOT NULL,
    "discount_end" TIMESTAMP(3) NOT NULL,
    "discount_price" DOUBLE PRECISION NOT NULL,
    "discount_code" VARCHAR(10),
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "discount_pkey" PRIMARY KEY ("disscount_id")
);

-- CreateTable
CREATE TABLE "districts" (
    "district_id" SERIAL NOT NULL,
    "province_id" INTEGER NOT NULL,
    "district_name" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("district_id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "feedback_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "disscount_id" INTEGER NOT NULL,
    "rate_star" INTEGER NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "stastus" CHAR(1),
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3),
    "content" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "genre" (
    "genre_id" SERIAL NOT NULL,
    "genre_name" VARCHAR(50) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "order" (
    "order_id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "oder_date" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "account_id" INTEGER NOT NULL,
    "status" CHAR(1),
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(100) NOT NULL,
    "update_by" VARCHAR(100) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,
    "order_note" VARCHAR(200),
    "orderAddressId" INTEGER,

    CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "orderaddress" (
    "orderAddressId" SERIAL NOT NULL,
    "orderPhonenumber" VARCHAR(10),
    "orderUsername" VARCHAR(20),
    "content" VARCHAR(150),
    "timesEdit" INTEGER NOT NULL,
    "province_id" INTEGER,
    "district_id" INTEGER,
    "ward_id" INTEGER,

    CONSTRAINT "orderaddress_pkey" PRIMARY KEY ("orderAddressId")
);

-- CreateTable
CREATE TABLE "payment" (
    "payment_id" SERIAL NOT NULL,
    "payment_name" VARCHAR(50) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "create_by" VARCHAR(20) NOT NULL,
    "status" CHAR(1),
    "update_by" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" SERIAL NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "disscount_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "view" BIGINT NOT NULL,
    "buyturn" BIGINT NOT NULL,
    "quantity" VARCHAR(10),
    "status" CHAR(1),
    "create_by" VARCHAR(100) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL,
    "Type" INTEGER,
    "update_by" VARCHAR(100),
    "update_at" TIMESTAMP(3) NOT NULL,
    "specifications" TEXT,
    "image" TEXT,
    "description" TEXT,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "productimages" (
    "product_img_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "disscount_id" INTEGER NOT NULL,
    "image" VARCHAR(500),

    CONSTRAINT "productimages_pkey" PRIMARY KEY ("product_img_id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "province_id" SERIAL NOT NULL,
    "province_name" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "replyfeedback" (
    "rep_feedback_id" SERIAL NOT NULL,
    "content" TEXT,
    "stastus" VARCHAR(1),
    "create_at" TIMESTAMP(3) NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "replyfeedback_pkey" PRIMARY KEY ("rep_feedback_id")
);

-- CreateTable
CREATE TABLE "wards" (
    "ward_id" SERIAL NOT NULL,
    "district_id" INTEGER NOT NULL,
    "ward_name" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("ward_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- AddForeignKey
ALTER TABLE "accountaddress" ADD CONSTRAINT "accountaddress_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("delivery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre"("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_disscount_id_fkey" FOREIGN KEY ("disscount_id") REFERENCES "discount"("disscount_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productimages" ADD CONSTRAINT "productimages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replyfeedback" ADD CONSTRAINT "replyfeedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("feedback_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replyfeedback" ADD CONSTRAINT "replyfeedback_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;
