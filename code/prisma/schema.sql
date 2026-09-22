-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('head_nurse', 'primary_nurse', 'nursing_admin', 'qa_readonly', 'sys_admin');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('pending', 'delivered', 'read', 'done');

-- CreateEnum
CREATE TYPE "public"."StayStatus" AS ENUM ('in_ward', 'discharged');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrgNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrgNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DemoState" (
    "id" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DemoState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EducationSettings" (
    "id" TEXT NOT NULL,
    "autoDischargeDays" INTEGER NOT NULL DEFAULT 30,
    "hotline" TEXT NOT NULL DEFAULT '010-83198318',
    "hotlineLabel" TEXT NOT NULL DEFAULT '病区热线',
    "consultEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requireIntakeForm" BOOLEAN NOT NULL DEFAULT false,
    "requirePushConfirm" BOOLEAN NOT NULL DEFAULT false,
    "consentText" TEXT NOT NULL DEFAULT '',
    "diseaseZoneName" TEXT NOT NULL DEFAULT '脑梗死专区',
    "diseaseZoneTagId" TEXT NOT NULL DEFAULT 'tag-stroke',

    CONSTRAINT "EducationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InviteLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "categoryId" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL DEFAULT 'department',
    "mediaType" TEXT NOT NULL DEFAULT 'richtext',
    "mediaUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'published',
    "changeLog" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffNurse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '责任护士',
    "bedsLabel" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "StaffNurse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamAssignment" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "ExamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Questionnaire" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "questionsJson" TEXT NOT NULL,
    "gradeJson" TEXT NOT NULL,
    "isExam" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SurveyResponse" (
    "id" TEXT NOT NULL,
    "stayId" TEXT,
    "questionnaireId" TEXT NOT NULL,
    "taskId" TEXT,
    "answersJson" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondentRole" TEXT NOT NULL DEFAULT 'patient',
    "respondentName" TEXT NOT NULL DEFAULT '',
    "assignmentId" TEXT,
    "nurseId" TEXT,
    "rawScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "detailJson" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pathway" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Pathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PathwayItem" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT NOT NULL,
    "articleId" TEXT,
    "questionnaireId" TEXT,
    "noticeBody" TEXT NOT NULL DEFAULT '',
    "bedsideRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "PathwayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StayPathway" (
    "id" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StayPathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bedsLabel" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bed" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "primaryNurseId" TEXT,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stay" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" "public"."StayStatus" NOT NULL DEFAULT 'in_ward',
    "admittedAt" TIMESTAMP(3) NOT NULL,
    "surgeryAt" TIMESTAMP(3),
    "dischargedAt" TIMESTAMP(3),
    "firstScanAt" TIMESTAMP(3),
    "consentAcceptedAt" TIMESTAMP(3),
    "pathwayAppliedAt" TIMESTAMP(3),
    "intakeFilledAt" TIMESTAMP(3),
    "diagnosis" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "age" INTEGER NOT NULL DEFAULT 0,
    "hospitalNo" TEXT NOT NULL DEFAULT '',
    "nursingLevel" TEXT NOT NULL DEFAULT '',
    "dietOrder" TEXT NOT NULL DEFAULT '',
    "allergy" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StayTag" (
    "stayId" TEXT NOT NULL,
    "tagGroupId" TEXT NOT NULL,

    CONSTRAINT "StayTag_pkey" PRIMARY KEY ("stayId","tagGroupId")
);

-- CreateTable
CREATE TABLE "public"."PushJob" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "articleId" TEXT,
    "questionnaireId" TEXT,
    "noticeBody" TEXT NOT NULL DEFAULT '',
    "filterJson" TEXT NOT NULL,
    "scheduleAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statsSent" INTEGER NOT NULL DEFAULT 0,
    "statsRead" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PushJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tagGroupId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "PushPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushTask" (
    "id" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "articleId" TEXT,
    "questionnaireId" TEXT,
    "noticeBody" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'article',
    "sourceType" TEXT NOT NULL DEFAULT 'pathway',
    "sourceId" TEXT NOT NULL DEFAULT '',
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'delivered',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "dwellMs" INTEGER NOT NULL DEFAULT 0,
    "effectiveReadAt" TIMESTAMP(3),
    "bedsideDoneAt" TIMESTAMP(3),
    "bedsideRequired" BOOLEAN NOT NULL DEFAULT false,
    "noticeAckAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "deliveryCount" INTEGER NOT NULL DEFAULT 1,
    "assignedPrimary" BOOLEAN NOT NULL DEFAULT false,
    "jobId" TEXT,
    "planId" TEXT,

    CONSTRAINT "PushTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReadEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_token_key" ON "public"."InviteLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "public"."Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StayPathway_stayId_pathwayId_key" ON "public"."StayPathway"("stayId", "pathwayId");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_code_key" ON "public"."Bed"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stay_bedId_key" ON "public"."Stay"("bedId");

-- CreateIndex
CREATE UNIQUE INDEX "Stay_accessToken_key" ON "public"."Stay"("accessToken");

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "public"."Stay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathwayItem" ADD CONSTRAINT "PathwayItem_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "public"."Pathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathwayItem" ADD CONSTRAINT "PathwayItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathwayItem" ADD CONSTRAINT "PathwayItem_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StayPathway" ADD CONSTRAINT "StayPathway_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "public"."Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StayPathway" ADD CONSTRAINT "StayPathway_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "public"."Pathway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bed" ADD CONSTRAINT "Bed_primaryNurseId_fkey" FOREIGN KEY ("primaryNurseId") REFERENCES "public"."StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stay" ADD CONSTRAINT "Stay_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "public"."Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StayTag" ADD CONSTRAINT "StayTag_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "public"."Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StayTag" ADD CONSTRAINT "StayTag_tagGroupId_fkey" FOREIGN KEY ("tagGroupId") REFERENCES "public"."TagGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushJob" ADD CONSTRAINT "PushJob_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushJob" ADD CONSTRAINT "PushJob_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushPlan" ADD CONSTRAINT "PushPlan_tagGroupId_fkey" FOREIGN KEY ("tagGroupId") REFERENCES "public"."TagGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushPlan" ADD CONSTRAINT "PushPlan_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushTask" ADD CONSTRAINT "PushTask_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "public"."Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushTask" ADD CONSTRAINT "PushTask_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushTask" ADD CONSTRAINT "PushTask_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushTask" ADD CONSTRAINT "PushTask_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."PushJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushTask" ADD CONSTRAINT "PushTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."PushPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadEvent" ADD CONSTRAINT "ReadEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."PushTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamAssignment" ADD CONSTRAINT "ExamAssignment_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamAssignment" ADD CONSTRAINT "ExamAssignment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "public"."StaffNurse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."ExamAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "public"."StaffNurse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

