import { prisma } from "./prisma";
import { ACCOUNTS, NAMES, STAFF_NURSES, nurseIdForBed } from "./demo";
import { hashPassword, readStaffPasswords } from "./password";

const ARTICLE_ADMIT = `尊敬的病友、家属：

欢迎入住本病房。请用 1 分钟了解以下事项：

一、请佩戴腕带，护士核对身份时请配合。
二、床头呼叫铃在右侧，有需要请按铃，不要自行拔管。
三、卫生间保持地面干燥，下床请有人搀扶。
四、贵重物品请交家属保管，不要放在床头柜。
五、探视请遵守病区时间，夜间保持安静。

本页用于演示：请停留约 8 秒，护士站会记为「已读」。`;

const ARTICLE_FALL = `跌倒是住院期间常见意外。请特别注意：

一、起床请先坐在床沿 1 分钟再站立。
二、穿防滑鞋，不要穿拖鞋去卫生间。
三、如感到头晕、乏力，请先按铃，不要独自上厕所。
四、夜间开夜灯，走固定路线。

本页用于演示：请不要读完，回到护士站查看「当面补讲」。`;

const ARTICLE_DIET = `糖尿病饮食要点（演示稿）：

一、定时定量进餐，不要自行加餐高糖食品。
二、主食粗细搭配，蔬菜占餐盘一半。
三、如出现出汗、心慌，可能是低血糖，请立即告知护士。
四、探视带来的水果请先问护士是否合适。`;

const ARTICLE_REHAB = `脑梗死康复要点（演示稿）：

一、早期在护士指导下床边坐起，不要自行下地。
二、患侧肢体摆放保持功能位。
三、饮水喂食请坐起，防止呛咳。
四、如突然头痛、视物成双、说话不清，请马上按铃。`;

const ARTICLE_HAND = `洗手与感染预防（公共库演示稿）：

六步洗手法：掌心、手背、指缝、指背、拇指、指尖。接触伤口前后、如厕后请洗手。本科室引用后即可推送给患者。`;

const ARTICLE_MED = `出院带药说明（院内共享演示稿）：

请按医嘱时间服药，不要自行停药。如出现皮疹、胸闷请回急诊。本篇标记为院内共享，其他科室可引用。`;

const Q_KNOW = JSON.stringify([
  {
    id: "k1",
    prompt: "住院时腕带的作用是？",
    type: "single",
    options: [
      { id: "a", label: "装饰", score: 0 },
      { id: "b", label: "核对身份，防止差错", score: 2 },
      { id: "c", label: "记床号", score: 0 },
    ],
  },
  {
    id: "k2",
    prompt: "下床前应先做什么？（可多选）",
    type: "multiple",
    options: [
      { id: "a", label: "在床沿坐 1 分钟", score: 1 },
      { id: "b", label: "穿防滑鞋", score: 1 },
      { id: "c", label: "立刻跑步活动", score: 0 },
    ],
  },
  {
    id: "k3",
    prompt: "有不舒服时您会怎么做？",
    type: "text",
    options: [],
  },
]);

const Q_SAT = JSON.stringify([
  {
    id: "s1",
    prompt: "入院介绍是否清楚（环境、制度、安全）？",
    type: "single",
    options: [
      { id: "a", label: "很清楚", score: 3 },
      { id: "b", label: "一般", score: 2 },
      { id: "c", label: "不清楚", score: 1 },
    ],
  },
  {
    id: "s2",
    prompt: "病房环境是否整洁安静？",
    type: "single",
    options: [
      { id: "a", label: "满意", score: 3 },
      { id: "b", label: "一般", score: 2 },
      { id: "c", label: "不满意", score: 1 },
    ],
  },
  {
    id: "s3",
    prompt: "护士沟通是否及时、能听懂？",
    type: "single",
    options: [
      { id: "a", label: "满意", score: 3 },
      { id: "b", label: "一般", score: 2 },
      { id: "c", label: "不满意", score: 1 },
    ],
  },
  {
    id: "s4",
    prompt: "总体是否愿意向病友推荐本科室护理？",
    type: "single",
    options: [
      { id: "a", label: "愿意", score: 3 },
      { id: "b", label: "一般", score: 2 },
      { id: "c", label: "不愿意", score: 1 },
    ],
  },
]);

const Q_EXAM = JSON.stringify([
  {
    id: "e1",
    prompt: "患者下床时，责任护士应首先提醒什么？",
    type: "single",
    options: [
      { id: "a", label: "先在床沿坐 1 分钟再站立", score: 2 },
      { id: "b", label: "尽快活动以防血栓", score: 0 },
      { id: "c", label: "不用管，家属负责", score: 0 },
    ],
  },
  {
    id: "e2",
    prompt: "防跌倒高危患者交班应包含？（可多选）",
    type: "multiple",
    options: [
      { id: "a", label: "跌倒史与评分", score: 1 },
      { id: "b", label: "陪伴与约束情况", score: 1 },
      { id: "c", label: "今日菜单", score: 0 },
    ],
  },
  {
    id: "e3",
    prompt: "发现患者呛咳时，正确处置关键词是？",
    type: "text",
    options: [],
    textAnswer: "坐起,停喂",
    textScore: 2,
  },
]);

const GRADE = JSON.stringify([
  { min: 80, label: "优秀" },
  { min: 60, label: "良好" },
  { min: 0, label: "待加强" },
]);

const BEDS: {
  code: number;
  gender: string;
  age: number;
  hospitalNo: string;
  nursingLevel: string;
  dietOrder: string;
  allergy: string;
  diagnosis: string;
  contactName: string;
  contactPhone: string;
  tags: string[];
  admittedOffset?: number;
  surgeryOffset?: number;
}[] = [
  {
    code: 1,
    gender: "男",
    age: 68,
    hospitalNo: "demo-001",
    nursingLevel: "一级",
    dietOrder: "低盐饮食",
    allergy: "青霉素过敏",
    diagnosis: "脑梗死",
    contactName: "张父",
    contactPhone: "13800000001",
    tags: ["tag-stroke", "tag-fall"],
  },
  {
    code: 2,
    gender: "女",
    age: 55,
    hospitalNo: "demo-002",
    nursingLevel: "二级",
    dietOrder: "糖尿病饮食",
    allergy: "",
    diagnosis: "2型糖尿病",
    contactName: "",
    contactPhone: "",
    tags: ["tag-diabetes"],
  },
  {
    code: 3,
    gender: "男",
    age: 62,
    hospitalNo: "demo-003",
    nursingLevel: "一级",
    dietOrder: "普食",
    allergy: "",
    diagnosis: "腰椎术后",
    contactName: "王母",
    contactPhone: "13800000003",
    tags: ["tag-surgery"],
    admittedOffset: -1,
    surgeryOffset: 1,
  },
  {
    code: 4,
    gender: "女",
    age: 79,
    hospitalNo: "demo-004",
    nursingLevel: "特级",
    dietOrder: "软食",
    allergy: "磺胺过敏",
    diagnosis: "高危跌倒观察",
    contactName: "赵女",
    contactPhone: "13800000004",
    tags: ["tag-fall"],
    admittedOffset: -3,
  },
  {
    code: 5,
    gender: "男",
    age: 71,
    hospitalNo: "demo-005",
    nursingLevel: "一级",
    dietOrder: "低盐糖尿病饮食",
    allergy: "",
    diagnosis: "脑梗死",
    contactName: "钱妻",
    contactPhone: "13800000005",
    tags: ["tag-stroke", "tag-diabetes"],
    admittedOffset: -8,
  },
  {
    code: 6,
    gender: "女",
    age: 48,
    hospitalNo: "demo-006",
    nursingLevel: "二级",
    dietOrder: "低脂饮食",
    allergy: "",
    diagnosis: "胆囊术后",
    contactName: "孙弟",
    contactPhone: "13800000006",
    tags: ["tag-surgery"],
    admittedOffset: -5,
    surgeryOffset: 0,
  },
  {
    code: 7,
    gender: "男",
    age: 41,
    hospitalNo: "demo-007",
    nursingLevel: "三级",
    dietOrder: "普食",
    allergy: "",
    diagnosis: "观察",
    contactName: "周妻",
    contactPhone: "13800000007",
    tags: [],
    surgeryOffset: 2,
  },
  {
    code: 8,
    gender: "女",
    age: 83,
    hospitalNo: "demo-008",
    nursingLevel: "一级",
    dietOrder: "糖尿病饮食",
    allergy: "碘过敏",
    diagnosis: "糖尿病伴跌倒高危",
    contactName: "吴儿",
    contactPhone: "13800000008",
    tags: ["tag-fall", "tag-diabetes"],
    admittedOffset: -2,
  },
];

async function wipe() {
  await prisma.readEvent.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.staffNurse.deleteMany();
  await prisma.pushTask.deleteMany();
  await prisma.stayTag.deleteMany();
  await prisma.stayPathway.deleteMany();
  await prisma.stay.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.staffAccount.deleteMany();
  await prisma.pushJob.deleteMany();
  await prisma.pushPlan.deleteMany();
  await prisma.pathwayItem.deleteMany();
  await prisma.pathway.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.tagGroup.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inviteLink.deleteMany();
  await prisma.educationSettings.deleteMany();
  await prisma.demoState.deleteMany();
  await prisma.orgNode.deleteMany();
  await prisma.tenant.deleteMany();
}

export async function resetDemoData() {
  await wipe();

  const admittedAt = new Date();
  admittedAt.setHours(8, 0, 0, 0);

  await prisma.tenant.create({ data: { id: "demo", name: "宣武演示病区" } });
  await prisma.demoState.create({ data: { id: "demo", dayOffset: 0 } });
  await prisma.educationSettings.create({
    data: {
      id: "demo",
      autoDischargeDays: 30,
      hotline: "010-83198318",
      hotlineLabel: "病区热线",
      consultEnabled: false,
      requireIntakeForm: false,
      requirePushConfirm: false,
      consentText: "护士将通过本页向您推送住院期间的健康教育内容。内容仅供了解住院注意事项，不能替代当面指导。",
      diseaseZoneName: "脑梗死专区",
      diseaseZoneTagId: "tag-stroke",
    },
  });
  await prisma.inviteLink.create({
    data: { id: "demo-invite", token: "demo-invite-neurology", role: "primary_nurse" },
  });
  const passwords = readStaffPasswords();
  await prisma.staffAccount.createMany({
    data: ACCOUNTS.map((account) => ({
      id: account.id,
      name: account.name,
      role: account.role,
      bedsLabel: account.bedsLabel,
      passwordHash: hashPassword(passwords[account.id]),
    })),
  });
  await prisma.staffNurse.createMany({
    data: STAFF_NURSES.map((n) => ({ id: n.id, name: n.name, title: "责任护士", bedsLabel: n.bedsLabel })),
  });
  await prisma.orgNode.createMany({
    data: [
      { id: "org-hospital", name: "宣武医院", kind: "hospital", sortOrder: 1 },
      { id: "org-campus", name: "演示院区", kind: "campus", parentId: "org-hospital", sortOrder: 1 },
      { id: "org-dept", name: "神经内科", kind: "dept", parentId: "org-campus", sortOrder: 1 },
      { id: "org-ward", name: "演示病区", kind: "ward", parentId: "org-dept", sortOrder: 1 },
    ],
  });
  await prisma.tagGroup.createMany({
    data: [
      { id: "tag-stroke", name: "病种-脑梗死", color: "#C45C26" },
      { id: "tag-surgery", name: "手术", color: "#0F3A5F" },
      { id: "tag-fall", name: "高危跌倒", color: "#D32F2F" },
      { id: "tag-diabetes", name: "糖尿病饮食", color: "#1A7A72" },
    ],
  });
  await prisma.category.createMany({
    data: [
      { id: "cat-admit", name: "入院", sortOrder: 1 },
      { id: "cat-discharge", name: "出院", sortOrder: 2 },
      { id: "cat-exam", name: "检查", sortOrder: 3 },
      { id: "cat-op", name: "手术", sortOrder: 4 },
      { id: "cat-disease", name: "疾病", sortOrder: 5 },
      { id: "cat-nurse", name: "护理", sortOrder: 6 },
      { id: "cat-diet", name: "饮食", sortOrder: 7 },
      { id: "cat-med", name: "用药", sortOrder: 8 },
      { id: "cat-rehab", name: "康复", sortOrder: 9 },
    ],
  });
  await prisma.article.createMany({
    data: [
      {
        id: "art-admit",
        slug: "admission",
        title: "入院须知",
        summary: "住院期间请配合护士完成安全与生活安排。",
        body: ARTICLE_ADMIT,
        sortOrder: 10,
        categoryId: "cat-admit",
        keywords: "入院,制度",
        scope: "department",
        mediaType: "image",
        mediaUrl: "/covers/admit.svg",
      },
      {
        id: "art-fall",
        slug: "fall-prevent",
        title: "防跌倒宣教",
        summary: "下床、如厕时请注意防滑，有人陪伴。",
        body: ARTICLE_FALL,
        sortOrder: 9,
        categoryId: "cat-nurse",
        keywords: "跌倒,安全",
        scope: "department",
        mediaType: "image",
        mediaUrl: "/covers/fall.svg",
      },
      {
        id: "art-diet",
        slug: "diabetes-diet",
        title: "糖尿病饮食指导",
        summary: "定时定量，预防低血糖。",
        body: ARTICLE_DIET,
        sortOrder: 8,
        categoryId: "cat-diet",
        keywords: "糖尿病,饮食",
        scope: "department",
        mediaType: "image",
        mediaUrl: "/covers/diet.svg",
      },
      {
        id: "art-rehab",
        slug: "stroke-rehab",
        title: "脑梗死康复要点",
        summary: "早期活动与防呛咳。",
        body: ARTICLE_REHAB,
        sortOrder: 7,
        categoryId: "cat-rehab",
        keywords: "脑梗死,康复",
        scope: "department",
        mediaType: "image",
        mediaUrl: "/covers/rehab.svg",
      },
      {
        id: "art-hand",
        slug: "hand-hygiene",
        title: "洗手与感染预防",
        summary: "公共库文章，引用后发布到本科。",
        body: ARTICLE_HAND,
        sortOrder: 6,
        categoryId: "cat-nurse",
        keywords: "洗手,感染",
        scope: "public_lib",
        mediaType: "text",
        mediaUrl: "",
      },
      {
        id: "art-med",
        slug: "discharge-meds",
        title: "出院带药说明",
        summary: "院内共享，其他科室可引用。",
        body: ARTICLE_MED,
        sortOrder: 5,
        categoryId: "cat-discharge",
        keywords: "出院,用药",
        scope: "hospital",
        mediaType: "text",
        mediaUrl: "",
        changeLog: `${admittedAt.toISOString().slice(0, 10)} 护理部发布初稿`,
      },
    ],
  });
  await prisma.questionnaire.createMany({
    data: [
      {
        id: "q-know",
        title: "入院宣教知晓",
        description: "读完入院须知后作答。",
        questionsJson: Q_KNOW,
        gradeJson: GRADE,
        isExam: false,
      },
      {
        id: "q-satisfy",
        title: "护理工作满意度",
        description: "入院介绍、环境、沟通等。也可作为护士分层考试试卷。",
        questionsJson: Q_SAT,
        gradeJson: GRADE,
        isExam: false,
      },
      {
        id: "q-exam",
        title: "护士安全考核",
        description: "护士长出题后发给责任护士。作答不含答案，提交后自动判卷。",
        questionsJson: Q_EXAM,
        gradeJson: GRADE,
        isExam: true,
      },
    ],
  });
  await prisma.pathway.create({
    data: {
      id: "path-admit",
      name: "普通入院",
      kind: "general",
      status: "active",
      items: {
        create: [
          { id: "pi-admit-1", offsetDays: 0, contentType: "article", articleId: "art-admit", sortOrder: 1 },
          {
            id: "pi-admit-2",
            offsetDays: 0,
            contentType: "article",
            articleId: "art-fall",
            bedsideRequired: true,
            sortOrder: 2,
          },
        ],
      },
    },
  });
  await prisma.pathway.create({
    data: {
      id: "path-stroke",
      name: "脑梗死路径",
      kind: "disease",
      status: "pending_review",
      items: {
        create: [
          { id: "pi-st-1", offsetDays: 0, contentType: "article", articleId: "art-diet", sortOrder: 1 },
          { id: "pi-st-2", offsetDays: 0, contentType: "questionnaire", questionnaireId: "q-satisfy", sortOrder: 2 },
          { id: "pi-st-3", offsetDays: 1, contentType: "article", articleId: "art-rehab", sortOrder: 3 },
        ],
      },
    },
  });
  await prisma.pushPlan.create({
    data: {
      id: "plan-fall",
      name: "高危跌倒 · 首次扫码当日 · 防跌倒",
      enabled: true,
      tagGroupId: "tag-fall",
      articleId: "art-fall",
      anchor: "first_scan",
      offsetDays: 0,
    },
  });
  await prisma.notification.create({
    data: {
      id: "note-unread",
      title: "今日未读汇总",
      body: "请到「今日任务」查看已推未读，未读项可当面补讲。",
    },
  });

  for (const row of BEDS) {
    const bedId = `bed-${row.code}`;
    await prisma.bed.create({
      data: {
        id: bedId,
        code: row.code,
        patientName: NAMES[row.code - 1],
        primaryNurseId: nurseIdForBed(row.code),
        stay: {
          create: {
            id: `stay-${row.code}`,
            accessToken: `demo-bed-${row.code}-token`,
            admittedAt: row.admittedOffset
              ? new Date(admittedAt.getTime() + row.admittedOffset * 86400000)
              : admittedAt,
            surgeryAt:
              row.surgeryOffset != null
                ? new Date(
                    (row.admittedOffset ? admittedAt.getTime() + row.admittedOffset * 86400000 : admittedAt.getTime()) +
                      row.surgeryOffset * 86400000,
                  )
                : null,
            diagnosis: row.diagnosis,
            gender: row.gender,
            age: row.age,
            hospitalNo: row.hospitalNo,
            nursingLevel: row.nursingLevel,
            dietOrder: row.dietOrder,
            allergy: row.allergy,
            contactName: row.contactName,
            contactPhone: row.contactPhone,
            tags: { create: row.tags.map((tagGroupId) => ({ tagGroupId })) },
          },
        },
      },
    });
  }

  await prisma.bed.create({
    data: { id: "bed-temp", code: 99, patientName: "" },
  });

  return { ok: true as const };
}
