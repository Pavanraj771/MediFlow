import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(filename="MediFlow_Presentation.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    total_slides = 12

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
        
        # Subtle Top Accent Bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = PRIMARY_TEAL
        top_bar.line.fill.background()

    def add_header(slide, category, title, slide_num):
        # Category Tag
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

        # Title
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

        # Slide Number Badge (Top Right)
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

        # Bottom Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.08), Inches(11.733), Inches(0.28))
        tf = footer_box.text_frame
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = "MediFlow  •  Intelligent Healthcare Management & Clinical Decision Support System  •  6 Modular Architecture"
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

    def add_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # Standard positions
    top_pos = Inches(1.5)
    card_h = Inches(5.3)
    col3_w = Inches(3.7)
    col3_gap = Inches(0.31)
    half_w = Inches(5.7)
    half_gap = Inches(0.33)

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1)
    
    brand_card = add_card(slide1, Inches(0.8), Inches(1.15), Inches(11.733), Inches(5.5), bg_color=CARD_BG, border_color=TEAL_BORDER)

    add_pill(slide1, Inches(1.4), Inches(1.6), Inches(4.2), Inches(0.4), "ENTERPRISE HEALTHCARE SAAS & CLINICAL AI", LIGHT_TEAL_BG, DARK_TEAL, TEAL_BORDER)

    t_box = slide1.shapes.add_textbox(Inches(1.4), Inches(2.2), Inches(10.5), Inches(1.1))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MediFlow"
    p.font.name = "Arial"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_DARK

    sub_box = slide1.shapes.add_textbox(Inches(1.4), Inches(3.3), Inches(10.5), Inches(0.55))
    tf = sub_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Intelligent Healthcare Management & Clinical Decision Support System"
    p.font.name = "Arial"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_TEAL

    tag_box = slide1.shapes.add_textbox(Inches(1.4), Inches(3.95), Inches(10.5), Inches(0.5))
    tf = tag_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "A Complete 6-Module Full-Stack Architectural Division with Explainable AI & Regulatory Compliance"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_SUBTLE

    # Highlights row
    h_data = [
        ("ARCHITECTURE", "6 Decoupled Modules\nMicroservices-Ready", PRIMARY_TEAL),
        ("TECH STACK", "React.js • FastAPI\nPostgreSQL • Scikit-learn", ACCENT_BLUE),
        ("CLINICAL AI", "Explainable CDSS\nSHAP Attribution Engine", ACCENT_PURPLE),
        ("GOVERNANCE", "HIPAA-Aligned Privacy\nImmutable Audit Trails", ACCENT_AMBER)
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

    add_notes(slide1,
        "Welcome everyone. Today I am presenting MediFlow, an intelligent healthcare management and clinical decision support system. "
        "To ensure high maintainability, security, and scalability, this project is divided cleanly into 6 functional and technical modules. "
        "In this presentation, we will walk through each of these six modules, our underlying technology stack, clinical AI explainability, and enterprise architecture."
    )

    # =========================================================================
    # SLIDE 2: Executive Summary & The 6 Modular Breakdown
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2)
    add_header(slide2, "Project Modularization", "Executive Summary: Complete 6-Module Architectural Division", 2)

    mod_grid = [
        ("MODULE 1", "Identity, Authentication & RBAC", "Bcrypt hashing, stateless JWT authorization, multi-role security (Patient, Doctor, Admin).", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER),
        ("MODULE 2", "Doctor Scheduling & Appointments", "Dynamic slot generator, ACID conflict detection, patient self-service booking & cancellation.", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER),
        ("MODULE 3", "EMR & Clinical Consultation", "Doctor consultation cockpit, patient biometrics tracking, digital prescriptions & health history.", LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER),
        ("MODULE 4", "Explainable AI (XAI) Decision Support", "Supervised risk stratification, SHAP biometric factor attribution, What-If simulation & guardrails.", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER),
        ("MODULE 5", "Hospital Operations & Analytics", "Staff directory, department load balancing, live throughput metrics & executive dashboards.", LIGHT_EMERALD_BG, ACCENT_EMERALD, EMERALD_BORDER),
        ("MODULE 6", "Security Governance & Audit Trails", "PHI encryption, immutable access logs, regulatory compliance (HIPAA readiness) & audit reporting.", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER)
    ]

    gw = Inches(3.68)
    gh = Inches(2.5)
    ggap_x = Inches(0.34)
    ggap_y = Inches(0.3)
    start_y = Inches(1.5)

    for i, (m_badge, m_title, m_desc, m_bg, m_color, m_border) in enumerate(mod_grid):
        row = i // 3
        col = i % 3
        gx = Inches(0.8) + (gw + ggap_x) * col
        gy = start_y + (gh + ggap_y) * row
        
        c = add_card(slide2, gx, gy, gw, gh, bg_color=CARD_BG, border_color=m_border)
        
        # Pill header
        add_pill(slide2, gx + Inches(0.2), gy + Inches(0.2), Inches(1.3), Inches(0.35), m_badge, m_bg, m_color, m_border, font_size=Pt(9.5))

        tb = slide2.shapes.add_textbox(gx + Inches(0.2), gy + Inches(0.68), gw - Inches(0.4), Inches(1.7))
        tfe = tb.text_frame
        tfe.word_wrap = True
        tfe.margin_left = tfe.margin_top = tfe.margin_right = tfe.margin_bottom = 0
        p = tfe.paragraphs[0]
        p.text = m_title
        p.font.name = "Arial"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_DARK
        p.space_after = Pt(4)
        
        p2 = tfe.add_paragraph()
        p2.text = m_desc
        p2.font.name = "Arial"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_SUBTLE

    add_notes(slide2,
        "Here is the high-level division of the MediFlow platform into its 6 core modules. "
        "Module 1 handles Identity and Access Governance. Module 2 manages Doctor Scheduling and Appointment allocation. "
        "Module 3 covers Electronic Medical Records and Doctor Consultations. Module 4 delivers our Explainable AI Decision Support System. "
        "Module 5 provides Hospital Management Operations and Operational Analytics. And Module 6 enforces HIPAA-aligned Security, Data Privacy, and Audit Logging."
    )

    # =========================================================================
    # SLIDE 3: Module 1 — Identity, Authentication & RBAC
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3)
    add_header(slide3, "Core Module 1", "Module 1: Authentication, Identity & Role-Based Access Control (RBAC)", 3)

    m1_cards = [
        ("AUTHENTICATION ENGINE", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Bcrypt Salted Hashing", "Passwords hashed with 12 salt rounds before database persistence, preventing rainbow table attacks."),
            ("Stateless JWT Tokens", "Cryptographically signed JSON Web Tokens carrying user claims (sub, email, role, exp)."),
            ("Token Lifecycle & Refresh", "Short-lived access tokens (60 min) with refresh rotation to prevent session hijacking."),
            ("OAuth2 Bearer Scheme", "FastAPI OAuth2PasswordBearer flow for standardized API header transmission.")
        ]),
        ("GRANULAR ROLE MATRIX", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Patient Role (Self-Scope)", "Access only personal medical history, book appointments, and view personal prescriptions."),
            ("Doctor Role (Clinical-Scope)", "View assigned appointment queue, manage clinical consultations, vitals, and CDSS tools."),
            ("Admin Role (System-Scope)", "Manage hospital roster, oversee all departmental queues, inspect audit logs and analytics."),
            ("Least Privilege Principle", "Strict zero-trust access boundaries enforced at both frontend and backend layers.")
        ]),
        ("SECURITY ENFORCEMENT", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("FastAPI Route Guards", "Declarative Depends(get_current_active_user) and role-checking dependencies on endpoints."),
            ("React Protected Routes", "Client-side route guards redirect unauthorized navigation immediately to login."),
            ("Session Invalidation", "One-click logout invalidates client tokens and terminates active browser storage."),
            ("Payload Sanitization", "Pydantic v2 schemas rigorously sanitize and validate all login and registration payloads.")
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

    add_notes(slide3,
        "Module 1 is our foundation for security and identity. It utilizes Bcrypt with 12 rounds for password hashing and issues stateless JWT tokens. "
        "A strict Role-Based Access Control matrix distinguishes Patients, Doctors, and Hospital Admins. Every API route is guarded by FastAPI dependencies, "
        "while React client routes are protected to prevent unauthorized URL access."
    )

    # =========================================================================
    # SLIDE 4: Module 2 — Doctor Schedule & Appointment Management
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4)
    add_header(slide4, "Core Module 2", "Module 2: Dynamic Doctor Scheduling & Appointment Management", 4)

    m2_cards = [
        ("SCHEDULE CONFIGURATION", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Configurable Slot Generator", "Doctors configure working days, shift hours (e.g. 09:00 - 17:00), and slot durations (default 30 mins)."),
            ("Break & Leave Management", "Doctors can block out lunch hours, emergency slots, or leave periods dynamically."),
            ("Real-Time Slot Engine", "System dynamically computes available bookable slots excluding booked or blocked slots."),
            ("Multi-Doctor Filtering", "Patients filter slots by department (Cardiology, Neurology, General Medicine), date, and doctor.")
        ]),
        ("TRANSACTIONAL BOOKING", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("ACID Conflict Prevention", "PostgreSQL serializable isolation and unique composite constraints eliminate double-booking."),
            ("Instant Booking Confirmation", "Patients confirm slot in one click with instant status change from Available to Booked."),
            ("Cancellation & Rescheduling", "Patients or doctors can cancel/reschedule with automatic status updates and queue rebalancing."),
            ("No-Show Reduction Alerts", "Pre-appointment notification badges alert patients to upcoming visit times.")
        ]),
        ("STATUS LIFECYCLE ENGINE", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("State Machine Logic", "Appointments progress through: SCHEDULED → IN_PROGRESS → COMPLETED or CANCELLED."),
            ("Queue Check-In Cockpit", "Doctors mark patient arrival, triggering real-time wait-room updates."),
            ("Historical Appointment Logs", "Complete historical logs of past, completed, and missed visits for both patient and clinician."),
            ("Concurrent Load Handling", "Handles concurrent booking requests smoothly without race conditions.")
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

    add_notes(slide4,
        "Module 2 is our scheduling and appointment engine. It enables clinicians to configure shift hours and automatically generates 30-minute booking slots. "
        "By enforcing PostgreSQL transactional integrity, we completely eliminate double-booking conflicts. Patients can view open slots, filter by doctor specialty, "
        "and seamlessly book or reschedule appointments while doctors manage their queue through a state machine."
    )

    # =========================================================================
    # SLIDE 5: Module 3 — Electronic Medical Records (EMR) & Clinical Consultation
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5)
    add_header(slide5, "Core Module 3", "Module 3: Electronic Medical Records (EMR) & Clinical Consultation Cockpit", 5)

    m3_cards = [
        ("CLINICAL CONSULTATION", LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER, [
            ("Structured Clinical Notes", "Doctor inputs Chief Complaints, Clinical Observations, Differential Diagnosis, and Treatment Plan."),
            ("ICD-Aligned Categorization", "Standardized diagnostic classifications for accurate medical coding and disease categorization."),
            ("Consultation Status Flow", "Seamless transition from active consultation to finalized medical report."),
            ("Historical Context Access", "Doctors can review previous visits and prescriptions during the ongoing consultation.")
        ]),
        ("BIOMETRIC VITALS TRACKER", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Core Biometrics Ingestion", "Records Systolic/Diastolic BP, Heart Rate, Fasting Blood Sugar, BMI, Body Temp, and SpO2."),
            ("Visual Longitudinal Trends", "Interactive Recharts line graphs show vital changes across historical patient visits."),
            ("Abnormal Vitals Alerts", "Immediate color-coded warnings if biometric values exceed clinical thresholds (e.g. BP > 140/90)."),
            ("Direct CDSS Pipeline", "Vitals entered here seamlessly flow into the Machine Learning engine for risk calculation.")
        ]),
        ("DIGITAL PRESCRIPTIONS (RX)", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Itemized Rx Generator", "Captures medication name, dosage (mg/ml), frequency (e.g. 1-0-1), route, and duration in days."),
            ("Special Instructions", "Configures specific dietary instructions (e.g., 'Take after food', 'Avoid dairy')."),
            ("Patient Timeline Delivery", "Prescriptions instantly appear on the patient's personal portal for download/viewing."),
            ("Historical Preservation", "Immutable digital archive of past medications prevents dangerous polypharmacy errors.")
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

    add_notes(slide5,
        "Module 3 represents the core clinical workstation for healthcare providers. Here doctors conduct consultations, document diagnoses, and record patient vitals. "
        "The system plots longitudinal vital trends using Recharts and enables doctors to generate itemized digital prescriptions with clear dosages and schedules. "
        "All data is tied directly to the patient's health record, giving patients permanent access on their own portal."
    )

    # =========================================================================
    # SLIDE 6: Module 4 — Explainable AI (XAI) & Clinical Decision Support
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6)
    add_header(slide6, "Core Module 4", "Module 4: Explainable AI (XAI) & Clinical Decision Support System (CDSS)", 6)

    m4_cards = [
        ("PREDICTIVE RISK ENGINE", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Validated ML Classifier", "Calibrated Ensemble / Random Forest model trained on clinical cardiovascular biometrics."),
            ("Key Biomarker Inputs", "Age, Sex, Resting BP, Serum Cholesterol, Fasting Blood Sugar, Resting ECG, Max HR, Angina."),
            ("Triage Categorization", "Predicts continuous risk score (0.0 to 1.0) and maps to LOW, MODERATE, or HIGH risk categories."),
            ("High Sensitivity Tuning", "Optimized recall to minimize false negatives, ensuring potential chronic risks are caught early.")
        ]),
        ("SHAP EXPLAINABILITY (XAI)", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("SHapley Additive exPlanations", "Decomposes complex machine learning prediction into transparent feature contribution scores."),
            ("Doctor-Facing Visuals", "Waterfall and bar indicators showing exactly which biometrics elevated risk (e.g. BP +24%, Age +15%)."),
            ("Eliminating 'Black Box'", "Provides clinicians with actionable mathematical rationale rather than ungrounded predictions."),
            ("Interactive 'What-If' Sim", "Doctor can adjust variables (e.g. lowering BP to 120) to demonstrate preventative health gains.")
        ]),
        ("CLINICAL GUARDRAILS", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER, [
            ("Strict Advisory Disclaimer", "Prominently displays: CDSS outputs are assistive recommendations, NEVER definitive diagnoses."),
            ("Human-in-the-Loop", "Only authenticated physicians can trigger and review AI outputs; predictions are never auto-finalized."),
            ("Clinician Override", "Doctors can accept, modify, or disregard AI recommendations with mandatory clinical rationale notes."),
            ("Model Audit Logging", "Every ML inference event is logged with inputs, outputs, and timestamp for clinical safety audits.")
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

    add_notes(slide6,
        "Module 4 sets MediFlow apart from traditional hospital management software. We integrate an Explainable AI Clinical Decision Support System. "
        "Instead of acting as a mysterious black box, our model uses SHAP values to attribute risk to specific biomarkers like elevated blood pressure or cholesterol. "
        "Doctors can run 'What-If' simulations to show patients how lifestyle interventions reduce risk. Strict ethical guardrails ensure that clinicians always retain ultimate decision authority."
    )

    # =========================================================================
    # SLIDE 7: Module 5 — Hospital Administration & Operational Analytics
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7)
    add_header(slide7, "Core Module 5", "Module 5: Hospital Administration, Department Operations & Analytics", 7)

    m5_cards = [
        ("STAFF & ROSTER MANAGEMENT", LIGHT_EMERALD_BG, ACCENT_EMERALD, EMERALD_BORDER, [
            ("Clinician Onboarding", "Administrators verify physician credentials, medical licenses, and assign hospital departments."),
            ("Department Hierarchy", "Organize clinical units (Cardiology, Orthopedics, Pediatrics, Neurology, Emergency)."),
            ("Doctor Shift Allocation", "Oversee doctor active hours, consultation room allocations, and clinic availability."),
            ("User Deactivation & Edits", "Instant revocation of clinical staff accounts upon departure or department transfer.")
        ]),
        ("OPERATIONAL ANALYTICS", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Patient Footfall Metrics", "Tracks daily, weekly, and monthly consultation volumes and peak arrival windows."),
            ("Department Load Factors", "Visualizes appointment distribution across departments to balance physician workloads."),
            ("Wait Time & Throughput", "Monitors average wait time from check-in to consultation completion."),
            ("Cancellation Tracking", "Analyzes appointment cancellation and no-show rates to optimize hospital capacity.")
        ]),
        ("EXECUTIVE DASHBOARDS", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Interactive Visual KPIs", "Executive dashboard powered by responsive charts showing revenue, visits, and capacity."),
            ("Exportable Reports", "Generate aggregated administrative and clinical operations reports in CSV / PDF."),
            ("Resource Optimization", "Identify underutilized specialty slots and reassign consultation resources efficiently."),
            ("Hospital System Health", "Live indicators on active API latencies, active user counts, and database connection status.")
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

    add_notes(slide7,
        "Module 5 empowers hospital administrators and chief medical officers with operational intelligence. Administrators can manage the hospital staff directory, "
        "assign departments, and configure physician rosters. Simultaneously, operational dashboards track patient throughput, department load balancing, and wait times, "
        "transforming raw operational data into actionable healthcare insights."
    )

    # =========================================================================
    # SLIDE 8: Module 6 — Security Governance, HIPAA & Immutable Audit
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8)
    add_header(slide8, "Core Module 6", "Module 6: Security Governance, HIPAA Compliance & Immutable Audit Logging", 8)

    m6_cards = [
        ("DATA PROTECTION & PRIVACY", LIGHT_ROSE_BG, ACCENT_ROSE, ROSE_BORDER, [
            ("Protected Health Info (PHI)", "Patient clinical records, vitals, and diagnostic findings are isolated and access-restricted."),
            ("Encryption Standards", "AES-256 encryption at rest for sensitive data and mandatory TLS 1.3 encryption in transit."),
            ("Zero Data Leakage", "Strict serialization schemas prevent accidental leakage of password hashes or internal IDs in responses."),
            ("Role-Scoped Filtering", "Patients cannot query other patient records; clinicians only query patients in their clinical care.")
        ]),
        ("IMMUTABLE AUDIT LOGGING", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Comprehensive Event Capture", "Logs every read, write, modification, or cancellation of Protected Health Information."),
            ("Audit Metadata Schema", "Records Actor ID, Action Type (VIEW, CREATE, UPDATE, DELETE), Resource, Client IP, and Timestamp."),
            ("Append-Only Integrity", "Audit table is strictly append-only; update and delete operations are prohibited at database level."),
            ("Forensic Traceability", "Hospital compliance officers can investigate any data access anomaly with complete chronological precision.")
        ]),
        ("HIPAA REGULATORY READINESS", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("Security Rule Compliance", "Implements technical safeguards, unique user identification, and automatic session logoff."),
            ("Privacy Rule Controls", "Enforces minimum necessary data disclosure standards across all patient interactions."),
            ("Compliance Audit Export", "Administrators can export verified compliance audit reports during regulatory reviews."),
            ("System Integrity Checks", "Continuous logging ensures high accountability and transparency across all hospital departments.")
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

    add_notes(slide8,
        "Module 6 addresses the non-negotiable requirement of healthcare IT: Regulatory compliance and patient data privacy. "
        "In compliance with HIPAA technical safeguards, all Protected Health Information is encrypted and protected by strict scoping. "
        "Furthermore, MediFlow implements an immutable, append-only audit trail that permanently captures who accessed what record, from what IP address, "
        "and at what exact second, ensuring total forensic accountability."
    )

    # =========================================================================
    # SLIDE 9: System Architecture & Technology Stack
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9)
    add_header(slide9, "System Architecture", "End-to-End Technology Stack & Multi-Tier Architecture", 9)

    flow_card = add_card(slide9, Inches(0.8), top_pos, Inches(11.733), Inches(0.85), bg_color=CARD_BG, border_color=TEAL_BORDER)
    tb_flow = slide9.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.12), Inches(11.333), Inches(0.6))
    tf_f = tb_flow.text_frame
    tf_f.word_wrap = True
    p = tf_f.paragraphs[0]
    p.text = "CLIENT TIER (React SPA)   ⇄ [RESTful JSON API] ⇄   APPLICATION TIER (FastAPI)\n                                                            ↳ [SQLAlchemy 2.0] ⇄ POSTGRESQL DB (ACID)\n                                                            ↳ [NumPy / Joblib] ⇄ SCIKIT-LEARN + SHAP ENGINE"
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
        ("PRESENTATION TIER", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("React.js & Vite", "Fast, modular SPA with blazing Hot Module Replacement."),
            ("Tailwind CSS", "Custom clinical design system with teal/slate color tokens."),
            ("State & Context", "Global Auth, Notification, and Theme Context providers."),
            ("Recharts Visuals", "Interactive charts for vital tracking & throughput analytics.")
        ]),
        ("APPLICATION TIER", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("FastAPI Engine", "Asynchronous, high-performance Python web framework."),
            ("Pydantic v2 Models", "Rigorous schema validation and automatic OpenAPI docs."),
            ("JWT & Bcrypt Auth", "Stateless bearer token authentication and RBAC guards."),
            ("Modular Routers", "Dedicated routers for Auth, Appointments, EMR, CDSS, Admin.")
        ]),
        ("PERSISTENCE TIER", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("PostgreSQL 15+", "Relational database with strict ACID transaction guarantees."),
            ("SQLAlchemy 2.0 ORM", "Type-safe database models with relational cascades."),
            ("Alembic Migrations", "Automated version control for evolving database schemas."),
            ("Data Integrity", "Foreign key constraints and unique composite indexes.")
        ]),
        ("DECISION-SUPPORT TIER", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Scikit-Learn ML", "Ensemble classifiers trained on clinical biometrics."),
            ("SHAP Explainability", "Mathematical feature attribution for transparent risk scores."),
            ("NumPy & Pandas", "High-speed data vectorization and preprocessing."),
            ("Simulated Analytics", "Real-time 'What-If' sensitivity inference service.")
        ])
    ]

    for idx, (l_title, l_bg, l_color, l_border, l_bullets) in enumerate(layers):
        l_left = Inches(0.8) + (q_w + q_gap) * idx
        add_card(slide9, l_left, stack_top, q_w, stack_h, bg_color=CARD_BG, border_color=l_border)
        add_pill(slide9, l_left + Inches(0.15), stack_top + Inches(0.18), q_w - Inches(0.3), Inches(0.4), l_title, l_bg, l_color, l_border, font_size=Pt(9))

        tb = slide9.shapes.add_textbox(l_left + Inches(0.15), stack_top + Inches(0.68), q_w - Inches(0.3), Inches(3.2))
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

    add_notes(slide9,
        "Slide 9 displays our comprehensive multi-tier architecture. On the client side, React and Tailwind CSS provide a responsive interface. "
        "The application tier is powered by FastAPI, ensuring high-throughput asynchronous request handling. "
        "The persistence layer utilizes PostgreSQL for relational integrity and ACID compliance, while our Decision Support tier executes Scikit-learn and SHAP inference asynchronously."
    )

    # =========================================================================
    # SLIDE 10: Inter-Module Workflow & Patient-Clinician Lifecycle
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10)
    add_header(slide10, "System Workflow", "End-to-End Inter-Module Workflow & Operational Lifecycle", 10)

    steps = [
        ("PHASE 1: ACCESS & ONBOARDING", [
            ("User Registration", "Module 1 validates credentials, hashes password with Bcrypt, assigns role."),
            ("Doctor Shift Setup", "Module 2 generates open 30-min booking slots according to doctor's weekly roster."),
            ("Roster Authorization", "Module 5 administrator verifies credentials and approves department access.")
        ], LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER),
        ("PHASE 2: APPOINTMENT LIFECYCLE", [
            ("Department Search", "Patient searches doctors by specialty, selects date and available slot."),
            ("Transactional Booking", "Module 2 locks slot in PostgreSQL, updates status to SCHEDULED."),
            ("Queue Check-In", "Patient arrives; doctor marks status as IN_PROGRESS in clinical cockpit.")
        ], LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER),
        ("PHASE 3: CLINICAL CONSULTATION", [
            ("Biometrics Capture", "Doctor inputs patient vitals (BP, glucose, heart rate) into Module 3 EMR."),
            ("Explainable CDSS", "Module 4 calculates risk score and displays SHAP attribution factors."),
            ("Digital Prescription", "Doctor generates itemized prescription with dosage, frequency, and instructions.")
        ], LIGHT_PURPLE_BG, ACCENT_PURPLE, PURPLE_BORDER),
        ("PHASE 4: AUDIT & INTELLIGENCE", [
            ("Audit Logging", "Module 6 logs all record views, consultation edits, and prescriptions immutably."),
            ("Patient Access", "Patient views consultation notes and downloads digital Rx from timeline."),
            ("Hospital Analytics", "Module 5 updates daily patient volume, wait times, and department throughput.")
        ], LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER)
    ]

    for idx, (p_title, p_items, p_bg, p_color, p_border) in enumerate(steps):
        s_left = Inches(0.8) + (q_w + q_gap) * idx
        add_card(slide10, s_left, top_pos, q_w, card_h, bg_color=CARD_BG, border_color=p_border)
        add_pill(slide10, s_left + Inches(0.15), top_pos + Inches(0.2), q_w - Inches(0.3), Inches(0.42), p_title, p_bg, p_color, p_border, font_size=Pt(9))

        tb = slide10.shapes.add_textbox(s_left + Inches(0.15), top_pos + Inches(0.8), q_w - Inches(0.3), Inches(4.1))
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

    add_notes(slide10,
        "Slide 10 details how all 6 modules interact across an end-to-end patient journey. In Phase 1, Identity and Scheduling initialize the system. "
        "In Phase 2, the patient books a conflict-free slot. In Phase 3, the clinician enters vitals in EMR, invokes the Explainable AI Decision Support System, "
        "and prescribes medication. In Phase 4, the audit log records the activity while the hospital dashboard updates operational metrics."
    )

    # =========================================================================
    # SLIDE 11: Clinical Impact & System Benefits
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide11)
    add_header(slide11, "Value & Impact", "Clinical Impact, Performance Benchmarks & Hospital ROI", 11)

    impact_cols = [
        ("OPERATIONAL EFFICIENCY", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("60% Less Paperwork", "Eliminates physical prescription slips and manual appointment registers entirely."),
            ("Zero Double-Booking", "ACID transactional locks eliminate conflicting patient appointments completely."),
            ("40% Faster Check-In", "Self-service online booking reduces reception desk queues significantly."),
            ("Automated Hand-offs", "Immediate transmission of digital consultation notes between departments.")
        ]),
        ("CLINICAL DECISION AID", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Early Triage Detection", "Identifies hidden cardiovascular risk factors during routine outpatient checkups."),
            ("Transparent Reasoning", "SHAP feature attributions build clinician trust in AI assistive scores."),
            ("Preventative Counseling", "'What-If' simulations help doctors visually demonstrate the benefits of lifestyle changes."),
            ("Zero Diagnostic Substitution", "Strict ethical guardrails prevent unauthorized automated diagnoses.")
        ]),
        ("ENTERPRISE READINESS", LIGHT_AMBER_BG, ACCENT_AMBER, AMBER_BORDER, [
            ("Sub-250ms API Latency", "High-throughput asynchronous FastAPI routes ensure responsive user interactions."),
            ("100% Audit Coverage", "Complete HIPAA-aligned logging of every access to Protected Health Information."),
            ("Scalable Architecture", "Decoupled 6-module architecture easily transitions into distributed microservices."),
            ("Reliable Data Modeling", "PostgreSQL ensures zero orphaned medical records or corrupted histories.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(impact_cols):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide11, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide11, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide11.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
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

    add_notes(slide11,
        "The impact of MediFlow is measurable across three key dimensions: Operational Efficiency, Clinical Quality, and Enterprise Governance. "
        "Operationally, we achieve up to a 60% reduction in administrative paperwork and 100% elimination of double-booking. "
        "Clinically, doctors gain explainable AI risk assessments that empower preventative patient care while respecting clinical judgment. "
        "And technically, our sub-250ms API response latency and complete audit trail ensure regulatory readiness."
    )

    # =========================================================================
    # SLIDE 12: Future Roadmap & Project Conclusion
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide12)
    add_header(slide12, "Roadmap & Conclusion", "Technological Roadmap & Project Conclusion", 12)

    road_cards = [
        ("FUTURE ROADMAP", LIGHT_BLUE_BG, ACCENT_BLUE, BLUE_BORDER, [
            ("Deep Learning Imaging", "Expand CDSS with PyTorch ResNet models for chest X-ray and CT-scan triage."),
            ("Clinical NLP Extraction", "Utilize BioBERT to parse unstructured PDF lab reports into structured EMR data."),
            ("FHIR / HL7 Interoperability", "Integrate with legacy hospital EHRs using standard healthcare interoperability protocols."),
            ("Telemedicine Video Engine", "Embed secure WebRTC video consultations directly into the doctor-patient interface.")
        ]),
        ("PROJECT SUMMARY", LIGHT_TEAL_BG, PRIMARY_TEAL, TEAL_BORDER, [
            ("6 Robust Modules", "Clean separation of Identity, Scheduling, EMR, CDSS, Operations, and Governance."),
            ("Full-Stack Modern Stack", "React.js frontend, FastAPI backend, PostgreSQL database, Scikit-learn AI."),
            ("Explainable by Design", "Transparent SHAP biometric attribution solves the AI 'black box' challenge."),
            ("Production-Grade Design", "Adheres to enterprise security patterns, ACID guarantees, and responsive UI.")
        ]),
        ("Q&A & DISCUSSION", RGBColor(241, 245, 249), PRIMARY_DARK, CARD_BORDER, [
            ("Thank You", "Thank you for your time and engagement."),
            ("Open Discussion", "Questions, technical demonstrations, and feedback are welcome."),
            ("Repository Deliverables", "Full source code, interactive presentation deck, and comprehensive README documentation."),
            ("System Ready", "MediFlow is engineered for modern, resilient healthcare delivery.")
        ])
    ]

    for idx, (c_title, bg_c, tag_c, b_col, bullet_list) in enumerate(road_cards):
        left_pos = Inches(0.8) + (col3_w + col3_gap) * idx
        add_card(slide12, left_pos, top_pos, col3_w, card_h, bg_color=CARD_BG, border_color=b_col)
        add_pill(slide12, left_pos + Inches(0.2), top_pos + Inches(0.25), Inches(3.3), Inches(0.42), c_title, bg_c, tag_c, b_col)

        tb = slide12.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.85), Inches(3.3), Inches(4.1))
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

    add_notes(slide12,
        "In conclusion, MediFlow delivers a comprehensive, modern healthcare ecosystem divided into 6 cohesive modules. "
        "It eliminates administrative chaos, guarantees slot consistency, empowers doctors with explainable clinical AI, and safeguards patient data. "
        "Our roadmap points toward deep learning image analysis and FHIR interoperability. Thank you very much, and I look forward to any questions or discussion."
    )

    try:
        prs.save(filename)
        print(f"Presentation saved successfully as '{filename}' ({total_slides} slides).")
    except PermissionError:
        alt_filename = "MediFlow_6_Modules_Presentation.pptx"
        prs.save(alt_filename)
        print(f"Notice: '{filename}' was locked/open in PowerPoint. Successfully saved presentation as '{alt_filename}' ({total_slides} slides).")

if __name__ == "__main__":
    create_deck()
