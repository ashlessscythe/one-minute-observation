-- CreateTable
CREATE TABLE "Observation" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "shift" INTEGER NOT NULL,
    "associateName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "actionAddressed" TEXT NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isSupervisor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
