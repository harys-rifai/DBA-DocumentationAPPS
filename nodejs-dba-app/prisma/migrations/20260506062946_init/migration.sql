-- CreateEnum
CREATE TYPE "DbType" AS ENUM ('mysql', 'redis', 'postgresql', 'mongodb', 'oracle', 'db2', 'edb', 'sqlserver', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(150),
    "fullName" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ipComp" VARCHAR(45),
    "lastLogin" TIMESTAMP(3),
    "roleId" INTEGER,
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_activities" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER,
    "username" VARCHAR(100),
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100),
    "description" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumentasi_db" (
    "id" SERIAL NOT NULL,
    "dbType" "DbType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "tutorial" TEXT,
    "summary" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "authorId" INTEGER,
    "flag" BOOLEAN NOT NULL DEFAULT true,
    "version" VARCHAR(50),
    "versionHistory" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "aiSource" VARCHAR(100),
    "last_ai_update" TIMESTAMP(3),
    "auto_update" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dokumentasi_db_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_activities" ADD CONSTRAINT "log_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumentasi_db" ADD CONSTRAINT "dokumentasi_db_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
