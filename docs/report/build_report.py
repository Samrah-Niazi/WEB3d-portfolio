"""Builds the project report as PDF (reportlab) and DOCX (python-docx) from content.py.

Run from the project root:  python docs/report/build_report.py
Rules: no header or footer except the page number, black and white except the title page and screenshots.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from content import C

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "docs", "report")
TITLE = os.path.join(OUT, "title-page.png")
FONTS = "C:/Windows/Fonts/"

def img_size(path):
    with Image.open(os.path.join(ROOT, path)) as im:
        return im.size

# ============================================================ PDF
def build_pdf(path):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                    Image as RLImage, PageBreak, CondPageBreak, KeepTogether, NextPageTemplate, ListFlowable, ListItem, Preformatted)
    from reportlab.platypus.tableofcontents import TableOfContents

    for name, f in [("Georgia", "georgia.ttf"), ("Georgia-Bold", "georgiab.ttf"), ("Georgia-Italic", "georgiai.ttf"),
                    ("Georgia-BoldItalic", "georgiaz.ttf"), ("Consolas", "consola.ttf")]:
        pdfmetrics.registerFont(TTFont(name, FONTS + f))
    pdfmetrics.registerFontFamily("Georgia", normal="Georgia", bold="Georgia-Bold", italic="Georgia-Italic", boldItalic="Georgia-BoldItalic")

    W, H = A4
    ML = MR = 2.5 * cm
    MT, MB = 2.4 * cm, 2.4 * cm
    TW = W - ML - MR
    BODY = ParagraphStyle("body", fontName="Georgia", fontSize=10.5, leading=15.5, alignment=TA_JUSTIFY, spaceAfter=7, textColor=colors.black)
    H1 = ParagraphStyle("h1", fontName="Georgia-Bold", fontSize=18, leading=22, spaceBefore=6, spaceAfter=10, textColor=colors.black, keepWithNext=1)
    H2 = ParagraphStyle("h2", fontName="Georgia-Bold", fontSize=12.5, leading=16, spaceBefore=10, spaceAfter=5, textColor=colors.black, keepWithNext=1)
    CAP = ParagraphStyle("cap", fontName="Georgia-Italic", fontSize=9, leading=12, alignment=TA_CENTER, spaceBefore=3, spaceAfter=12, textColor=colors.black)
    CELL = ParagraphStyle("cell", fontName="Georgia", fontSize=9.2, leading=12.4, textColor=colors.black)
    CELLB = ParagraphStyle("cellb", parent=CELL, fontName="Georgia-Bold")
    CODE = ParagraphStyle("code", fontName="Consolas", fontSize=8.5, leading=11)
    TOC1 = ParagraphStyle("toc1", fontName="Georgia", fontSize=11, leading=20, textColor=colors.black)

    class Doc(BaseDocTemplate):
        def afterFlowable(self, fl):
            if isinstance(fl, Paragraph) and fl.style.name == "h1":
                self.notify("TOCEntry", (0, fl.getPlainText(), self.page))

    def title_page(canvas, doc):
        canvas.drawImage(TITLE, 0, 0, width=W, height=H)

    def number_page(canvas, doc):
        canvas.setFont("Georgia", 9.5)
        canvas.setFillColor(colors.black)
        canvas.drawCentredString(W / 2, 1.3 * cm, str(doc.page))

    doc = Doc(path, pagesize=A4, leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
              title="Design and Development of an Interactive 3D Web Portfolio: Project Report", author="Samrah Niazi")
    full = Frame(0, 0, W, H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="full")
    body = Frame(ML, MB, TW, H - MT - MB, id="body")
    doc.addPageTemplates([PageTemplate("title", frames=[full], onPage=title_page, autoNextPageTemplate="body"),
                          PageTemplate("body", frames=[body], onPage=number_page)])

    S = [Spacer(1, 1), NextPageTemplate("body"), PageBreak()]
    # table of contents
    S.append(Paragraph("Contents", ParagraphStyle("h1c", parent=H1)))
    toc = TableOfContents(); toc.levelStyles = [TOC1]; toc.dotsMinLevel = 0
    S += [toc, PageBreak()]

    def wrap(t):
        return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    n_fig = 0
    def figure(path_, caption, width_cm):
        nonlocal n_fig
        n_fig += 1
        w, h = img_size(path_)
        wd = min(width_cm * cm, TW); ht = wd * h / w
        im = RLImage(os.path.join(ROOT, path_), width=wd, height=ht)
        t = Table([[im]], colWidths=[wd + 2], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
                  ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        t.hAlign = "CENTER"
        return KeepTogether([t, Paragraph("Figure %d: %s" % (n_fig, wrap(caption)), CAP)])

    first_h1 = True
    for it in C:
        k = it[0]
        if k == "h1":
            if not first_h1: S.append(CondPageBreak(7 * cm))
            first_h1 = False
            S.append(Paragraph(wrap(it[1]), H1))
        elif k == "h2":
            S.append(Paragraph(wrap(it[1]), H2))
        elif k == "p":
            S.append(Paragraph(wrap(it[1]), BODY))
        elif k == "bullets":
            S.append(ListFlowable([ListItem(Paragraph(wrap(b), BODY), leftIndent=14, value="\u2022") for b in it[1]],
                                  bulletType="bullet", start="\u2022", leftIndent=14, bulletFontName="Georgia", bulletFontSize=10))
        elif k == "table":
            _, header, rows, widths = it
            scale = TW / (sum(widths) * cm)
            cw = [w * cm * scale for w in widths]
            data = [[Paragraph(wrap(h), CELLB) for h in header]] + [[Paragraph(wrap(c), CELL) for c in r] for r in rows]
            t = Table(data, colWidths=cw, repeatRows=1)
            t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.black), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e6e6e6")),
                                   ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                                   ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
            S += [t, Spacer(1, 10)]
        elif k == "fig":
            S.append(figure(it[1], it[2], it[3]))
        elif k == "figrow":
            _, paths, caption, wcm = it
            n_fig += 1
            cells = []
            for pth in paths:
                w, h = img_size(pth)
                wd = wcm * cm
                cells.append(RLImage(os.path.join(ROOT, pth), width=wd, height=wd * h / w))
            t = Table([cells], colWidths=[wcm * cm + 6] * len(cells), style=TableStyle([("BOX", (0, 0), (-1, -1), 0.0, colors.white)] +
                      [("BOX", (i, 0), (i, 0), 0.5, colors.HexColor("#555555")) for i in range(len(cells))] +
                      [("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
            t.hAlign = "CENTER"
            S.append(KeepTogether([t, Paragraph("Figure %d: %s" % (n_fig, wrap(caption)), CAP)]))
        elif k == "code":
            S.append(Preformatted(it[1], CODE))
        elif k == "pagebreak":
            S.append(PageBreak())
    merged = []
    for fl in S:
        if merged and isinstance(merged[-1], Paragraph) and merged[-1].style.name == "h2" and isinstance(fl, KeepTogether):
            merged[-1] = KeepTogether([merged[-1], fl])
        else:
            merged.append(fl)
    doc.multiBuild(merged)

# ============================================================ DOCX
def build_docx(path):
    from docx import Document
    from docx.shared import Pt, Cm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.section import WD_SECTION
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    d = Document()
    st = d.styles["Normal"]; st.font.name = "Georgia"; st.font.size = Pt(10.5); st.font.color.rgb = RGBColor(0, 0, 0)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Georgia")
    st.paragraph_format.space_after = Pt(6); st.paragraph_format.line_spacing = 1.15
    for name, size in [("Heading 1", 18), ("Heading 2", 12.5)]:
        h = d.styles[name]; h.font.name = "Georgia"; h.font.size = Pt(size); h.font.bold = True; h.font.color.rgb = RGBColor(0, 0, 0)
        h.element.rPr.rFonts.set(qn("w:ascii"), "Georgia"); h.element.rPr.rFonts.set(qn("w:hAnsi"), "Georgia")
        h.paragraph_format.space_before = Pt(12); h.paragraph_format.space_after = Pt(6); h.paragraph_format.keep_with_next = True

    # section 1: title page, full bleed, no footer
    s0 = d.sections[0]
    s0.page_width, s0.page_height = Cm(21.0), Cm(29.7)
    s0.left_margin = s0.right_margin = s0.top_margin = s0.bottom_margin = Cm(0)
    s0.header_distance = s0.footer_distance = Cm(0)
    p = d.paragraphs[0] if d.paragraphs else d.add_paragraph()
    p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(TITLE, width=Cm(21.0), height=Cm(29.65))

    # section 2: body
    s1 = d.add_section(WD_SECTION.NEW_PAGE)
    s1.left_margin = s1.right_margin = Cm(2.5); s1.top_margin = s1.bottom_margin = Cm(2.4)
    s1.header_distance = Cm(1.0); s1.footer_distance = Cm(1.0)
    s1.header.is_linked_to_previous = False; s1.footer.is_linked_to_previous = False
    fp = s1.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    def fld(par, instr):
        r = par.add_run()
        for t, txt in (("begin", None), (None, instr), ("end", None)):
            if t:
                e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), t); r._r.append(e)
            else:
                e = OxmlElement("w:instrText"); e.set(qn("xml:space"), "preserve"); e.text = txt; r._r.append(e)
        r.font.size = Pt(9.5)
    fld(fp, "PAGE")

    # contents (a field: Word fills it in when the file is opened and fields are updated)
    d.add_heading("Contents", level=1)
    tp = d.add_paragraph(); fld(tp, 'TOC \\o "1-1" \\h \\z \\u')
    note = d.add_paragraph("(Right-click this area and choose Update Field to show the page numbers.)")
    note.runs[0].italic = True; note.runs[0].font.size = Pt(9)
    d.add_page_break()

    TWc = 16.0
    n_fig = 0
    def caption(text):
        nonlocal n_fig
        n_fig += 1
        c = d.add_paragraph(); c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = c.add_run("Figure %d: %s" % (n_fig, text)); r.italic = True; r.font.size = Pt(9)
        c.paragraph_format.space_after = Pt(10)
    def set_borders(tbl):
        tblPr = tbl._tbl.tblPr
        b = OxmlElement("w:tblBorders")
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            e = OxmlElement("w:" + edge); e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "4"); e.set(qn("w:color"), "000000"); b.append(e)
        tblPr.append(b)
    def shade(cell, hexcolor):
        tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
        sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hexcolor); tcPr.append(sh)

    first = True
    for it in C:
        k = it[0]
        if k == "h1":
            if not first: d.add_page_break()
            first = False
            d.add_heading(it[1], level=1)
        elif k == "h2":
            d.add_heading(it[1], level=2)
        elif k == "p":
            para = d.add_paragraph(it[1]); para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        elif k == "bullets":
            for b in it[1]:
                para = d.add_paragraph(b, style="List Bullet"); para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        elif k == "table":
            _, header, rows, widths = it
            scale = TWc / sum(widths)
            t = d.add_table(rows=1 + len(rows), cols=len(header)); t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
            set_borders(t)
            for ci, h in enumerate(header):
                c = t.rows[0].cells[ci]; c.text = ""; r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(9.2); shade(c, "E6E6E6")
            for ri, row in enumerate(rows, start=1):
                for ci, val in enumerate(row):
                    c = t.rows[ri].cells[ci]; c.text = ""; r = c.paragraphs[0].add_run(val); r.font.size = Pt(9.2)
            for row in t.rows:
                for ci, c in enumerate(row.cells):
                    c.width = Cm(widths[ci] * scale)
                    c.paragraphs[0].paragraph_format.space_after = Pt(2)
            d.add_paragraph().paragraph_format.space_after = Pt(2)
        elif k == "fig":
            _, pth, cap, wcm = it
            para = d.add_paragraph(); para.alignment = WD_ALIGN_PARAGRAPH.CENTER; para.paragraph_format.keep_with_next = True
            w, h = img_size(pth)
            para.add_run().add_picture(os.path.join(ROOT, pth), width=Cm(min(wcm, TWc)))
            caption(cap)
        elif k == "figrow":
            _, paths, cap, wcm = it
            t = d.add_table(rows=1, cols=len(paths)); t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for ci, pth in enumerate(paths):
                c = t.rows[0].cells[ci]; c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                c.paragraphs[0].add_run().add_picture(os.path.join(ROOT, pth), width=Cm(wcm * 0.97))
            caption(cap)
        elif k == "pagebreak":
            d.add_page_break()
    d.core_properties.title = "Design and Development of an Interactive 3D Web Portfolio: Project Report"
    d.core_properties.author = "Samrah Niazi"
    d.save(path)

if __name__ == "__main__":
    build_pdf(os.path.join(OUT, "Samrah_Niazi_Project_Report.pdf"))
    print("pdf ok")
    build_docx(os.path.join(OUT, "Samrah_Niazi_Project_Report.docx"))
    print("docx ok")
