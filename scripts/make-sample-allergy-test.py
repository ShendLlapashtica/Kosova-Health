"""Generate public/sample-allergy-test.pdf — a DEMO food-allergy / intolerance
test (specific IgE panel + intolerance tests) for presenting the upload.
Not a real medical document and not branded as any real laboratory.
    python scripts/make-sample-allergy-test.py      (needs: pip install reportlab)
"""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).resolve().parent.parent / "public" / "sample-allergy-test.pdf"
TEAL, INK, MUTED, FLAG, ROW = (colors.HexColor(c) for c in ("#00685f", "#131b2e", "#5b6b69", "#ba1a1a", "#f2f6f5"))

IGE = [  # allergen, code, kU/L, class, interpretation
    ("Lajthi (Hazelnut)", "f17", "3.42", "Klasa 3", "Pozitiv"),
    ("Kikirikë (Peanut)", "f13", "1.12", "Klasa 2", "Pozitiv"),
    ("Bajame (Almond)", "f20", "0.21", "Klasa 0", "Negativ"),
    ("Qumësht lope (Cow's milk)", "f2", "0.10", "Klasa 0", "Negativ"),
    ("Vezë – e bardha (Egg white)", "f1", "0.48", "Klasa 1", "Pozitiv i dobët"),
    ("Grurë (Wheat)", "f4", "0.08", "Klasa 0", "Negativ"),
    ("Soje (Soybean)", "f14", "0.05", "Klasa 0", "Negativ"),
    ("Susam (Sesame)", "f10", "0.62", "Klasa 1", "Pozitiv i dobët"),
    ("Peshk – merluc (Cod)", "f3", "0.02", "Klasa 0", "Negativ"),
    ("Karkaleca (Shrimp)", "f24", "0.04", "Klasa 0", "Negativ"),
]
INTOL = [
    ("Testi i frymëmarrjes me hidrogjen (laktozë)", "+38 ppm", "< 20 ppm", "Pozitiv (intolerancë)"),
    ("Anti-tTG IgA (celiakia)", "1.2 U/mL", "< 7 U/mL", "Negativ"),
]

def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, leading=12, textColor=INK); base.update(kw)
    return ParagraphStyle(name, **base)

def table(head, rows, widths, flag_col):
    th = st("th", fontName="Helvetica-Bold", fontSize=8, textColor=colors.white)
    data = [[Paragraph(h, th) for h in head]]
    for r in rows:
        pos = r[flag_col].startswith("Pozitiv")
        data.append([Paragraph(c, st("c", fontName="Helvetica-Bold" if (pos and i >= 1) else "Helvetica", textColor=FLAG if (pos and i == flag_col) else INK)) for i, c in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#d5dfdd")),
                           ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    return t

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm,
                        title="Test Shembull i Alergjive Ushqimore — KosovaHealth (DEMO)", author="KosovaHealth Demo")
W = A4[0] - 36*mm
head = Table([[Paragraph("<b>KosovaHealth</b> · Laboratori Demo", st("h", fontSize=15, leading=18, textColor=TEAL)),
               Paragraph("TEST SHEMBULL — VETËM PËR PREZANTIM", st("d", fontName="Helvetica-Bold", fontSize=8, textColor=FLAG, alignment=2))],
              [Paragraph("Paneli i Alergjive Ushqimore (IgE specifike) & Intolerancat · Prishtinë", st("s", textColor=MUTED)),
               Paragraph("Nr. i kampionit: KH-ALG-2026-1003", st("n", textColor=MUTED, alignment=2))]], colWidths=[W*0.65, W*0.35])
head.setStyle(TableStyle([("LINEBELOW", (0, 1), (-1, 1), 1.2, TEAL), ("BOTTOMPADDING", (0, 1), (-1, 1), 6), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
lab, val = st("l", textColor=MUTED), st("v", fontName="Helvetica-Bold")
pt = Table([[Paragraph(a, lab), Paragraph(b, val), Paragraph(c, lab), Paragraph(d, val)] for a, b, c, d in [
    ("Pacienti:", "Arta Shembulli", "ID e pacientit:", "#DEMO-0001"),
    ("Mjeku referues:", "—", "Data e marrjes:", "03.10.2026 09:10")]], colWidths=[W*0.18, W*0.32, W*0.18, W*0.32])
pt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), ROW)]))
sec = st("sec", fontName="Helvetica-Bold", fontSize=9, textColor=TEAL)
doc.build([head, Spacer(1, 8), pt, Spacer(1, 10),
           Paragraph("1. IgE SPECIFIKE NDAJ USHQIMEVE", sec), Spacer(1, 4),
           table(["Alergjeni", "Kodi", "Rezultati kU/L", "Klasa", "Interpretimi"], IGE, [W*0.38, W*0.1, W*0.17, W*0.13, W*0.22], 4),
           Spacer(1, 10), Paragraph("2. TESTET E INTOLERANCËS", sec), Spacer(1, 4),
           table(["Testi", "Rezultati", "Referenca", "Interpretimi"], INTOL, [W*0.42, W*0.14, W*0.14, W*0.30], 3),
           Spacer(1, 12),
           Paragraph("Klasat: 0 &lt; 0.35 kU/L · 1 = 0.35–0.69 · 2 = 0.70–3.49 · 3 = 3.5–17.4. Rezultati pozitiv tregon ndjeshmëri dhe duhet "
                     "interpretuar nga mjeku. Dokument demonstrues i gjeneruar për prezantimin e KosovaHealth — nuk është raport mjekësor.",
                     st("f", fontSize=7.5, leading=10, textColor=MUTED))])
print(f"Wrote {OUT}")
