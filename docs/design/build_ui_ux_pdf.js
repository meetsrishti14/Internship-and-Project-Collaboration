const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = __dirname;
const screensDir = path.join(baseDir, 'screens');

function getBase64(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return '';
  }
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace('.', '');
  return `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${data.toString('base64')}`;
}

const screen1 = getBase64(path.join(screensDir, '01_login_screen.png'));
const screen2 = getBase64(path.join(screensDir, '02_student_dashboard.png'));
const screen3 = getBase64(path.join(screensDir, '03_browse_internships.png'));
const screen4 = getBase64(path.join(screensDir, '04_project_collaboration.png'));
const screen5 = getBase64(path.join(screensDir, '05_student_profile.png'));
const screen6 = getBase64(path.join(screensDir, '06_faculty_dashboard.png'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UI/UX Design &amp; Architecture Report - Internship and Project Collaboration</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 11pt;
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      position: relative;
      height: 269mm;
      max-height: 269mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .content-wrap {
      flex: 1;
    }

    /* HEADER */
    .doc-header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 6px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-header .title-area h1 {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 15pt;
      font-weight: bold;
      color: #1e3a8a;
      letter-spacing: -0.2px;
      margin-bottom: 2px;
    }

    .doc-header .title-area .subtitle {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 9.5pt;
      font-weight: bold;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-header .meta-area {
      font-family: 'Times New Roman', Times, serif !important;
      text-align: right;
      font-size: 8.5pt;
      color: #374151;
      line-height: 1.3;
    }

    /* FOOTER */
    .doc-footer {
      border-top: 1px solid #9ca3af;
      padding-top: 5px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #4b5563;
      font-family: 'Times New Roman', Times, serif !important;
    }

    h2 {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 13pt;
      font-weight: bold;
      color: #1e3a8a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    h3 {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 11pt;
      font-weight: bold;
      color: #1f2937;
      margin-top: 7px;
      margin-bottom: 4px;
    }

    p {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 10pt;
      margin-bottom: 7px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 7px;
      font-size: 9.8pt;
    }

    li {
      margin-bottom: 3px;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 10px 0;
      font-size: 9pt;
      font-family: 'Times New Roman', Times, serif !important;
    }

    th, td {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* SCREEN EMBED CARD */
    .screen-container {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px;
      background: #ffffff;
      margin-bottom: 8px;
    }

    .screen-img {
      width: 100%;
      max-height: 120mm;
      object-fit: contain;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
      display: block;
      margin: 0 auto;
    }

    .screen-caption {
      font-size: 8.8pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 4px;
      text-align: center;
    }

    .screen-desc-box {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 5px 8px;
      margin-top: 4px;
      font-size: 8.8pt;
    }

    .callout {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      padding: 6px 10px;
      border-radius: 3px;
      margin: 6px 0;
      font-size: 9pt;
    }

    .badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 7.5pt;
      font-weight: bold;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>

  <!-- =========================================================================
       PAGE 1: TITLE & EXECUTIVE OVERVIEW
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Internship &amp; Project Collaboration Platform</h1>
          <div class="subtitle">UI/UX Design, Applied Principles &amp; Architecture Report</div>
        </div>
        <div class="meta-area">
          <div><strong>Authors:</strong> Srishti Jain (24BRS1412) &bull; Aakriti Chadha (24BAI1066)</div>
          <div><strong>Course:</strong> Software Engineering &bull; DA-2</div>
          <div><strong>Font Standard:</strong> Times New Roman</div>
        </div>
      </div>

      <h2>1. Project Overview &amp; UI/UX System Architecture</h2>
      <p>
        The <strong>Internship and Project Collaboration</strong> platform is a centralized, role-based web application engineered to bridge students, faculty mentors, and hiring organizations. It streamlines opportunity discovery, multi-disciplinary capstone collaboration, milestone evaluation, and talent portfolio management.
      </p>

      <div class="callout">
        <strong>Report Objectives &amp; Scope:</strong> This document provides the formal software engineering and UI/UX report for Digital Assignment 2 (DA-2). It encompasses all 6 high-fidelity Figma UI screens, a detailed breakdown of <strong>Applied Design Principles</strong> (<em>Abstraction, Modularity, High Cohesion, Low Coupling</em>), and an analytical justification of <strong>5 Key Design Decisions</strong>.
      </div>

      <h3>1.1 User Personas &amp; System Access Tiers</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Role / Persona</th>
            <th style="width: 40%;">Primary Capabilities &amp; Workflows</th>
            <th style="width: 40%;">Assigned UI Screens &amp; Views</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Student</strong></td>
            <td>Explore verified internships, apply via 1-click workflows, manage capstone Kanban sprint tasks, track ATS resume score, and collaborate with peers.</td>
            <td>Screen 01 (Auth), Screen 02 (Dashboard), Screen 03 (Internships), Screen 04 (Projects), Screen 05 (Profile).</td>
          </tr>
          <tr>
            <td><strong>Faculty / Mentor</strong></td>
            <td>Supervise student capstones, review uploaded architecture documents, grade milestones (Approve / Request Revision), and monitor class velocity.</td>
            <td>Screen 01 (Auth), Screen 06 (Faculty Supervision Dashboard), Review &amp; Grading Modal.</td>
          </tr>
          <tr>
            <td><strong>Recruiter / Org</strong></td>
            <td>Post verified opportunities, filter applicant pools by verified skills and GPA, review candidate portfolios, and manage candidate pipelines.</td>
            <td>Screen 01 (Auth), Screen 03 (Talent &amp; Opportunity Matcher).</td>
          </tr>
        </tbody>
      </table>

      <h3>1.2 Client UI Architecture &amp; Layering</h3>
      <p>
        The front-end is architected as a lightweight, high-performance <strong>Single-Page Application (SPA)</strong>. The system separates concerns into three decoupled tiers:
      </p>
      <ul>
        <li><strong>Presentation Layer:</strong> Modular HTML5 semantic views styled with semantic CSS design tokens.</li>
        <li><strong>Abstraction &amp; Event Bus Layer:</strong> Decoupled pub/sub event dispatcher (<code>EventBus</code>), centralized state repository (<code>AppStore</code>), declarative client-side route manager (<code>NavigationRouter</code>), and toast notification service (<code>NotificationService</code>).</li>
        <li><strong>Data &amp; Entity Layer:</strong> High-cohesion domain repositories for Users, Internships, Capstone Projects, and Faculty Evaluation Queues.</li>
      </ul>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 1 of 6</span>
    </div>
  </div>

  <!-- =========================================================================
       PAGE 2: FIGMA SCREENS 01 & 02
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>2. High-Fidelity UI Screens (Screens 01 &amp; 02)</h1>
          <div class="subtitle">Authentication, Role Selection &amp; Student Dashboard</div>
        </div>
        <div class="meta-area">
          <div><strong>Student:</strong> Srishti Jain (24BRS1412)</div>
          <div><strong>Format:</strong> High-Resolution 1920&times;1080 Mockups</div>
        </div>
      </div>

      <!-- Screen 1 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 01 &bull; Secure Authentication &amp; Institutional Role Selector</div>
        <img class="screen-img" src="${screen1}" alt="Screen 01: Login">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> Modern SaaS split-screen layout with dark mesh branding; dynamic 3-role toggle (Student / Faculty / Recruiter); institutional University Single Sign-On (SSO) button; floating inputs; ISO 27001 trust indicator.
        </div>
      </div>

      <!-- Screen 2 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 02 &bull; Student Dashboard &amp; Opportunity Recommendation Hub</div>
        <img class="screen-img" src="${screen2}" alt="Screen 02: Dashboard">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> Global header with &#8984;K search palette; 4 primary KPI metrics (Active Applications, Projects, Profile Views +28%, Mentor Score 4.9/5); personalized greeting; recommended internship cards with stipend tags; active capstone progress meters.
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 2 of 6</span>
    </div>
  </div>

  <!-- =========================================================================
       PAGE 3: FIGMA SCREENS 03 & 04
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>2. High-Fidelity UI Screens (Screens 03 &amp; 04)</h1>
          <div class="subtitle">Browse Internships &amp; Project Collaboration Workspace</div>
        </div>
        <div class="meta-area">
          <div><strong>Student:</strong> Srishti Jain (24BRS1412)</div>
          <div><strong>Format:</strong> High-Resolution 1920&times;1080 Mockups</div>
        </div>
      </div>

      <!-- Screen 3 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 03 &bull; Browse Internships &amp; Faceted Multi-Tag Filtering</div>
        <img class="screen-img" src="${screen3}" alt="Screen 03: Browse Internships">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> Sticky multi-tag search bar (Location, Work Type, Tech Stack, Duration, Stipend range); 6 rich opportunity cards featuring company logos, verified badges, stipend badges (&#8377;12k - &#8377;25k/mo), applicant counters, and 1-click modal application drawer.
        </div>
      </div>

      <!-- Screen 4 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 04 &bull; Project Collaboration Workspace &amp; Sprint Kanban</div>
        <img class="screen-img" src="${screen4}" alt="Screen 04: Project Collaboration">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> 4 Kanban milestone sprint cards (AI Resume Builder, Placement Tracker, Event Hub, Smart Campus IoT); interactive milestone checklists (8/10 Done); scheduled Google Meet syncs; assigned mentor badges; real-time team activity feed.
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 3 of 6</span>
    </div>
  </div>

  <!-- =========================================================================
       PAGE 4: FIGMA SCREENS 05 & 06
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>2. High-Fidelity UI Screens (Screens 05 &amp; 06)</h1>
          <div class="subtitle">Student Profile Portfolio &amp; Faculty Supervision Dashboard</div>
        </div>
        <div class="meta-area">
          <div><strong>Student:</strong> Srishti Jain (24BRS1412)</div>
          <div><strong>Format:</strong> High-Resolution 1920&times;1080 Mockups</div>
        </div>
      </div>

      <!-- Screen 5 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 05 &bull; Student Profile, Skill Matrix &amp; ATS Resume Portfolio</div>
        <img class="screen-img" src="${screen5}" alt="Screen 05: Student Profile">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> Gradient cover banner with verified avatar; academic information grid (B.Tech CSE, CGPA 8.42/10.0); categorized technical skills matrix; ATS 94% verified resume manager with upload/download; 3-stage visual application pipeline tracker.
        </div>
      </div>

      <!-- Screen 6 -->
      <div class="screen-container">
        <div class="screen-caption">Screen 06 &bull; Faculty Oversight &amp; Milestone Evaluation Dashboard</div>
        <img class="screen-img" src="${screen6}" alt="Screen 06: Faculty Dashboard">
        <div class="screen-desc-box">
          <strong>Key Features &amp; UX Highlights:</strong> Institutional analytics cards (256 students, 38 projects, 17 postings, 12 pending reviews); structured student project evaluation table with status pills (Under Review, Approved, Needs Revision); 1-click modal grading and feedback recording.
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 4 of 6</span>
    </div>
  </div>

  <!-- =========================================================================
       PAGE 5: DESIGN PRINCIPLES APPLIED (SECTION A)
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>3. Design Principles Applied (Section a)</h1>
          <div class="subtitle">Abstraction, Modularity, Cohesion, and Low Coupling</div>
        </div>
        <div class="meta-area">
          <div><strong>Software Engineering Core:</strong> Section (a)</div>
          <div><strong>Font Standard:</strong> Times New Roman</div>
        </div>
      </div>

      <h2>3.1 Abstraction (Hiding Complexity Behind Clean Interfaces)</h2>
      <p>
        <strong>Abstraction</strong> ensures that higher-level components interact with clear, declarative interfaces while low-level implementation details (data persistence, DOM rendering, network operations) remain encapsulated.
      </p>
      <ul>
        <li><strong>Centralized State Repository (<code>AppStore</code> in <code>app/app.js</code>):</strong> UI components do not perform direct mutations on underlying datasets. Instead, they invoke high-level abstract methods such as <code>store.applyInternship(id)</code>, <code>store.toggleTask(projId, taskIdx)</code>, or <code>store.setRole('faculty')</code>. The inner state transformations and event triggers are completely hidden.</li>
        <li><strong>Decoupled Pub/Sub Event Bus (<code>EventBus</code>):</strong> Modules publish domain events without knowing which subscribers exist, abstracting the communication channel.</li>
        <li><strong>Toast Feedback Service (<code>NotificationService</code>):</strong> Any module requests notifications via <code>appEventBus.publish('notify', { message, type })</code>, abstracting away DOM insertion, timer lifecycles, and animation keyframes.</li>
        <li><strong>CSS Design Tokens (<code>app/styles.css</code>):</strong> Visual attributes are abstracted into semantic custom properties (<code>--primary: #4f46e5</code>, <code>--shadow-md</code>, <code>--radius-lg</code>), shielding developers from hardcoded hex codes.</li>
      </ul>

      <h2>3.2 Modularity (Decomposition into Self-Contained Units)</h2>
      <p>
        <strong>Modularity</strong> divides the software system into distinct, interchangeable modules, each responsible for a specific functional domain.
      </p>
      <ul>
        <li><strong>6 Discrete Screen Feature Modules:</strong> The codebase is organized into 6 class-based modules corresponding directly to the Figma designs: <code>AuthModule</code>, <code>DashboardModule</code>, <code>InternshipsModule</code>, <code>ProjectsModule</code>, <code>ProfileModule</code>, and <code>FacultyModule</code>.</li>
        <li><strong>Atomic UI Components:</strong> Common elements (<code>.metric-card</code>, <code>.status-badge</code>, <code>.tag-stipend</code>, <code>.kanban-col-card</code>, <code>.modal-overlay</code>) are defined once in CSS and reused across all views.</li>
        <li><strong>Separation of Architectural Concerns:</strong> Strict segregation between markup (<code>index.html</code>), style design system (<code>styles.css</code>), and runtime state orchestration (<code>app.js</code>).</li>
      </ul>

      <h2>3.3 High Cohesion (Single, Focused Responsibility)</h2>
      <p>
        <strong>High Cohesion</strong> ensures that all functions and data within a module are tightly related and serve a single, well-defined purpose (Single Responsibility Principle).
      </p>
      <ul>
        <li><strong>Domain-Specific Isolation:</strong> <code>InternshipsModule</code> only handles filtering, searching, and opportunity rendering. It contains no milestone or grading logic. Conversely, <code>FacultyModule</code> is strictly dedicated to managing the review queue and evaluation modals.</li>
        <li><strong>Pure Data Transformations:</strong> The filter engine inside <code>InternshipsModule.render()</code> performs pure filtering operations on in-memory state without side effects on external modules.</li>
      </ul>

      <h2>3.4 Low Coupling (Minimizing Inter-Module Dependencies)</h2>
      <p>
        <strong>Low Coupling</strong> minimizes inter-dependencies between components so modifications in one unit do not cause unintended ripple effects.
      </p>
      <ul>
        <li><strong>No Direct Cross-Module Invocations:</strong> When a user applies for an internship, <code>InternshipsModule</code> does not query or mutate DOM elements belonging to <code>DashboardModule</code> or <code>ProfileModule</code>.</li>
        <li><strong>Event-Driven Pub/Sub Synchronization:</strong> Applying for an internship emits <code>internship:applied</code>. The dashboard counter and toast service listen independently and react without coupling to the caller.</li>
        <li><strong>Decoupled Business Logic:</strong> <code>AppStore</code> contains zero DOM or browser window dependencies, allowing it to execute and be tested in headless environments.</li>
      </ul>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 5 of 6</span>
    </div>
  </div>

  <!-- =========================================================================
       PAGE 6: DESIGN DECISIONS & WHY (SECTION D)
       ========================================================================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>4. Design Decisions &amp; Why (Section d)</h1>
          <div class="subtitle">Key Architectural, UX &amp; Engineering Choices</div>
        </div>
        <div class="meta-area">
          <div><strong>Software Engineering Core:</strong> Section (d)</div>
          <div><strong>Font Standard:</strong> Times New Roman</div>
        </div>
      </div>

      <h2>4. Key Architectural &amp; UX Choices (Quick List: 3&ndash;5 Key Choices)</h2>
      <p>
        Below is the structured analysis of the 5 primary design decisions made during the development of the Internship and Project Collaboration platform, outlining alternatives considered and the technical/UX justifications.
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 25%;">Design Decision / Choice</th>
            <th style="width: 30%;">Alternative Considered</th>
            <th style="width: 40%;">Engineering &amp; UX Justification (Why?)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1</strong></td>
            <td><strong>Role-Based Single-Page App (SPA) Architecture</strong></td>
            <td>Multi-Page Website (separate HTML page per screen)</td>
            <td><strong>Zero-Latency Screen Switching:</strong> Eliminates page reload flicker, retains active in-memory search/filter states and Kanban checklist progress across views, and provides desktop-app smoothness for students and mentors.</td>
          </tr>
          <tr>
            <td><strong>2</strong></td>
            <td><strong>Centralized Event-Driven Pub/Sub State Model (<code>EventBus</code>)</strong></td>
            <td>Direct cross-component DOM updates &amp; global procedural scripts</td>
            <td><strong>Enforces Strict Low Coupling:</strong> When a milestone is completed or an internship applied, KPI cards, activity feeds, and toast notifications synchronize automatically without spaghetti dependencies.</td>
          </tr>
          <tr>
            <td><strong>3</strong></td>
            <td><strong>Faceted Multi-Tag Client-Side Filter Engine</strong></td>
            <td>Server-side form submissions requiring page reloads</td>
            <td><strong>Instant Discovery:</strong> Students can filter by Work Type (<em>Remote / Hybrid / On-site</em>) and Tech Stack (<em>React, Python, Docker, Figma</em>) simultaneously with immediate reactive re-rendering, reducing cognitive effort.</td>
          </tr>
          <tr>
            <td><strong>4</strong></td>
            <td><strong>Semantic CSS Design Tokens (Custom Properties)</strong></td>
            <td>Hardcoded inline styles / ad-hoc utility classes</td>
            <td><strong>Design Consistency &amp; Accessibility:</strong> Guarantees visual harmony across all 6 Figma screens, meets WCAG AA contrast standards, and allows seamless future theming (e.g., institution-specific branding or dark mode).</td>
          </tr>
          <tr>
            <td><strong>5</strong></td>
            <td><strong>Interactive Faculty Evaluation Modal Workflow</strong></td>
            <td>Static non-interactive PDF feedback sheets / manual emails</td>
            <td><strong>Closes the Feedback Loop:</strong> Enables faculty mentors to inspect milestone submissions and instantly record decisions (<em>Approved / Needs Revision</em>) with rubric remarks in real time.</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Summary of Deliverables &amp; Codebase Assets</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Deliverable</th>
            <th style="width: 40%;">Repository Location</th>
            <th style="width: 30%;">Format / Technology</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Working UI/UX Application</strong></td>
            <td><code>app/index.html</code>, <code>app/styles.css</code>, <code>app/app.js</code></td>
            <td>Vanilla HTML5, CSS3 Tokens, ES6 JS</td>
          </tr>
          <tr>
            <td><strong>High-Res Figma Mockup Screens</strong></td>
            <td><code>docs/design/screens/*.png</code> &amp; <code>docs/figma/</code></td>
            <td>1920&times;1080 High-Res PNG</td>
          </tr>
          <tr>
            <td><strong>Compiled Academic PDF Report</strong></td>
            <td><code>UI_UX_Design_Report(TimesNewRoman).pdf</code></td>
            <td>PDF Document (Times New Roman)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      <span>Internship &amp; Project Collaboration Platform &bull; Software Engineering Report</span>
      <span>Page 6 of 6</span>
    </div>
  </div>

</body>
</html>`;

const outHtmlPath = path.join(baseDir, 'ui_ux_report_times_new_roman.html');
fs.writeFileSync(outHtmlPath, htmlContent);
console.log(`Saved HTML report to ${outHtmlPath}`);

let browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(browserPath)) {
  browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
}

const outPdfPath = path.join(baseDir, 'UI_UX_Design_Report(TimesNewRoman).pdf');
const fileUrl = `file:///${outHtmlPath.replace(/\\/g, '/')}`;

console.log(`Compiling PDF using ${browserPath}...`);
const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPdfPath}" "${fileUrl}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✓ Successfully compiled PDF: ${outPdfPath} (${fs.statSync(outPdfPath).size} bytes)`);

  // Copy to workspace root
  const rootPdfPath = path.join(baseDir, '../../UI_UX_Design_Report(TimesNewRoman).pdf');
  fs.copyFileSync(outPdfPath, rootPdfPath);
  console.log(`✓ Copied PDF to workspace root: ${rootPdfPath}`);
} catch (err) {
  console.error('Error compiling PDF:', err.message);
}
