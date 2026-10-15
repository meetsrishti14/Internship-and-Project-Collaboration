const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getBase64Image(filePath) {
  const fileData = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace('.', '');
  return `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${fileData.toString('base64')}`;
}

const baseDir = __dirname;
const archImg = getBase64Image(path.join(baseDir, 'system_architecture.png'));
const screen1 = getBase64Image(path.join(baseDir, 'screens/01_login_screen.png'));
const screen2 = getBase64Image(path.join(baseDir, 'screens/02_student_dashboard.png'));
const screen3 = getBase64Image(path.join(baseDir, 'screens/03_browse_internships.png'));
const screen4 = getBase64Image(path.join(baseDir, 'screens/04_project_collaboration.png'));
const screen5 = getBase64Image(path.join(baseDir, 'screens/05_student_profile.png'));
const screen6 = getBase64Image(path.join(baseDir, 'screens/06_faculty_dashboard.png'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Software Design Document - Internship and Project Collaboration</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9.2pt;
      line-height: 1.42;
      color: #1e293b;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      position: relative;
      height: 271mm;
      max-height: 271mm;
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
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-header .title-area h1 {
      font-size: 14pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }

    .doc-header .title-area .subtitle {
      font-size: 8.5pt;
      font-weight: 600;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-header .meta-area {
      text-align: right;
      font-size: 7.8pt;
      color: #475569;
      line-height: 1.25;
    }

    .meta-tag {
      font-weight: 700;
      color: #0f172a;
    }

    /* FOOTER */
    .doc-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
    }

    /* SECTION HEADERS */
    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6px;
      margin-bottom: 5px;
      padding-bottom: 2px;
      border-bottom: 1.5px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h2 .sec-num {
      background: #2563eb;
      color: #ffffff;
      font-size: 8pt;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
    }

    h3 {
      font-size: 9.8pt;
      font-weight: 700;
      color: #1e40af;
      margin-top: 6px;
      margin-bottom: 3px;
    }

    p {
      margin-bottom: 5px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 16px;
      margin-bottom: 5px;
    }

    li {
      margin-bottom: 2px;
    }

    /* CALLOUT BOXES */
    .callout {
      background-color: #f8fafc;
      border-left: 3.5px solid #2563eb;
      padding: 6px 10px;
      border-radius: 0 5px 5px 0;
      margin: 6px 0;
      font-size: 8.5pt;
    }

    .callout.success {
      background-color: #f0fdf4;
      border-left-color: #16a34a;
    }

    .callout.accent {
      background-color: #faf5ff;
      border-left-color: #8b5cf6;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 8pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 7px;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* CODE BLOCKS */
    .code-container {
      margin: 4px 0 6px 0;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      background: #0f172a;
    }

    .code-header {
      background: #1e293b;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      padding: 2.5px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }

    .code-header .lang-badge {
      color: #38bdf8;
      font-weight: 600;
    }

    pre {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 6.8pt;
      line-height: 1.3;
      padding: 6px 8px;
      color: #f8fafc;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .kw { color: #f43f5e; font-weight: 600; }
    .fn { color: #38bdf8; font-weight: 600; }
    .str { color: #a3e635; }
    .cm { color: #64748b; font-style: italic; }
    .cls { color: #fbbf24; font-weight: 600; }
    .prop { color: #e2e8f0; }
    .num { color: #f59e0b; }

    /* DIAGRAM & IMAGE CONTAINERS */
    .diagram-frame {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px;
      background: #ffffff;
      text-align: center;
      margin: 6px 0;
    }

    .diagram-frame img {
      max-width: 100%;
      height: auto;
      max-height: 250px;
      object-fit: contain;
      border-radius: 4px;
    }

    .screen-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 5px 0;
    }

    .screen-card {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .screen-card-header {
      background: #f1f5f9;
      padding: 3px 6px;
      font-size: 7.5pt;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
    }

    .screen-card-img {
      width: 100%;
      height: 135px;
      object-fit: cover;
      object-position: top;
      display: block;
      border-bottom: 1px solid #f1f5f9;
    }

    .screen-card-body {
      padding: 4px 6px;
      font-size: 7pt;
      color: #334155;
      line-height: 1.25;
    }

    .key-decision-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #2563eb;
      border-radius: 4px;
      padding: 5px 8px;
      margin-bottom: 5px;
    }
    .key-decision-card h4 {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .key-decision-card p {
      font-size: 7.8pt;
      margin-bottom: 1px;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">Software Engineering &bull; Internship & Project Collaboration Platform</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Student 1:</span> Srishti Jain (24BRS1412)</div>
          <div><span class="meta-tag">Student 2:</span> Aakriti Chadha (24BAI1066)</div>
          <div><span class="meta-tag">GitHub:</span> github.com/meetsrishti14/Internship-and-Project-Collaboration</div>
        </div>
      </div>

      <div class="callout">
        <strong>Executive Overview:</strong> This Software Design Document translates requirements and user stories into a modular, production-ready system design. We formalize software engineering principles (Abstraction, Modularity, Cohesion, Low Coupling), 3-Tier Layered Architecture, Figma UI designs, and key architectural trade-offs for the <em>Internship and Project Collaboration</em> platform.
      </div>

      <h2><span class="sec-num">1</span> Core Design Principles Applied</h2>
      <p>
        The system architecture strictly implements the four fundamental pillars of software engineering: <strong>Abstraction, Modularity, High Cohesion, and Low Coupling</strong>.
      </p>

      <h3>1.1 Abstraction</h3>
      <p>
        <strong>How it is applied:</strong> Lower-level complexities (such as MongoDB database queries, indexing, third-party authentication algorithms, and SMTP mail protocols) are encapsulated behind clean service interfaces and Data Transfer Objects (DTOs). The presentation tier calls abstract methods like <code>applyToOpportunity()</code> without coupling to database drivers or caching layers.
      </p>

      <div class="code-container">
        <div class="code-header">
          <span>src/services/interfaces/IInternshipService.js &bull; Service Contract Abstraction</span>
          <span class="lang-badge">JavaScript (ES6)</span>
        </div>
        <pre><span class="cm">// Abstraction: The Controller and UI consume this abstract contract.</span>
<span class="cm">// Underlying database (MongoDB/PostgreSQL) and caching details remain fully encapsulated.</span>
<span class="kw">class</span> <span class="cls">InternshipService</span> {
  <span class="kw">constructor</span>(internshipRepository, notificationService, cacheService) {
    <span class="kw">this</span>.internshipRepo = internshipRepository;
    <span class="kw">this</span>.notifService = notificationService;
    <span class="kw">this</span>.cache = cacheService;
  }

  <span class="kw">async</span> <span class="fn">applyToOpportunity</span>(studentId, internshipId, applicationData) {
    <span class="kw">const</span> isOpen = <span class="kw">await</span> <span class="kw">this</span>.internshipRepo.<span class="fn">isApplicationOpen</span>(internshipId);
    <span class="kw">if</span> (!isOpen) <span class="kw">throw new</span> <span class="cls">Error</span>(<span class="str">"This opportunity is no longer accepting applications."</span>);

    <span class="kw">const</span> application = <span class="kw">await</span> <span class="kw">this</span>.internshipRepo.<span class="fn">createApplication</span>({
      studentId, internshipId, resumeUrl: applicationData.resumeUrl, appliedAt: <span class="kw">new</span> <span class="cls">Date</span>()
    });

    <span class="kw">await</span> <span class="kw">this</span>.notifService.<span class="fn">sendReceiptNotification</span>(studentId, internshipId);
    <span class="kw">return</span> application;
  }
}</pre>
      </div>

      <h3>1.2 Modularity</h3>
      <p>
        <strong>How it is applied:</strong> The application is decomposed into cohesive, self-contained functional modules: <code>AuthModule</code>, <code>InternshipModule</code>, <code>ProjectModule</code>, <code>ReviewModule</code>, and <code>NotificationModule</code>. Each module encapsulates its dedicated routes, controllers, validation schemas, and services, enabling parallel development and isolated testing.
      </p>

      <div class="code-container">
        <div class="code-header">
          <span>src/modules/internships/internship.routes.js &bull; Self-Contained Module Router</span>
          <span class="lang-badge">Express.js Router</span>
        </div>
        <pre><span class="kw">const</span> express = <span class="fn">require</span>(<span class="str">'express'</span>);
<span class="kw">const</span> router = express.<span class="fn">Router</span>();
<span class="kw">const</span> { authenticateToken, requireRole } = <span class="fn">require</span>(<span class="str">'../../middleware/auth.middleware'</span>);
<span class="kw">const</span> { validateApplication } = <span class="fn">require</span>(<span class="str">'./internship.validation'</span>);
<span class="kw">const</span> internshipController = <span class="fn">require</span>(<span class="str">'./internship.controller'</span>);

<span class="cm">// Modular Route Definitions encapsulated within the Internship domain boundary</span>
router.<span class="fn">get</span>(<span class="str">'/'</span>, internshipController.getOpportunities);
router.<span class="fn">get</span>(<span class="str">'/:id'</span>, internshipController.getOpportunityById);
router.<span class="fn">post</span>(<span class="str">'/:id/apply'</span>, authenticateToken, requireRole(<span class="str">'STUDENT'</span>), validateApplication, internshipController.submitApplication);
router.<span class="fn">post</span>(<span class="str">'/create'</span>, authenticateToken, requireRole(<span class="str">'ORGANIZATION'</span>), internshipController.createOpportunity);

module.exports = router;</pre>
      </div>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 1 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">1. Design Principles Applied (Continued)</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Focus:</span> High Cohesion &amp; Loose Coupling</div>
        </div>
      </div>

      <h3>1.3 High Cohesion</h3>
      <p>
        <strong>How it is applied:</strong> Each component is designed adhering to the <em>Single Responsibility Principle (SRP)</em>. Classes and modules perform one well-defined task:
      </p>
      <ul>
        <li><strong>Controllers:</strong> Strictly handle HTTP request parsing, status codes, and JSON response formatting. They contain zero business logic or SQL/NoSQL queries.</li>
        <li><strong>Services:</strong> Solely manage business validation rules, workflow orchestration, and role authorization.</li>
        <li><strong>Repositories:</strong> Exclusively execute database transactions and data retrieval via Mongoose ODM.</li>
      </ul>

      <div class="code-container">
        <div class="code-header">
          <span>src/modules/projects/project.controller.js &bull; High Cohesion Presentation Controller</span>
          <span class="lang-badge">JavaScript (Express)</span>
        </div>
        <pre><span class="cm">// Highly Cohesive Controller: Focuses STRICTLY on HTTP transport & status mapping</span>
<span class="kw">const</span> projectService = <span class="fn">require</span>(<span class="str">'./project.service'</span>);

exports.<span class="fn">createProjectWorkspace</span> = <span class="kw">async</span> (req, res, next) => {
  <span class="kw">try</span> {
    <span class="kw">const</span> { title, description, techStack, visibility } = req.body;
    <span class="kw">const</span> creatorId = req.user.id; <span class="cm">// Extracted from verified JWT</span>

    <span class="kw">const</span> project = <span class="kw">await</span> projectService.<span class="fn">initializeWorkspace</span>({
      title, description, techStack, visibility, creatorId
    });

    <span class="kw">return</span> res.<span class="fn">status</span>(<span class="num">201</span>).<span class="fn">json</span>({
      success: <span class="kw">true</span>,
      message: <span class="str">"Project workspace initialized successfully"</span>,
      data: project
    });
  } <span class="kw">catch</span> (error) {
    next(error); <span class="cm">// Delegates error formatting to centralized error middleware</span>
  }
};</pre>
      </div>

      <h3>1.4 Low Coupling</h3>
      <p>
        <strong>How it is applied:</strong> Modules interact via standard REST API contracts, Dependency Injection, and an asynchronous Event Bus rather than direct hardcoded dependencies. When milestones are submitted, <code>ProjectService</code> emits a domain event without knowing the subscriber details.
      </p>

      <div class="code-container">
        <div class="code-header">
          <span>src/events/eventBus.js &bull; Loosely Coupled Event-Driven Architecture</span>
          <span class="lang-badge">Node.js EventEmitter</span>
        </div>
        <pre><span class="kw">const</span> EventEmitter = <span class="fn">require</span>(<span class="str">'events'</span>);
<span class="kw">class</span> <span class="cls">AppEventBus</span> <span class="kw">extends</span> <span class="cls">EventEmitter</span> {}
<span class="kw">const</span> eventBus = <span class="kw">new</span> <span class="cls">AppEventBus</span>();

<span class="cm">// In ProjectService.js -> Emits event without knowing who handles it (Zero Direct Coupling)</span>
eventBus.<span class="fn">emit</span>(<span class="str">'project:milestoneSubmitted'</span>, {
  projectId: <span class="str">"proj_101"</span>,
  milestoneTitle: <span class="str">"Sprint 1 Architecture Signoff"</span>,
  submittedBy: <span class="str">"24BRS1412"</span>,
  facultyMentorId: <span class="str">"fac_909"</span>
});

<span class="cm">// In NotificationService.js -> Independent listener; changes do not impact ProjectService</span>
eventBus.<span class="fn">on</span>(<span class="str">'project:milestoneSubmitted'</span>, <span class="kw">async</span> (eventPayload) => {
  <span class="kw">await</span> emailProvider.<span class="fn">sendMentorAlert</span>(eventPayload.facultyMentorId, eventPayload.milestoneTitle);
  <span class="kw">await</span> inAppNotificationRepo.<span class="fn">createAlert</span>(eventPayload);
});

module.exports = eventBus;</pre>
      </div>

      <div class="callout success">
        <strong>Architectural Benefit:</strong> This design allows swapping out the email notification provider or adding real-time WebSocket push notifications with zero modifications to project or internship business logic.
      </div>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 2 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 3 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">2. High-Level Architecture &amp; System Blueprint</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Diagram:</span> Draw.io System Architecture</div>
        </div>
      </div>

      <h2><span class="sec-num">2</span> High-Level Architecture</h2>
      <p>
        The platform follows a <strong>3-Tier Layered Client-Server Architecture</strong> utilizing the <strong>Service-Repository Pattern</strong>. Below is the updated, formal architecture diagram created in Draw.io.
      </p>

      <div class="diagram-frame">
        <img src="${archImg}" alt="High-Level Architecture Diagram">
        <div style="font-size: 7.2pt; color: #64748b; margin-top: 3px;">
          <strong>Figure 2.1:</strong> High-Level 3-Tier Layered Architecture Diagram (Source: <code>docs/design/system_architecture.drawio</code>)
        </div>
      </div>

      <h3>2.1 Chosen Architectural Style: 3-Tier Layered Architecture</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 24%;">Tier / Layer</th>
            <th style="width: 33%;">Key Technologies</th>
            <th style="width: 43%;">Core Function &amp; Responsibilities</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Presentation Tier</strong></td>
            <td>React SPA, HTML5, Vanilla CSS Design System, Axios</td>
            <td>Renders user interfaces for Students, Mentors, and Organizations; manages client-side form validation and state.</td>
          </tr>
          <tr>
            <td><strong>2. Gateway &amp; Security</strong></td>
            <td>Nginx Reverse Proxy, Express Gateway, JWT RBAC</td>
            <td>Terminates SSL/TLS, manages CORS headers, enforces rate limiting, and validates cryptographic auth tokens.</td>
          </tr>
          <tr>
            <td><strong>3. Application Services</strong></td>
            <td>Node.js, Express.js, Modular Domain Services</td>
            <td>Executes business logic, access rules, data processing, team invitations, and event orchestration.</td>
          </tr>
          <tr>
            <td><strong>4. Persistence &amp; Storage</strong></td>
            <td>MongoDB Atlas, Redis Cache, Cloud Document Storage</td>
            <td>Stores structured document collections, caches active tokens and search filters, and archives resume PDFs.</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Architectural Justification ("Why?")</h3>
      <ul>
        <li><strong>Separation of Concerns:</strong> Isolates UI presentation from business logic and database persistence, ensuring UI redesigns require zero backend changes.</li>
        <li><strong>Parallel Development Velocity:</strong> Frontend and backend engineers work against clean REST contracts concurrently.</li>
        <li><strong>Horizontal Scalability:</strong> Stateless Node.js containers scale dynamically behind Nginx with zero session lock bottlenecks.</li>
        <li><strong>Isolated Testability:</strong> Business services can be unit-tested independently with mock database repositories.</li>
      </ul>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 3 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 4 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">3. User Interface Design &bull; Wireframes (Part 1)</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Tool:</span> Figma UI Design System</div>
        </div>
      </div>

      <h2><span class="sec-num">3</span> User Interface Design &amp; UX Decisions</h2>
      <p>
        The UI design in Figma follows modern UX heuristics: visual hierarchy, high contrast ratios, progressive disclosure, and contextual feedback.
      </p>

      <div class="screen-grid">
        <!-- Screen 1 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 01 &bull; Secure Login &amp; Role Selector</div>
          <img class="screen-card-img" src="${screen1}" alt="Login Screen">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li>Distraction-free centered card layout.</li>
              <li>Role-aware credential authentication (Student/Mentor/Org).</li>
              <li>Instant client-side validation with password recovery.</li>
            </ul>
          </div>
        </div>

        <!-- Screen 2 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 02 &bull; Student Dashboard Overview</div>
          <img class="screen-card-img" src="${screen2}" alt="Student Dashboard">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li>Summary cards (Active Apps, Projects, Matches).</li>
              <li>Personalized greeting with contextual next steps.</li>
              <li>Direct navigation to project workspaces and team milestones.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="screen-grid" style="grid-template-columns: 1fr;">
        <!-- Screen 3 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 03 &bull; Browse Internships &amp; Faceted Filtering</div>
          <img class="screen-card-img" style="height: 160px;" src="${screen3}" alt="Browse Internships">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li><strong>Faceted Multi-Tag Filters:</strong> Instant client-side filtering by Location (Remote/On-site), Skill Tags, and Duration.</li>
              <li><strong>Card-Based Opportunity Summaries:</strong> Clean visual hierarchy displaying role title, stipend, deadline, and tech stack badges.</li>
              <li><strong>One-Click Modal Drawer:</strong> Allows students to review full job specifications and submit applications without page reloading.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="callout accent" style="margin-top: 4px;">
        <strong>Design Tokens &amp; Consistency:</strong> Standard color tokens (Primary Blue: <code>#2563eb</code>, Success Green: <code>#16a34a</code>, Slate Neutral: <code>#1e293b</code>) ensure a unified, professional user experience across all modules.
      </div>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 4 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 5 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">3. User Interface Design &bull; Wireframes (Part 2)</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Focus:</span> Collaboration, Profile &amp; Faculty Oversight</div>
        </div>
      </div>

      <div class="screen-grid">
        <!-- Screen 4 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 04 &bull; Project Collaboration Workspace</div>
          <img class="screen-card-img" src="${screen4}" alt="Project Collaboration">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li>Project card grid with team avatars and status tags.</li>
              <li>Upcoming meeting widgets and activity feeds.</li>
              <li>Kanban task overview with visual progress bars.</li>
            </ul>
          </div>
        </div>

        <!-- Screen 5 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 05 &bull; Student Profile &amp; Portfolio Manager</div>
          <img class="screen-card-img" src="${screen5}" alt="Student Profile">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li>Academic credentials and dynamic skills matrix.</li>
              <li>Interactive PDF resume uploader and live preview.</li>
              <li>Application tracker with status pills (Review, Selected).</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="screen-grid" style="grid-template-columns: 1fr;">
        <!-- Screen 6 -->
        <div class="screen-card">
          <div class="screen-card-header">Screen 06 &bull; Faculty / Mentor Review Dashboard</div>
          <img class="screen-card-img" style="height: 150px;" src="${screen6}" alt="Faculty Dashboard">
          <div class="screen-card-body">
            <strong>Key UX Features:</strong>
            <ul>
              <li><strong>KPI Metric Tiles:</strong> Total Students (256), Active Projects (38), Internship Posts (17), and Pending Reviews (12).</li>
              <li><strong>Supervision Table:</strong> Tabular overview of supervised students, assigned projects, and milestone progress.</li>
              <li><strong>Quick Actions:</strong> Direct one-click shortcuts to post internships, review milestones, and export assessment reports.</li>
            </ul>
          </div>
        </div>
      </div>

      <h3>3.1 How We Made the UI User-Friendly</h3>
      <ul>
        <li><strong>Reduced Cognitive Load:</strong> Workflows are organized into role-specific views so users see only contextually relevant actions.</li>
        <li><strong>Visual Affordance &amp; Status Colors:</strong> Badges use standardized cues (Green = Active/Selected, Amber = In Progress/Review, Red = Closed).</li>
        <li><strong>Accessibility &amp; Contrast:</strong> Strict compliance with WCAG AA standards (high contrast text &gt; 4.5:1 ratio and keyboard navigation).</li>
      </ul>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 5 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 6 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">4. Key Design Decisions &amp; Trade-off Analysis</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Section:</span> Architectural Decisions</div>
        </div>
      </div>

      <h2><span class="sec-num">4</span> Key Design Decisions &amp; Why</h2>
      <p>
        Key architectural decisions were evaluated against viable alternatives to optimize performance, developer agility, and maintainability:
      </p>

      <!-- Decision 1 -->
      <div class="key-decision-card">
        <h4>1. RESTful JSON API Architecture over GraphQL</h4>
        <p><strong>Decision:</strong> Adopt standard RESTful JSON HTTP endpoints over GraphQL.</p>
        <p><strong>Why:</strong> The domain models (internships, projects, applications) have clearly defined boundaries and predictable CRUD operations. REST simplifies edge-level caching via Nginx/CDN, leverages native HTTP status codes (200, 201, 401, 403, 404, 500), and provides straightforward security controls per endpoint without complex query depth analysis.</p>
      </div>

      <!-- Decision 2 -->
      <div class="key-decision-card">
        <h4>2. Stateless JWT Authentication with Role-Based Access Control (RBAC)</h4>
        <p><strong>Decision:</strong> Implement JSON Web Tokens (JWT) with embedded role claims (Student, Mentor, Organization) over server-side session cookies.</p>
        <p><strong>Why:</strong> JWTs are self-contained and cryptographically verified at the API Gateway level. This eliminates database lookup overhead on every authenticated request, enabling horizontal backend scaling across multi-container Docker nodes with zero session synchronization overhead.</p>
      </div>

      <!-- Decision 3 -->
      <div class="key-decision-card">
        <h4>3. MongoDB (Document Model) over Rigid Relational Schema</h4>
        <p><strong>Decision:</strong> Utilize MongoDB with Mongoose ODM as the primary data persistence layer.</p>
        <p><strong>Why:</strong> Internship postings and project workspaces feature flexible, hierarchical data structures (e.g., dynamic skill tags, embedded task checklists, varying application questionnaire responses, and nested feedback comments). MongoDB's polymorphic document format accommodates rapid feature iterations without requiring complex, locking database table migrations.</p>
      </div>

      <!-- Decision 4 -->
      <div class="key-decision-card">
        <h4>4. Component-Based Frontend Architecture (React SPA)</h4>
        <p><strong>Decision:</strong> Construct the client as a modular Single Page Application using reusable UI components.</p>
        <p><strong>Why:</strong> Encapsulating UI elements (e.g., <code>&lt;OpportunityCard /&gt;</code>, <code>&lt;KanbanBoard /&gt;</code>, <code>&lt;SkillTagSelector /&gt;</code>) provides predictable state management, zero unnecessary full-page refreshes, and effortless component reuse across Student, Faculty, and Recruiter views.</p>
      </div>

      <!-- Decision 5 -->
      <div class="key-decision-card">
        <h4>5. Docker Containerization &amp; Environment Parity</h4>
        <p><strong>Decision:</strong> Containerize the entire application lifecycle using Docker and Docker Compose.</p>
        <p><strong>Why:</strong> Eliminates the classic "works on my machine" barrier by bundling Node.js runtime, Nginx web server, and local database services into reproducible container images, ensuring identical behavior across Windows, Linux, and cloud production environments.</p>
      </div>

      <div class="callout success">
        <strong>Trade-off Summary:</strong> These choices prioritize developer velocity, horizontal elasticity, clean API boundaries, and responsive client experiences without over-engineering initial delivery.
      </div>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 6 of 7</span>
    </div>
  </div>

  <!-- ================= PAGE 7 ================= -->
  <div class="page">
    <div class="content-wrap">
      <div class="doc-header">
        <div class="title-area">
          <h1>Software Design Document (DA-2)</h1>
          <div class="subtitle">5. Maintainability, Future Scope &amp; Deliverables</div>
        </div>
        <div class="meta-area">
          <div><span class="meta-tag">Students:</span> Srishti Jain &amp; Aakriti Chadha</div>
          <div><span class="meta-tag">Conclusion:</span> Submission Summary &amp; Git Proof</div>
        </div>
      </div>

      <h2><span class="sec-num">5</span> Maintainability &amp; Future Adaptations</h2>
      <p>
        The platform is engineered as an <strong>Evolutionary Architecture</strong>. By isolating services and communicating via domain event buses, future features can be integrated seamlessly:
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Future Enhancement</th>
            <th style="width: 35%;">Architectural Integration Strategy</th>
            <th style="width: 40%;">Maintainability Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>AI Recommendation Engine</strong></td>
            <td>Subscribe machine-learning worker service to the <code>application:created</code> event bus.</td>
            <td>Zero changes to existing core backend; AI worker operates asynchronously.</td>
          </tr>
          <tr>
            <td><strong>Cross-Platform Mobile App</strong></td>
            <td>Consume the existing RESTful API endpoints via Flutter / React Native.</td>
            <td>Reuses 100% of backend services, auth layers, and data validation rules.</td>
          </tr>
          <tr>
            <td><strong>University SSO / OAuth2</strong></td>
            <td>Add Passport.js SAML/OAuth strategy inside the existing <code>AuthModule</code>.</td>
            <td>Replaces internal credential validation while preserving downstream user IDs.</td>
          </tr>
          <tr>
            <td><strong>Microservices Extraction</strong></td>
            <td>Spin off <code>NotificationModule</code> and <code>ReviewModule</code> into discrete containers.</td>
            <td>Existing REST routes and service contracts map directly to microservice endpoints.</td>
          </tr>
        </tbody>
      </table>

      <h2><span class="sec-num">6</span> Submission Deliverables &amp; Repository Structure</h2>
      <p>
        In accordance with Digital Assignment 2 guidelines, all design assets, editable source files, wireframes, and documentation updates have been committed to the official GitHub repository.
      </p>

      <div class="callout success">
        <strong>Official Repository URL:</strong><br>
        <a href="https://github.com/meetsrishti14/Internship-and-Project-Collaboration" style="color: #166534; font-weight: 700; text-decoration: none;">
          https://github.com/meetsrishti14/Internship-and-Project-Collaboration
        </a>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deliverable Item</th>
            <th>File Location in Repository</th>
            <th>Format / Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Editable Architecture Diagram</strong></td>
            <td><code>docs/design/system_architecture.drawio</code></td>
            <td>Draw.io XML Editable Source</td>
          </tr>
          <tr>
            <td><strong>Exported Architecture Diagram</strong></td>
            <td><code>docs/design/system_architecture.png</code></td>
            <td>High-Resolution PNG</td>
          </tr>
          <tr>
            <td><strong>UI Wireframes (6 Screens)</strong></td>
            <td><code>docs/design/screens/*.png</code></td>
            <td>PNG Screen Captures (Figma UI)</td>
          </tr>
          <tr>
            <td><strong>Updated Repository Readme</strong></td>
            <td><code>README.md</code> (Section: Software Design)</td>
            <td>Markdown with embedded assets</td>
          </tr>
          <tr>
            <td><strong>Software Design Document</strong></td>
            <td><code>DA-2(24BRS1412).pdf</code></td>
            <td>Final Compiled Report (PDF, 7 Pages)</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 12px; padding: 7px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 7.8pt; color: #475569; text-align: center;">
        <strong>Project Team:</strong> Srishti Jain (24BRS1412) &bull; Aakriti Chadha (24BAI1066) &bull; Software Engineering (Review 2 / DA-2)
      </div>
    </div>
    <div class="doc-footer">
      <span>Internship & Project Collaboration Platform &bull; Digital Assignment 2</span>
      <span>Page 7 of 7</span>
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(baseDir, 'software_design_document.html'), htmlContent);
console.log('Successfully generated software_design_document.html with embedded base64 images.');
