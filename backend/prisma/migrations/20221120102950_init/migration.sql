-- CreateTable
CREATE TABLE "Bear" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
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
    "slug" TEXT NOT NULL,
    "layer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "layer_id" TEXT,
    "image_url_webp" TEXT,
    "image_url_png_2000x2000" TEXT,
    "image_url_png_512x512" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trait_Variant" (
    "trait_id" TEXT NOT NULL,
    "variant_of_trait_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Trait_Variant_pkey" PRIMARY KEY ("trait_id","variant_of_trait_id")
);

-- CreateTable
CREATE TABLE "Trait_Dependency" (
    "trait_id" TEXT NOT NULL,
    "depending_on_trait_id" TEXT NOT NULL,

    CONSTRAINT "Trait_Dependency_pkey" PRIMARY KEY ("trait_id","depending_on_trait_id")
);

-- CreateTable
CREATE TABLE "Trait_Combination" (
    "trait_id" TEXT NOT NULL,
    "combined_with_trai_id" TEXT NOT NULL,

    CONSTRAINT "Trait_Combination_pkey" PRIMARY KEY ("trait_id","combined_with_trai_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bear_index_key" ON "Bear"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Bear_public_key_key" ON "Bear"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "Layer_index_key" ON "Layer"("index");

-- AddForeignKey
ALTER TABLE "Bear_Trait" ADD CONSTRAINT "Bear_Trait_bear_id_fkey" FOREIGN KEY ("bear_id") REFERENCES "Bear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bear_Trait" ADD CONSTRAINT "Bear_Trait_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "Layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "Layer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Variant" ADD CONSTRAINT "Trait_Variant_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Variant" ADD CONSTRAINT "Trait_Variant_variant_of_trait_id_fkey" FOREIGN KEY ("variant_of_trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Dependency" ADD CONSTRAINT "Trait_Dependency_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Dependency" ADD CONSTRAINT "Trait_Dependency_depending_on_trait_id_fkey" FOREIGN KEY ("depending_on_trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Combination" ADD CONSTRAINT "Trait_Combination_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trait_Combination" ADD CONSTRAINT "Trait_Combination_combined_with_trai_id_fkey" FOREIGN KEY ("combined_with_trai_id") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
