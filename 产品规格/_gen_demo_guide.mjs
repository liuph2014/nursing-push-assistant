/**
 * 生成 05-演示路径说明书.docx
 * 运行：在本目录 npm install docx && node _gen_demo_guide.mjs
 */
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat } from "docx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = "Microsoft YaHei";
const PAGE_W = 11906;
const MARGIN = 1080;
const CONTENT_W = PAGE_W - MARGIN * 2;
const navy = "0F3A5F";
const thin = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const headerFill = "0F3A5F";
const altFill = "F4F7F8";

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 21, bold: opts.bold, color: opts.color, italics: opts.italics });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0, line: 360 },
    alignment: opts.align,
    children: Array.isArray(text) ? text : [run(text, opts)],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [run(text, { size: 32, bold: true, color: navy })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [run(text, { size: 26, bold: true, color: navy })],
  });
}

function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 340 },
    children: [run(text)],
  });
}

function check(text, ref = "checks") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60, line: 340 },
    children: [run(text)],
  });
}

function cell(text, width, opts = {}) {
  const fill = opts.header ? headerFill : opts.alt ? altFill : "FFFFFF";
  const color = opts.header ? "FFFFFF" : "1E293B";
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [run(String(text), { bold: opts.header || opts.bold, color, size: opts.size ?? 18 })],
      }),
    ],
  });
}

function table(colWidths, rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((cols, i) =>
      new TableRow({
        children: cols.map((c, j) =>
          cell(c, colWidths[j], {
            header: i === 0,
            alt: i > 0 && i % 2 === 0,
            bold: i === 0,
          }),
        ),
      }),
    ),
  });
}

const c3 = [1800, 3613, 3613];
const c2 = [2400, 6626];
const c4 = [1400, 4200, 1713, 1713];
const cCheck = [1400, 6226, 1400];

const children = [
  new Paragraph({
    spacing: { after: 80 },
    children: [run("宣武 POC · 护理推送助手", { size: 20, color: "64748B" })],
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [run("演示路径说明书", { size: 44, bold: true, color: navy })],
  }),
  p("现场 / 电脑走查「入院宣教作业闭环」并勾选验收。对应代码目录：护理推送助手 / code。本切片不是完整 59 项 SaaS，只验证入院路径这一条作业链。", { after: 200 }),

  h1("1. 演示在验证什么"),
  p("一条护士站作业闭环："),
  bullet("护士长给 1 床套用「普通入院」路径"),
  bullet("患者用微信扫床头码（或电脑打开 H5）同意进入"),
  bullet("读完《入院须知》（停留满 8 秒）→ 护士端记为已读"),
  bullet("故意不读《防跌倒宣教》→ 出现在「当面补讲」"),
  bullet("护士点「已当面完成」"),
  bullet("护理部看板数字能对上刚才的操作"),
  bullet("责任护士只能操作 1–4 床"),
  p("本 Demo 没有：路径审核、智能计划、群发确认、月报导出、分层考试、入科长表单、短信、HIS、小程序、床旁屏 SDK。授权只保留一页「同意并进入」。", { before: 80 }),

  h1("2. 开始前准备"),
  h2("2.1 电脑端（必做）"),
  p("进入 护理推送助手/code，执行 npm install 与 npm run dev，浏览器打开 http://localhost:3000，应进入床位图，顶部有深蓝色演示条。"),
  p("一直白屏：结束占用 3000 端口的旧 node 进程后重跑 npm run dev，浏览器 Ctrl+F5 强制刷新。"),
  h2("2.2 微信真机扫码（可选）"),
  p("本地 http://localhost:3000 的二维码在微信里通常打不开。真机扫码需部署 Vercel（HTTPS），配置 DATABASE_URL（Neon）与 NEXT_PUBLIC_APP_URL（https 域名，不要斜杠结尾）。改完 APP_URL 必须重新部署。电脑验收可全程用演示条「打开该床患者 H5」。"),
  h2("2.3 预置数据"),
  table(c2, [
    ["项", "内容"],
    ["病区 / 床", "1 个演示病区，8 张床"],
    ["患者假名", "张一、李二、王三、赵四、钱五、孙六、周七、吴八"],
    ["路径", "普通入院：A《入院须知》必读；B《防跌倒宣教》故意不读"],
    ["有效阅读", "累计停留 ≥ 8 秒（每 2 秒心跳）"],
    ["账号", "无登录、无验证码；演示条切换角色"],
    ["1 床链接", "/p/demo-bed-1-token（重置后仍可用）"],
    ["权限", "责任护士 1–4 床；护士长 1–8 床；护理部只看看板"],
  ]),

  h1("3. 演示条怎么用"),
  p("仅医护电脑有演示条。患者 H5 没有演示条，页脚只有「演示数据」。"),
  table(c2, [
    ["控件", "作用"],
    ["护士长 / 责任护士 / 护理部", "一键切角色。切护理部会跳到看板"],
    ["当前床 1–8", "切换后打开该床；「打开该床患者 H5」跟这张床走"],
    ["打开该床患者 H5", "新标签打开患者页（电脑预览）"],
    ["复制患者链接", "手机扫不开码时的兜底"],
    ["步骤 1–7", "跳到对应页，主按钮橙色描边"],
    ["重置演示数据", "必须点两次才重置；只清演示租户"],
  ]),
  p("每轮开始前：点「重置演示数据」→ 变成橙色「再点一次确认重置」→ 再点一次。重置后应 8 床均未套路径。", { before: 160 }),

  h1("4. 主路径（必须全过）"),
  p("约 15–20 分钟。电脑用 Chrome；患者侧可用第二个浏览器窗口代替微信。"),

  h2("步骤 0 · 确认入口"),
  check("打开地址进入床位图，顶部有演示条，能看到 8 张床卡"),
  check("无需注册、验证码、下载 App"),

  h2("步骤 1 · 护士长套路径"),
  p("演示条点护士长 → 点「1 套路径」→ 点橙色「套用入院路径」。"),
  check("文案变为「已套用普通入院路径」"),
  check("列表出现：入院须知 未读、防跌倒宣教 未读"),
  check("右侧床头码可见，地址含 /p/demo-bed-1-token"),
  check("「打开该床患者 H5」与二维码是同一 token"),

  h2("步骤 2 · 患者同意并看到待学习"),
  p("电脑：点「打开该床患者 H5」。微信（已部署 HTTPS）：扫 1 床码。然后点满宽「同意并进入」。"),
  check("患者页没有医护演示条，页脚有「演示数据」"),
  check("「我的待学习」两篇，状态为待学习"),
  check("未要求注册 / 验证码 / 下载 App"),

  h2("步骤 3 · 只读文章 A（入院须知）"),
  p("打开入院须知，停留满 8 秒，直到提示「已记为有效阅读」。不要读完防跌倒。回到护士电脑 1 床页，等约 3 秒自动刷新。"),
  check("护士端「入院须知」变为已读（绿色）"),
  check("「防跌倒宣教」仍为未读（红色）"),

  h2("步骤 4 · 当面补讲"),
  p("点「5 当面补讲」，或「今日任务 → 当面补讲」。应看到 1 床张一 · 防跌倒宣教。点「已当面完成」。"),
  check("该条离开当面补讲 Tab"),
  check("1 床页「防跌倒宣教」变为已当面完成"),

  h2("步骤 5 · 护理部看板"),
  p("演示条点护理部（会进看板）。对照数字："),
  table(c4, [
    ["指标", "含义", "刚重置", "走完主路径"],
    ["今日新增", "已套路径人数", "0", "1"],
    ["有效阅读人数", "至少读过一篇的人数", "0", "1"],
    ["未读人数", "仍有未读任务的人数", "0", "0"],
    ["在院人数", "8 张床", "8", "8"],
  ]),
  check("身份为护理部；今日新增、有效阅读与重置后不同"),
  check("护理部进入 1 床不能套路径（只读）"),

  h2("步骤 6 · 责任护士权限"),
  p("演示条点责任护士，打开床位。"),
  check("副标题写可操作 1–4 床，5–8 床已灰显"),
  check("5–8 床变淡并标注非责任床"),
  check("进入 5 床：无套路径按钮，提示当前角色不能给此床套路径"),
  check("进入 1 床：仍可看到套路径按钮"),

  h2("步骤 7 · 演示步骤跳转"),
  table(c3, [
    ["步骤", "应到达", "应高亮"],
    ["1 套路径", "1 床详情", "套用入院路径"],
    ["2 / 3", "1 床详情", "右侧二维码"],
    ["4 看已读", "1 床详情", "待学习列表"],
    ["5 / 6", "今日任务 · 当面补讲", "已当面完成"],
    ["7 看板", "科室看板", "四张数字卡片"],
  ]),
  check("七个步骤均可点击跳转，无需找隐藏菜单"),

  h1("5. 失败态（必须有）"),
  h2("5.1 码已失效"),
  p("打开 /p/not-a-token。"),
  check("明确写「码已失效，请找护士」，不白屏、不跳登录"),
  h2("5.2 未套路径就扫码"),
  p("对 2 床（不要套路径）打开患者 H5 → 同意并进入。"),
  check("能进待学习，列表为空，提示请让护士套路径后再扫码"),
  h2("5.3 重置不误伤"),
  check("第一次点重置只变确认，数据不变；第二次才清空"),
  check("重置后仍是 8 床、两篇文章、token 仍为 demo-bed-N-token"),

  h1("6. 体验底线与微信加分项"),
  check("医护主按钮对比足够：套路径橙色、补讲青绿、未读红点可见"),
  check("H5 同意按钮满宽；文章字号适合微信"),
  check("患者页无演示条；无注册、验证码、下载 App"),
  p("微信（仅公网 HTTPS）：地址栏是 https 不是 localhost；扫 1 床码域名与 NEXT_PUBLIC_APP_URL 一致；读满 8 秒后护士电脑约 3 秒内变为已读。", { before: 80 }),

  h1("7. 现场讲解口径（约 3 分钟）"),
  p("护士站先给床位套入院路径，床头码给患者。患者同意后读必读篇，系统按停留时间记有效阅读。没读的进「当面补讲」，护士床旁讲完一点就闭环。护理部看板看覆盖，责任护士只能动自己的床。这一版只跑通作业闭环，不做完整健康教育中台。讲解时建议双屏：左护士站、右患者 H5。"),

  h1("8. 本切片验收结论"),
  p("下列全部勾上，即可认为垂直切片 Demo 验收通过（电脑端即可；微信为加分项）。"),
  table(cCheck, [
    ["编号", "结论项", "通过"],
    ["A", "护士长可为 1 床套路径，两篇待学习 + 床头码可见", "☐"],
    ["B", "患者同意后可见两篇；读 A 满 8 秒后护士端已读", "☐"],
    ["C", "B 不读 → 当面补讲 → 点完成离开该栏", "☐"],
    ["D", "护理部看板数字能对应上述操作", "☐"],
    ["E", "责任护士 5–8 床灰显且不可套路径", "☐"],
    ["F", "步骤 1–7 可跳转；H5 链接与二维码同一 token", "☐"],
    ["G", "无效码、未套路径、二次确认重置三种失败态成立", "☐"],
    ["H", "无注册 / 验证码 / 下载 App", "☐"],
  ]),
  p("总评：通过 ☐     有条件通过 ☐     不通过 ☐", { before: 240, after: 80 }),
  p("验收人：____________________     日期：____________________"),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: navy },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: navy },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
      { reference: "checks",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "☐", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: 16838 },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [run("护理推送助手 · 演示路径说明书", { size: 16, color: "64748B" })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            run("第 ", { size: 16, color: "64748B" }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "64748B" }),
            run(" 页", { size: 16, color: "64748B" }),
          ],
        })],
      }),
    },
    children,
  }],
});

const out = path.join(__dirname, "05-演示路径说明书.docx");
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(out, buf);
console.log("wrote", out);
