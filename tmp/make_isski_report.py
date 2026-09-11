from docx import Document
from docx.shared import Pt, RGBColor, Cm, Twips
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from pathlib import Path

doc = Document()

for section in doc.sections:
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)


def set_run_font(run, name="Calibri", size=11, bold=False, italic=False, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_text(cell, text, bold=False, size=10, color=None, center=False):
    cell.text = ""
    p = cell.paragraphs[0]
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, color=color)


def add_heading_custom(text, level=1):
    p = doc.add_paragraph()
    run = p.add_run(text)
    if level == 0:
        set_run_font(run, size=20, bold=True, color=(32, 33, 36))
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(4)
    elif level == 1:
        set_run_font(run, size=14, bold=True, color=(26, 115, 232))
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "10")
        bottom.set(qn("w:space"), "3")
        bottom.set(qn("w:color"), "1A73E8")
        pBdr.append(bottom)
        pPr.append(pBdr)
    else:
        set_run_font(run, size=12, bold=True, color=(60, 64, 67))
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
    return p


def add_para(text, size=11, bold=False, italic=False, space_after=8, center=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic, color=(32, 33, 36))
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.2
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return p


def add_bullet(text, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True, size=11)
        r2 = p.add_run(text)
        set_run_font(r2, size=11)
    else:
        r = p.add_run(text)
        set_run_font(r, size=11)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    return p


# ========== COVER ==========
add_heading_custom("LEARNING REPORT", 0)
add_para("Google Gurugram — Khushiyon Ka Tyohaar", size=13, bold=True, center=True, space_after=2)
add_para("Annual Festive Meet", size=12, center=True, space_after=10)

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = meta.add_run(
    "Date: 6 August 2026\n"
    "Venue: Google Office, Gurugram\n"
    "Nature of Document: Post-event learning summary\n"
    "(Derived from on-site session slides and materials)"
)
set_run_font(r, size=10, color=(95, 99, 104))
meta.paragraph_format.space_after = Pt(18)

# thin line
line = doc.add_paragraph()
line.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = line.add_run("─" * 48)
set_run_font(r, size=9, color=(189, 193, 198))

# ========== PURPOSE ==========
add_heading_custom("1. Purpose of This Report", 1)
add_para(
    "This report documents what was learned during Google's Khushiyon Ka Tyohaar "
    "(Annual Festive Meet) at the Gurugram office. It focuses only on insights, "
    "frameworks, and data shared in the sessions — not on personal photos or "
    "campus sightseeing. The goal is to convert the day's content into clear, "
    "reusable learning for marketing, product, and growth work."
)

# ========== CONTEXT ==========
add_heading_custom("2. Event Context", 1)
add_bullet("Event: Khushiyon Ka Tyohaar — Annual Festive Meet")
add_bullet("Host: Google (Gurugram office)")
add_bullet("Date: 6 August 2026")
add_bullet(
    "Theme: How India shops during the festive season, and how brands can win "
    "using Search, YouTube, AI, CTV, local, and retail media"
)
add_bullet(
    "Format: Expert presentations + product booths (Creator Partnerships, "
    "Commerce Media Network) + structured feedback"
)

add_heading_custom("Speakers noted from sessions", 2)
add_bullet("Abhinav Kishore — India Head, SMB, Google Cloud")
add_bullet("Ramneek Bhardwaj — Business Lead, North & East India, New Business Sales")
add_bullet("Dhwani Rathod — Business Development Consultant, New Business Sales")
add_bullet("Jahnvi Sangal — Business Development Consultant, New Business Sales")

# ========== CORE LEARNINGS ==========
add_heading_custom("3. Core Learning Themes — Kya Seekhne Ko Mila", 1)
add_para(
    "Neeche diye gaye points isi visit ki asli seekh hain. Har theme ke andar "
    "session data + practical implication dono diye gaye hain."
)

# --- Theme 1 ---
add_heading_custom("3.1 Festive Market Reality: Size, Timing & Growth Drivers", 2)
add_para(
    "Festive commerce in India is not a Diwali-week spike. Interest and spend "
    "build early, and growth is coming from structural shifts — not only discounts."
)
add_bullet(
    "Market scale: Festive Gross Merchandise Value context of about Rs 1.2 Lakh Crore (2025)."
)
add_bullet(
    "Velocity: The first 11 days of the 2025 sales event alone crossed Rs 60,000+ Crore GMV."
)
add_bullet(
    "Timing: Search interest for 'Diwali Sale' starts as early as August — planning must begin then, not in October."
)
add_bullet(
    "Growth (~27% festive shopping growth) came from three forces: Tier 2+ city demand, higher spend per buyer, and quick commerce."
)
add_bullet(
    "Tier 2+ / Bharat: 60–65% of shoppers; roughly half of incremental e-retail orders."
)
add_bullet(
    "Spend: About 70% of buyers spent more than in 2024 (GST cuts + early platform access)."
)
add_bullet(
    "Quick commerce: Net order value more than doubled YoY; festive share rose from 8% (2024) to 12%."
)
add_bullet(
    "Who shops: Gen Z is 40–45% of the e-retail shopper base — a core cohort, not a niche."
)
add_para(
    "Learning: Festive strategy must prioritise Bharat + Gen Z, start in August, and treat "
    "quick commerce as a mainstream festive channel.",
    italic=True,
)

# --- Theme 2 ---
add_heading_custom("3.2 Shopper Journey: Research-Heavy, Not Impulse-Only", 2)
add_para(
    "The strongest behavioural lesson: festive buying is a multi-touch journey. "
    "Discovery may start on social, but validation and immersion happen on Google and YouTube."
)
add_bullet("9 in 10 shoppers research before purchasing; 33% do 'a lot of research'.")
add_bullet(
    "Average journey intensity: ~8.3 search-engine searches and ~7.7 online video views."
)
add_bullet(
    "Immersive stage: After inspiration, shoppers go deep — checking whether a product fits their identity and physical space. It is not a 'quick click'."
)
add_bullet(
    "Social → Search handoff: 7 in 10 festive shoppers who saw brands on Facebook/Instagram went to Google Search to research further."
)
add_bullet(
    "Omnichannel reality: Shoppers make ~6.6 physical store visits on average; 84% check digital sources before visiting a store."
)
add_bullet(
    "Speed closes the sale: 81% choose where to buy based on delivery speed; 90% want reliable shipping in two days or less."
)
add_bullet(
    "Nearly 30% used quick commerce for festive shopping — it has become a staple final step of the journey."
)
add_para(
    "Learning: Winning festive demand means owning research moments (Search/YouTube), "
    "connecting digital to store, and promising (and delivering) speed.",
    italic=True,
)

# --- Theme 3 ---
add_heading_custom("3.3 AI Is Now Shopping Infrastructure", 2)
add_para(
    "The biggest mindset shift from the sessions: shoppers will no longer only 'try' AI — "
    "they will rely on it, especially for complex categories."
)
add_bullet("AI Overview: ~2.5 billion monthly users.")
add_bullet("AI Mode: 1 billion+ monthly users (Gemini 1.5 era capabilities highlighted).")
add_bullet("95% of consumers using AI Mode for shopping find it helpful.")
add_bullet(
    "AI acts as a personal shopper: comparing specs, clarifying needs, simplifying jargon, "
    "shortening decision time, and answering nuanced questions (~38–40% across roles)."
)
add_bullet(
    "Highest AI chatbot dependency: Mobile devices (89%), large home appliances (87%), "
    "furniture (84%), consumer electronics (83%). Apparel is lower but still material (69%)."
)
add_bullet(
    "India leads globally in AI marketing expectations: 53% of Indian CMOs expect 5–9% "
    "incremental growth from AI in marketing; 27% rank AI adoption in their top-3 priorities."
)
add_bullet(
    "Retail AI impact (Google Cloud framing): >$3T estimated agentic commerce revenue by 2030; "
    "81% of consumers expect faster service due to AI; ~24% reduction in frontline burnout when AI is used."
)
add_bullet(
    "Data foundation for AI retail: Cleanliness (accurate data), Connectivity (open to agents), "
    "Context (actionable enrichment)."
)
add_para(
    "Learning: For any product or brand, AI-ready content (clear specs, comparisons, FAQs, "
    "structured feeds) is now as important as creative ads.",
    italic=True,
)

# --- Theme 4 ---
add_heading_custom("3.4 Media Systems That Matter This Festive Season", 2)

add_para("YouTube Shorts & Creator Partnerships", bold=True, space_after=4)
add_bullet(
    "Short-form video is a primary catalyst for impulse purchases: 61% of shoppers who bought "
    "quickly (with little research) used YouTube Shorts in their journey."
)
add_bullet(
    "Creator Partnerships positioning: 'Capture Hearts (and Carts)' — emotional trust plus commerce."
)
add_bullet(
    "Repeatable flow: Connect with creators → create brand videos → boost as Partnership Ads → "
    "measure in Creator Partnership Hub."
)
add_bullet(
    "YouTube Prime Time Masthead (IPL example) was presented as a high-impact 'first eyeball' format."
)

add_para("Connected TV (CTV)", bold=True, space_after=4)
add_bullet("Google positioned as the CTV destination for the festive season.")
add_bullet("YouTube: #1 streaming platform in India.")
add_bullet("Google TV: #1 TV base operating system in India.")
add_bullet("DV360: access to ~86% reach of CTV households in India.")

add_para("Local / location advantage", bold=True, space_after=4)
add_bullet("In an AI-first world, location is a competitive advantage.")
add_bullet(
    "Three-step local framework: Be Visible (Business Profile + AI Search) → "
    "Build Connections (local conversion goals / Local Campaigns) → "
    "Drive Performance (connect and activate data signals)."
)

add_para("Ride-hailing inventory", bold=True, space_after=4)
add_bullet(
    "Premium high-intent placements on apps like Uber and Rapido (On Trip / Journey Ads; "
    "native & display; location-based shopping-hub formats)."
)
add_bullet("Framed opportunity: be seen during high-intent commute moments.")

add_para("Commerce Media Suite & Performance Max", bold=True, space_after=4)
add_bullet(
    "Commerce Media Suite now spans multiple campaign types: Performance Max, Video, "
    "Demand Gen, Search, and Shopping."
)
add_bullet(
    "Steer AI — do not set and forget: channel steering, demographic exclusions, "
    "first-party exclusions (e.g. returners), and product-value bid adjustments."
)

add_para("Measurement & privacy", bold=True, space_after=4)
add_bullet(
    "iOS performance stability can be recovered with on-device conversion measurement — "
    "a privacy-preserving way to restore signal for models."
)

add_para("Media planning (DV360 / Canvas)", bold=True, space_after=4)
add_bullet(
    "Media planning can be visualised geographically (Brand GRPs, Social GRPs, investment by city/state)."
)
add_bullet(
    "Festive next steps taught: (1) consolidate media buys on DV360 across the journey, "
    "(2) activate programmatic DOOH where people gather, (3) align briefs with Google/DV360 POCs."
)
add_para(
    "Learning: Festive media is a system — Search + YouTube + CTV + Local + Creators + "
    "measurement — not isolated channel spends.",
    italic=True,
)

# --- Theme 5 ---
add_heading_custom("3.5 Strategic Playbooks Shared on Stage", 2)
add_para("Boosting Playbook: Gaining the Edge — practical levers for festive media uplift.")
add_para("Inspire consumers — Tip set A:", bold=True, space_after=4)
add_bullet("Be Present — Future of Search")
add_bullet("Connect the Dots — Omnichannel solutions")
add_bullet("Multiply influence")
add_para("Inspire consumers — Tip set B:", bold=True, space_after=4)
add_bullet("Own the moment")
add_bullet("Own the Living Room (CTV / YouTube / Google TV)")
add_bullet("Command Attention — Masthead and impact formats")
add_para(
    "Booth-level concepts reinforced the same system thinking: "
    "Creator Partnerships for hearts-and-carts, and Commerce Media Network for "
    "Awareness → Consideration → Conversion using retail signals.",
    italic=True,
)

# ========== PERSONAL TAKEAWAYS ==========
add_heading_custom("4. Personal Takeaways — Mujhe Specifically Kya Mila", 1)
add_para(
    "Ye section event ke after-reflection se aata hai: jo cheezein ab practical soch / "
    "kaam mein seedha apply ho sakti hain."
)

takeaways = [
    (
        "1. Festive planning starts in August",
        "Diwali interest builds early. Waiting for sale week means missing the research window "
        "when shoppers are already immersing on Google and YouTube.",
    ),
    (
        "2. Bharat + Gen Z are the dual growth engine",
        "Tier 2+ cities and Gen Z together define volume and culture. Ignoring either means "
        "leaving the larger festive opportunity untouched.",
    ),
    (
        "3. Social discovers; Google decides",
        "Even after Instagram/Facebook discovery, most festive shoppers validate on Google Search. "
        "SEO, Shopping feed quality, AI Overview readiness, and YouTube education content matter "
        "more than vanity social reach.",
    ),
    (
        "4. AI is shopping infrastructure, not a novelty",
        "For complex categories, AI already behaves like a personal shopper. Product data, "
        "clear specs, and comparison content are the new storefront UX.",
    ),
    (
        "5. Speed is a marketing message",
        "With quick commerce rising and two-day shipping expectations dominant, delivery "
        "reliability is part of brand promise — not only an operations KPI.",
    ),
    (
        "6. Creators need a measurement loop",
        "Creator work should move from one-off posts to a system: create → boost as Partnership Ads "
        "→ measure impact. Hearts without carts is incomplete.",
    ),
    (
        "7. Steer AI; do not only automate",
        "PMax and Commerce Media Suite work best when humans guide them with channel controls, "
        "exclusions, and product-value signals.",
    ),
    (
        "8. Measurement recovery is a competitive skill",
        "Privacy changes (especially iOS) reduce signal. On-device conversion measurement and "
        "clean first-party data are growth capabilities, not backend chores.",
    ),
    (
        "9. Omnichannel must be designed, not assumed",
        "Digital research, store visits, CTV living-room presence, and festive DOOH all connect. "
        "Channel-silo campaigns underperform a journey-based plan.",
    ),
    (
        "10. Culture and commerce are linked at Google",
        "The event itself showed how Google connects cultural moments (festivals) with product "
        "systems (ads, cloud, retail media) — a useful model for product storytelling.",
    ),
]

for title, body in takeaways:
    add_para(title, bold=True, space_after=2)
    add_para(body, space_after=8)

# ========== STATS TABLE ==========
add_heading_custom("5. Key Statistics Reference", 1)
add_para(
    "Selected figures presented during the sessions (as shown on slides / cited studies):",
    space_after=8,
)

table = doc.add_table(rows=1, cols=2)
table.style = "Table Grid"
table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = table.rows[0].cells
set_cell_text(hdr[0], "Metric", bold=True, size=10, color=(255, 255, 255), center=True)
set_cell_text(hdr[1], "Insight", bold=True, size=10, color=(255, 255, 255), center=True)
shade_cell(hdr[0], "1A73E8")
shade_cell(hdr[1], "1A73E8")

rows = [
    ("Rs 1.2 Lakh Cr", "Festive GMV context (2025)"),
    ("Rs 60K+ Cr", "GMV in first 11 days of 2025 sales event"),
    ("27%", "Festive shopping growth explained in session"),
    ("60–65%", "Shoppers from Tier 2+ cities"),
    ("40–45%", "Gen Z share of e-retail shoppers"),
    ("12% (from 8%)", "Quick commerce share of festive shopping"),
    ("9 in 10", "Shoppers who research before purchase"),
    ("7 in 10", "Social discoverers who then search on Google"),
    ("84%", "Research online before a store visit"),
    ("6.6", "Average physical store visits in journey"),
    ("81% / 90%", "Buy based on speed / want ≤2-day shipping"),
    ("61%", "Fast impulse buyers who used YouTube Shorts"),
    ("89%", "AI chatbot use for mobile-device shopping"),
    ("95%", "Find AI Mode helpful for shopping"),
    ("53%", "Indian CMOs expect 5–9% growth from AI marketing"),
    (">$3T by 2030", "Estimated agentic commerce revenue"),
    ("86%", "CTV household reach via DV360 in India"),
]
for i, (metric, insight) in enumerate(rows):
    row = table.add_row().cells
    set_cell_text(row[0], metric, bold=True, size=10)
    set_cell_text(row[1], insight, size=10)
    if i % 2 == 1:
        shade_cell(row[0], "F1F3F4")
        shade_cell(row[1], "F1F3F4")

doc.add_paragraph()

# ========== CLOSING ==========
add_heading_custom("6. Closing Summary", 1)
add_para(
    "Khushiyon Ka Tyohaar was a compressed masterclass on how India shops in 2025–26: "
    "research-heavy, AI-assisted, omnichannel, speed-obsessed, and creator-influenced. "
    "The clearest overall lesson is that festive winners prepare early, respect Bharat and Gen Z, "
    "feed AI good data, and show up as a connected system across Search, YouTube, CTV, local, "
    "and retail media — not as scattered campaigns."
)
add_para(
    "End-of-day feedback reflected high value from the sessions (maximum satisfaction rating).",
    space_after=14,
)

# footer
footer = doc.add_paragraph()
r = footer.add_run(
    "Document type: Professional learning report  |  Based on analysis of event slides and materials  |  "
    "Figures as presented during Google Khushiyon Ka Tyohaar, Gurugram (6 August 2026)."
)
set_run_font(r, size=8, italic=True, color=(120, 120, 120))
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER

out_dir = Path(r"C:\Users\Sahil\Downloads\careerverse\output")
out_dir.mkdir(parents=True, exist_ok=True)
out = out_dir / "Google_Gurugram_Learning_Report_6Aug2026.docx"
doc.save(str(out))

desktop = Path(r"C:\Users\Sahil\Desktop") / out.name
doc.save(str(desktop))
print("SAVED", out)
print("SAVED", desktop)
print("SIZE", out.stat().st_size)
