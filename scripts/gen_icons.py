"""Generate app icons from the customer SVG using pycairo directly.

Reads the SVG, crops viewBox to the real bounding box, then renders
via pycairo + rsvg2 if available, otherwise falls back to Pillow polygon rendering.
Generates all Tauri icon sizes + multi-res .ico.
"""

import re
import os
import sys
import tempfile
from pathlib import Path
from io import BytesIO

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SVG_SRC = ROOT / "design" / "icons" / "Символ ГИ chess-T1 1.svg"
ICONS_DIR = ROOT / "src-tauri" / "icons"
SIZE = 1024


def crop_svg(svg_text: str) -> str:
    """Crop viewBox to the real graphic bounding box."""
    # User-specified bbox based on actual graphic coordinates
    vb = "-2420 1150 430 310"

    # Make it square with padding
    x, y, w, h = -2420.0, 1150.0, 430.0, 310.0
    # Center into square
    if w > h:
        diff = w - h
        y -= diff / 2
        h = w
    else:
        diff = h - w
        x -= diff / 2
        w = h
    # 8% padding
    pad = w * 0.08
    x -= pad
    y -= pad
    w += 2 * pad
    h += 2 * pad

    vb = f"{x:.2f} {y:.2f} {w:.2f} {h:.2f}"

    svg_text = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', svg_text)
    svg_text = re.sub(r'width="[^"]*"', f'width="{w:.2f}"', svg_text, count=1)
    svg_text = re.sub(r'height="[^"]*"', f'height="{h:.2f}"', svg_text, count=1)
    return svg_text


def try_cairosvg_render(svg_bytes: bytes, size: int) -> Image.Image | None:
    """Try rendering via cairosvg (needs cairocffi -> libcairo-2.dll)."""
    try:
        # Patch: make cairocffi find cairo from pycairo's bundled DLL
        import cairo as _pycairo
        pycairo_dir = os.path.dirname(_pycairo.__file__)
        if pycairo_dir not in os.environ.get('PATH', ''):
            os.environ['PATH'] = pycairo_dir + os.pathsep + os.environ.get('PATH', '')

        import cairosvg
        png_data = cairosvg.svg2png(
            bytestring=svg_bytes,
            output_width=size,
            output_height=size,
            background_color="#00000000",
        )
        return Image.open(BytesIO(png_data)).convert("RGBA")
    except Exception as e:
        print(f"  cairosvg failed: {e}")
        return None


def try_pycairo_rsvg_render(svg_bytes: bytes, size: int) -> Image.Image | None:
    """Try rendering via pycairo + Rsvg (GObject introspection)."""
    try:
        import cairo
        import gi
        gi.require_version('Rsvg', '2.0')
        from gi.repository import Rsvg

        handle = Rsvg.Handle.new_from_data(svg_bytes)
        dim = handle.get_dimensions()

        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
        ctx = cairo.Context(surface)
        ctx.scale(size / dim.width, size / dim.height)
        handle.render_cairo(ctx)

        # Convert ARGB32 surface to PIL RGBA
        buf = surface.get_data()
        img = Image.frombuffer("RGBA", (size, size), bytes(buf), "raw", "BGRA", 0, 1)
        return img
    except Exception as e:
        print(f"  pycairo+rsvg failed: {e}")
        return None


def pil_render(svg_text: str, size: int) -> Image.Image:
    """Fallback: parse SVG paths manually and render with PIL."""
    # Extract paths by id
    path_data = {}
    for m in re.finditer(r'id="(path\d+)"[^>]*\bd="([^"]*)"', svg_text):
        pid, d = m.groups()
        path_data[pid] = d
    for m in re.finditer(r'\bd="([^"]*)"[^>]*id="(path\d+)"', svg_text):
        d, pid = m.groups()
        if pid not in path_data:
            path_data[pid] = d

    # Parse viewBox
    vb_match = re.search(r'viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"', svg_text)
    vb_x, vb_y, vb_w, vb_h = [float(v) for v in vb_match.groups()]

    def parse_path(d):
        tokens = re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?\d*\.?\d+', d)
        points = []
        cmd = 'M'
        cx, cy = 0.0, 0.0
        first_x, first_y = 0.0, 0.0
        i = 0
        while i < len(tokens):
            t = tokens[i]
            if t.isalpha():
                cmd = t
                i += 1
                continue
            val = float(t)
            if cmd in ('M', 'L'):
                cx = val
                i += 1
                if i < len(tokens) and not tokens[i].isalpha():
                    cy = float(tokens[i]); i += 1
                points.append((cx, cy))
                if cmd == 'M':
                    first_x, first_y = cx, cy
                    cmd = 'L'
            elif cmd in ('m', 'l'):
                cx += val
                i += 1
                if i < len(tokens) and not tokens[i].isalpha():
                    cy += float(tokens[i]); i += 1
                points.append((cx, cy))
                if cmd == 'm':
                    first_x, first_y = cx, cy
                    cmd = 'l'
            elif cmd == 'H':
                cx = val; points.append((cx, cy)); i += 1
            elif cmd == 'h':
                cx += val; points.append((cx, cy)); i += 1
            elif cmd == 'V':
                cy = val; points.append((cx, cy)); i += 1
            elif cmd == 'v':
                cy += val; points.append((cx, cy)); i += 1
            elif cmd in ('Z', 'z'):
                points.append((first_x, first_y)); i += 1
            else:
                i += 1
        return points

    def transform(points):
        scale = size / vb_w
        return [(int((x - vb_x) * scale), int((y - vb_y) * scale)) for x, y in points]

    RENDER = size * 4
    img = Image.new("RGBA", (RENDER, RENDER), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def transform_hr(points):
        scale = RENDER / vb_w
        return [(int((x - vb_x) * scale), int((y - vb_y) * scale)) for x, y in points]

    # White piece (background)
    for pid, fill, stroke in [("path36", (255,255,255,255), (10,10,10,255)),
                               ("path37", (255,255,255,255), (10,10,10,255))]:
        pts = parse_path(path_data.get(pid, ""))
        if pts:
            tpts = transform_hr(pts)
            draw.polygon(tpts, fill=fill, outline=stroke)
            sw = int(7.27 * RENDER / vb_w)
            draw.line(tpts + [tpts[0]], fill=stroke, width=sw, joint="curve")

    # White piece center line (path38)
    pts38 = parse_path(path_data.get("path38", ""))
    if len(pts38) >= 2:
        lw = int(14.16 * RENDER / vb_w)
        tline = transform_hr(pts38)
        draw.line(tline, fill=(0,0,0,255), width=lw)

    # Black piece (foreground)
    for pid, fill, stroke in [("path33", (0,0,0,255), (65,27,26,255)),
                               ("path34", (0,0,0,255), (65,27,26,255))]:
        pts = parse_path(path_data.get(pid, ""))
        if pts:
            tpts = transform_hr(pts)
            draw.polygon(tpts, fill=fill, outline=stroke)
            sw = int(7.27 * RENDER / vb_w)
            draw.line(tpts + [tpts[0]], fill=stroke, width=sw, joint="curve")

    # Black piece center line (path35)
    pts35 = parse_path(path_data.get("path35", ""))
    if len(pts35) >= 2:
        lw = int(12.38 * RENDER / vb_w)
        tline = transform_hr(pts35)
        draw.line(tline, fill=(255,254,247,255), width=lw)

    return img.resize((size, size), Image.LANCZOS)


def main():
    svg_text = SVG_SRC.read_text(encoding="utf-8")
    cropped = crop_svg(svg_text)
    svg_bytes = cropped.encode("utf-8")

    print("Attempting cairosvg render...")
    img1024 = try_cairosvg_render(svg_bytes, SIZE)

    if img1024 is None:
        print("Attempting pycairo+rsvg render...")
        img1024 = try_pycairo_rsvg_render(svg_bytes, SIZE)

    if img1024 is None:
        print("Falling back to PIL polygon render...")
        img1024 = pil_render(cropped, SIZE)

    # Save 1024
    img1024.save(ICONS_DIR / "icon.png")
    print(f"  -> icon.png (1024x1024)")

    # Tauri sizes
    tauri_sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    all_images = {}
    for name, sz in tauri_sizes.items():
        img = img1024.resize((sz, sz), Image.LANCZOS)
        img.save(ICONS_DIR / name)
        all_images[sz] = img
        print(f"  -> {name} ({sz}x{sz})")

    # Extra sizes
    for sz in [16, 48, 64, 512]:
        img = img1024.resize((sz, sz), Image.LANCZOS)
        img.save(ICONS_DIR / f"{sz}x{sz}.png")
        all_images[sz] = img
        print(f"  -> {sz}x{sz}.png")

    # ICO
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_imgs = [all_images.get(s, img1024.resize((s, s), Image.LANCZOS)) for s in ico_sizes]
    ico_imgs.sort(key=lambda i: i.size[0], reverse=True)
    ico_imgs[0].save(
        ICONS_DIR / "icon.ico",
        format="ICO",
        sizes=[(i.size[0], i.size[1]) for i in ico_imgs],
        append_images=ico_imgs[1:],
    )
    print("  -> icon.ico")
    print("\nDone!")


if __name__ == "__main__":
    main()
