import PptxGenJS from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SHOT = path.join(ROOT, "产品规格/使用者说明素材");
const BRAND = path.join(ROOT, "code/public/brand");
const OUT = path.join(ROOT, "护理推送助手-使用者说明.pptx");

const C = {
  navy: "0F3A5F",
  deep: "0A2744",
  teal: "1A7A72",
  clay: "C45C26",
  paper: "F3F1EC",
  white: "FFFFFF",
  ink: "1C2430",
  muted: "5C6876",
  line: "D5DCE4",
  gold: "C4A574",
};

const FONT = "Microsoft YaHei";
const SERIF = "KaiTi";
const W = 13.333;
const H = 7.5;

function img(name) {
  return path.join(SHOT, name);
}

function sh() {
  return { type: "outer", color: "0A2744", blur: 14, offset: 4, angle: 135, opacity: 0.14 };
}

function shSoft() {
  return { type: "outer", color: "0A2744", blur: 22, offset: 6, angle: 135, opacity: 0.18 };
}

const pres = new PptxGenJS();
pres.defineLayout({ name: "XW", width: W, height: H });
pres.layout = "XW";
pres.title = "护理推送助手 · 使用者说明";
pres.author = "宣武医院神经外科 Demo";
pres.subject = "演示系统各页面功能与操作说明";

let page = 0;

function rail(slide, color = C.navy) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.1,
    h: H,
    fill: { color },
  });
}

function footer(slide, light = false) {
  page += 1;
  const color = light ? "9BB0C2" : "8A96A3";
  slide.addText("首都医科大学宣武医院神经外科  护理推送助手  演示版使用者说明", {
    x: 0.42,
    y: 7.18,
    w: 10.6,
    h: 0.22,
    fontSize: 10,
    fontFace: FONT,
    color,
    margin: 0,
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: 11.9,
    y: 7.18,
    w: 0.95,
    h: 0.22,
    fontSize: 10,
    fontFace: FONT,
    color,
    align: "right",
    margin: 0,
  });
}

function kicker(slide, text, x = 0.48, y = 0.28) {
  slide.addText(text, {
    x,
    y,
    w: 8,
    h: 0.22,
    fontSize: 11,
    fontFace: FONT,
    color: C.teal,
    bold: true,
    margin: 0,
  });
}

function title(slide, text, x = 0.48, y = 0.48, w = 8.2) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.48,
    fontSize: 28,
    fontFace: SERIF,
    color: C.navy,
    margin: 0,
  });
}

function paperSlide() {
  const slide = pres.addSlide();
  slide.background = { color: C.paper };
  rail(slide);
  return slide;
}

function addShot(slide, file, x, y, w, h, mode = "contain") {
  slide.addImage({
    path: file,
    x,
    y,
    w,
    h,
    sizing: { type: mode, w, h },
    shadow: shSoft(),
  });
}

function featureBlock(slide, items, x, y0, w) {
  items.forEach((item, i) => {
    const y = y0 + i * 1.02;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w,
      h: 0.92,
      fill: { color: C.white },
      rectRadius: 0.08,
      shadow: sh(),
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.14,
      y: y + 0.14,
      w: 0.42,
      h: 0.28,
      fontSize: 13,
      fontFace: FONT,
      color: C.clay,
      bold: true,
      margin: 0,
    });
    slide.addText(item.h, {
      x: x + 0.58,
      y: y + 0.12,
      w: w - 0.74,
      h: 0.26,
      fontSize: 14,
      fontFace: FONT,
      color: C.navy,
      bold: true,
      margin: 0,
    });
    slide.addText(item.p, {
      x: x + 0.58,
      y: y + 0.4,
      w: w - 0.74,
      h: 0.42,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
      valign: "top",
    });
  });
}

function screenRight(opts) {
  const slide = paperSlide();
  kicker(slide, opts.kicker);
  title(slide, opts.title, 0.48, 0.5, 4.4);
  if (opts.lead) {
    slide.addText(opts.lead, {
      x: 0.48,
      y: 1.02,
      w: 4.4,
      h: 0.62,
      fontSize: 13,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  }
  featureBlock(slide, opts.items, 0.48, 1.72, 4.4);
  addShot(slide, opts.shot, 5.12, 0.88, 7.72, 4.34);
  if (opts.caption) {
    slide.addText(opts.caption, {
      x: 5.12,
      y: 5.32,
      w: 7.72,
      h: 0.28,
      fontSize: 11,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  }
  footer(slide);
  return slide;
}

// ——— 1 封面 ———
{
  const slide = pres.addSlide();
  slide.background = { path: path.join(BRAND, "campus.jpg") };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: C.deep, transparency: 38 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.18,
    h: H,
    fill: { color: C.clay },
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.62,
    y: 0.48,
    w: 4.55,
    h: 0.78,
    fill: { color: C.white },
    rectRadius: 0.12,
  });
  slide.addImage({
    path: path.join(BRAND, "logo.png"),
    x: 0.78,
    y: 0.56,
    w: 4.22,
    h: 0.62,
  });
  slide.addText("使用者说明", {
    x: 0.62,
    y: 2.35,
    w: 11.5,
    h: 0.42,
    fontSize: 16,
    fontFace: FONT,
    color: C.gold,
    margin: 0,
  });
  slide.addText("护理推送助手", {
    x: 0.62,
    y: 2.78,
    w: 12,
    h: 1.05,
    fontSize: 54,
    fontFace: SERIF,
    color: C.white,
    margin: 0,
  });
  slide.addText("本文件说明演示系统各页面的功能与操作方法，供病区护士、护士长及护理部使用。", {
    x: 0.62,
    y: 4.0,
    w: 9.2,
    h: 0.7,
    fontSize: 16,
    fontFace: FONT,
    color: "E6EDF3",
    margin: 0,
  });
  slide.addText("首都医科大学宣武医院神经外科  演示版  2026", {
    x: 0.62,
    y: 6.85,
    w: 8,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: "C5D0DA",
    margin: 0,
  });
  page += 1;
}

// ——— 2 目录 ———
{
  const slide = paperSlide();
  kicker(slide, "目录");
  title(slide, "本说明的内容");
  const cols = [
    {
      n: "01",
      t: "启动与权限",
      d: "如何打开系统、如何登录，以及四种角色进入的页面。",
    },
    {
      n: "02",
      t: "作业台",
      d: "床位图、档案归类、患者档案、床头码、今日任务。",
    },
    {
      n: "03",
      t: "宣教与质控",
      d: "图文库、群发、计划、路径、问卷考核、成效看板。",
    },
    {
      n: "04",
      t: "患者端",
      d: "知情同意、待学习、有效阅读、宣教中心、专病专区。",
    },
  ];
  cols.forEach((c, i) => {
    const x = 0.48 + (i % 2) * 6.35;
    const y = 1.28 + Math.floor(i / 2) * 2.55;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 6.05,
      h: 2.32,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addText(c.n, {
      x: x + 0.32,
      y: y + 0.32,
      w: 1.4,
      h: 0.5,
      fontSize: 28,
      fontFace: FONT,
      color: C.clay,
      bold: true,
      margin: 0,
    });
    slide.addText(c.t, {
      x: x + 1.8,
      y: y + 0.38,
      w: 3.8,
      h: 0.4,
      fontSize: 22,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(c.d, {
      x: x + 0.32,
      y: y + 1.12,
      w: 5.4,
      h: 0.8,
      fontSize: 14,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
      valign: "top",
    });
  });
  footer(slide);
}

// ——— 3 产品是什么 ———
{
  const slide = paperSlide();
  kicker(slide, "用途");
  title(slide, "本演示解决什么问题");
  slide.addText("护士为在院患者套用入院路径，患者扫床头码后阅读宣教。系统按页面停留时间记录有效阅读。未完成阅读的条目可登记当面补讲。护理部在成效看板核对人数。", {
    x: 0.48,
    y: 1.1,
    w: 12.3,
    h: 0.7,
    fontSize: 15,
    fontFace: FONT,
    color: C.ink,
    margin: 0,
  });
  const cards = [
    { t: "使用对象", p: "护士长、责任护士、护理部。本版为演示系统，功能少于正式部署版本。" },
    { t: "标准流程", p: "为1床套用普通入院路径。患者阅读入院须知满8秒。未读防跌倒时登记当面补讲。在成效看板核对人数。" },
    { t: "未实现功能", p: "不含微信小程序、短信、医院信息系统对接及短信验证码。" },
    { t: "演示数据", p: "8张床，患者姓名为张一至吴八。1床链接在重置后保持不变。" },
  ];
  cards.forEach((c, i) => {
    const x = 0.48 + (i % 4) * 3.18;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.05,
      w: 3.02,
      h: 4.55,
      fill: { color: i === 1 ? C.navy : C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addText(c.t, {
      x: x + 0.22,
      y: 2.28,
      w: 2.58,
      h: 0.7,
      fontSize: 20,
      fontFace: SERIF,
      color: i === 1 ? C.white : C.navy,
      margin: 0,
    });
    slide.addText(c.p, {
      x: x + 0.22,
      y: 3.12,
      w: 2.58,
      h: 3.1,
      fontSize: 14,
      fontFace: FONT,
      color: i === 1 ? "D5E2EC" : C.muted,
      margin: 0,
      valign: "top",
    });
  });
  footer(slide);
}

// ——— 4 打开 ———
{
  const slide = paperSlide();
  kicker(slide, "启动");
  title(slide, "如何打开演示系统");
  const steps = [
    { n: "1", h: "打开目录", p: "护理推送助手 / code" },
    { n: "2", h: "启动服务", p: "npm install\nnpm run dev" },
    { n: "3", h: "打开页面", p: "http://localhost:3000\n默认显示床位图" },
    { n: "4", h: "页面空白时", p: "结束占用3000端口的进程后重新启动，并强制刷新浏览器。" },
  ];
  steps.forEach((s, i) => {
    const x = 0.48 + i * 3.18;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.28,
      w: 3.02,
      h: 4.0,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.24,
      y: 1.52,
      w: 0.48,
      h: 0.48,
      fill: { color: i === 2 ? C.clay : C.navy },
    });
    slide.addText(s.n, {
      x: x + 0.24,
      y: 1.58,
      w: 0.48,
      h: 0.38,
      fontSize: 16,
      fontFace: FONT,
      color: C.white,
      align: "center",
      margin: 0,
    });
    slide.addText(s.h, {
      x: x + 0.24,
      y: 2.2,
      w: 2.54,
      h: 0.5,
      fontSize: 18,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(s.p, {
      x: x + 0.24,
      y: 2.8,
      w: 2.54,
      h: 2.1,
      fontSize: 14,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
      valign: "top",
    });
  });
  slide.addText("手机微信扫码需使用公网HTTPS地址。在电脑上可点击演示条「患者页」查看患者端。", {
    x: 0.48,
    y: 5.5,
    w: 12.3,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT,
    color: C.navy,
    margin: 0,
  });
  footer(slide);
}

// ——— 5 登录 ———
{
  const slide = paperSlide();
  kicker(slide, "医护端");
  title(slide, "医护登录", 0.48, 0.5, 4.2);
  slide.addText("本页用于选择身份并进入工作页面。演示登录不发送短信验证码。", {
    x: 0.48,
    y: 1.05,
    w: 4.2,
    h: 0.7,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
    margin: 0,
  });
  featureBlock(
    slide,
    [
      { h: "登录", p: "使用预填的手机号与密码，点击「进入作业台」。" },
      { h: "进入页面", p: "护士长、责任护士进入床位图；护理部、只读质控进入成效看板。" },
      { h: "邀请链接", p: "设置页中的邀请链接以责任护士身份打开。登录后也可在演示条更换身份。" },
    ],
    0.48,
    1.82,
    4.2,
  );
  addShot(slide, img("01-login.png"), 4.95, 0.72, 7.95, 4.47);
  footer(slide);
}

// ——— 6 角色 ———
{
  const slide = paperSlide();
  kicker(slide, "权限");
  title(slide, "角色与可操作范围");
  const roles = [
    { r: "护士长", go: "床位图", can: "可操作本科全部在院床位：套用路径、修改档案、发布图文、维护标记组、启用路径。" },
    { r: "责任护士", go: "床位图", can: "仅可操作责任床（默认1–4床）。5–8床标注为非责任床。可检索图文并发送，不可发布。" },
    { r: "护理部", go: "成效看板", can: "可查看覆盖率与完成率。患者姓名显示为姓加星号。不可套用路径。" },
    { r: "只读质控", go: "成效看板", can: "页面只读。查看范围与护理部相同。" },
  ];
  roles.forEach((r, i) => {
    const y = 1.22 + i * 1.32;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.48,
      y,
      w: 12.35,
      h: 1.18,
      fill: { color: C.white },
      rectRadius: 0.08,
      shadow: sh(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.48,
      y,
      w: 0.12,
      h: 1.18,
      fill: { color: i < 2 ? C.navy : C.teal },
    });
    slide.addText(r.r, {
      x: 0.86,
      y: y + 0.22,
      w: 2.2,
      h: 0.36,
      fontSize: 18,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText("默认打开  " + r.go, {
      x: 0.86,
      y: y + 0.62,
      w: 2.2,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT,
      color: C.teal,
      margin: 0,
    });
    slide.addText(r.can, {
      x: 3.4,
      y: y + 0.28,
      w: 9.1,
      h: 0.64,
      fontSize: 15,
      fontFace: FONT,
      color: C.ink,
      valign: "middle",
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 7 导航 ———
{
  const slide = paperSlide();
  kicker(slide, "导航");
  title(slide, "页面结构");
  slide.addText("点击左侧院标返回该角色的默认首页。床位详情页可返回床位图。图文库中「分发给患者」打开群发页，并选中该篇文章。", {
    x: 0.48,
    y: 1.05,
    w: 12.3,
    h: 0.42,
    fontSize: 14,
    fontFace: FONT,
    color: C.muted,
    margin: 0,
  });
  const groups = [
    { g: "作业台", items: ["床位图  检索、归类、打开档案", "今日任务  未读、当面补讲"] },
    { g: "宣教", items: ["图文库  编辑并发送", "群发  选择图文后发送", "计划  按标记组自动发送", "路径  入院路径、病种路径"] },
    { g: "质控", items: ["问卷考核  出题、发送、成绩", "成效看板  阅读人数、未读人数"] },
    { g: "系统", items: ["设置  病区参数、标记组、审计"] },
  ];
  groups.forEach((g, i) => {
    const x = 0.48 + i * 3.18;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.62,
      w: 3.02,
      h: 4.95,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.62,
      w: 3.02,
      h: 0.1,
      fill: { color: i === 0 ? C.clay : i === 2 ? C.teal : C.navy },
    });
    slide.addText(g.g, {
      x: x + 0.22,
      y: 1.9,
      w: 2.58,
      h: 0.4,
      fontSize: 20,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(
      g.items.map((t) => t).join("\n\n"),
      {
        x: x + 0.22,
        y: 2.5,
        w: 2.58,
        h: 3.7,
        fontSize: 14,
        fontFace: FONT,
        color: C.ink,
        margin: 0,
        valign: "top",
      },
    );
  });
  footer(slide);
}

// ——— 8 演示条 ———
{
  const slide = paperSlide();
  kicker(slide, "演示工具");
  title(slide, "演示工具条", 0.48, 0.5, 4.4);
  slide.addText("演示工具条仅出现在医护端。点击「演示工具」后可快进日期、重置数据、按步骤跳转。", {
    x: 0.48,
    y: 1.05,
    w: 4.4,
    h: 0.7,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
    margin: 0,
  });
  featureBlock(
    slide,
    [
      { h: "更换身份", p: "可在护士长、责任护士、护理部、只读质控之间切换，无需重新登录。" },
      { h: "选择床位", p: "可选择1–8床。点击「患者页」打开该床患者端，或复制链接。" },
      { h: "演示操作", p: "可将演示日期增加1天、执行到期任务、按步骤1–9跳转。重置须连续点击两次。" },
    ],
    0.48,
    1.82,
    4.4,
  );
  addShot(slide, img("05-demo-tools.png"), 5.12, 0.88, 7.72, 4.34);
  slide.addText("患者端不显示演示工具条。每次演示开始前应重置数据并再次确认。", {
    x: 5.12,
    y: 5.36,
    w: 7.72,
    h: 0.32,
    fontSize: 12,
    fontFace: FONT,
    color: C.clay,
    margin: 0,
  });
  footer(slide);
}

// ——— 9 床位图 ———
screenRight({
  kicker: "作业台",
  title: "床位图",
  lead: "床位图列出本科8张床，显示护理等级、住院天数、手术安排及标记组。",
  items: [
    { h: "检索", p: "可按床号、姓名、住院号查找患者。" },
    { h: "打开档案", p: "点击床卡进入该床详情，可套用路径、查看床头码。群发不在本页操作。" },
    { h: "今日任务", p: "右上角进入未读列表与当面补讲列表。" },
  ],
  shot: img("02-ward.png"),
  caption: "护士长可操作全部8张床。",
});

// ——— 10 责任护士 ———
screenRight({
  kicker: "作业台",
  title: "责任床权限",
  lead: "身份为责任护士时，默认可操作1–4床。5–8床标注为非责任床，显示为浅色。",
  items: [
    { h: "未读人数", p: "已套用路径且存在未读任务时，床卡显示未读人数。" },
    { h: "非责任床", p: "可查看，不可套用路径。护士长可在床位档案中调整分管床位。" },
    { h: "切换护士", p: "演示条可选择李、王、赵、钱护士，对应不同责任床范围。" },
  ],
  shot: img("16-ward-primary.png"),
  caption: "图中1床已套用路径，未读数为2。",
});

// ——— 11 档案归类 ———
screenRight({
  kicker: "作业台",
  title: "档案归类",
  lead: "检索框右侧为「档案归类」。可按诊断、护理等级、手术日、住院天数筛选床位。",
  items: [
    { h: "快捷筛选", p: "包括今日手术、术后、住院超过7天、特级护理。演示数据中均有对应床位。" },
    { h: "筛选条件", p: "可按诊断、护理等级、手术日、住院时间、饮食医嘱、过敏史、标记组筛选。" },
    { h: "与检索的区别", p: "检索用于查找单个患者；归类用于按条件列出一组患者。刷新后筛选条件仍保留。" },
  ],
  shot: img("03-ward-classify.png"),
  caption: "按钮为橙色时，归类面板已打开。",
});

// ——— 12 今日手术 ———
screenRight({
  kicker: "作业台",
  title: "按手术日筛选",
  lead: "选择「今日手术」后，仅显示手术日为当天的床位。重置演示数据后，3床为今日手术。",
  items: [
    { h: "床卡摘要", p: "显示护理等级、住院天数，以及今日入科、术后、待手术等状态。" },
    { h: "标记组", p: "色点表示已打标记。1床预置脑梗死、高危跌倒。" },
    { h: "床位数", p: "「当前1/8床」表示筛选后的床位数与在院总数。" },
  ],
  shot: img("04-ward-today-op.png"),
  caption: "预置：3床今日手术，6床术后，5床住院超过7天，4床特级护理，7床待手术。",
});

// ——— 13 床位详情 ———
{
  const slide = paperSlide();
  kicker(slide, "作业台");
  title(slide, "床位详情", 0.48, 0.5, 12);
  addShot(slide, img("06-bed.png"), 0.48, 1.08, 8.55, 4.81);
  const bits = [
    { h: "套用入院路径", p: "点击橙色按钮，套用已启用的普通入院路径。" },
    { h: "患者档案", p: "可填写住院号、诊断、护理等级、饮食医嘱、过敏史、手术日期。护士长可保存修改。" },
    { h: "床头码", p: "与患者端为同一地址。在电脑上可点击演示条「患者页」打开。" },
    { h: "返回床位图", p: "使用页面右上角按钮返回。" },
  ];
  bits.forEach((b, i) => {
    const y = 1.08 + i * 1.18;
    slide.addText(b.h, {
      x: 9.22,
      y,
      w: 3.6,
      h: 0.32,
      fontSize: 14,
      fontFace: FONT,
      color: C.navy,
      bold: true,
      margin: 0,
    });
    slide.addText(b.p, {
      x: 9.22,
      y: y + 0.34,
      w: 3.6,
      h: 0.7,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 14 今日任务 ———
screenRight({
  kicker: "作业台",
  title: "今日任务",
  lead: "本页分三个页签。点击「查看床位」打开对应患者档案。",
  items: [
    { h: "已推未读", p: "内容已发送至患者待学习，页面停留未满8秒。" },
    { h: "当面补讲", p: "未达有效阅读的条目，可在床旁讲解后点击「已当面完成」。" },
    { h: "待推", p: "路径中尚未发送的条目，或计划已到期未发送的内容。将演示日期增加1天后可出现。" },
  ],
  shot: img("07-tasks.png"),
  caption: "1床套用入院路径后，入院须知与防跌倒宣教显示为未读。",
});

// ——— 15 图文库 ———
{
  const slide = paperSlide();
  kicker(slide, "宣教");
  title(slide, "图文库", 0.48, 0.5, 12);
  addShot(slide, img("09-content.png"), 1.85, 1.05, 9.6, 5.4);
  slide.addText("护士长在左侧编辑并发布图文，可只发文字或同时配图。责任护士可检索本科已发布内容，点击「分发给患者」进入群发。", {
    x: 0.48,
    y: 6.58,
    w: 12.35,
    h: 0.38,
    fontSize: 13,
    fontFace: FONT,
    color: C.ink,
    margin: 0,
  });
  footer(slide);
}

// ——— 16 群发 ———
screenRight({
  kicker: "宣教",
  title: "群发",
  lead: "先选择图文，再按标记组及发送范围提交。",
  items: [
    { h: "选择内容", p: "可按标题、摘要、关键词检索。也可发送问卷或文字通知。" },
    { h: "发送范围", p: "标记组可不选，表示当前范围内全部床位。责任护士默认仅能发送至责任床。" },
    { h: "发送时间", p: "可立即发送，或选择次日发送。选择次日后，将演示日期增加1天即可完成投递。" },
  ],
  shot: img("10-push.png"),
  caption: "若开启「全科群发须护士长确认」，责任护士选择全科时生成待确认记录。",
});

// ——— 17 计划 ———
screenRight({
  kicker: "宣教",
  title: "推送计划",
  lead: "按标记组设定自动发送规则。患者完成扫码后，点击「执行到期任务」生成待学习内容。",
  items: [
    { h: "预置计划", p: "高危跌倒、首次扫码当日、防跌倒宣教。4床已打该标记。" },
    { h: "避免重复", p: "若该床入院路径已包含防跌倒宣教，计划不再发送同一篇文章。" },
    { h: "手术日期", p: "已打手术标记但未填写手术日期的患者，不执行以手术日为起点的计划。" },
  ],
  shot: img("11-plans.png"),
});

// ——— 18 路径 ———
screenRight({
  kicker: "宣教",
  title: "宣教路径",
  lead: "路径模板在本页启用。套用操作在床位详情页完成。病种路径须护士长点击「审核并启用」后方可套用。",
  items: [
    { h: "普通入院", p: "已启用。入院当日发送入院须知与防跌倒宣教，防跌倒须当面补讲。" },
    { h: "脑梗死路径", p: "默认待审核。启用后当日发送饮食指导与满意度问卷，次日康复指导为待推。" },
    { h: "待推", p: "将演示日期增加1天后，次日条目转为已发送、未阅读。" },
  ],
  shot: img("12-pathways.png"),
});

// ——— 19 问卷 ———
{
  const slide = paperSlide();
  kicker(slide, "质控");
  title(slide, "问卷与考核", 0.48, 0.5, 12);
  addShot(slide, img("13-surveys.png"), 0.48, 1.08, 8.55, 4.81);
  const bits = [
    { h: "出题", p: "题型为单选、多选、填空，选项可设分值。勾选「用于护士考核」后作为考核卷。" },
    { h: "发送", p: "选择责任护士后发送。作答界面不显示参考答案。" },
    { h: "判卷", p: "提交后系统计分。护士长与作答护士可查看作答、参考答案与得分。" },
    { h: "患者问卷", p: "可通过路径或群发发送至患者端。本页可导出表格文件。" },
  ];
  bits.forEach((b, i) => {
    const y = 1.08 + i * 1.18;
    slide.addText(b.h, {
      x: 9.22,
      y,
      w: 3.6,
      h: 0.32,
      fontSize: 14,
      fontFace: FONT,
      color: C.navy,
      bold: true,
      margin: 0,
    });
    slide.addText(b.p, {
      x: 9.22,
      y: y + 0.34,
      w: 3.6,
      h: 0.7,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 20 看板 ———
screenRight({
  kicker: "质控",
  title: "成效看板",
  lead: "护理部与只读质控登录后首先打开本页。完成标准操作后，统计数字应与1床操作一致。",
  items: [
    { h: "指标", p: "今日新增、有效阅读人数、未读人数、在院人数。" },
    { h: "时间范围", p: "可查看全部、近7天或近30天。可打印月报、导出PDF。" },
    { h: "24小时完成率", p: "套用路径后，当日应完成条目在24小时内完成的比例。" },
  ],
  shot: img("14-stats.png"),
  caption: "仅套用路径、尚未阅读时：今日新增为1，未读为1，在院为8。护理部视图中姓名脱敏。",
});

// ——— 21 设置 ———
screenRight({
  kicker: "系统",
  title: "设置",
  lead: "可设置病区参数、标记组、组织信息、邀请链接，并查看操作记录。责任护士不能删除标记组。",
  items: [
    { h: "宣教参数", p: "包括扫码后是否填写联系人、全科群发是否须护士长确认、专病专区名称。" },
    { h: "标记组", p: "护士长可新增、修改、删除。删除「高危跌倒」前须先修改占用该组的计划。" },
    { h: "操作记录", p: "套用路径等操作写入记录。患者咨询功能保持关闭。" },
  ],
  shot: img("15-settings.png"),
});

// ——— 22 患者知情 + 待学习 ———
{
  const slide = paperSlide();
  kicker(slide, "患者端");
  title(slide, "知情同意与待学习", 0.48, 0.48, 12);
  addShot(slide, img("18-p-consent.png"), 0.55, 1.1, 2.55, 5.52);
  addShot(slide, img("19-p-inbox.png"), 3.3, 1.1, 2.55, 5.52);
  const bits = [
    { h: "知情同意", p: "点击「同意并进入」。不要求注册、验证码或安装应用。页脚标注演示数据。" },
    { h: "待学习", p: "显示护士已发送且待阅读的内容。未套用路径时列表为空，并提示联系护士。" },
    { h: "底部导航", p: "待学习、已完成、宣教中心、专病专区。演示专区名称为脑梗死专区。" },
    { h: "在电脑上打开", p: "点击医护端演示条「患者页」，或复制链接。1床地址在重置后不变。" },
  ];
  bits.forEach((b, i) => {
    const y = 1.15 + i * 1.28;
    slide.addText(b.h, {
      x: 6.15,
      y,
      w: 6.6,
      h: 0.32,
      fontSize: 16,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(b.p, {
      x: 6.15,
      y: y + 0.36,
      w: 6.6,
      h: 0.72,
      fontSize: 13,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 23 阅读 + 中心 + 专区 ———
{
  const slide = paperSlide();
  kicker(slide, "患者端");
  title(slide, "有效阅读、宣教中心、专区", 0.48, 0.48, 12);
  slide.addText("打开指定文章后，页面累计停留满8秒记为有效阅读。宣教中心按分类列出已发布内容。专区按设定关键词收录文章，演示关键词为脑梗死。", {
    x: 0.48,
    y: 1.0,
    w: 12.3,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
    margin: 0,
  });
  const phones = [
    { f: "20-p-article.png", cap: "入院须知（停留计时）" },
    { f: "21-p-center.png", cap: "宣教中心" },
    { f: "22-p-zone.png", cap: "脑梗死专区" },
  ];
  phones.forEach((p, i) => {
    const x = 1.95 + i * 3.2;
    addShot(slide, img(p.f), x, 1.42, 2.4, 5.19);
    slide.addText(p.cap, {
      x,
      y: 6.68,
      w: 2.4,
      h: 0.24,
      fontSize: 12,
      fontFace: FONT,
      color: C.navy,
      align: "center",
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 24 失效码 ———
{
  const slide = paperSlide();
  kicker(slide, "患者端");
  title(slide, "无效床头码");
  addShot(slide, img("23-p-invalid.png"), 0.55, 1.15, 2.55, 5.52);
  const cards = [
    { h: "错误链接", p: "打开无效地址时显示「码已失效，请找护士」，不进入医护登录页。" },
    { h: "未套用路径", p: "2床患者同意后可进入待学习，列表为空，提示由护士套用入院路径。" },
    { h: "重置数据", p: "第一次点击仅进入确认状态；第二次点击后清空演示数据。8秒内未再次点击则取消。" },
  ];
  cards.forEach((c, i) => {
    const y = 1.2 + i * 1.7;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 3.4,
      y,
      w: 9.4,
      h: 1.5,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addText(c.h, {
      x: 3.7,
      y: y + 0.22,
      w: 8.9,
      h: 0.36,
      fontSize: 18,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(c.p, {
      x: 3.7,
      y: y + 0.64,
      w: 8.9,
      h: 0.6,
      fontSize: 14,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 25 主路径 ———
{
  const slide = paperSlide();
  kicker(slide, "操作顺序");
  title(slide, "标准操作（约15分钟）");
  const steps = [
    { n: "01", h: "套用路径", p: "在1床点击「套用入院路径」。" },
    { n: "02", h: "患者同意", p: "打开「患者页」，点击「同意并进入」，待学习出现两篇文章。" },
    { n: "03", h: "有效阅读", p: "打开入院须知，停留满8秒。不要打开防跌倒宣教。" },
    { n: "04", h: "当面补讲", p: "在今日任务中登记防跌倒已当面完成。" },
    { n: "05", h: "核对统计", p: "切换为护理部，核对应日新增与有效阅读人数。" },
    { n: "06", h: "核对权限", p: "切换为责任护士。非责任床不可套用路径。" },
  ];
  steps.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.48 + col * 4.2;
    const y = 1.22 + row * 2.7;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 3.98,
      h: 2.48,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: sh(),
    });
    slide.addText(s.n, {
      x: x + 0.28,
      y: y + 0.28,
      w: 1.2,
      h: 0.4,
      fontSize: 20,
      fontFace: FONT,
      color: C.clay,
      bold: true,
      margin: 0,
    });
    slide.addText(s.h, {
      x: x + 1.4,
      y: y + 0.32,
      w: 2.3,
      h: 0.36,
      fontSize: 18,
      fontFace: SERIF,
      color: C.navy,
      margin: 0,
    });
    slide.addText(s.p, {
      x: x + 0.28,
      y: y + 1.0,
      w: 3.42,
      h: 1.1,
      fontSize: 14,
      fontFace: FONT,
      color: C.muted,
      margin: 0,
      valign: "top",
    });
  });
  footer(slide);
}

// ——— 26 支线 ———
{
  const slide = paperSlide();
  kicker(slide, "补充功能");
  title(slide, "其他可演示功能");
  const rows = [
    { n: "标记组", p: "在1床勾选或取消标记。在设置中新增标记组后，床卡显示对应色点。" },
    { n: "群发", p: "选择《糖尿病饮食指导》，标记组选糖尿病饮食，范围选责任床。发送后2床待学习出现该文。" },
    { n: "计划", p: "不要为4床套用路径。4床患者同意后执行到期任务，应出现防跌倒宣教。" },
    { n: "病种路径", p: "启用脑梗死路径并套用。将演示日期增加1天后，待推条目转为已发送。" },
    { n: "转床与出院", p: "在床位详情办理出院，在院人数减1。可将在院患者转至已出院空床。" },
    { n: "入科表单", p: "开启「扫码后先填联系人」后，2床患者同意后须填写联系人才能进入宣教。" },
  ];
  rows.forEach((r, i) => {
    const y = 1.18 + i * 0.88;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.48,
      y,
      w: 12.35,
      h: 0.78,
      fill: { color: C.white },
      rectRadius: 0.08,
      shadow: sh(),
    });
    slide.addText(r.n, {
      x: 0.72,
      y: y + 0.2,
      w: 1.8,
      h: 0.38,
      fontSize: 15,
      fontFace: FONT,
      color: C.navy,
      bold: true,
      margin: 0,
    });
    slide.addText(r.p, {
      x: 2.7,
      y: y + 0.18,
      w: 9.8,
      h: 0.42,
      fontSize: 14,
      fontFace: FONT,
      color: C.muted,
      valign: "middle",
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 27 边界 ———
{
  const slide = paperSlide();
  kicker(slide, "范围");
  title(slide, "本版功能范围");
  const left = [
    "文章分类、关键词检索、公共库引用",
    "入院路径、病种路径、当面补讲",
    "群发、定时发送、护士长确认",
    "患者端页面、与床头码相同的屏用地址",
    "按停留时间记录有效阅读、统计与月报",
    "患者问卷、护士考核、成绩导出",
  ];
  const right = [
    "微信小程序、订阅消息",
    "短信、真实短信验证码",
    "医院信息系统对接",
    "患者在线咨询",
    "多机构部署、扫码人数限制",
    "家属权限、非住院场景",
  ];
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.48,
    y: 1.22,
    w: 6.05,
    h: 5.35,
    fill: { color: C.white },
    rectRadius: 0.1,
    shadow: sh(),
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.78,
    y: 1.22,
    w: 6.05,
    h: 5.35,
    fill: { color: C.deep },
    rectRadius: 0.1,
  });
  slide.addText("本演示已提供", {
    x: 0.78,
    y: 1.48,
    w: 5.45,
    h: 0.4,
    fontSize: 18,
    fontFace: SERIF,
    color: C.navy,
    margin: 0,
  });
  slide.addText("本演示未提供", {
    x: 7.08,
    y: 1.48,
    w: 5.45,
    h: 0.4,
    fontSize: 18,
    fontFace: SERIF,
    color: C.white,
    margin: 0,
  });
  left.forEach((t, i) => {
    slide.addText(t, {
      x: 0.78,
      y: 2.1 + i * 0.62,
      w: 5.45,
      h: 0.5,
      fontSize: 14,
      fontFace: FONT,
      color: C.ink,
      margin: 0,
    });
  });
  right.forEach((t, i) => {
    slide.addText(t, {
      x: 7.08,
      y: 2.1 + i * 0.62,
      w: 5.45,
      h: 0.5,
      fontSize: 14,
      fontFace: FONT,
      color: "D5E2EC",
      margin: 0,
    });
  });
  footer(slide);
}

// ——— 28 封底 ———
{
  const slide = pres.addSlide();
  slide.background = { color: C.deep };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.18,
    h: H,
    fill: { color: C.clay },
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.62,
    y: 0.48,
    w: 3.8,
    h: 0.66,
    fill: { color: C.white },
    rectRadius: 0.08,
  });
  slide.addImage({
    path: path.join(BRAND, "logo.png"),
    x: 0.74,
    y: 0.54,
    w: 3.56,
    h: 0.54,
  });
  slide.addText("操作要点", {
    x: 0.7,
    y: 1.7,
    w: 11,
    h: 0.36,
    fontSize: 14,
    fontFace: FONT,
    color: C.gold,
    margin: 0,
  });
  slide.addText("护士为床位套用入院路径后，患者通过床头码打开页面并同意接收宣教。患者停留满八秒后记为有效阅读。未阅读条目由护士在床旁讲解后登记完成。", {
    x: 0.7,
    y: 2.2,
    w: 11.4,
    h: 1.35,
    fontSize: 22,
    fontFace: SERIF,
    color: C.white,
    margin: 0,
  });
  slide.addText("演示时可同时打开医护端与患者端。逐步操作见《演示路径说明书》。", {
    x: 0.7,
    y: 3.8,
    w: 11.4,
    h: 0.5,
    fontSize: 16,
    fontFace: FONT,
    color: "C5D0DA",
    margin: 0,
  });
  slide.addText("首都医科大学宣武医院神经外科  护理推送助手  演示版", {
    x: 0.7,
    y: 6.85,
    w: 11,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: "9BB0C2",
    margin: 0,
  });
  page += 1;
}

await pres.writeFile({ fileName: OUT });
console.log("wrote", OUT, "slides", page);
