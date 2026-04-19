"""Build a separate README.pdf for the Windows 7 Electron build.
The main scripts/build_assets.py targets the Tauri (Win10+) build; this
one has the correct install size and mentions Electron/WebView specifics
relevant to Windows 7.

Run:  python scripts/build_readme_win7.py
"""
from __future__ import annotations
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "electron-win7" / "README.pdf"

WIN_FONTS = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Arial", str(WIN_FONTS / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(WIN_FONTS / "arialbd.ttf")))


TITLE = "GI chess-T1 — Информация о программе (сборка для Windows 7)"

BLOCKS: list[tuple[str, str]] = [
    ("Название программы",
     "GI chess-T1 — графический интерфейс тактико-стратегической игры chess-T1. "
     "Настоящий установочный пакет — отдельная сборка, совместимая с Microsoft Windows 7."),
    ("Поддерживаемые операционные системы",
     "Windows 7 SP1, Windows 8.1, Windows 10, Windows 11 (64-bit). "
     "Для Windows 7 SP1 требуется установленное обновление KB4474419 "
     "(SHA-2 code signing support) и Visual C++ 2015–2019 Redistributable (x64) — "
     "как правило, они уже установлены на современных системах Windows 7."),
    ("Объём установочного пакета",
     "Установочный пакет занимает приблизительно 74 МБ. "
     "После установки программа занимает на диске около 240 МБ. "
     "Увеличенный по сравнению со стандартной сборкой размер связан с тем, "
     "что в установочный пакет для совместимости с Windows 7 включён встроенный "
     "браузерный движок (Chromium), не поставляемый вместе с этой версией Windows."),
    ("Установка",
     "Запустите установочный файл «GI chess-T1 (Win7)_0.1.0_x64-setup.exe» "
     "и следуйте указаниям мастера установки. По умолчанию программа устанавливается "
     "в папку Program Files, создаёт ярлык в меню «Пуск» и на рабочем столе. "
     "При установке может потребоваться подтверждение прав администратора."),
    ("Удаление программы",
     "Удаление программы выполняется стандартным средством Windows: "
     "«Пуск» → «Панель управления» → «Программы и компоненты» → «GI chess-T1» → «Удалить». "
     "После удаления никаких файлов программы в системе не остаётся."),
    ("Системные требования",
     "Процессор: x64, 1,5 ГГц или быстрее. "
     "Оперативная память: 2 ГБ (рекомендуется 4 ГБ). "
     "Свободное место на диске: 300 МБ. "
     "Видео: совместимое с OpenGL 2.0 или DirectX 9. "
     "Права администратора требуются только для установки."),
    ("Отличия от основной сборки",
     "Функционально и визуально данная сборка идентична основной версии «GI chess-T1» "
     "для Windows 10 и Windows 11: совпадают правила игры, интерфейс, фигуры, "
     "режимы Партии и Анализа, сохранение скриншотов, меню. "
     "Сохранение скриншотов выполняется в папку «Изображения» (Pictures) пользователя, "
     "в подпапку с именем, заданным при создании партии."),
    ("Контакты и поддержка",
     "По вопросам работы программы обращайтесь к разработчику."),
]


def wrap_text(text: str, font: str, size: float, max_w: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for w in words:
        cand = w if not line else f"{line} {w}"
        if pdfmetrics.stringWidth(cand, font, size) <= max_w:
            line = cand
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    page_w, page_h = A4
    margin = 20 * mm
    max_width = page_w - 2 * margin

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("GI chess-T1 — README (Win7)")
    c.setAuthor("GI chess-T1")

    y = page_h - margin
    c.setFont("Arial-Bold", 16)
    c.drawString(margin, y, TITLE)
    y -= 9 * mm
    c.setStrokeColorRGB(0.2, 0.4, 0.7)
    c.setLineWidth(1)
    c.line(margin, y, page_w - margin, y)
    y -= 8 * mm

    body_size = 11
    head_size = 12
    leading = 5.2 * mm

    for heading, body in BLOCKS:
        if y < margin + 30 * mm:
            c.showPage()
            y = page_h - margin
        c.setFont("Arial-Bold", head_size)
        c.drawString(margin, y, heading)
        y -= 5.5 * mm

        c.setFont("Arial", body_size)
        for line in wrap_text(body, "Arial", body_size, max_width):
            if y < margin:
                c.showPage()
                y = page_h - margin
                c.setFont("Arial", body_size)
            c.drawString(margin, y, line)
            y -= leading
        y -= 3 * mm

    c.setFont("Arial", 9)
    c.setFillGray(0.45)
    c.drawString(margin, margin / 2, "GI chess-T1 — установочный пакет для Microsoft Windows 7 SP1 и выше (сборка Electron)")
    c.save()
    print(f"README PDF -> {OUT}")


if __name__ == "__main__":
    main()
