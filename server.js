const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const APP_DIR = path.join(__dirname, 'app');
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Database Operations
function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], internships: [], applications: [], projects: [], milestoneSubmissions: [], notifications: [] };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], internships: [], applications: [], projects: [], milestoneSubmissions: [], notifications: [] };
  }
}

function saveDb(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Current active session state
let currentSessionUser = 'usr_student_1';

function getAuthUser(req, db) {
  // 1. Try Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const match = token.match(/^demo_jwt_token_(.+)_(\d+)$/);
    if (match) {
      const userId = match[1];
      const user = db.users.find(u => u.id === userId);
      if (user) return user;
    }
  }

  // 2. Try x-user-id header
  const customUserId = req.headers['x-user-id'];
  if (customUserId) {
    const user = db.users.find(u => u.id === customUserId);
    if (user) return user;
  }

  // 3. Fallback to active server session
  return db.users.find(u => u.id === currentSessionUser) || db.users[0];
}

// JSON Response Helpers
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// REST API Request Router
async function handleApiRequest(req, res, urlObj) {
  const method = req.method;
  const pathname = urlObj.pathname;
  const query = urlObj.searchParams;
  const db = loadDb();
  const currentUser = getAuthUser(req, db);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id'
    });
    return res.end();
  }

  // --- /api/health ---
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
  }

  // --- /api/auth/current-user ---
  if (pathname === '/api/auth/current-user' && method === 'GET') {
    return sendJson(res, 200, { user: currentUser });
  }

  // --- /api/auth/login ---
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { email, password, role } = body;

    if (!email || !email.trim()) {
      return sendJson(res, 400, { error: 'Please enter your registered institutional or work email.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase().trim() === cleanEmail);

    if (!user) {
      return sendJson(res, 404, { error: `No account found with email '${email.trim()}'. Please verify or sign up first.` });
    }

    // Role check if specified
    if (role && user.role !== role) {
      const properRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      return sendJson(res, 403, { 
        error: `Role mismatch: This account is registered as '${properRole}'. Please select the '${properRole}' role card to log in.` 
      });
    }

    if (!password) {
      return sendJson(res, 400, { error: 'Please enter your account password.' });
    }

    // STRICT PASSWORD VALIDATION - NO BYPASSES
    if (user.password !== password) {
      return sendJson(res, 401, { error: 'Incorrect password entered. Please check your credentials and try again.' });
    }

    currentSessionUser = user.id;
    const token = `jwt_token_${user.id}_${Date.now()}`;
    return sendJson(res, 200, {
      success: true,
      message: `Authenticated successfully as ${user.name} (${user.role.toUpperCase()})`,
      user,
      token
    });
  }

  // --- /api/auth/logout ---
  if (pathname === '/api/auth/logout' && method === 'POST') {
    currentSessionUser = null;
    return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  // --- /api/auth/switch-role (Disabled - users must logout first) ---
  if (pathname === '/api/auth/switch-role' && method === 'POST') {
    return sendJson(res, 403, { error: 'Direct role switching is disabled. Please log out and sign in with the other role.' });
  }

  // --- /api/auth/register ---
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseJsonBody(req);
    if (!body.email || !body.name || !body.role || !body.password) {
      return sendJson(res, 400, { error: 'Full name, email address, password, and role are required.' });
    }

    const cleanEmail = body.email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      return sendJson(res, 409, { error: `This email (${body.email.trim()}) is already registered and in use. Please sign in instead or use another email address.` });
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: body.name.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role,
      regNo: body.regNo || (body.role === 'student' ? '24BRS' + Math.floor(1000 + Math.random() * 9000) : undefined),
      company: body.company || (body.role === 'recruiter' ? (body.regNo || 'TechCorp') : undefined),
      employeeId: body.employeeId || (body.role === 'faculty' ? (body.regNo || 'VIT-FAC-' + Math.floor(1000 + Math.random() * 9000)) : undefined),
      institution: body.institution || 'Vellore Institute of Technology',
      department: body.department || 'Computer Science & Engineering',
      cgpa: body.cgpa || '8.5 / 10.0',
      bio: body.bio || 'New member on Internship & Project Collaboration portal.',
      skills: body.skills || ['Python', 'JavaScript'],
      resume: body.role === 'student' ? {
        fileName: `${body.name.trim().replace(/\s+/g, '_')}_Resume.pdf`,
        fileSize: '1.2 MB',
        uploadDate: 'Just now',
        atsScore: '92%'
      } : undefined
    };

    db.users.push(newUser);
    currentSessionUser = newUser.id;
    saveDb(db);

    const token = `jwt_token_${newUser.id}_${Date.now()}`;
    return sendJson(res, 201, {
      success: true,
      message: 'Account registered successfully! Welcome to your workspace.',
      user: newUser,
      token
    });
  }

  // --- /api/auth/forgot-password ---
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const body = await parseJsonBody(req);
    if (!body.email) {
      return sendJson(res, 400, { error: 'Email is required' });
    }
    return sendJson(res, 200, {
      success: true,
      message: `Password reset instructions sent to ${body.email}. Please check your inbox within 2 minutes.`
    });
  }

  // --- /api/stats (Role-Specific KPI Metrics with Real-Time Cross-Sync) ---
  if (pathname === '/api/stats' && method === 'GET') {
    const role = query.get('role') || currentUser.role;

    if (role === 'student') {
      const studentId = currentUser.role === 'student' ? currentUser.id : 'usr_student_1';
      const myApps = db.applications.filter(a => a.studentId === studentId);
      const activeAppsCount = myApps.filter(a => a.stage !== 'Rejected').length;
      const myProjects = db.projects.filter(p => (p.members || []).some(m => m.id === studentId));

      return sendJson(res, 200, {
        role: 'student',
        metrics: {
          activeApplications: activeAppsCount,
          interviewStageCount: myApps.filter(a => a.stage.includes('Interview') || a.stage === 'Shortlisted').length,
          enrolledProjects: myProjects.length,
          profileViews: 142 + db.applications.length,
          mentorScore: '4.95 / 5.0'
        }
      });
    }

    if (role === 'faculty') {
      const pendingReviews = db.milestoneSubmissions.filter(s => s.status === 'Pending Review').length;
      const approvedCount = db.milestoneSubmissions.filter(s => s.status === 'Approved').length;
      const totalReviews = db.milestoneSubmissions.length;
      const rate = totalReviews ? Math.round((approvedCount / totalReviews) * 100) : 94;

      return sendJson(res, 200, {
        role: 'faculty',
        metrics: {
          mentoredStudents: 256,
          activeProjects: db.projects.length,
          pendingReviews,
          approvalRate: `${rate}%`
        }
      });
    }

    if (role === 'recruiter') {
      const activeJobs = db.internships.filter(i => i.status === 'Active');
      const totalCandidates = db.applications.length;
      const shortlisted = db.applications.filter(a => a.stage === 'Shortlisted' || a.stage.includes('Interview')).length;
      const offers = db.applications.filter(a => a.stage.includes('Offer')).length;

      return sendJson(res, 200, {
        role: 'recruiter',
        metrics: {
          activePostings: activeJobs.length,
          totalCandidates,
          shortlistedCandidates: shortlisted,
          interviewsScheduled: db.applications.filter(a => a.stage.includes('Interview')).length,
          offersExtended: offers
        }
      });
    }
  }

  // --- /api/internships (Browse, Search, Filter) ---
  if (pathname === '/api/internships' && method === 'GET') {
    let results = [...db.internships];
    const search = (query.get('search') || '').toLowerCase().trim();
    const type = (query.get('type') || '').toLowerCase();
    const tag = (query.get('tag') || '').toLowerCase();

    if (search) {
      results = results.filter(i =>
        i.title.toLowerCase().includes(search) ||
        i.company.toLowerCase().includes(search) ||
        i.desc.toLowerCase().includes(search) ||
        (i.tags || []).some(t => t.toLowerCase().includes(search))
      );
    }

    if (type && type !== 'all') {
      results = results.filter(i => (i.type || '').toLowerCase().includes(type));
    }

    if (tag && tag !== 'all') {
      results = results.filter(i => (i.tags || []).some(t => t.toLowerCase().includes(tag)));
    }

    // Flag whether current student has applied
    const studentId = currentUser.role === 'student' ? currentUser.id : 'usr_student_1';
    const appliedMap = new Set(
      db.applications
        .filter(a => a.studentId === studentId)
        .map(a => a.internshipId)
    );
    results = results.map(item => ({
      ...item,
      applied: appliedMap.has(item.id)
    }));

    return sendJson(res, 200, { count: results.length, internships: results });
  }

  // --- POST /api/internships (Recruiter Creates Opportunity) ---
  if (pathname === '/api/internships' && method === 'POST') {
    const body = await parseJsonBody(req);
    if (!body.title || !body.company) {
      return sendJson(res, 400, { error: 'Job title and company name are required.' });
    }

    const newInternship = {
      id: `int_${Date.now()}`,
      title: body.title,
      company: body.company,
      logo: body.logo || '💼',
      type: body.type || 'Remote',
      location: body.location || (body.type === 'Remote' ? 'Remote (India/Global)' : 'Bengaluru, India'),
      stipend: body.stipend || '₹25,000/mo',
      duration: body.duration || '3 Months',
      tags: Array.isArray(body.tags) ? body.tags : (body.tags || 'React, Node.js').split(',').map(s => s.trim()),
      desc: body.desc || 'Exciting internship opening for university students to solve engineering challenges.',
      responsibilities: body.responsibilities || [
        'Deliver reliable and well-tested features.',
        'Collaborate with multi-functional engineering teams.'
      ],
      requirements: body.requirements || [
        'Strong problem-solving fundamentals.',
        'Familiarity with relevant tech stack and tools.'
      ],
      applicants: 0,
      deadline: body.deadline || 'In 14 days',
      postedDate: 'Just now',
      recruiterId: currentUser.id,
      status: body.status || 'Active',
      capacity: parseInt(body.capacity, 10) || 3
    };

    db.internships.unshift(newInternship);
    saveDb(db);

    return sendJson(res, 201, {
      success: true,
      message: 'Internship opportunity published successfully to the student job board!',
      internship: newInternship
    });
  }

  // --- DELETE /api/internships/:id ---
  if (pathname.startsWith('/api/internships/') && method === 'DELETE') {
    const id = pathname.split('/').pop();
    const idx = db.internships.findIndex(i => i.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'Internship not found' });

    db.internships.splice(idx, 1);
    saveDb(db);
    return sendJson(res, 200, { success: true, message: 'Internship role closed successfully.' });
  }

  // --- /api/applications (Multi-Role Pipeline Sync) ---
  if (pathname === '/api/applications' && method === 'GET') {
    let apps = [...db.applications];
    const forceAll = query.get('all') === 'true';
    const forStudentId = query.get('studentId');

    if (forStudentId) {
      apps = apps.filter(a => a.studentId === forStudentId);
    } else if (!forceAll && currentUser.role === 'student') {
      apps = apps.filter(a => a.studentId === currentUser.id);
    }

    const internshipId = query.get('internshipId');
    if (internshipId) {
      apps = apps.filter(a => a.internshipId === internshipId);
    }

    return sendJson(res, 200, { count: apps.length, applications: apps });
  }

  // --- POST /api/applications (Student Applies -> Instantly shown on Recruiter Dashboard) ---
  if (pathname === '/api/applications' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { internshipId, coverLetter, resumeName, resumeSize } = body;

    const internship = db.internships.find(i => i.id === internshipId);
    if (!internship) {
      return sendJson(res, 404, { error: 'Internship opportunity not found.' });
    }

    // Check duplicate
    const existing = db.applications.find(
      a => a.internshipId === internshipId && a.studentId === currentUser.id
    );
    if (existing) {
      return sendJson(res, 400, { error: 'You have already applied for this position!' });
    }

    const newApp = {
      id: `app_${Date.now()}`,
      internshipId,
      internshipTitle: internship.title,
      company: internship.company,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentRegNo: currentUser.regNo || '24BRS1412',
      studentCgpa: currentUser.cgpa ? currentUser.cgpa.split('/')[0].trim() : '8.42',
      stage: 'Received',
      appliedDate: 'Just now',
      resumeName: resumeName || (currentUser.resume ? currentUser.resume.fileName : 'Custom_Resume.pdf'),
      resumeSize: resumeSize || '1.4 MB',
      coverLetter: coverLetter || 'I am excited to apply for this position and contribute to the engineering team.',
      recruiterNotes: 'Application received with uploaded candidate resume.',
      lastUpdated: 'Just now'
    };

    db.applications.unshift(newApp);
    internship.applicants = (internship.applicants || 0) + 1;

    // Send notification to recruiter
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: internship.recruiterId || 'usr_recruiter_1',
      title: 'New Candidate Application',
      message: `${currentUser.name} applied for ${internship.title} at ${internship.company}.`,
      type: 'info',
      timestamp: 'Just now',
      read: false
    });

    saveDb(db);
    return sendJson(res, 201, {
      success: true,
      message: `Application submitted successfully to ${internship.company}! Recruiter will review your profile.`,
      application: newApp
    });
  }

  // --- PATCH /api/applications/:id/stage (Recruiter moves stage -> Instantly shown on Student Dashboard) ---
  if (pathname.startsWith('/api/applications/') && pathname.endsWith('/stage') && method === 'PATCH') {
    const parts = pathname.split('/');
    const appId = parts[3];
    const body = await parseJsonBody(req);
    const { stage, recruiterNotes } = body;

    const app = db.applications.find(a => a.id === appId);
    if (!app) return sendJson(res, 404, { error: 'Application not found' });

    if (stage) app.stage = stage;
    if (recruiterNotes !== undefined) app.recruiterNotes = recruiterNotes;
    app.lastUpdated = 'Just now';

    // Notify student
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: app.studentId,
      title: `Application Status Updated: ${stage}`,
      message: `Your application for ${app.internshipTitle} at ${app.company} has been moved to '${stage}'. Notes: ${recruiterNotes || 'Under recruiter review.'}`,
      type: stage === 'Rejected' ? 'warning' : 'success',
      timestamp: 'Just now',
      read: false
    });

    saveDb(db);
    return sendJson(res, 200, {
      success: true,
      message: `Candidate stage moved to '${stage}'. Status synchronized with student portal.`,
      application: app
    });
  }

  // --- /api/projects ---
  if (pathname === '/api/projects' && method === 'GET') {
    return sendJson(res, 200, { count: db.projects.length, projects: db.projects });
  }

  // --- POST /api/projects ---
  if (pathname === '/api/projects' && method === 'POST') {
    const body = await parseJsonBody(req);
    if (!body.title) {
      return sendJson(res, 400, { error: 'Project title is required.' });
    }

    const newProject = {
      id: `proj_${Date.now()}`,
      title: body.title,
      tagline: body.tagline || 'Collaborative capstone innovation project',
      desc: body.desc || 'Building software architecture and deliverables in collaboration with peers.',
      leadId: currentUser.id,
      leadName: currentUser.name,
      leadRegNo: currentUser.regNo || '24BRS1412',
      visibility: body.visibility || 'Public',
      repoUrl: body.repoUrl || 'https://github.com/project-team',
      mentorId: body.mentorId || 'usr_faculty_1',
      mentorName: body.mentorName || 'Dr. Arun Kumar',
      techStack: Array.isArray(body.techStack) ? body.techStack : (body.techStack || 'React, Node.js, Docker').split(',').map(s => s.trim()),
      members: [
        {
          name: currentUser.name,
          role: 'Lead Developer',
          avatar: currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          id: currentUser.id
        }
      ],
      milestones: [
        { id: `m_${Date.now()}_1`, title: 'Milestone 1: Architecture & Requirements Specification', dueDate: 'In 2 weeks', completed: false, submissionStatus: 'Not Submitted', grade: null },
        { id: `m_${Date.now()}_2`, title: 'Milestone 2: Core Engine & Prototype API Implementation', dueDate: 'In 5 weeks', completed: false, submissionStatus: 'Not Submitted', grade: null },
        { id: `m_${Date.now()}_3`, title: 'Milestone 3: Final Testing, Containerization & Presentation', dueDate: 'In 8 weeks', completed: false, submissionStatus: 'Not Submitted', grade: null }
      ],
      tasks: [
        { id: `t_${Date.now()}_1`, title: 'Draft project SRS and wireframes', desc: 'Detail system requirements and architectural blueprints.', column: 'in-progress', priority: 'High', assignee: currentUser.name },
        { id: `t_${Date.now()}_2`, title: 'Initialize Git repository and CI pipeline', desc: 'Set up branching strategy and linters.', column: 'todo', priority: 'Medium', assignee: currentUser.name }
      ],
      joinRequests: []
    };

    db.projects.unshift(newProject);
    saveDb(db);
    return sendJson(res, 201, {
      success: true,
      message: 'Capstone project initialized successfully!',
      project: newProject
    });
  }

  // --- POST /api/projects/:id/tasks ---
  if (pathname.includes('/projects/') && pathname.endsWith('/tasks') && method === 'POST') {
    const projId = pathname.split('/')[3];
    const body = await parseJsonBody(req);
    const proj = db.projects.find(p => p.id === projId);
    if (!proj) return sendJson(res, 404, { error: 'Project not found' });

    const newTask = {
      id: `t_${Date.now()}`,
      title: body.title || 'New Sprint Deliverable',
      desc: body.desc || '',
      column: body.column || 'todo',
      priority: body.priority || 'Medium',
      assignee: body.assignee || (proj.members[0] ? proj.members[0].name : 'Unassigned')
    };

    proj.tasks.push(newTask);
    saveDb(db);
    return sendJson(res, 201, { success: true, task: newTask });
  }

  // --- PATCH /api/projects/:id/tasks/:taskId ---
  if (pathname.includes('/projects/') && pathname.includes('/tasks/') && method === 'PATCH') {
    const parts = pathname.split('/');
    const projId = parts[3];
    const taskId = parts[5];
    const body = await parseJsonBody(req);

    const proj = db.projects.find(p => p.id === projId);
    if (!proj) return sendJson(res, 404, { error: 'Project not found' });

    const task = proj.tasks.find(t => t.id === taskId);
    if (!task) return sendJson(res, 404, { error: 'Task not found' });

    if (body.column) task.column = body.column;
    if (body.priority) task.priority = body.priority;
    if (body.title) task.title = body.title;

    saveDb(db);
    return sendJson(res, 200, { success: true, task });
  }

  // --- POST /api/projects/:id/join-requests ---
  if (pathname.includes('/projects/') && pathname.endsWith('/join-requests') && method === 'POST') {
    const projId = pathname.split('/')[3];
    const body = await parseJsonBody(req);
    const proj = db.projects.find(p => p.id === projId);
    if (!proj) return sendJson(res, 404, { error: 'Project not found' });

    const newReq = {
      id: `req_${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      regNo: currentUser.regNo || '24BRS1000',
      pitch: body.pitch || 'I would like to collaborate on this project.',
      status: 'Pending',
      requestedAt: 'Just now'
    };

    if (!proj.joinRequests) proj.joinRequests = [];
    proj.joinRequests.push(newReq);
    saveDb(db);

    return sendJson(res, 201, {
      success: true,
      message: 'Join request sent to project lead!',
      request: newReq
    });
  }

  // --- PATCH /api/projects/:id/join-requests/:reqId ---
  if (pathname.includes('/projects/') && pathname.includes('/join-requests/') && method === 'PATCH') {
    const parts = pathname.split('/');
    const projId = parts[3];
    const reqId = parts[5];
    const body = await parseJsonBody(req);
    const { status } = body;

    const proj = db.projects.find(p => p.id === projId);
    if (!proj) return sendJson(res, 404, { error: 'Project not found' });

    const reqItem = (proj.joinRequests || []).find(r => r.id === reqId);
    if (!reqItem) return sendJson(res, 404, { error: 'Request not found' });

    reqItem.status = status;
    if (status === 'Accepted') {
      const avatar = reqItem.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      proj.members.push({
        id: reqItem.studentId,
        name: reqItem.studentName,
        role: 'Collaborator',
        avatar
      });
    }

    saveDb(db);
    return sendJson(res, 200, { success: true, message: `Request marked as ${status}`, project: proj });
  }

  // --- POST /api/projects/:id/milestones/:milestoneId/submit (Student Submits -> Shows on Faculty Queue) ---
  if (pathname.includes('/projects/') && pathname.includes('/milestones/') && pathname.endsWith('/submit') && method === 'POST') {
    const parts = pathname.split('/');
    const projId = parts[3];
    const milestoneId = parts[5];
    const body = await parseJsonBody(req);

    const proj = db.projects.find(p => p.id === projId);
    if (!proj) return sendJson(res, 404, { error: 'Project not found' });

    const milestone = proj.milestones.find(m => m.id === milestoneId);
    if (!milestone) return sendJson(res, 404, { error: 'Milestone not found' });

    milestone.submissionStatus = 'Submitted';

    const newSubmission = {
      id: `sub_${Date.now()}`,
      projectId: proj.id,
      projectTitle: proj.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentRegNo: currentUser.regNo || '24BRS1412',
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      submittedAt: 'Just now',
      repoUrl: body.repoUrl || proj.repoUrl,
      deliverables: body.deliverables || 'Milestone code artifacts, documentation, and unit tests submitted for faculty evaluation.',
      status: 'Pending Review',
      facultyNotes: '',
      grade: ''
    };

    db.milestoneSubmissions.unshift(newSubmission);

    // Notify faculty
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: 'usr_faculty_1',
      title: 'Milestone Submitted for Evaluation',
      message: `${currentUser.name} submitted '${milestone.title}' for project '${proj.title}'.`,
      type: 'warning',
      timestamp: 'Just now',
      read: false
    });

    saveDb(db);
    return sendJson(res, 201, {
      success: true,
      message: 'Milestone submitted for faculty evaluation! Added to faculty review queue.',
      submission: newSubmission
    });
  }

  // --- /api/faculty/submissions ---
  if (pathname === '/api/faculty/submissions' && method === 'GET') {
    return sendJson(res, 200, {
      count: db.milestoneSubmissions.length,
      submissions: db.milestoneSubmissions
    });
  }

  // --- PATCH /api/faculty/submissions/:id/review (Faculty Reviews -> Updates Student Dashboard) ---
  if (pathname.startsWith('/api/faculty/submissions/') && pathname.endsWith('/review') && method === 'PATCH') {
    const parts = pathname.split('/');
    const subId = parts[4];
    const body = await parseJsonBody(req);
    const { status, facultyNotes, grade } = body;

    const sub = db.milestoneSubmissions.find(s => s.id === subId);
    if (!sub) return sendJson(res, 404, { error: 'Submission not found' });

    sub.status = status;
    if (facultyNotes !== undefined) sub.facultyNotes = facultyNotes;
    if (grade !== undefined) sub.grade = grade || (status === 'Approved' ? '9.5/10' : 'Pending Revision');

    // Update the corresponding project milestone
    const proj = db.projects.find(p => p.id === sub.projectId);
    if (proj) {
      const milestone = proj.milestones.find(m => m.id === sub.milestoneId || m.title === sub.milestoneTitle);
      if (milestone) {
        milestone.submissionStatus = status;
        milestone.grade = sub.grade;
        if (status === 'Approved') {
          milestone.completed = true;
        }
      }
    }

    // Notify student
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: sub.studentId,
      title: `Milestone Evaluated: ${status}`,
      message: `Your submission for '${sub.milestoneTitle}' has been evaluated: ${status}. Grade: ${sub.grade || 'N/A'}. Feedback: ${facultyNotes || 'Approved with honors.'}`,
      type: status === 'Approved' ? 'success' : 'warning',
      timestamp: 'Just now',
      read: false
    });

    saveDb(db);
    return sendJson(res, 200, {
      success: true,
      message: `Milestone evaluation recorded: ${status}! Student project progress synchronized.`,
      submission: sub
    });
  }

  // --- /api/faculty/schedule (Mentorship & Viva Sessions) ---
  if (pathname === '/api/faculty/schedule' && method === 'GET') {
    return sendJson(res, 200, { schedule: db.facultySchedule || [] });
  }

  if (pathname === '/api/faculty/schedule' && method === 'POST') {
    const body = await parseJsonBody(req);
    const newSession = {
      id: `viva_${Date.now()}`,
      projectId: body.projectId || 'proj_1',
      projectTitle: body.projectTitle || 'AI Resume Analyzer & ATS Scoring Engine',
      studentLead: body.studentLead || 'Srishti Jain',
      sessionType: body.sessionType || 'Sprint Review & Viva Defense',
      date: body.date || 'Oct 25, 2026',
      time: body.time || '4:00 PM - 5:00 PM',
      meetUrl: body.meetUrl || 'https://meet.google.com/abc-xyz-vit',
      status: 'Scheduled',
      agenda: body.agenda || 'Milestone verification and sprint code quality assessment.'
    };

    if (!db.facultySchedule) db.facultySchedule = [];
    db.facultySchedule.unshift(newSession);
    saveDb(db);
    return sendJson(res, 201, { success: true, message: 'Mentorship review session scheduled!', session: newSession });
  }

  // --- /api/recruiter/interviews (Candidate Interview Coordination) ---
  if (pathname === '/api/recruiter/interviews' && method === 'GET') {
    return sendJson(res, 200, { interviews: db.recruiterInterviews || [] });
  }

  if (pathname === '/api/recruiter/interviews' && method === 'POST') {
    const body = await parseJsonBody(req);
    const newIntv = {
      id: `intv_${Date.now()}`,
      applicationId: body.applicationId || '',
      candidateName: body.candidateName || 'Srishti Jain',
      candidateEmail: body.candidateEmail || 'srishti.jain2024@vitstudent.ac.in',
      roleTitle: body.roleTitle || 'Internship Candidate',
      company: body.company || 'HyperScale AI',
      round: body.round || 'Technical Screening & Deep Dive',
      date: body.date || 'Oct 21, 2026',
      time: body.time || '3:00 PM - 3:45 PM',
      interviewer: body.interviewer || 'Engineering VP',
      meetUrl: body.meetUrl || 'https://meet.google.com/interview-sync',
      status: 'Confirmed',
      notes: body.notes || 'Technical interview round scheduled.'
    };

    if (!db.recruiterInterviews) db.recruiterInterviews = [];
    db.recruiterInterviews.unshift(newIntv);

    // Sync with application status
    if (body.applicationId) {
      const app = db.applications.find(a => a.id === body.applicationId);
      if (app) {
        app.stage = 'Interview Scheduled';
        app.recruiterNotes = body.notes || `Interview scheduled for ${newIntv.date} at ${newIntv.time}`;
      }
    }

    saveDb(db);
    return sendJson(res, 201, { success: true, message: 'Candidate interview scheduled and synchronized!', interview: newIntv });
  }

  // --- /api/recruiter/offers (Formal Job Offer Extension) ---
  if (pathname === '/api/recruiter/offers' && method === 'GET') {
    return sendJson(res, 200, { offers: db.recruiterOffers || [] });
  }

  if (pathname === '/api/recruiter/offers' && method === 'POST') {
    const body = await parseJsonBody(req);
    const newOffer = {
      id: `off_${Date.now()}`,
      applicationId: body.applicationId || '',
      candidateName: body.candidateName || 'Srishti Jain',
      candidateEmail: body.candidateEmail || 'srishti.jain2024@vitstudent.ac.in',
      roleTitle: body.roleTitle || 'Software Engineer Intern',
      company: body.company || 'HyperScale AI',
      stipend: body.stipend || '₹25,000/mo',
      startDate: body.startDate || 'Nov 15, 2026',
      duration: body.duration || '6 Months',
      status: 'Offer Extended',
      message: body.message || 'Congratulations! We are delighted to extend this internship offer.'
    };

    if (!db.recruiterOffers) db.recruiterOffers = [];
    db.recruiterOffers.unshift(newOffer);

    // Sync with application status
    if (body.applicationId) {
      const app = db.applications.find(a => a.id === body.applicationId);
      if (app) {
        app.stage = 'Offer Extended';
        app.recruiterNotes = `Formal offer extended (${newOffer.stipend}). Expected joining: ${newOffer.startDate}`;
      }
    }

    saveDb(db);
    return sendJson(res, 201, { success: true, message: 'Formal internship offer extended!', offer: newOffer });
  }

  // --- /api/profile ---
  if (pathname === '/api/profile' && method === 'GET') {
    return sendJson(res, 200, { profile: currentUser });
  }

  // --- PUT /api/profile ---
  if (pathname === '/api/profile' && method === 'PUT') {
    const body = await parseJsonBody(req);
    const user = db.users.find(u => u.id === currentUser.id) || currentUser;

    if (body.name) user.name = body.name;
    if (body.program) user.program = body.program;
    if (body.institution) user.institution = body.institution;
    if (body.cgpa) user.cgpa = body.cgpa;
    if (body.graduationYear) user.graduationYear = body.graduationYear;
    if (body.bio) user.bio = body.bio;
    if (Array.isArray(body.skills)) user.skills = body.skills;
    if (body.socialLinks) user.socialLinks = { ...user.socialLinks, ...body.socialLinks };

    saveDb(db);
    return sendJson(res, 200, {
      success: true,
      message: 'Profile details updated and saved successfully!',
      profile: user
    });
  }

  // --- POST /api/profile/resume ---
  if (pathname === '/api/profile/resume' && method === 'POST') {
    const body = await parseJsonBody(req);
    const user = db.users.find(u => u.id === currentUser.id) || currentUser;

    user.resume = {
      fileName: body.fileName || `${user.name.replace(/\s+/g, '_')}_Resume.pdf`,
      fileSize: body.fileSize || '1.6 MB',
      uploadDate: 'Just now',
      atsScore: body.atsScore || '96% Match'
    };

    saveDb(db);
    return sendJson(res, 200, {
      success: true,
      message: 'Resume uploaded and analyzed with ATS scoring!',
      resume: user.resume
    });
  }

  // --- /api/notifications ---
  if (pathname === '/api/notifications' && method === 'GET') {
    const userNotifs = db.notifications.filter(
      n => n.recipientId === currentUser.id || n.recipientId === 'all'
    );
    return sendJson(res, 200, { notifications: userNotifs });
  }

  // Fallback 404 for unmatched API routes
  return sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found.` });
}

// Master HTTP Server
const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const urlObj = new URL(req.url, `http://${host}`);

  // Route API requests
  if (urlObj.pathname.startsWith('/api/')) {
    try {
      await handleApiRequest(req, res, urlObj);
    } catch (err) {
      console.error('API Error:', err);
      sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
    }
    return;
  }

  // Route Static Files
  let reqPath = decodeURI(urlObj.pathname);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(APP_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, reqPath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 Internship & Project Collaboration Platform`);
  console.log(` Real-Time Multi-Role Sync & REST API Server Active`);
  console.log(` Portal URL: http://localhost:${PORT}/`);
  console.log(` API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
