"""Build deliverable assets for the installer:
  1. README.pdf for the install package (Russian, A4).
  2. App icons in 256x256, 512x512 PNG and a multi-resolution .ico
     from design/ЛОГОЛАСТ.png — re-rendered at high quality.

Run:  python scripts/build_assets.py
Requires: Pillow, reportlab.
"""
from __future__ import annotations
from pathlib import Path
import io
import struct
from PIL import Image, ImageDraw, ImageFont

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design"
TAURI_ICONS = ROOT / "src-tauri" / "icons"
DIST = ROOT / "dist-installer"
DIST.mkdir(exist_ok=True)


# ---------- README.pdf ----------------------------------------------------

# Register a Cyrillic-capable font (Arial ships with Windows).
WIN_FONTS = Path("C:/Windows/Fonts")
ARIAL = WIN_FONTS / "arial.ttf"
ARIAL_BOLD = WIN_FONTS / "arialbd.ttf"
pdfmetrics.registerFont(TTFont("Arial", str(ARIAL)))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(ARIAL_BOLD)))


README_TITLE = "GI chess-T1 — Информация о программе"

README_BLOCKS: list[tuple[str, str]] = [
    ("Название программы",
     "GI chess-T1 — графический интерфейс тактико-стратегической игры chess-T1."),
    ("Поддерживаемые операционные системы",
     "Windows 7 и выше (64-bit). "
     "Программа поставляется в виде стандартного установочного пакета для Windows."),
    ("Объём установочного пакета",
     "Установочный пакет занимает приблизительно 12–15 МБ. "
     "После установки программа занимает на диске около 30–40 МБ."),
    ("Установка",
     "Запустите установочный файл и следуйте указаниям мастера установки. "
     "По умолчанию программа устанавливается в папку Program Files и создаёт ярлык "
     "в меню «Пуск» и (опционально) на рабочем столе."),
    ("Удаление программы",
     "Удаление программы выполняется стандартным средством Windows: "
     "«Параметры» → «Приложения» → «Установленные приложения», найти "
     "«GI chess-T1» и нажать «Удалить». "
     "Альтернативно: «Панель управления» → «Программы и компоненты» → "
     "«GI chess-T1» → «Удалить». "
     "После удаления никаких файлов программы в системе не остаётся."),
    ("Системные требования",
     "Процессор: x64, 1 ГГц или быстрее. "
     "Оперативная память: 512 МБ. "
     "Свободное место на диске: 100 МБ. "
     "Видео: совместимое с DirectX 11. "
     "Права администратора требуются только для установки."),
    ("Контакты и поддержка",
     "По вопросам работы программы обращайтесь к разработчику."),
]


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    """Greedy word wrap respecting pdfmetrics string width."""
    words = text.split()
    lines: list[str] = []
    line = ""
    for w in words:
        candidate = w if not line else f"{line} {w}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def build_readme_pdf(out: Path) -> None:
    page_w, page_h = A4
    margin = 20 * mm
    max_width = page_w - 2 * margin

    c = canvas.Canvas(str(out), pagesize=A4)
    c.setTitle("GI chess-T1 — README")
    c.setAuthor("GI chess-T1")

    y = page_h - margin

    # Title
    c.setFont("Arial-Bold", 18)
    c.drawString(margin, y, README_TITLE)
    y -= 10 * mm
    c.setStrokeColorRGB(0.2, 0.4, 0.7)
    c.setLineWidth(1)
    c.line(margin, y, page_w - margin, y)
    y -= 8 * mm

    body_size = 11
    head_size = 12
    leading = 5.2 * mm

    for heading, body in README_BLOCKS:
        # Heading
        if y < margin + 30 * mm:
            c.showPage()
            y = page_h - margin
        c.setFont("Arial-Bold", head_size)
        c.drawString(margin, y, heading)
        y -= 5.5 * mm

        # Body
        c.setFont("Arial", body_size)
        for line in wrap_text(body, "Arial", body_size, max_width):
            if y < margin:
                c.showPage()
                y = page_h - margin
                c.setFont("Arial", body_size)
            c.drawString(margin, y, line)
            y -= leading
        y -= 3 * mm

    # Footer
    c.setFont("Arial", 9)
    c.setFillGray(0.45)
    c.drawString(margin, margin / 2, "GI chess-T1 — установочный пакет для Microsoft Windows")
    c.save()
    print(f"  README PDF -> {out}")


# ---------- App icons -----------------------------------------------------

LOGO_SOURCE = DESIGN / "ЛОГОЛАСТ.png"


def render_native_logo(size: int = 1024) -> Image.Image:
    """Render GI chess-T1 app icon (image5 design) at the requested size.
    Cyan rounded square, dark border, two chess-piece silhouettes side by
    side: black (left) + white (right). Drawn natively → sharp at all sizes.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    s = size  # alias

    # Cyan rounded square background.
    pad = int(s * 0.05)
    box = (pad, pad, s - pad, s - pad)
    radius = int(s * 0.16)
    d.rounded_rectangle(box, radius=radius,
                        fill=(58, 168, 232, 255),                # cyan
                        outline=(20, 20, 20, 255),
                        width=max(4, s // 80))

    # --- Two pieces (Knekht-like silhouettes) ---
    # Each piece: a vertical body with sloped shoulders + small triangular hat.
    def draw_piece(cx: int, base_y: int, h: int, body_fill, hat_fill):
        outline = (20, 20, 20, 255)
        line = max(3, s // 110)
        body_w = int(h * 0.55)
        # Trapezoidal body
        top_w = int(body_w * 0.55)
        body_top = base_y - int(h * 0.62)
        body = [
            (cx - body_w // 2, base_y),
            (cx + body_w // 2, base_y),
            (cx + top_w // 2, body_top),
            (cx - top_w // 2, body_top),
        ]
        d.polygon(body, fill=body_fill, outline=outline)
        # Re-stroke (PIL polygon outline can be 1px on some versions)
        d.line(body + [body[0]], fill=outline, width=line)

        # Triangular hat
        hat_h = int(h * 0.32)
        hat_w = int(top_w * 1.05)
        hat = [
            (cx - hat_w // 2, body_top),
            (cx + hat_w // 2, body_top),
            (cx, body_top - hat_h),
        ]
        d.polygon(hat, fill=hat_fill, outline=outline)
        d.line(hat + [hat[0]], fill=outline, width=line)

        # Vertical centerline accent
        d.line((cx, body_top, cx, base_y), fill=outline, width=max(2, s // 200))

    base_y = int(s * 0.74)
    piece_h = int(s * 0.55)
    gap = int(s * 0.04)
    body_w = int(piece_h * 0.55)
    left_cx = s // 2 - body_w // 2 - gap // 2
    right_cx = s // 2 + body_w // 2 + gap // 2

    # Left = black piece, right = white piece.
    draw_piece(left_cx, base_y, piece_h,
               body_fill=(20, 20, 20, 255), hat_fill=(40, 40, 40, 255))
    draw_piece(right_cx, base_y, piece_h,
               body_fill=(248, 248, 248, 255), hat_fill=(225, 225, 225, 255))

    return img


def write_ico(path: Path, images: list[Image.Image]) -> None:
    """Write a multi-resolution .ico where each entry is its own image
    (so 16/32 can use a different design from 256)."""
    entries = []
    blobs = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        blobs.append(buf.getvalue())
    offset = 6 + 16 * len(images)
    header = struct.pack("<HHH", 0, 1, len(images))
    out = bytearray(header)
    for im, blob in zip(images, blobs):
        w = im.width if im.width < 256 else 0
        h = im.height if im.height < 256 else 0
        out += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
    for blob in blobs:
        out += blob
    path.write_bytes(bytes(out))


def render_simple_logo(size: int) -> Image.Image:
    """Tiny-size variant: rounded frame + 2x2 checker (white + dark grey).
    No pieces, no text — readable down to 16x16.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size
    # Border thickness scales but stays >=1px.
    border = max(1, s // 16)
    radius = max(2, s // 5)
    outline = (20, 20, 20, 255)
    # Outer rounded frame (cyan ring matches brand).
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius,
                        fill=(58, 168, 232, 255), outline=outline, width=border)
    # Inner checker area.
    inset = border + max(1, s // 16)
    x0, y0, x1, y1 = inset, inset, s - inset, s - inset
    mx = (x0 + x1) // 2
    my = (y0 + y1) // 2
    white = (245, 245, 245, 255)
    dark = (55, 55, 60, 255)
    # Top-left white, top-right dark, bottom-left dark, bottom-right white.
    d.rectangle((x0, y0, mx, my), fill=white)
    d.rectangle((mx, y0, x1, my), fill=dark)
    d.rectangle((x0, my, mx, y1), fill=dark)
    d.rectangle((mx, my, x1, y1), fill=white)
    return img


def build_icons() -> None:
    # Render natively at 1024 — sharp source for every downscale.
    square = render_native_logo(1024)
    print(f"  source: procedurally rendered {square.size}")

    # High-res sizes the user explicitly asked for + Tauri standard sizes.
    sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    rendered: dict[int, Image.Image] = {}
    for s in sizes:
        if s <= 32:
            # Render simplified checker variant natively at this size.
            rendered[s] = render_simple_logo(s)
        else:
            rendered[s] = square.resize((s, s), Image.LANCZOS)

    # PNGs requested by user.
    for s in (256, 512, 1024):
        out = DIST / f"icon-{s}.png"
        rendered[s].save(out, "PNG", optimize=True)
        print(f"  PNG -> {out}")

    # Multi-resolution Windows .ico — distinct per-size variants.
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = [rendered[s] for s in ico_sizes]
    out_ico = DIST / "icon.ico"
    write_ico(out_ico, ico_images)
    print(f"  ICO -> {out_ico}")

    # Also overwrite the Tauri icons so the built app uses the sharp versions.
    if TAURI_ICONS.exists():
        rendered[32].save(TAURI_ICONS / "32x32.png", "PNG", optimize=True)
        rendered[128].save(TAURI_ICONS / "128x128.png", "PNG", optimize=True)
        rendered[256].save(TAURI_ICONS / "128x128@2x.png", "PNG", optimize=True)
        rendered[512].save(TAURI_ICONS / "icon.png", "PNG", optimize=True)
        write_ico(TAURI_ICONS / "icon.ico", ico_images)
        print(f"  Tauri icons updated in {TAURI_ICONS}")


# ---------- main ----------------------------------------------------------

if __name__ == "__main__":
    print("Building installer assets…")
    print("[1/2] README.pdf")
    build_readme_pdf(DIST / "README.pdf")
    print("[2/2] Icons")
    build_icons()
    print("Done. Output in:", DIST)
