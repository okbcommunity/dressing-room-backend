-- CreateTable
CREATE TABLE "Bear" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "public_key" TEXT,

    CONSTRAINT "Bear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bear_Attribut" (
    "bear_id" TEXT NOT NULL,
    "attribut_id" TEXT NOT NULL,

    CONSTRAINT "Bear_Attribut_pkey" PRIMARY KEY ("bear_id","attribut_id")
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
CREATE TABLE "Attribut" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "image_url_web" TEXT NOT NULL,
    "image_url_png_2000x200" TEXT NOT NULL,
    "image_url_png_512x512" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attribut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bear_number_key" ON "Bear"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Bear_public_key_key" ON "Bear"("public_key");

-- AddForeignKey
ALTER TABLE "Bear_Attribut" ADD CONSTRAINT "Bear_Attribut_bear_id_fkey" FOREIGN KEY ("bear_id") REFERENCES "Bear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bear_Attribut" ADD CONSTRAINT "Bear_Attribut_attribut_id_fkey" FOREIGN KEY ("attribut_id") REFERENCES "Attribut"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribut" ADD CONSTRAINT "Attribut_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
