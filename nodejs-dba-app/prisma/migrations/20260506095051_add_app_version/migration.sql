-- CreateTable
CREATE TABLE "apps_version" (
    "id" SERIAL NOT NULL,
    "appVersion" VARCHAR(50) NOT NULL,
    "detail" TEXT,
    "createdBy" INTEGER,
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apps_version_appVersion_key" ON "apps_version"("appVersion");
