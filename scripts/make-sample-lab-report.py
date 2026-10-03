"""Generate public/sample-lab-report.pdf — a DEMO lab report for presenting
the PDF upload. Text-based PDF so the in-browser parser can read it.
Not a real medical document and not branded as any real laboratory.

    python scripts/make-sample-lab-report.py      (needs: pip install reportlab)
"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).resolve().parent.parent / "public" / "sample-lab-report.pdf"
TEAL = colors.HexColor("#00685f")
INK = colors.HexColor("#131b2e")
MUTED = colors.HexColor("#5b6b69")
FLAG = colors.HexColor("#ba1a1a")
ROW = colors.HexColor("#f2f6f5")

PATIENT = [
    ("Pacienti:", "Shend Llapashtica", "ID e pacientit:", "#SL-04-2004"),
    ("Mosha / Gjinia:", "20 vjeç / M", "Data e marrjes:", "01.10.2026 08:15"),
    ("Mjeku referues:", "Dr. Arben Krasniqi", "Data e raportit:", "01.10.2026 13:40"),
]

# (section, rows) — rows: analysis, result, unit, reference, flag
PANELS = [
    ("BIOKIMIA", [
        ("Glukoza esëll", "108", "mg/dL", "70 – 99", "H"),
        ("Magnezi (Mg)", "1.6", "mg/dL", "1.7 – 2.4", "L"),
        ("Kalciumi (Ca)", "8.2", "mg/dL", "8.5 – 10.2", "L"),
        ("Kolesteroli total", "212", "mg/dL", "< 200", "H"),
    ]),
    ("HEMATOLOGJIA", [
        ("Hemoglobina (HGB)", "13.2", "g/dL", "13.5 – 17.5", "L"),
        ("Leukocitet (WBC)", "7.2", "x10^9/L", "4.0 – 10.0", ""),
        ("Trombocitet (PLT)", "251", "x10^9/L", "150 – 400", ""),
    ]),
    ("VITAMINAT & DEPOT E HEKURIT", [
        ("25-OH Vitamina D", "12", "ng/mL", "30 – 100", "L"),
        ("Vitamina B12", "198", "pg/mL", "200 – 900", "L"),
        ("Ferritina", "19", "ng/mL", "24 – 336", "L"),
    ]),
    ("HORMONET", [
        ("TSH", "3.62", "µIU/mL", "0.4 – 4.0", ""),
    ]),
    ("SHENJAT VITALE", [
        ("Tensioni arterial", "142/91", "mmHg", "< 120/80", "H"),
        ("Pulsi në qetësi", "84", "bpm", "60 – 100", ""),
    ]),
]


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, leading=12, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


def build():
    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title="Raport Shembull i Analizave — KosovaHealth (DEMO)",
        author="KosovaHealth Demo", subject="Sample lab report for demo purposes",
    )
    width = A4[0] - 36 * mm
    story = []

    head = Table(
        [[
            Paragraph("<b>KosovaHealth</b> · Laboratori Demo", style("h", fontSize=15, leading=18, textColor=TEAL)),
            Paragraph("RAPORT SHEMBULL — VETËM PËR PREZANTIM", style("d", fontName="Helvetica-Bold", fontSize=8, textColor=FLAG, alignment=2)),
        ], [
            Paragraph("Rezultatet e Analizave Laboratorike · Prishtinë", style("s", textColor=MUTED)),
            Paragraph("Nr. i kampionit: KH-DEMO-2026-0417", style("n", textColor=MUTED, alignment=2)),
        ]],
        colWidths=[width * 0.6, width * 0.4],
    )
    head.setStyle(TableStyle([
        ("LINEBELOW", (0, 1), (-1, 1), 1.2, TEAL),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story += [head, Spacer(1, 8)]

    label = style("l", textColor=MUTED)
    value = style("v", fontName="Helvetica-Bold")
    pt = Table(
        [[Paragraph(a, label), Paragraph(b, value), Paragraph(c, label), Paragraph(d, value)] for a, b, c, d in PATIENT],
        colWidths=[width * 0.18, width * 0.32, width * 0.18, width * 0.32],
    )
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ROW),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story += [pt, Spacer(1, 10)]

    cols = [width * 0.40, width * 0.15, width * 0.15, width * 0.20, width * 0.10]
    th = style("th", fontName="Helvetica-Bold", fontSize=8, textColor=colors.white)
    rows = [[Paragraph(h, th) for h in ("Analiza", "Rezultati", "Njësia", "Vlerat referente", "Flag")]]
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#d5dfdd")),
    ]
    for section, panel in PANELS:
        cmds += [("SPAN", (0, len(rows)), (-1, len(rows))), ("BACKGROUND", (0, len(rows)), (-1, len(rows)), ROW)]
        rows.append([Paragraph(section, style("sec", fontName="Helvetica-Bold", fontSize=8, textColor=TEAL)), "", "", "", ""])
        for name, result, unit, ref, flag in panel:
            hi = flag != ""
            rows.append([
                Paragraph(name, style("a")),
                Paragraph(result, style("r", fontName="Helvetica-Bold", textColor=FLAG if hi else INK)),
                Paragraph(unit, style("u", textColor=MUTED)),
                Paragraph(ref, style("rf", textColor=MUTED)),
                Paragraph(flag, style("f", fontName="Helvetica-Bold", textColor=FLAG)),
            ])
    table = Table(rows, colWidths=cols, repeatRows=1)
    table.setStyle(TableStyle(cmds))
    story += [table, Spacer(1, 12)]

    story.append(Paragraph(
        "L = nën vlerat referente · H = mbi vlerat referente. "
        "Dokument demonstrues i gjeneruar për prezantimin e KosovaHealth — nuk është raport mjekësor "
        "dhe nuk duhet përdorur për diagnozë.",
        style("foot", fontSize=7.5, leading=10, textColor=MUTED),
    ))
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
