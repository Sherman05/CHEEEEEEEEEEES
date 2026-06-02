"""Build README.pdf for the main Tauri build (Windows 10+).

Run:  python scripts/build_readme.py
"""
from __future__ import annotations
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "delivery" / "README.pdf"

WIN_FONTS = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Arial", str(WIN_FONTS / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(WIN_FONTS / "arialbd.ttf")))


TITLE = "GI chess-T1 — Информация о программе"

BLOCKS: list[tuple[str, str]] = [
    ("Название программы",
     "GI chess-T1 — графический интерфейс тактико-стратегической игры chess-T1."),
    ("Поддерживаемые операционные системы",
     "Windows 10, Windows 11 (64-bit). "
     "Компонент Microsoft Edge WebView2 Runtime должен быть установлен — "
     "в большинстве систем Windows 10/11 он уже присутствует."),
    ("Объём установочного пакета",
     "Установочный пакет занимает приблизительно 2,6 МБ. "
     "После установки программа занимает на диске около 8 МБ."),
    ("Установка",
     "Запустите установочный файл «GI chess-T1_0.1.0_x64-setup.exe» "
     "и следуйте указаниям мастера установки. По умолчанию программа устанавливается "
     "в папку Program Files, создаёт ярлык в меню «Пуск» и на рабочем столе. "
     "При установке может потребоваться подтверждение прав администратора."),
    ("Удаление программы",
     "Удаление программы выполняется стандартным средством Windows: "
     "«Параметры» → «Приложения» → «GI chess-T1» → «Удалить». "
     "Также можно удалить через «Панель управления» → «Программы и компоненты». "
     "После удаления никаких файлов программы в системе не остаётся."),
    ("Системные требования",
     "Процессор: x64, 1,5 ГГц или быстрее. "
     "Оперативная память: 2 ГБ (рекомендуется 4 ГБ). "
     "Свободное место на диске: 50 МБ. "
     "Видео: совместимое с OpenGL 2.0 или DirectX 9. "
     "Права администратора требуются только для установки."),
    ("Сохранение скриншотов",
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
    c.setTitle("GI chess-T1 — README")
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
    c.drawString(margin, margin / 2, "GI chess-T1 — установочный пакет для Microsoft Windows 10 и выше")
    c.save()
    print(f"README PDF -> {OUT}")


if __name__ == "__main__":
    main()
