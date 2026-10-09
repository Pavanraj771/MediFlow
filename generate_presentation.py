import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(filename="MediFlow_8_Modules_Presentation.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    total_slides = 14

    # Color Palette Definitions
    BG_LIGHT = RGBColor(248, 250, 252)          # Slate 50
    CARD_BG = RGBColor(255, 255, 255)           # Pure White
    CARD_BORDER = RGBColor(226, 232, 240)       # Slate 200
    
    PRIMARY_DARK = RGBColor(15, 23, 42)         # Slate 900
    PRIMARY_TEAL = RGBColor(13, 148, 136)       # Teal 600
    DARK_TEAL = RGBColor(15, 118, 110)          # Teal 700
    LIGHT_TEAL_BG = RGBColor(240, 253, 250)     # Teal 50
    TEAL_BORDER = RGBColor(153, 246, 228)       # Teal 200
    
    ACCENT_BLUE = RGBColor(2, 132, 199)         # Sky 600
    LIGHT_BLUE_BG = RGBColor(240, 249, 255)     # Sky 50
    BLUE_BORDER = RGBColor(186, 230, 253)       # Sky 200

    ACCENT_AMBER = RGBColor(217, 119, 6)        # Amber 600
    LIGHT_AMBER_BG = RGBColor(254, 243, 199)    # Amber 50
    AMBER_BORDER = RGBColor(253, 230, 138)      # Amber 200

    ACCENT_PURPLE = RGBColor(126, 34, 206)      # Purple 700
    LIGHT_PURPLE_BG = RGBColor(250, 245, 255)   # Purple 50
    PURPLE_BORDER = RGBColor(233, 213, 255)     # Purple 200

    ACCENT_EMERALD = RGBColor(5, 150, 105)      # Emerald 600
    LIGHT_EMERALD_BG = RGBColor(236, 253, 245)  # Emerald 50
    EMERALD_BORDER = RGBColor(167, 243, 208)    # Emerald 200

    ACCENT_ROSE = RGBColor(225, 29, 72)         # Rose 600
    LIGHT_ROSE_BG = RGBColor(255, 241, 242)     # Rose 50
    ROSE_BORDER = RGBColor(254, 205, 211)       # Rose 200

    TEXT_DARK = RGBColor(30, 41, 59)            # Slate 800
    TEXT_MUTED = RGBColor(100, 116, 139)        # Slate 500
    TEXT_SUBTLE = RGBColor(71, 85, 105)         # Slate 600

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_LIGHT
        bg.line.fill.background()
        
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = PRIMARY_TEAL
        top_bar.line.fill.background()

    def add_header(slide, category, title, slide_num):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(10), Inches(0.32))
        tf = cat_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.font.name = "Arial"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_TEAL

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(10.5), Inches(0.65))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Arial"
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK

        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.6), Inches(0.4), Inches(0.95), Inches(0.35))
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(226, 232, 240)
        badge.line.fill.background()
        tf = badge.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = f"{slide_num} / {total_slides}"
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Arial"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK

        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.08), Inches(11.733), Inches(0.28))
        tf = footer_box.text_frame
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = "MediFlow  •  Smart Healthcare Platform  •  8 Modular System Structure"
        p.font.name = "Arial"
        p.font.size = Pt(8.5)
        p.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        return card

    def add_pill(slide, left, top, width, height, text, bg_color, text_color, border_color=None, font_size=Pt(10)):
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        pill.fill.solid()
        pill.fill.fore_color.rgb = bg_color
        if border_color:
            pill.line.color.rgb = border_color
            pill.line.width = Pt(1)
        else:
            pill.line.fill.background()
        tf = pill.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Arial"
        p.font.size = font_size
        p.font.bold = True
        p.font.color.rgb = text_color
        return pill

    # Standard positions
    top_pos = Inches(1.5)
    card_h = Inches(5.3)
    col3_w = Inches(3.7)
    col3_gap = Inches(0.31)

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1)
    
    add_card(slide1, Inches(0.8), Inches(1.15), Inches(11.733), Inches(5.5), bg_color=CARD_BG, border_color=TEAL_BORDER)

    add_pill(slide1, Inches(1.4), Inches(1.6), Inches(4.5), Inches(0.4), "INTELLIGENT HEALTHCARE MANAGEMENT SYSTEM", LIGHT_TEAL_BG, DARK_TEAL, TEAL_BORDER)

    t_box = slide1.shapes.add_textbox(Inches(1.4), Inches(2.2), Inches(10.5), Inches(1.1))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MediFlow"
    p.font.name = "Arial"
    p.font.size = Pt(46)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_DARK

    sub_box = slide1.shapes.add_textbox(Inches(1.4), Inches(3.3), Inches(10.5), Inches(0.55))
    tf = sub_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Smart Hospital & Clinical Care Management Platform"
    p.font.name = "Arial"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_TEAL

    tag_box = slide1.shapes.add_textbox(Inches(1.4), Inches(3.95), Inches(10.5), Inches(0.5))
    tf = tag_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Complete 8-Module Architecture: Easy Authentication, Multi-Role UI, Scheduling, AI Risk & Security"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_SUBTLE

    h_data = [
        ("MODULES 1 & 2", "Login & Auth • OAuth\n3-Role UI & Authorization", PRIMARY_TEAL),
        ("TECH STACK", "React.js • Django REST\nPostgreSQL • JWT Auth", ACCENT_BLUE),
        ("CARE & AI", "Doctor Schedules • EMR\nAI Risk Triage Support", ACCENT_PURPLE),
        ("SECURITY", "HIPAA Ready • Privacy\nImmutable Audit Logs", ACCENT_AMBER)
    ]
    hw = Inches(2.55)
    hgap = Inches(0.25)
    for i, (ht, hd, hc) in enumerate(h_data):
        hx = Inches(1.4) + (hw + hgap) * i
        mc = add_card(slide1, hx, Inches(4.7), hw, Inches(1.4), bg_color=BG_LIGHT, border_color=CARD_BORDER)
        tfm = mc.text_frame
        tfm.margin_left = Inches(0.18)
        tfm.margin_top = Inches(0.15)
        p = tfm.paragraphs[0]
        p.text = ht
        p.font.name = "Arial"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = hc
        p2 = tfm.add_paragraph()
        p2.text = hd
        p2.font.name = "Arial"
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = PRIMARY_DARK

    # =========================================================================
    # SLIDE 2: Executive Summary — 8 Modules Overview
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2)
    add_header(slide2, "Project Structure", "Executive Summary: Complete 8-Module System Division", 2)

    mod_grid = [
        ("MODULE 1", "User Authentication & Login", "Login page, email OTP code verification, JWT tokens, and Google OAuth sign-in.", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER),
        ("MODULE 2", "Multi-Role UI & Access Control", "Clean UI dashboards for Patient, Doctor, and Admin roles with RBAC protection.", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER),
        ("MODULE 3", "Doctor Scheduling Engine", "Weekly shift planner, time slot creation, and dynamic slot availability calculation.", LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER),
        ("MODULE 4", "Patient Portal & Booking", "Self-service appointment booking, doctor search by department, and visit cancellation.", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER),
        ("MODULE 5", "Doctor Workstation & EMR", "Clinical queue management, patient vitals recording, and digital prescription generator.", LIGHT_EMERALD_BG, ACCENT_EMERALD, EMERALD_BORDER),
        ("MODULE 6", "Explainable AI Risk Engine", "AI risk score calculation, biomarker analysis, and SHAP explanation graphs.", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER),
        ("MODULE 7", "Hospital Admin & Operations", "Doctor request approvals, department rosters, staff directory, and footfall metrics.", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER),
        ("MODULE 8", "Security, Privacy & Audits", "Data encryption, Protected Health Info isolation, and immutable user action logs.", LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER)
    ]

    gw = Inches(2.75)
    gh = Inches(2.4)
    ggap_x = Inches(0.24)
    ggap_y = Inches(0.22)
    start_y = Inches(1.5)

    for i, (m_badge, m_title, m_desc, m_bg, m_color, m_border) in enumerate(mod_grid):
        row = i // 4
        col = i % 4
        gx = Inches(0.8) + (gw + ggap_x) * col
        gy = start_y + (gh + ggap_y) * row
        
        c = add_card(slide2, gx, gy, gw, gh, bg_color=CARD_BG, border_color=m_border)
        add_pill(slide2, gx + Inches(0.15), gy + Inches(0.18), Inches(1.2), Inches(0.32), m_badge, m_bg, m_color, m_border, font_size=Pt(9))

        tb = slide2.shapes.add_textbox(gx + Inches(0.15), gy + Inches(0.58), gw - Inches(0.3), Inches(1.6))
        tfe = tb.text_frame
        tfe.word_wrap = True
        tfe.margin_left = tfe.margin_top = tfe.margin_right = tfe.margin_bottom = 0
        p = tfe.paragraphs[0]
        p.text = m_title
        p.font.name = "Arial"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK
        p.space_after = Pt(3)
        
        p2 = tfe.add_paragraph()
        p2.text = m_desc
        p2.font.name = "Arial"
        p2.font.size = Pt(9.2)
        p2.font.color.rgb = TEXT_SUBTLE

    # =========================================================================
    # SLIDE 3: Module 1 — User Authentication & Login (Completed)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3)
    add_header(slide3, "Module 1", "Module 1: User Authentication & Secure Login System", 3)

    m1_cards = [
        ("LOGIN & SIGNUP PAGES", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Clean Login Form", "Simple login page with email/username and password inputs."),
            ("Patient Registration", "Quick signup form for new patients with instant account creation."),
            ("Doctor Registration", "Doctor signup request form with specialty and license selection."),
            ("Input Validation", "Prevents empty fields, invalid emails, and weak passwords.")
        ]),
        ("EMAIL OTP & GOOGLE OAUTH", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Email OTP Code", "Generates 6-digit OTP sent via email for user identity verification."),
            ("Google One-Tap OAuth", "Allows fast 1-click login using existing Google accounts."),
            ("Secure OTP Expiry", "OTP code automatically expires after 10 minutes for safety."),
            ("Smooth UX Flow", "Inline verification status with error messages if code is wrong.")
        ]),
        ("JWT SECURITY TOKENS", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Stateless JWT Tokens", "Issues secure Access Token and Refresh Token upon successful login."),
            ("Password Hashing", "Stores passwords safely using strong password hashing algorithms."),
            ("Auto Token Refresh", "Refreshes session automatically without asking user to re-login."),
            ("Secure Logout", "Clears tokens from local memory on logout to end user session.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m1_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide3, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide3, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide3.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 4: Module 2 — Multi-Role UI & Authorization (Completed)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4)
    add_header(slide4, "Module 2", "Module 2: Basic UI Design of 3 Roles & Authorization", 4)

    m2_cards = [
        ("3 ROLE DASHBOARD UI", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Patient Dashboard", "Clean view for patients to manage appointments and health profile."),
            ("Doctor Workstation", "Emerald-themed clinical portal for schedules and patient visits."),
            ("Admin Workspace", "Central dashboard for managing hospital staff and doctor approvals."),
            ("Modern Visual Theme", "Glassmorphism UI, dual dark/light mode, and clear typography.")
        ]),
        ("AUTHORIZATION (RBAC)", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Role Boundaries", "Strict access rules: Patient, Doctor, and Hospital Administrator."),
            ("Route Protection", "Unapproved users are redirected automatically to their authorized portal."),
            ("API Endpoint Guard", "Backend verifies user role token on every API request."),
            ("No Unauthorized Access", "Patients cannot open doctor files; doctors cannot change admin settings.")
        ]),
        ("HEADER & NAVIGATION", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Top Navigation Bar", "Displays brand logo, active theme switcher, and role indicator."),
            ("Patient Avatar Dropdown", "Quick menu for patient profile, appointments, and logout."),
            ("Doctor Avatar Dropdown", "Quick menu for doctor schedule, workstation, and logout."),
            ("Responsive Layout", "Works smoothly across desktop, tablet, and mobile screens.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m2_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide4, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide4, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide4.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 5: Module 3 — Doctor Scheduling & Dynamic Slots
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5)
    add_header(slide5, "Module 3", "Module 3: Doctor Scheduling & Dynamic Slot Generator", 5)

    m3_cards = [
        ("WEEKLY SCHEDULE SETUP", LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER, [
            ("Working Days Config", "Doctors select working days (e.g. Monday to Friday)."),
            ("Shift Timings", "Doctors set start time and end time (e.g. 09:00 AM to 05:00 PM)."),
            ("Slot Duration", "Flexible consultation slot length (15, 20, 30, or 60 minutes)."),
            ("Easy Schedule Edit", "Doctors can add, edit, or remove working days in one click.")
        ]),
        ("DYNAMIC SLOT ENGINE", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Automatic Calculation", "System generates exact time slots from doctor work hours."),
            ("Booked Slot Removal", "Already booked slots disappear immediately from available list."),
            ("Doctor Leave Blocks", "Blocks out time slots when doctor is on leave or break."),
            ("Real-Time Availability", "Always shows accurate available time slots to patients.")
        ]),
        ("CONFLICT PREVENTION", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Database Locking", "Uses database transactions to prevent double-booking."),
            ("Single Patient Rule", "A time slot can only be booked by one patient at a time."),
            ("Instant Status Update", "Changes slot state from Available to Scheduled upon booking."),
            ("Clean Error Handling", "Shows clear notice if a slot was just taken by someone else.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m3_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide5, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide5, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide5.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 6: Module 4 — Patient Portal & Self-Service Booking
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6)
    add_header(slide6, "Module 4", "Module 4: Patient Portal & Appointment Booking", 6)

    m4_cards = [
        ("EASY APPOINTMENT BOOKING", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Department Search", "Patients filter doctors by department (Cardiology, Neurology, etc.)."),
            ("Doctor Selection", "Select preferred doctor and view their available calendar dates."),
            ("Slot Picker", "Pick available time slot and add optional reason for visit."),
            ("Instant Confirmation", "Immediate booking confirmation with clear visit details.")
        ]),
        ("APPOINTMENT MANAGEMENT", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Upcoming Visits List", "Displays upcoming appointments with date, time, and doctor name."),
            ("One-Click Cancel", "Patients can cancel an appointment if they cannot attend."),
            ("Past Visit History", "Complete history of previous finished and cancelled visits."),
            ("High-Contrast UI", "Clean input text and high visibility in both light and dark mode.")
        ]),
        ("PATIENT PROFILE", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER, [
            ("Personal Details", "View and update full name, email, phone number, and address."),
            ("Emergency Contact", "Save emergency contact person name and phone number."),
            ("Medical Overview", "View recorded blood group, allergies, and vital summary."),
            ("Privacy Control", "Patient data is private and visible only to authorized doctors.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m4_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide6, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide6, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide6.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 7: Module 5 — Doctor Clinical Workstation & EMR
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7)
    add_header(slide7, "Module 5", "Module 5: Doctor Clinical Workstation & EMR Prescriptions", 7)

    m5_cards = [
        ("PATIENT QUEUE COCKPIT", LIGHT_EMERALD_BG, ACCENT_EMERALD, EMERALD_BORDER, [
            ("Today's Patient Queue", "View all patient visits scheduled for today in order."),
            ("Visit Status Flow", "Update visit status: Scheduled → In-Progress → Completed."),
            ("Quick Patient Info", "View patient age, gender, and main reason for visit."),
            ("Fast Queue Search", "Search patients quickly by name or appointment time.")
        ]),
        ("PATIENT VITALS TRACKER", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Core Vitals Entry", "Record blood pressure, heart rate, temperature, and blood sugar."),
            ("Longitudinal Graphs", "Simple visual charts showing vitals changes over past visits."),
            ("Abnormal Vitals Warning", "Color alerts if vitals are high or abnormal (e.g. BP > 140/90)."),
            ("Direct Data Flow", "Vitals link directly to the AI risk engine for analysis.")
        ]),
        ("DIGITAL PRESCRIPTION (RX)", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Medicine Generator", "Add medicine name, dosage, frequency, and number of days."),
            ("Diet & Care Notes", "Add special instructions (e.g. 'Take after meals')."),
            ("Instant Patient Share", "Prescription instantly appears on patient's account portal."),
            ("Digital Record Storage", "Saves medication history permanently to avoid prescription errors.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m5_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide7, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide7, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide7.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 8: Module 6 — Explainable AI (XAI) Risk Support
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8)
    add_header(slide8, "Module 6", "Module 6: Explainable AI (XAI) & Clinical Risk Support", 8)

    m6_cards = [
        ("AI RISK PREDICTION ENGINE", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER, [
            ("Machine Learning Model", "Trained ML model analyzes patient health indicators."),
            ("Clinical Inputs", "Uses age, blood pressure, cholesterol, blood sugar, and ECG."),
            ("Risk Score Output", "Generates risk percentage and maps to LOW, MODERATE, or HIGH risk."),
            ("Early Warning", "Helps catch potential heart and chronic health risks early.")
        ]),
        ("SHAP EXPLANATION CHARTS", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Clear Factor Breakdown", "Shows exactly which factors increased or decreased health risk."),
            ("No 'Black Box' Secret", "Explains AI reasoning clearly so doctors can trust the output."),
            ("Visual Bar Graphs", "Easy-to-read charts showing factor impact (e.g. BP +25%, Age +10%)."),
            ("What-If Simulator", "Doctor can test how lowering BP or sugar reduces patient risk.")
        ]),
        ("DOCTOR SAFETY GUARDRAILS", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Doctor Always Decides", "AI gives advice ONLY — doctor makes final medical decision."),
            ("Safety Disclaimer", "Displays clear notice that AI is an assistant, not a doctor."),
            ("Doctor Note Required", "Doctor can accept or override AI advice with custom clinical notes."),
            ("AI Inference Logs", "Logs AI prediction history for audit and clinical safety checks.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m6_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide8, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide8, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide8.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 9: Module 7 — Hospital Administration & Operations
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9)
    add_header(slide9, "Module 7", "Module 7: Hospital Administration & Department Operations", 9)

    m7_cards = [
        ("DOCTOR APPROVAL SYSTEM", LIGHT_EMERALD_BG, ACCENT_EMERALD, EMERALD_BORDER, [
            ("Doctor Request Queue", "Admin reviews new doctor registration requests."),
            ("Department Assignment", "Verifies doctor medical license and sets department."),
            ("One-Click Approval", "Admin approves or rejects doctor account with notification."),
            ("Staff Roster Control", "Admin can activate, deactivate, or edit staff accounts.")
        ]),
        ("DEPARTMENT MANAGEMENT", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Department Hierarchy", "Organizes Cardiology, Neurology, Pediatrics, Orthopedics, etc."),
            ("Doctor Roster View", "Lists active doctors assigned to each clinical department."),
            ("Schedule Overview", "Monitors active consultation shifts across all departments."),
            ("Resource Balance", "Helps reassign doctors to busy departments when needed.")
        ]),
        ("OPERATIONAL ANALYTICS", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Daily Patient Footfall", "Tracks total patients visiting hospital per day and week."),
            ("Department Load Chart", "Visual charts showing appointment distribution per specialty."),
            ("Wait Time Analytics", "Measures average patient wait time from arrival to doctor visit."),
            ("Exportable Reports", "Download administrative and patient volume reports.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m7_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide9, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide9, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide9.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 10: Module 8 — Security, Data Privacy & Audit Logs
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10)
    add_header(slide10, "Module 8", "Module 8: Security Governance, Data Privacy & Audit Logging", 10)

    m8_cards = [
        ("PATIENT DATA PROTECTION", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER, [
            ("PHI Isolation", "Patient health records and vitals are kept isolated and secure."),
            ("Data Encryption", "Strong encryption used for stored data and network transmission."),
            ("No Password Leaks", "Password hashes and secret keys are never sent in API responses."),
            ("Role-Scoped Visibility", "Patients only see their own data; doctors see assigned patients.")
        ]),
        ("IMMUTABLE AUDIT LOGS", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Complete Event Logs", "Logs every record view, appointment edit, and prescription."),
            ("Detailed Log Info", "Records Who (User ID), What (Action), When (Time), and IP Address."),
            ("No Deletion Allowed", "Audit log entries cannot be modified or deleted by anyone."),
            ("Traceability", "Admin can track exact history of any data access event.")
        ]),
        ("HIPAA REGULATORY READINESS", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Technical Safeguards", "Meets standard healthcare privacy and access rules."),
            ("Auto Session Timeout", "Logs out idle users automatically to protect screen data."),
            ("Compliance Reports", "Generates security audit summary for administrative review."),
            ("System Reliability", "Ensures high system security and zero data loss.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(m8_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide10, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide10, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide10.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 11: Architecture & Technology Stack
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide11)
    add_header(slide11, "Technology Stack", "End-to-End System Architecture & Technology Stack", 11)

    flow_card = add_card(slide11, Inches(0.8), top_pos, Inches(11.733), Inches(0.85), bg_color=CARD_BG, border_color=TEAL_BORDER)
    tb_flow = slide11.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.12), Inches(11.333), Inches(0.6))
    tf_f = tb_flow.text_frame
    tf_f.word_wrap = True
    p = tf_f.paragraphs[0]
    p.text = "FRONTEND (React.js SPA)   ⇄ [RESTful API / JSON] ⇄   BACKEND (Django REST / FastAPI)\n                                                            ↳ [SQLAlchemy / ORM] ⇄ POSTGRESQL DB (ACID)\n                                                            ↳ [Scikit-Learn ML Engine] ⇄ SHAP EXPLAINER"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Consolas"
    p.font.size = Pt(9.8)
    p.font.bold = True
    p.font.color.rgb = DARK_TEAL

    stack_top = top_pos + Inches(1.05)
    stack_h = Inches(4.1)
    q_w = Inches(2.7)
    q_gap = Inches(0.31)

    layers = [
        ("FRONTEND TIER", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("React.js & Vite", "Fast user interface with smooth page navigation."),
            ("Vanilla CSS System", "Clean dual dark/light theme with glassmorphism design."),
            ("State Context", "Global Auth, Theme, and Notification state management."),
            ("Lucide Icons", "Modern clinical iconography for buttons and cards.")
        ]),
        ("BACKEND TIER", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Django REST / FastAPI", "High-performance Python backend API server."),
            ("JWT Token Auth", "Secure token generation, verification, and rotation."),
            ("OTP Email Service", "Generates 6-digit email OTP codes for validation."),
            ("Modular API Routes", "Separate routes for Auth, Appointments, EMR, and Admin.")
        ]),
        ("DATABASE TIER", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("PostgreSQL Database", "Reliable database storing users, appointments, and EMR."),
            ("ACID Transactions", "Guarantees zero double-booking and zero data loss."),
            ("Django ORM", "Type-safe database models and structured queries."),
            ("Auto Migrations", "Easy database schema updates and version control.")
        ]),
        ("AI DECISION TIER", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Scikit-Learn Models", "Cardiovascular risk triage machine learning model."),
            ("SHAP Explainability", "Calculates feature impact for clear risk explanation."),
            ("Biometric Analysis", "Evaluates blood pressure, sugar, age, and ECG."),
            ("What-If Engine", "Calculates risk change when patient vitals improve.")
        ])
    ]

    for idx, (l_title, l_bg, l_color, l_border, l_bullets) in enumerate(layers):
        l_left = Inches(0.8) + (q_w + q_gap) * idx
        add_card(slide11, l_left, stack_top, q_w, stack_h, bg_color=CARD_BG, border_color=l_border)
        add_pill(slide11, l_left + Inches(0.15), stack_top + Inches(0.18), q_w - Inches(0.3), Inches(0.4), l_title, l_bg, l_color, l_border, font_size=Pt(9))

        tb = slide11.shapes.add_textbox(l_left + Inches(0.15), stack_top + Inches(0.68), q_w - Inches(0.3), Inches(3.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_h, b_t) in enumerate(l_bullets):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"• {b_h}:"
            p.font.name = "Arial"
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(1)
            p2 = tf.add_paragraph()
            p2.text = f"  {b_t}"
            p2.font.name = "Arial"
            p2.font.size = Pt(8.8)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(7)

    # =========================================================================
    # SLIDE 12: Inter-Module Workflow & Patient Journey
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide12)
    add_header(slide12, "System Workflow", "End-to-End 8-Module Patient Care Journey", 12)

    steps = [
        ("PHASE 1: SIGNUP & SCHEDULE", [
            ("User Registration", "Module 1 creates user account with password hashing and email OTP."),
            ("Admin Approval", "Module 7 admin verifies doctor request and assigns department."),
            ("Doctor Shift Setup", "Module 3 doctor creates weekly work days and time slot duration.")
        ], LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER),
        ("PHASE 2: BOOKING & CHECK-IN", [
            ("Department Search", "Module 4 patient picks department, doctor, and date."),
            ("Slot Reservation", "Module 3 locks selected time slot and confirms booking."),
            ("Queue Arrival", "Doctor views patient arrival in Module 5 queue cockpit.")
        ], LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER),
        ("PHASE 3: CLINICAL VISIT & AI", [
            ("Vitals Entry", "Module 5 doctor records patient blood pressure, sugar, and heart rate."),
            ("AI Risk Analysis", "Module 6 AI predicts risk score and displays SHAP factor chart."),
            ("Digital Prescription", "Module 5 doctor creates digital prescription with dosage and notes.")
        ], LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER),
        ("PHASE 4: AUDIT & INSIGHTS", [
            ("Audit Trail Log", "Module 8 logs all visit edits and prescription creations safely."),
            ("Patient Access", "Module 4 patient views prescription and visit history on portal."),
            ("Hospital Analytics", "Module 7 updates daily patient count and department throughput.")
        ], LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER)
    ]

    for idx, (p_title, p_items, p_bg, p_color, p_border) in enumerate(steps):
        s_left = Inches(0.8) + (q_w + q_gap) * idx
        add_card(slide12, s_left, top_pos, q_w, card_h, bg_color=CARD_BG, border_color=p_border)
        add_pill(slide12, s_left + Inches(0.15), top_pos + Inches(0.2), q_w - Inches(0.3), Inches(0.42), p_title, p_bg, p_color, p_border, font_size=Pt(9))

        tb = slide12.shapes.add_textbox(s_left + Inches(0.15), top_pos + Inches(0.8), q_w - Inches(0.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (item_h, item_d) in enumerate(p_items):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"{i+1}. {item_h}:"
            p.font.name = "Arial"
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {item_d}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.2)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(10)

    # =========================================================================
    # SLIDE 13: System Benefits & Practical Impact
    # =========================================================================
    slide13 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide13)
    add_header(slide13, "System Benefits", "Practical Benefits & Real-World Healthcare Impact", 13)

    impact_cols = [
        ("FOR PATIENTS", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Easy Online Booking", "Book appointments 24/7 without waiting in hospital phone lines."),
            ("Zero Wait Uncertainty", "See exact appointment time slot and doctor availability."),
            ("Digital Health History", "Access all prescriptions and visit history anytime on phone/PC."),
            ("Clear Privacy Control", "Personal health data is protected and kept private.")
        ]),
        ("FOR DOCTORS", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Organized Queue", "Clear daily queue of patient visits with reason for visit."),
            ("Flexible Scheduling", "Easy control over working days, shift hours, and slot lengths."),
            ("Explainable AI Helper", "SHAP charts explain risk factors without replacing doctor judgment."),
            ("Fast Digital Prescriptions", "Create structured prescriptions in seconds.")
        ]),
        ("FOR HOSPITALS", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("No Double-Booking", "Database transactions guarantee zero conflicting appointments."),
            ("Better Staff Allocation", "Department analytics show busy hours and staff load."),
            ("Complete Audit Trail", "HIPAA-aligned event log tracks all user data access."),
            ("Paperless Operations", "Reduces physical paperwork and reception desk congestion.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(impact_cols):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide13, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide13, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide13.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"✓  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    # =========================================================================
    # SLIDE 14: Future Roadmap & Conclusion
    # =========================================================================
    slide14 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide14)
    add_header(slide14, "Roadmap & Conclusion", "Future Enhancements & Project Conclusion", 14)

    road_cards = [
        ("FUTURE ENHANCEMENTS", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Telemedicine Video Calls", "Add live video consultation between doctor and patient."),
            ("Lab Report Uploads", "Allow patients to upload PDF lab results directly to profile."),
            ("SMS Appointment Alerts", "Send automated SMS reminders before appointment time."),
            ("Multi-Language Support", "Add local language support for patient portal UI.")
        ]),
        ("PROJECT SUMMARY", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Clean 8-Module Design", "Organized separation of Auth, UI, Schedules, Care, AI & Security."),
            ("Modern Tech Stack", "React.js frontend, Django/FastAPI backend, PostgreSQL database."),
            ("Explainable AI", "Clear SHAP risk charts built to assist, not replace, doctors."),
            ("Production Ready", "High performance, responsive design, and strict security rules.")
        ]),
        ("THANK YOU & Q&A", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Thank You", "Thank you for your time and interest in MediFlow."),
            ("Questions & Answers", "We welcome any questions, suggestions, or feedback."),
            ("Live Demonstration", "System is active and ready for walkthrough."),
            ("MediFlow Platform", "Building smarter, safer, and simpler healthcare software.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(road_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide14, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide14, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide14.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        for i, (b_title, b_desc) in enumerate(bullet_list):
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"•  {b_title}:"
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_DARK
            p.space_after = Pt(2)
            p2 = tf.add_paragraph()
            p2.text = f"    {b_desc}"
            p2.font.name = "Arial"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_SUBTLE
            p2.space_after = Pt(8)

    try:
        prs.save(filename)
        print(f"Presentation saved successfully as '{filename}' ({total_slides} slides).")
    except PermissionError:
        alt_filename = "MediFlow_8_Modules_Deck.pptx"
        prs.save(alt_filename)
        print(f"Notice: '{filename}' was locked. Successfully saved presentation as '{alt_filename}' ({total_slides} slides).")

if __name__ == "__main__":
    create_deck()
