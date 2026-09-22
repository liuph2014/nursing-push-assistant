# -*- coding: utf-8 -*-
"""Capture real demo screenshots, TTS, and mux a 16:9 explainer video."""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
SPEC = ROOT.parent
SHOTS = ROOT / "shots"
AUDIO = ROOT / "audio"
CLIPS = ROOT / "clips"
SCRIPT = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
BASE = "http://localhost:3000"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "zh-CN-XiaoxiaoNeural"
OUT_MP4 = SPEC / "护理推送助手-演示讲解.mp4"
OUT_SRT = SPEC / "护理推送助手-演示讲解.srt"
OUT_ASS = ROOT / "subs.ass"
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BD = Path(r"C:\Windows\Fonts\msyhbd.ttc")


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True)
    err = (p.stderr or b"").decode("utf-8", errors="replace")
    if p.returncode != 0:
        raise RuntimeError(err[-2000:] or str(cmd))
    return err


def duration_sec(path: Path) -> float:
    p = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True)
    err = (p.stderr or b"").decode("utf-8", errors="replace")
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
    if not m:
        raise RuntimeError(f"no duration for {path}\n{err[-500:]}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    p = FONT_BD if bold and FONT_BD.exists() else FONT
    return ImageFont.truetype(str(p), size=size, index=0)


def overlay_card(src: Path, dst: Path, title: str, subtitle: str) -> None:
    im = Image.open(src).convert("RGB").resize((1920, 1080), Image.Resampling.LANCZOS)
    cover = Image.new("RGBA", im.size, (15, 58, 95, 150))
    out = im.convert("RGBA")
    out.alpha_composite(cover)
    draw = ImageDraw.Draw(out)
    tw = draw.textbbox((0, 0), title, font=font(64, True))
    sw = draw.textbbox((0, 0), subtitle, font=font(28))
    tx = (1920 - (tw[2] - tw[0])) // 2
    sx = (1920 - (sw[2] - sw[0])) // 2
    draw.text((tx, 430), title, font=font(64, True), fill=(255, 255, 255, 255))
    draw.text((sx, 530), subtitle, font=font(28), fill=(220, 230, 235, 255))
    out.convert("RGB").save(dst, quality=92)


def fit_1920(src: Path) -> None:
    im = Image.open(src).convert("RGB")
    canvas = Image.new("RGB", (1920, 1080), (244, 247, 248))
    w, h = im.size
    scale = min(1920 / w, 1080 / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(im, ((1920 - nw) // 2, (1080 - nh) // 2))
    canvas.save(src, quality=92)


def hide_dev(page) -> None:
    page.evaluate(
        """() => {
          document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
          const style = document.getElementById('hide-next-badge') || document.createElement('style');
          style.id = 'hide-next-badge';
          style.textContent = 'nextjs-portal,[data-next-badge-root],#__next-dev-overlay{display:none!important}';
          document.documentElement.appendChild(style);
        }"""
    )


def snap(page, name: str) -> None:
    hide_dev(page)
    page.wait_for_timeout(150)
    hide_dev(page)
    page.screenshot(path=str(SHOTS / name), full_page=False)


def api(page, method: str, path: str, body: dict | None = None):
    return page.evaluate(
        """async ({method, path, body}) => {
          const res = await fetch(path, {
            method,
            headers: body ? {'Content-Type':'application/json'} : undefined,
            body: body ? JSON.stringify(body) : undefined,
          });
          const text = await res.text();
          return {ok: res.ok, status: res.status, text};
        }""",
        {"method": method, "path": path, "body": body},
    )


def capture() -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
            locale="zh-CN",
        )
        page = context.new_page()
        page.set_default_timeout(20000)
        page.add_init_script(
            """
            (() => {
              const hide = () => {
                document.querySelectorAll('nextjs-portal,[data-next-badge-root]').forEach((el) => el.remove());
              };
              hide();
              setInterval(hide, 200);
            })();
            """
        )
        page.goto(f"{BASE}/app/login", wait_until="networkidle")
        r = api(page, "POST", "/api/demo/reset")
        if not r["ok"]:
            raise RuntimeError(f"reset failed {r}")
        page.goto(f"{BASE}/app/login", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "02_login.png")
        overlay_card(
            SHOTS / "02_login.png",
            SHOTS / "01_title.png",
            "护理推送助手",
            "宣武医院神经外科 · 把宣教做成可交接的护理作业",
        )

        api(page, "POST", "/api/demo/role", {"role": "head_nurse"})
        page.goto(f"{BASE}/app/ward", wait_until="networkidle")
        page.wait_for_timeout(500)
        snap(page, "03_ward.png")

        page.goto(f"{BASE}/app/ward/1", wait_until="networkidle")
        apply_btn = page.get_by_role("button", name=re.compile("套用"))
        if apply_btn.count():
            apply_btn.first.click()
            page.wait_for_timeout(800)
        page.goto(f"{BASE}/app/ward/1", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "04_bed.png")

        page.goto(f"{BASE}/p/demo-bed-1-token/consent", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "05_consent.png")

        api(page, "POST", "/api/p/demo-bed-1-token/consent")
        page.goto(f"{BASE}/p/demo-bed-1-token/inbox", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "06_inbox.png")

        page.goto(f"{BASE}/p/demo-bed-1-token/articles/art-admit", wait_until="networkidle")
        page.wait_for_timeout(600)
        snap(page, "07_article.png")

        api(page, "POST", "/api/p/read", {"token": "demo-bed-1-token", "articleId": "art-admit", "addMs": 5000})
        api(page, "POST", "/api/p/read", {"token": "demo-bed-1-token", "articleId": "art-admit", "addMs": 5000})

        api(page, "POST", "/api/demo/role", {"role": "head_nurse"})
        page.goto(f"{BASE}/app/tasks?tab=bedside", wait_until="networkidle")
        page.wait_for_timeout(500)
        snap(page, "08_bedside.png")

        page.goto(f"{BASE}/app/push", wait_until="networkidle")
        page.wait_for_timeout(400)
        diet = page.get_by_role("button", name=re.compile("糖尿病饮食"))
        if diet.count():
            diet.first.click()
            page.wait_for_timeout(200)
        try:
            page.locator("label").filter(has_text="标记组").locator("select").select_option(label="糖尿病饮食")
        except Exception:
            pass
        page.wait_for_timeout(200)
        snap(page, "09_push.png")

        page.goto(f"{BASE}/app/plans", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "10_plans.png")

        api(page, "POST", "/api/demo/role", {"role": "nursing_admin"})
        page.goto(f"{BASE}/app/stats", wait_until="networkidle")
        page.wait_for_timeout(500)
        snap(page, "11_stats.png")

        api(page, "POST", "/api/demo/role", {"role": "head_nurse"})
        page.goto(f"{BASE}/app/ward", wait_until="networkidle")
        page.wait_for_timeout(400)
        snap(page, "12_ward_raw.png")
        overlay_card(
            SHOTS / "12_ward_raw.png",
            SHOTS / "12_end.png",
            "同一条作业台",
            "小程序、HIS 与咨询不在本演示",
        )
        browser.close()

    mapping = {
        "01_title": "01_title.png",
        "02_login": "02_login.png",
        "03_ward": "03_ward.png",
        "04_bed": "04_bed.png",
        "05_consent": "05_consent.png",
        "06_inbox": "06_inbox.png",
        "07_article": "07_article.png",
        "08_bedside": "08_bedside.png",
        "09_push": "09_push.png",
        "10_plans": "10_plans.png",
        "11_stats": "11_stats.png",
        "12_end": "12_end.png",
    }
    for sid, name in mapping.items():
        pth = SHOTS / name
        if not pth.exists():
            raise FileNotFoundError(pth)
        fit_1920(pth)


async def tts_all() -> list[float]:
    AUDIO.mkdir(parents=True, exist_ok=True)
    durs: list[float] = []
    for sc in SCRIPT["scenes"]:
        wav = AUDIO / f"{sc['id']}.mp3"
        comm = edge_tts.Communicate(sc["cn"], VOICE, rate="-12%")
        await comm.save(str(wav))
        durs.append(duration_sec(wav) + 0.45)
    return durs


def srt_time(t: float) -> str:
    if t < 0:
        t = 0
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s += 1
        ms = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def ass_time(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


PUNCT_CN = "，。；、： "


def _split_cn(text: str, target: int) -> int:
    hits = [i for i, ch in enumerate(text) if ch in PUNCT_CN and 8 <= i <= len(text) - 6]
    if hits:
        return min(hits, key=lambda i: abs(i - target))
    if 8 <= target <= len(text) - 6:
        return target
    return max(len(text) // 2, 1)


def wrap_cn(text: str) -> str:
    text = text.replace("\n", "").strip()
    if len(text) <= 36:
        return text
    i = _split_cn(text, len(text) // 2)
    return text[: i + 1].strip() + r"\N" + text[i + 1 :].strip()


def wrap_en(text: str) -> str:
    text = text.replace("\n", " ").replace("’", "'").replace("‘", "'").strip()
    words = text.split()
    if len(text) <= 88:
        return text
    total = sum(len(w) + 1 for w in words)
    acc = 0
    cut = max(1, len(words) // 2)
    for i, w in enumerate(words):
        acc += len(w) + 1
        if acc >= total / 2:
            cut = i + 1
            break
    return " ".join(words[:cut]) + r"\N" + " ".join(words[cut:])


def write_subs(durs: list[float]) -> None:
    srt_lines = []
    ass = [
        "[Script Info]",
        "Title: Nursing Push Demo",
        "ScriptType: v4.00+",
        "PlayResX: 1920",
        "PlayResY: 1080",
        "WrapStyle: 2",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        r"Style: SUB,Microsoft YaHei,26,&H00FFFFFF,&H000000FF,&H00102840,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,90,90,22,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    t = 0.0
    for i, (sc, d) in enumerate(zip(SCRIPT["scenes"], durs), 1):
        a, b = t, t + d
        cn = wrap_cn(sc["cn"].replace("\n", " "))
        en = wrap_en(sc["en"].replace("\n", " "))
        srt_cn = cn.replace(r"\N", "\n")
        srt_en = en.replace(r"\N", "\n")
        srt_lines.append(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{srt_cn}\n{srt_en}\n")
        ass.append(
            f"Dialogue: 0,{ass_time(a)},{ass_time(b)},SUB,,0,0,0,,"
            + cn
            + r"\N{\fs18\b0\c&HF4F0E8&}"
            + en
        )
        t = b
    OUT_SRT.write_text("\n".join(srt_lines), encoding="utf-8")
    OUT_ASS.write_text("\n".join(ass), encoding="utf-8")


def make_clips(durs: list[float]) -> list[Path]:
    CLIPS.mkdir(parents=True, exist_ok=True)
    files: list[Path] = []
    mapping = {
        "01_title": "01_title.png",
        "02_login": "02_login.png",
        "03_ward": "03_ward.png",
        "04_bed": "04_bed.png",
        "05_consent": "05_consent.png",
        "06_inbox": "06_inbox.png",
        "07_article": "07_article.png",
        "08_bedside": "08_bedside.png",
        "09_push": "09_push.png",
        "10_plans": "10_plans.png",
        "11_stats": "11_stats.png",
        "12_end": "12_end.png",
    }
    for sc, d in zip(SCRIPT["scenes"], durs):
        png = SHOTS / mapping[sc["id"]]
        mp3 = AUDIO / f"{sc['id']}.mp3"
        out = CLIPS / f"{sc['id']}.mp4"
        frames = max(int(d * 25), 25)
        vf = (
            f"scale=1920:1080,zoompan=z='min(1.04,1+0.04*on/{frames})':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps=25,"
            "format=yuv420p"
        )
        run(
            [
                FFMPEG,
                "-y",
                "-loop",
                "1",
                "-i",
                str(png),
                "-i",
                str(mp3),
                "-t",
                f"{d:.3f}",
                "-vf",
                vf,
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "20",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-shortest",
                "-movflags",
                "+faststart",
                str(out),
            ]
        )
        files.append(out)
    return files


def mux(clips: list[Path]) -> None:
    lst = ROOT / "concat.txt"
    lst.write_text("".join(f"file '{c.as_posix()}'\n" for c in clips), encoding="utf-8")
    raw = ROOT / "raw.mp4"
    run(
        [
            FFMPEG,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(lst),
            "-c",
            "copy",
            str(raw),
        ]
    )
    # Windows ASS path: escape for subtitles filter
    ass_path = str(OUT_ASS).replace("\\", "/").replace(":", "\\:")
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(raw),
            "-vf",
            f"drawbox=x=0:y=ih-140:w=iw:h=140:color=0x0F3A5F@0.78:t=fill,ass='{ass_path}'",
            "-c:v",
            "libx264",
            "-crf",
            "19",
            "-preset",
            "medium",
            "-c:a",
            "copy",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(OUT_MP4),
        ]
    )


def audio_durs() -> list[float]:
    durs: list[float] = []
    for sc in SCRIPT["scenes"]:
        wav = AUDIO / f"{sc['id']}.mp3"
        if not wav.exists():
            raise FileNotFoundError(wav)
        durs.append(duration_sec(wav) + 0.45)
    return durs


def recapture_push() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
            locale="zh-CN",
        )
        page = context.new_page()
        page.set_default_timeout(20000)
        page.goto(f"{BASE}/app/login", wait_until="networkidle")
        api(page, "POST", "/api/demo/role", {"role": "head_nurse"})
        page.goto(f"{BASE}/app/push", wait_until="networkidle")
        page.wait_for_timeout(400)
        diet = page.get_by_role("button", name=re.compile("糖尿病饮食"))
        if diet.count():
            diet.first.click()
            page.wait_for_timeout(200)
        try:
            page.locator("label").filter(has_text="标记组").locator("select").select_option(label="糖尿病饮食")
        except Exception:
            pass
        page.wait_for_timeout(200)
        snap(page, "09_push.png")
        browser.close()
    fit_1920(SHOTS / "09_push.png")


def remake_clip(scene_id: str, d: float) -> Path:
    mapping = {
        "01_title": "01_title.png",
        "02_login": "02_login.png",
        "03_ward": "03_ward.png",
        "04_bed": "04_bed.png",
        "05_consent": "05_consent.png",
        "06_inbox": "06_inbox.png",
        "07_article": "07_article.png",
        "08_bedside": "08_bedside.png",
        "09_push": "09_push.png",
        "10_plans": "10_plans.png",
        "11_stats": "11_stats.png",
        "12_end": "12_end.png",
    }
    png = SHOTS / mapping[scene_id]
    mp3 = AUDIO / f"{scene_id}.mp3"
    out = CLIPS / f"{scene_id}.mp4"
    frames = max(int(d * 25), 25)
    vf = (
        f"scale=1920:1080,zoompan=z='min(1.04,1+0.04*on/{frames})':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps=25,"
        "format=yuv420p"
    )
    run(
        [
            FFMPEG,
            "-y",
            "-loop",
            "1",
            "-i",
            str(png),
            "-i",
            str(mp3),
            "-t",
            f"{d:.3f}",
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(out),
        ]
    )
    return out


def remux_existing() -> None:
    durs = audio_durs()
    total = sum(durs)
    print("durations", [round(x, 2) for x in durs], "total", round(total, 2))
    write_subs(durs)
    clips = [CLIPS / f"{sc['id']}.mp4" for sc in SCRIPT["scenes"]]
    missing = [str(c) for c in clips if not c.exists()]
    if missing:
        raise FileNotFoundError("missing clips: " + ", ".join(missing))
    mux(clips)
    print("done", OUT_MP4, "sec", round(duration_sec(OUT_MP4), 2))


def main() -> None:
    args = set(sys.argv[1:])
    if "--subs-only" in args:
        if "--recapture-push" in args:
            print("recapture push")
            recapture_push()
            durs = audio_durs()
            idx = next(i for i, sc in enumerate(SCRIPT["scenes"]) if sc["id"] == "09_push")
            print("remake clip 09")
            remake_clip("09_push", durs[idx])
        remux_existing()
        return
    print("1 capture")
    capture()
    print("2 tts")
    durs = asyncio.run(tts_all())
    total = sum(durs)
    print("durations", [round(x, 2) for x in durs], "total", round(total, 2))
    if total > 300:
        print("WARNING over 5 min", file=sys.stderr)
    print("3 subs")
    write_subs(durs)
    print("4 clips")
    clips = make_clips(durs)
    print("5 mux")
    mux(clips)
    print("done", OUT_MP4, "sec", round(duration_sec(OUT_MP4), 2))


if __name__ == "__main__":
    main()
