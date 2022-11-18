-- CreateTable
CREATE TABLE "Bear" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "public_key" TEXT,

    CONSTRAINT "Bear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bear_Trait" (
    "bear_id" TEXT NOT NULL,
    "trait_id" TEXT NOT NULL,

    CONSTRAINT "Bear_Trait_pkey" PRIMARY KEY ("bear_id","trait_id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "image_url_webp" TEXT,
    "image_url_png_2000x2000" TEXT,
    "image_url_png_512x512" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bear_number_key" ON "Bear"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Bear_public_key_key" ON "Bear"("public_key");

-- AddForeignKey
ALTER TABLE "Bear_Trait" ADD CONSTRAINT "Bear_Trait_bear_id_fkey" FOREIGN KEY ("bear_id") REFERENCES "Bear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bear_Trait" ADD CONSTRAINT "Bear_Trait_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
