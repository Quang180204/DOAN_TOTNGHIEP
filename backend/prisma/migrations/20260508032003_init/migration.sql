-- CreateTable
CREATE TABLE "provinces" (
    "province_id" SERIAL NOT NULL,
    "province_name" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("province_id")
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
CREATE TABLE "wards" (
    "ward_id" SERIAL NOT NULL,
    "district_id" INTEGER NOT NULL,
    "ward_name" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("ward_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "account_id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "avatar" TEXT,
    "role" INTEGER NOT NULL,
    "status" CHAR(1),
    "requestCode" VARCHAR(100),
    "createBy" VARCHAR(100),
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100),
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "account_addresses" (
    "account_address_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "province_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "phoneNumber" VARCHAR(10),
    "username" VARCHAR(20),
    "content" VARCHAR(50),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "account_addresses_pkey" PRIMARY KEY ("account_address_id")
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" SERIAL NOT NULL,
    "genre_name" VARCHAR(50) NOT NULL,
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "brands" (
    "brand_id" SERIAL NOT NULL,
    "brand_name" VARCHAR(50) NOT NULL,
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "discount_id" SERIAL NOT NULL,
    "discount_name" VARCHAR(100) NOT NULL,
    "discount_start" TIMESTAMP(3) NOT NULL,
    "discount_end" TIMESTAMP(3) NOT NULL,
    "discount_price" DOUBLE PRECISION NOT NULL,
    "discount_code" VARCHAR(10),
    "quantity" INTEGER NOT NULL,
    "status" CHAR(1),
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("discount_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" VARCHAR(10),
    "type" INTEGER,
    "specifications" TEXT,
    "image" TEXT,
    "description" TEXT,
    "view" BIGINT NOT NULL DEFAULT 0,
    "buyturn" BIGINT NOT NULL DEFAULT 0,
    "status" CHAR(1),
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100),
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "product_img_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "image" VARCHAR(500),

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("product_img_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "payment_name" VARCHAR(50) NOT NULL,
    "status" CHAR(1),
    "createBy" VARCHAR(20) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(20) NOT NULL,
    "updateAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "delivery_id" SERIAL NOT NULL,
    "delivery_name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" CHAR(1),
    "createBy" VARCHAR(20) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(20) NOT NULL,
    "updateAt" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "order_addresses" (
    "order_address_id" SERIAL NOT NULL,
    "province_id" INTEGER,
    "district_id" INTEGER,
    "ward_id" INTEGER,
    "phoneNumber" VARCHAR(10),
    "username" VARCHAR(20),
    "content" VARCHAR(150),
    "timesEdit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("order_address_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "order_address_id" INTEGER,
    "order_date" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" CHAR(1),
    "order_note" VARCHAR(200),
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_details" (
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transaction" VARCHAR(50) NOT NULL,
    "status" CHAR(1),
    "createBy" VARCHAR(20) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(20) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("order_id","product_id","genre_id","discount_id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "feedback_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "rate_star" INTEGER NOT NULL,
    "content" TEXT,
    "status" CHAR(1),
    "createBy" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(100) NOT NULL,
    "updateAt" TIMESTAMP(3),

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "reply_feedbacks" (
    "rep_feedback_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "content" TEXT,
    "status" VARCHAR(1),
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_feedbacks_pkey" PRIMARY KEY ("rep_feedback_id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "contact_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" CHAR(1) NOT NULL,
    "createBy" VARCHAR(20) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateBy" VARCHAR(20) NOT NULL,
    "updateAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("contact_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "genres_genre_name_key" ON "genres"("genre_name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_name_key" ON "brands"("brand_name");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_id_genre_id_discount_id_key" ON "products"("product_id", "genre_id", "discount_id");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_addresses" ADD CONSTRAINT "account_addresses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_addresses" ADD CONSTRAINT "account_addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_addresses" ADD CONSTRAINT "account_addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_addresses" ADD CONSTRAINT "account_addresses_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("ward_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("discount_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("ward_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("delivery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_address_id_fkey" FOREIGN KEY ("order_address_id") REFERENCES "order_addresses"("order_address_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("discount_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_feedbacks" ADD CONSTRAINT "reply_feedbacks_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("feedback_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_feedbacks" ADD CONSTRAINT "reply_feedbacks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;
