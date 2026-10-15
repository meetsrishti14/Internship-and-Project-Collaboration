/**
 * ==============================================================================
 * Internship & Project Collaboration Platform - Client Application
 * Architecture: Initial Role-Based Login Gateway -> Distinct Role Dashboards
 * Real-Time Cross-Dashboard Data Synchronization & REST API Backend
 * ==============================================================================
 */

// =============================================================================
// 1. API CLIENT (REST API with Session Token Headers)
// =============================================================================
class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const token = localStorage.getItem('auth_token') || '';
      const userId = localStorage.getItem('auth_user_id') || '';

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(options.headers || {})
      };

      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`API request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

const api = new ApiClient();

// =============================================================================
// 2. EVENT BUS (Decoupled Reactive Communication)
// =============================================================================
class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  publish(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => {
      try { cb(data); } catch (err) { console.error(`Error in ${event} listener:`, err); }
    });
  }
}

const appEventBus = new EventBus();

// =============================================================================
// 3. TOAST NOTIFICATION SERVICE
// =============================================================================
class NotificationService {
  constructor() {
    this.container = document.getElementById('toast-container');
    appEventBus.subscribe('notify', data => this.show(data.message, data.type));
  }

  show(message, type = 'info') {
    if (!this.container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }
}

// =============================================================================
// 4. CENTRAL APP STORE (State Management & Multi-Role Sync)
// =============================================================================
class AppStore {
  constructor() {
    this.state = {
      currentUser: null,
      internships: [],
      applications: [],
      projects: [],
      facultySubmissions: [],
      facultySchedule: [],
      recruiterInterviews: [],
      recruiterOffers: [],
      stats: {},
      isLoggedIn: false
    };

    this.pollInterval = null;
  }

  async init() {
    try {
      // 1. Check local session (sessionStorage ensures fresh visitors see the Login page first)
      const sessionActive = sessionStorage.getItem('auth_session_active');
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');

      if (sessionActive === 'true' && savedUser && savedToken) {
        try {
          this.state.currentUser = JSON.parse(savedUser);
          this.state.isLoggedIn = true;
        } catch (e) {
          this.state.currentUser = null;
          this.state.isLoggedIn = false;
        }
      } else {
        this.state.currentUser = null;
        this.state.isLoggedIn = false;
      }

      // If user is logged in, sync with server
      if (this.state.isLoggedIn && this.state.currentUser) {
        try {
          const userData = await api.get('/api/auth/current-user');
          if (userData && userData.user) {
            this.state.currentUser = userData.user;
            localStorage.setItem('auth_user', JSON.stringify(userData.user));
            localStorage.setItem('auth_user_id', userData.user.id);
          }
        } catch (e) {}
      }

      // Parallel fetch all data entities
      await Promise.all([
        this.fetchInternships(),
        this.fetchApplications(),
        this.fetchProjects(),
        this.fetchFacultySubmissions(),
        this.fetchFacultySchedule(),
        this.fetchRecruiterInterviews(),
        this.fetchRecruiterOffers(),
        this.fetchStats()
      ]);

      appEventBus.publish('store:ready', this.state);

      // Start automatic background poll sync (every 2.5s) to guarantee real-time multi-dashboard updates
      this.startPollSync();
    } catch (err) {
      console.warn('Backend sync initialized:', err);
      appEventBus.publish('store:ready', this.state);
    }
  }

  startPollSync() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      if (!this.state.isLoggedIn) return;
      try {
        await Promise.all([
          this.fetchInternships(null, true),
          this.fetchApplications(true),
          this.fetchProjects(true),
          this.fetchFacultySubmissions(true),
          this.fetchFacultySchedule(true),
          this.fetchRecruiterInterviews(true),
          this.fetchRecruiterOffers(true),
          this.fetchStats(true)
        ]);
      } catch (e) {}
    }, 2500);
  }

  async fetchInternships(query = null, silent = false) {
    try {
      const q = query !== null ? (query ? '?' + query : '') : '';
      const data = await api.get(`/api/internships${q}`);
      const newItems = data.internships || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.internships);
      this.state.internships = newItems;
      if (!silent || changed) appEventBus.publish('internships:updated', this.state.internships);
    } catch (err) { console.error('Error fetching internships:', err); }
  }

  async fetchApplications(silent = false) {
    try {
      const data = await api.get('/api/applications?all=true');
      const newItems = data.applications || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.applications);
      this.state.applications = newItems;
      if (!silent || changed) appEventBus.publish('applications:updated', this.state.applications);
    } catch (err) { console.error('Error fetching applications:', err); }
  }

  async fetchProjects(silent = false) {
    try {
      const data = await api.get('/api/projects');
      const newItems = data.projects || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.projects);
      this.state.projects = newItems;
      if (!silent || changed) appEventBus.publish('projects:updated', this.state.projects);
    } catch (err) { console.error('Error fetching projects:', err); }
  }

  async fetchFacultySubmissions(silent = false) {
    try {
      const data = await api.get('/api/faculty/submissions');
      const newItems = data.submissions || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.facultySubmissions);
      this.state.facultySubmissions = newItems;
      if (!silent || changed) appEventBus.publish('faculty:submissions_updated', this.state.facultySubmissions);
    } catch (err) { console.error('Error fetching faculty submissions:', err); }
  }

  async fetchFacultySchedule(silent = false) {
    try {
      const data = await api.get('/api/faculty/schedule');
      const newItems = data.schedule || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.facultySchedule);
      this.state.facultySchedule = newItems;
      if (!silent || changed) appEventBus.publish('faculty:schedule_updated', this.state.facultySchedule);
    } catch (err) { console.error('Error fetching faculty schedule:', err); }
  }

  async fetchRecruiterInterviews(silent = false) {
    try {
      const data = await api.get('/api/recruiter/interviews');
      const newItems = data.interviews || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.recruiterInterviews);
      this.state.recruiterInterviews = newItems;
      if (!silent || changed) appEventBus.publish('recruiter:interviews_updated', this.state.recruiterInterviews);
    } catch (err) { console.error('Error fetching recruiter interviews:', err); }
  }

  async fetchRecruiterOffers(silent = false) {
    try {
      const data = await api.get('/api/recruiter/offers');
      const newItems = data.offers || [];
      const changed = JSON.stringify(newItems) !== JSON.stringify(this.state.recruiterOffers);
      this.state.recruiterOffers = newItems;
      if (!silent || changed) appEventBus.publish('recruiter:offers_updated', this.state.recruiterOffers);
    } catch (err) { console.error('Error fetching recruiter offers:', err); }
  }

  async fetchStats(silent = false) {
    try {
      const role = (this.state.currentUser && this.state.currentUser.role) ? this.state.currentUser.role : 'student';
      const data = await api.get(`/api/stats?role=${role}`);
      const newStats = data.metrics || {};
      const changed = JSON.stringify(newStats) !== JSON.stringify(this.state.stats);
      this.state.stats = newStats;
      if (!silent || changed) appEventBus.publish('stats:updated', this.state.stats);
    } catch (err) { console.error('Error fetching stats:', err); }
  }

  async switchRole(role) {
    try {
      const res = await api.post('/api/auth/switch-role', { role });
      if (res && res.user) {
        this.state.currentUser = res.user;
        this.state.isLoggedIn = true;
        if (res.token) localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        localStorage.setItem('auth_user_id', res.user.id);

        await Promise.all([
          this.fetchInternships(),
          this.fetchApplications(),
          this.fetchProjects(),
          this.fetchFacultySubmissions(),
          this.fetchFacultySchedule(),
          this.fetchRecruiterInterviews(),
          this.fetchRecruiterOffers(),
          this.fetchStats()
        ]);

        appEventBus.publish('user:switched', this.state.currentUser);
        return res.user;
      }
    } catch (err) {
      if (this.state.currentUser) this.state.currentUser.role = role;
      appEventBus.publish('user:switched', this.state.currentUser);
    }
  }

  logout() {
    sessionStorage.removeItem('auth_session_active');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_id');
    this.state.currentUser = null;
    this.state.isLoggedIn = false;
    appEventBus.publish('auth:logged_out');
  }
}

const store = new AppStore();

// =============================================================================
// 5. NAVIGATION & VIEW ROUTER (Role-Isolated Workspace Controller)
// =============================================================================
class NavigationRouter {
  constructor() {
    this.navLinks = document.querySelectorAll('.nav-link');
    this.viewSections = document.querySelectorAll('.view-section');
    this.currentView = 'auth';

    this.initEvents();
  }

  initEvents() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        if (view) this.navigateTo(view);
      });
    });

    const userBadge = document.getElementById('userProfileBadge');
    if (userBadge) {
      userBadge.addEventListener('click', () => {
        if (!store.state.currentUser) return;
        const role = store.state.currentUser.role;
        if (role === 'student') this.navigateTo('profile');
        else if (role === 'faculty') this.navigateTo('faculty');
        else this.navigateTo('recruiter');
      });
    }

    appEventBus.subscribe('user:switched', (user) => {
      this.updateRoleUi(user.role);
    });

    appEventBus.subscribe('auth:logged_out', () => {
      this.updateRoleUi(null);
      this.navigateTo('auth');
    });
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    // Update section active classes
    this.viewSections.forEach(section => {
      if (section.id === `view-${viewId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Update nav links active status
    this.navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateRoleUi(role) {
    const userBadge = document.getElementById('userProfileBadge');
    const btnLogout = document.getElementById('btnNavLogout');
    const rolePills = document.querySelector('.quick-role-toggle');
    const avatar = document.getElementById('navUserAvatar');
    const name = document.getElementById('navUserName');
    const roleEl = document.getElementById('navUserRole');
    const searchEl = document.getElementById('navGlobalSearch');
    const authLink = document.getElementById('navLinkAuth');
    const user = store.state.currentUser;

    if (!role || !user || !store.state.isLoggedIn) {
      // LOGGED OUT STATE: Hide dashboard nav buttons & show auth only
      if (userBadge) userBadge.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'none';
      if (rolePills) rolePills.style.display = 'none';
      if (searchEl) searchEl.style.display = 'none';
      if (authLink) authLink.style.display = 'none';

      document.querySelectorAll('.role-link-student').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.role-link-faculty').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.role-link-recruiter').forEach(el => el.style.display = 'none');

      this.navigateTo('auth');
      return;
    }

    // LOGGED IN STATE: Show only links matching the active role
    if (userBadge) userBadge.style.display = 'flex';
    if (btnLogout) btnLogout.style.display = 'flex';
    if (rolePills) rolePills.style.display = 'none'; // Strict role isolation
    if (searchEl) searchEl.style.display = (role === 'student' ? 'flex' : 'none');
    if (authLink) authLink.style.display = 'inline-flex';

    if (avatar) avatar.textContent = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
    if (name) name.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : 'Student';

    // Show ONLY the navigation links for this specific role!
    document.querySelectorAll('.role-link-student').forEach(el => el.style.display = (role === 'student' ? 'inline-flex' : 'none'));
    document.querySelectorAll('.role-link-faculty').forEach(el => el.style.display = (role === 'faculty' ? 'inline-flex' : 'none'));
    document.querySelectorAll('.role-link-recruiter').forEach(el => el.style.display = (role === 'recruiter' ? 'inline-flex' : 'none'));

    if (role === 'student') {
      this.navigateTo('dashboard');
    } else if (role === 'faculty') {
      this.navigateTo('faculty');
    } else if (role === 'recruiter') {
      this.navigateTo('recruiter');
    }
  }
}

// =============================================================================
// 6. STUDENT DASHBOARD MODULE (Figma Screen 02 - Real-Time Synced)
// =============================================================================
class StudentDashboardModule {
  constructor() {
    appEventBus.subscribe('store:ready', () => this.render());
    appEventBus.subscribe('internships:updated', () => this.renderOpps());
    appEventBus.subscribe('applications:updated', () => {
      this.renderApplications();
      this.renderStats(store.state.stats);
    });
    appEventBus.subscribe('projects:updated', () => this.renderCapstone());
    appEventBus.subscribe('stats:updated', (stats) => this.renderStats(stats));
    appEventBus.subscribe('user:switched', () => this.render());
  }

  render() {
    if (!store.state.currentUser || store.state.currentUser.role !== 'student') return;
    const user = store.state.currentUser;
    const greeting = document.getElementById('dashGreeting');
    if (greeting) greeting.textContent = `Welcome back, ${user.name.split(' ')[0]}! 👋`;

    this.renderStats(store.state.stats);
    this.renderOpps();
    this.renderApplications();
    this.renderCapstone();
  }

  renderStats(stats) {
    const apps = document.getElementById('statStudentApps');
    const projs = document.getElementById('statStudentProjects');

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const myApps = store.state.applications.filter(a => a.studentId === studentId);
    const activeCount = myApps.filter(a => a.stage !== 'Rejected').length;
    const myProjects = store.state.projects.filter(p => (p.members || []).some(m => m.id === studentId));

    if (apps) apps.textContent = String(activeCount).padStart(2, '0');
    if (projs) projs.textContent = String(myProjects.length).padStart(2, '0');
  }

  renderOpps() {
    const container = document.getElementById('dashboardOppsList');
    if (!container) return;

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const appliedJobIds = new Set(
      store.state.applications.filter(a => a.studentId === studentId).map(a => a.internshipId)
    );

    // Prioritize unapplied roles so student sees what else they can apply to
    const unapplied = store.state.internships.filter(opp => !appliedJobIds.has(opp.id));
    const applied = store.state.internships.filter(opp => appliedJobIds.has(opp.id));
    const opps = [...unapplied, ...applied].slice(0, 4);

    container.innerHTML = opps.map(opp => {
      const isApplied = opp.applied || appliedJobIds.has(opp.id);
      return `
        <div class="opp-item-card">
          <div class="opp-meta">
            <div class="company-logo">${opp.logo || '💼'}</div>
            <div class="opp-details">
              <h4>${opp.title}</h4>
              <p>${opp.company} &bull; ${opp.type} &bull; Posted ${opp.postedDate || 'recently'}</p>
              <div class="tag-list">
                <span class="tag tag-stipend">${opp.stipend}</span>
                <span class="tag ${opp.type === 'Remote' ? 'tag-remote' : ''}">${opp.type}</span>
                ${(opp.tags || []).slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
          ${isApplied
            ? `<button class="btn-secondary" style="background:#ecfdf5; color:#065f46; border-color:#a7f3d0;" disabled>✓ Applied</button>`
            : `<button class="btn-primary" style="width: auto; padding: 8px 18px; font-size: 13px;" onclick="window.openApplyModal('${opp.id}')">Apply Now</button>`
          }
        </div>
      `;
    }).join('');
  }

  renderApplications() {
    const container = document.getElementById('dashboardApplicationsList');
    if (!container) return;

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const myApps = store.state.applications.filter(a => a.studentId === studentId);

    if (!myApps.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px; background: white; border-radius: 8px;">
          <p>No applications submitted yet. Click <strong>Apply Now</strong> on recommended opportunities above!</p>
        </div>
      `;
      return;
    }

    const stageColors = {
      'Received': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      'Under Review': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
      'Shortlisted': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
      'Interview Scheduled': { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
      'Offer Extended': { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
      'Rejected': { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
    };

    // Render ALL student applications consistently with profile tracker table
    container.innerHTML = myApps.map(app => {
      const col = stageColors[app.stage] || stageColors['Received'];
      return `
        <div class="opp-item-card" style="border-left: 4px solid ${col.color};">
          <div class="opp-meta">
            <div class="company-logo">${app.logo || '💼'}</div>
            <div class="opp-details">
              <h4>${app.internshipTitle}</h4>
              <p>${app.company} &bull; Applied: ${app.appliedDate || 'Recently'}</p>
              ${app.recruiterNotes ? `<div style="font-size: 11px; color: #475569; margin-top: 4px; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px dashed #e2e8f0;">💬 <em>Recruiter:</em> ${app.recruiterNotes}</div>` : ''}
            </div>
          </div>
          <span style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: ${col.bg}; color: ${col.color}; border: 1px solid ${col.border}; white-space: nowrap;">
            ${app.stage === 'Interview Scheduled' ? '🗓️ ' : ''}${app.stage}
          </span>
        </div>
      `;
    }).join('');
  }

  renderCapstone() {
    const proj = store.state.projects[0];
    if (!proj || !proj.milestones) return;

    const titleEl = document.getElementById('dashCapstoneTitle');
    const milestoneEl = document.getElementById('dashCapstoneMilestone');
    const fillEl = document.querySelector('#view-dashboard .progress-bar-fill');
    const badgeEl = document.querySelector('#view-dashboard .capstone-item .status-badge');

    const completedCount = proj.milestones.filter(m => m.completed).length;
    const total = proj.milestones.length;
    const pct = total ? Math.round((completedCount / total) * 100) : 0;
    const activeMilestone = proj.milestones.find(m => !m.completed) || proj.milestones[proj.milestones.length - 1];

    if (titleEl) titleEl.textContent = proj.title;
    if (milestoneEl && activeMilestone) {
      milestoneEl.innerHTML = `<strong>${activeMilestone.title}</strong> &bull; Status: <span style="color:#4338ca; font-weight:700;">${activeMilestone.submissionStatus}</span> ${activeMilestone.grade ? `(${activeMilestone.grade})` : ''}`;
    }
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (badgeEl) badgeEl.textContent = `${pct}% Done`;
  }
}

// =============================================================================
// 7. BROWSE INTERNSHIPS MODULE (Figma Screen 03 / User Stories 7, 8 & 9)
// =============================================================================
class InternshipsModule {
  constructor() {
    this.searchInput = document.getElementById('internSearchInput');
    this.typeSelect = document.getElementById('filterType');
    this.tagSelect = document.getElementById('filterTag');

    this.initEvents();
    appEventBus.subscribe('internships:updated', () => this.render());
    appEventBus.subscribe('applications:updated', () => this.render());
  }

  initEvents() {
    const filterHandler = () => this.applyFilters();
    if (this.searchInput) this.searchInput.addEventListener('input', filterHandler);
    if (this.typeSelect) this.typeSelect.addEventListener('change', filterHandler);
    if (this.tagSelect) this.tagSelect.addEventListener('change', filterHandler);
  }

  applyFilters() {
    const search = this.searchInput ? this.searchInput.value.trim() : '';
    const type = this.typeSelect ? this.typeSelect.value : 'all';
    const tag = this.tagSelect ? this.tagSelect.value : 'all';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type !== 'all') params.append('type', type);
    if (tag !== 'all') params.append('tag', tag);

    store.fetchInternships(params.toString());
  }

  render() {
    const grid = document.getElementById('internshipsGrid');
    if (!grid) return;

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const appliedJobIds = new Set(
      store.state.applications.filter(a => a.studentId === studentId).map(a => a.internshipId)
    );

    if (!store.state.internships.length) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <h3 style="font-size: 16px; color: #1e293b;">No matching internship openings found</h3>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Try loosening your search keywords or resetting work mode filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = store.state.internships.map(opp => {
      const isApplied = opp.applied || appliedJobIds.has(opp.id);
      const app = store.state.applications.find(a => (a.internshipId === opp.id || a.internshipTitle === opp.title) && a.studentId === studentId);
      const stage = app ? app.stage : null;
      return `
        <div class="intern-card">
          <div class="intern-card-header">
            <div class="company-logo">${opp.logo || '💼'}</div>
            <div style="flex-grow: 1;">
              <h4 class="intern-role-title">${opp.title}</h4>
              <div class="intern-company-meta">${opp.company} &bull; ${opp.location || opp.type}</div>
            </div>
            <span class="status-badge ${opp.type === 'Remote' ? 'status-active' : 'status-review'}">${opp.type}</span>
          </div>

          <p class="intern-desc">${opp.desc}</p>

          <div class="tag-list" style="margin-bottom: 16px;">
            <span class="tag tag-stipend">${opp.stipend}</span>
            <span class="tag">${opp.duration}</span>
            ${(opp.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>

          <div class="intern-card-footer">
            <div class="intern-meta-info">
              <span>👥 ${opp.applicants || 0} applicants</span> &bull; 
              <span>⏳ Deadline: ${opp.deadline}</span>
            </div>
            ${isApplied
              ? `<div style="display:flex; align-items:center; gap:8px;">
                   ${stage ? `<span class="status-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:10px; text-transform:none;">${stage}</span>` : ''}
                   <button class="btn-secondary" style="background:#ecfdf5; color:#065f46; border-color:#a7f3d0;" disabled>✓ Applied</button>
                 </div>`
              : `<button class="btn-primary" style="width: auto; padding: 8px 18px;" onclick="window.openApplyModal('${opp.id}')">Apply Now &rarr;</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }
}

// =============================================================================
// 8. PROJECT WORKSPACE & KANBAN MODULE (Figma Screen 04 / User Stories 12 & 13)
// =============================================================================
class ProjectsModule {
  constructor() {
    appEventBus.subscribe('projects:updated', () => this.render());
    appEventBus.subscribe('store:ready', () => this.render());
  }

  render() {
    this.renderKanban();
    this.renderMilestones();
    this.renderDirectory();
    this.renderJoinRequests();
  }

  renderKanban() {
    const container = document.getElementById('kanbanBoard4Col');
    if (!container) return;

    const proj = store.state.projects[0] || { tasks: [] };
    const tasks = proj.tasks || [];

    const cols = [
      { id: 'todo', title: 'To Do', icon: '📝', bg: '#f8fafc' },
      { id: 'in-progress', title: 'In Progress', icon: '⚡', bg: '#f0f9ff' },
      { id: 'review', title: 'Under Review', icon: '👀', bg: '#fffbeb' },
      { id: 'done', title: 'Done / Completed', icon: '✅', bg: '#f0fdf4' }
    ];

    container.innerHTML = cols.map(col => {
      const colTasks = tasks.filter(t => t.column === col.id);
      return `
        <div class="kanban-col-card" style="background: ${col.bg};">
          <div class="kanban-col-header">
            <div style="font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>${col.icon}</span>
              <span>${col.title}</span>
              <span class="pipeline-badge-count">${colTasks.length}</span>
            </div>
            <button onclick="window.openAddTaskModal('${col.id}')" style="background:none; border:none; font-size:16px; cursor:pointer; color:var(--slate-500);" title="Add Task">+</button>
          </div>

          <div class="task-list">
            ${colTasks.length === 0 ? `<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 20px 0;">No sprint tasks</div>` : ''}
            ${colTasks.map(task => `
              <div class="task-item" style="background: white; flex-direction: column; align-items: flex-start; gap: 6px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                  <strong style="font-size: 12px; color: #0f172a;">${task.title}</strong>
                  <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${task.priority === 'High' ? '#fee2e2; color:#991b1b' : '#e0e7ff; color:#3730a3'};">${task.priority}</span>
                </div>
                ${task.desc ? `<p style="font-size: 11px; color: #64748b; line-height: 1.3;">${task.desc}</p>` : ''}
                <div style="display: flex; justify-content: space-between; width: 100%; font-size: 10px; color: #94a3b8; align-items: center; margin-top: 4px;">
                  <span>👤 ${task.assignee}</span>
                  <div style="display: flex; gap: 4px;">
                    ${col.id !== 'todo' ? `<button onclick="window.moveTask('${proj.id}', '${task.id}', '${this.getPrevCol(col.id)}')" style="border:none; background:#f1f5f9; padding:2px 6px; border-radius:3px; cursor:pointer;" title="Move Left">←</button>` : ''}
                    ${col.id !== 'done' ? `<button onclick="window.moveTask('${proj.id}', '${task.id}', '${this.getNextCol(col.id)}')" style="border:none; background:#f1f5f9; padding:2px 6px; border-radius:3px; cursor:pointer;" title="Move Right">→</button>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  getPrevCol(col) {
    if (col === 'done') return 'review';
    if (col === 'review') return 'in-progress';
    return 'todo';
  }

  getNextCol(col) {
    if (col === 'todo') return 'in-progress';
    if (col === 'in-progress') return 'review';
    return 'done';
  }

  renderMilestones() {
    const container = document.getElementById('milestonesListContainer');
    if (!container) return;

    const proj = store.state.projects[0];
    if (!proj || !proj.milestones) return;

    container.innerHTML = proj.milestones.map(m => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; border-bottom: 1px solid #f1f5f9;">
        <div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${m.title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            Target: ${m.dueDate} &bull; Mentor Evaluation: <strong>${m.grade || 'Pending Review'}</strong>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="status-badge ${m.submissionStatus === 'Approved' ? 'status-completed' : (m.submissionStatus === 'Submitted' ? 'status-review' : 'status-active')}">${m.submissionStatus}</span>
          ${m.submissionStatus !== 'Approved'
            ? `<button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.openSubmitMilestoneModal('${m.id}')">Submit Code</button>`
            : `<span style="font-size: 12px; color: #10b981; font-weight:700;">✓ Completed</span>`
          }
        </div>
      </div>
    `).join('');
  }

  renderDirectory() {
    const grid = document.getElementById('projectsDirectoryGrid');
    if (!grid) return;

    grid.innerHTML = store.state.projects.map(p => `
      <div class="intern-card">
        <div class="intern-card-header">
          <div class="company-logo">🚀</div>
          <div>
            <h4 class="intern-role-title">${p.title}</h4>
            <div class="intern-company-meta">Lead: ${p.leadName} &bull; Mentor: ${p.mentorName}</div>
          </div>
        </div>
        <p class="intern-desc">${p.desc}</p>
        <div class="tag-list" style="margin-bottom: 14px;">
          ${(p.techStack || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="intern-card-footer">
          <span style="font-size: 12px; color: #64748b;">👥 ${(p.members || []).length} active collaborators</span>
          <button class="btn-primary" style="width: auto; padding: 8px 16px; font-size: 13px;" onclick="window.openJoinProjectModal('${p.id}', '${p.title}')">Request to Join &rarr;</button>
        </div>
      </div>
    `).join('');
  }

  renderJoinRequests() {
    const list = document.getElementById('teamJoinRequestsList');
    if (!list) return;

    const proj = store.state.projects[0];
    const requests = (proj && proj.joinRequests) ? proj.joinRequests : [];

    if (!requests.length) {
      list.innerHTML = `<div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 12px 0;">No pending join requests</div>`;
      return;
    }

    list.innerHTML = requests.map(req => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 13px; color: #0f172a;">${req.studentName}</strong>
          <span class="status-badge status-review">${req.status}</span>
        </div>
        <p style="font-size: 12px; color: #475569; line-height: 1.4; margin-bottom: 8px;">"${req.pitch}"</p>
        ${req.status === 'Pending' ? `
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="padding: 4px 10px; font-size: 11px; width: auto;" onclick="window.respondJoinRequest('${proj.id}', '${req.id}', 'Accepted')">Accept</button>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; width: auto;" onclick="window.respondJoinRequest('${proj.id}', '${req.id}', 'Declined')">Decline</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  }
}

// =============================================================================
// 9. STUDENT PROFILE MODULE (Figma Screen 05 / User Stories 4, 5 & 6)
// =============================================================================
class ProfileModule {
  constructor() {
    appEventBus.subscribe('store:ready', () => this.render());
    appEventBus.subscribe('applications:updated', () => this.renderAppsTable());
    appEventBus.subscribe('projects:updated', () => this.renderProjects());
    appEventBus.subscribe('user:switched', () => this.render());
  }

  render() {
    if (!store.state.currentUser || store.state.currentUser.role !== 'student') return;
    const user = store.state.currentUser;
    const name = document.getElementById('profileFullName');
    const degree = document.getElementById('profileDegreeLine');
    const avatar = document.getElementById('profileBigAvatar');
    const inst = document.getElementById('profileInst');
    const cgpa = document.getElementById('profileCgpa');
    const grad = document.getElementById('profileGrad');
    const ats = document.getElementById('profileAts');

    if (name) name.innerHTML = `${user.name} <span style="font-size: 16px; color: #3b82f6;">✓ Verified</span>`;
    if (degree) degree.textContent = `${user.program || 'B.Tech CSE'} • Reg: ${user.regNo || '24BRS1412'}`;
    if (avatar) avatar.textContent = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SJ';
    if (inst) inst.textContent = user.institution || 'Vellore Institute of Technology';
    if (cgpa) cgpa.textContent = user.cgpa || '8.42 / 10.0';
    if (grad) grad.textContent = `Class of ${user.graduationYear || '2028'}`;
    if (ats) ats.textContent = user.atsScore || '94% Match';

    // Skill pills
    const skillContainer = document.getElementById('profileSkillMatrix');
    if (skillContainer) {
      skillContainer.innerHTML = (user.skills || []).map(s => `
        <span class="skill-pill">${s}</span>
      `).join('');
    }

    this.renderAppsTable();
    this.renderProjects();
  }

  renderAppsTable() {
    const tbody = document.getElementById('studentApplicationTableBody');
    if (!tbody) return;

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const apps = store.state.applications.filter(a => a.studentId === studentId);
    if (!apps.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">No applications submitted yet. Browse open internships to apply!</td></tr>`;
      return;
    }

    const stageStyles = {
      'Received': 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;',
      'Under Review': 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;',
      'Shortlisted': 'background: #fef9c3; color: #854d0e; border: 1px solid #fef08a;',
      'Interview Scheduled': 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;',
      'Offer Extended': 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;',
      'Rejected': 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'
    };

    tbody.innerHTML = apps.map(app => {
      const style = stageStyles[app.stage] || stageStyles['Received'];
      return `
        <tr>
          <td><strong>${app.company}</strong> &bull; ${app.internshipTitle}</td>
          <td>${app.appliedDate}</td>
          <td><span class="status-badge" style="${style}">${app.stage === 'Interview Scheduled' ? '🗓️ ' : ''}${app.stage}</span></td>
          <td><span style="font-size: 12px; color: #64748b;">${app.recruiterNotes || 'Under initial review'}</span></td>
        </tr>
      `;
    }).join('');
  }

  renderProjects() {
    const container = document.getElementById('profileProjectsList');
    if (!container) return;

    const studentId = store.state.currentUser ? store.state.currentUser.id : 'usr_student_1';
    const myProjects = store.state.projects.filter(p => (p.members || []).some(m => m.id === studentId));

    if (!myProjects.length) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #94a3b8;">No collaborative projects joined yet.</div>`;
      return;
    }

    container.innerHTML = myProjects.map(p => {
      const myMember = (p.members || []).find(m => m.id === studentId);
      const myRole = myMember ? myMember.role : 'Contributor';
      const completed = (p.milestones || []).filter(m => m.completed).length;
      const total = (p.milestones || []).length;
      const pct = total ? Math.round((completed / total) * 100) : 0;

      return `
        <div class="intern-card" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0;">
          <div>
            <div class="intern-card-header">
              <div class="company-logo">🚀</div>
              <div style="flex-grow: 1;">
                <h4 class="intern-role-title">${p.title}</h4>
                <div class="intern-company-meta">Role: <strong>${myRole}</strong> &bull; Team of ${(p.members || []).length}</div>
              </div>
              <span class="status-badge ${pct === 100 ? 'status-completed' : 'status-active'}">${pct === 100 ? 'Completed' : `${pct}% Done`}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 10px 0; line-height: 1.5;">${p.tagline || p.desc}</p>
            <div class="tag-list" style="margin-bottom: 12px;">
              ${(p.techStack || []).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px; display: flex; justify-content: space-between;">
              <span>Milestones Progress:</span>
              <strong>${completed} / ${total} Approved</strong>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            <span style="font-size: 11px; color: #64748b;">Mentor: ${p.mentorName || 'Faculty'}</span>
            <button class="btn-secondary" style="font-size: 12px; padding: 6px 14px;" onclick="window.appRouter.navigateTo('projects')">Workspace Hub &rarr;</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// =============================================================================
// 10. STUDENT COMPREHENSIVE ACADEMIC & PLACEMENT REPORT MODULE
// =============================================================================
class StudentReportModule {
  constructor() {
    appEventBus.subscribe('store:ready', () => this.render());
    appEventBus.subscribe('user:switched', () => this.render());
    appEventBus.subscribe('applications:updated', () => this.render());
    appEventBus.subscribe('projects:updated', () => this.render());
  }

  render() {
    const user = store.state.currentUser;
    if (!user || user.role !== 'student') return;

    const nameEl = document.getElementById('reportStudentName');
    const metaEl = document.getElementById('reportStudentMeta');
    const skillsContainer = document.getElementById('reportStudentSkills');
    const projectsContainer = document.getElementById('reportStudentProjectsList');
    const appsTableBody = document.getElementById('reportStudentAppsTable');
    const statProjects = document.getElementById('reportStatProjects');

    if (nameEl) nameEl.textContent = user.name || 'Srishti Jain';
    if (metaEl) {
      metaEl.innerHTML = `${user.program || 'B.Tech Computer Science & Engineering (AI & Robotics)'} &bull; Reg: ${user.regNo || '24BRS1412'} &bull; Vellore Institute of Technology`;
    }

    if (skillsContainer) {
      const skills = (user.skills && user.skills.length) ? user.skills : ['Python', 'FastAPI', 'React', 'PyTorch', 'Docker', 'PostgreSQL', 'Figma UI/UX', 'Git'];
      skillsContainer.innerHTML = skills.map(s => `
        <span style="background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 999px;">
          ✓ ${s}
        </span>
      `).join('');
    }

    const myProjects = store.state.projects.filter(p => (p.members || []).some(m => m.id === user.id) || p.leadRegNo === user.regNo);
    const activeProjects = myProjects.length > 0 ? myProjects : store.state.projects;

    if (statProjects) {
      statProjects.textContent = `${String(activeProjects.length).padStart(2, '0')} Active`;
    }

    if (projectsContainer) {
      projectsContainer.innerHTML = activeProjects.map(p => {
        const completedMilestones = (p.milestones || []).filter(m => m.completed);
        return `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div>
                <strong style="font-size: 14px; color: #0f172a;">${p.title}</strong>
                <div style="font-size: 12px; color: #64748b;">Mentor: ${p.mentorName || 'Dr. Arun Kumar'} &bull; Repo: <a href="${p.repoUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${p.repoUrl}</a></div>
              </div>
              <span class="status-badge status-completed" style="font-size: 11px;">${completedMilestones.length}/${(p.milestones || []).length} Milestones Cleared</span>
            </div>
            <div style="font-size: 12px; color: #334155; margin-top: 8px;">
              ${(p.milestones || []).map(m => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
                  <span>${m.completed ? '✅' : '⏳'} <strong>${m.title}</strong>: <span style="color:#64748b;">${m.desc || ''}</span></span>
                  <span style="font-weight: 700; color: ${m.completed ? '#059669' : '#d97706'};">${m.completed ? (m.grade || 'Approved (9.5/10)') : 'In Progress'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    if (appsTableBody) {
      const myApps = store.state.applications.filter(a => a.studentId === user.id || a.studentEmail === user.email);
      const displayApps = myApps.length > 0 ? myApps : store.state.applications.slice(0, 4);

      appsTableBody.innerHTML = displayApps.map(a => `
        <tr>
          <td><strong>${a.internshipTitle}</strong><br><span style="font-size: 11px; color:#64748b;">${a.company || 'Corporate Partner'}</span></td>
          <td>${a.appliedDate || 'Oct 2026'}</td>
          <td><span class="status-badge ${a.stage === 'Offer Extended' ? 'status-completed' : (a.stage === 'Interview Scheduled' ? 'status-active' : 'status-review')}">${a.stage}</span></td>
          <td style="font-size: 12px; color: #475569;">${a.recruiterNotes || 'Application actively reviewed under autumn cycle'}</td>
        </tr>
      `).join('');
    }
  }
}

// =============================================================================
// 11. FACULTY SUPERVISION MODULE (Dedicated Evaluations, Roster, Viva & Sheet)
// =============================================================================
class FacultyModule {
  constructor() {
    appEventBus.subscribe('faculty:submissions_updated', () => this.render());
    appEventBus.subscribe('faculty:schedule_updated', () => this.renderSchedule());
    appEventBus.subscribe('projects:updated', () => {
      this.renderRoster();
      this.renderReport();
    });
    appEventBus.subscribe('store:ready', () => {
      this.render();
      this.renderSchedule();
      this.renderReport();
    });
    appEventBus.subscribe('user:switched', () => {
      this.render();
      this.renderSchedule();
      this.renderReport();
    });
  }

  render() {
    const tbody = document.getElementById('facultyTableBody');
    const allSubsBody = document.getElementById('facultyAllSubmissionsBody');
    const pendingCountEl = document.getElementById('statFacultyPending');
    const activeProjCountEl = document.getElementById('statFacultyProjects');

    if (activeProjCountEl) activeProjCountEl.textContent = String(store.state.projects.length).padStart(2, '0');

    const subs = store.state.facultySubmissions;
    const pendingSubs = subs.filter(s => s.status === 'Pending Review');
    if (pendingCountEl) pendingCountEl.textContent = String(pendingSubs.length).padStart(2, '0');

    if (tbody) {
      if (!subs.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color:#94a3b8;">No milestone submissions in queue.</td></tr>`;
      } else {
        tbody.innerHTML = subs.map(sub => {
          let actionHtml = '';
          if (sub.status === 'Approved') {
            actionHtml = `
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="status-badge status-completed" style="font-weight:700;">✓ ${sub.grade || 'Approved'}</span>
                <button class="btn-secondary" style="width: auto; padding: 4px 8px; font-size: 11px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                  View
                </button>
              </div>
            `;
          } else if (sub.status === 'Needs Revision') {
            actionHtml = `
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="status-badge" style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-size:11px;">⚠️ Revision (${sub.grade || '8/10'})</span>
                <button class="btn-secondary" style="width: auto; padding: 4px 8px; font-size: 11px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                  Re-evaluate
                </button>
              </div>
            `;
          } else {
            actionHtml = `
              <button class="btn-primary" style="width: auto; padding: 6px 14px; font-size: 12px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                Evaluate &rarr;
              </button>
            `;
          }

          return `
            <tr>
              <td><strong>${sub.studentName}</strong><br><span style="font-size: 11px; color:#94a3b8;">${sub.studentRegNo}</span></td>
              <td>${sub.projectTitle}</td>
              <td><strong>${sub.milestoneTitle}</strong></td>
              <td>${sub.submittedAt}</td>
              <td><span class="status-badge ${sub.status === 'Approved' ? 'status-completed' : (sub.status === 'Pending Review' ? 'status-review' : 'status-active')}">${sub.status}</span></td>
              <td>${actionHtml}</td>
            </tr>
          `;
        }).join('');
      }
    }

    if (allSubsBody) {
      if (!subs.length) {
        allSubsBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color:#94a3b8;">No submissions in registry.</td></tr>`;
      } else {
        allSubsBody.innerHTML = subs.map(sub => {
          let actionHtml = '';
          if (sub.status === 'Approved') {
            actionHtml = `
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="status-badge status-completed" style="font-weight:700;">✓ Graded (${sub.grade || 'Approved'})</span>
                <button class="btn-secondary" style="width: auto; padding: 4px 10px; font-size: 11px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                  View Details
                </button>
              </div>
            `;
          } else if (sub.status === 'Needs Revision') {
            actionHtml = `
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="status-badge" style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-weight:700;">⚠️ Revision (${sub.grade || '8/10'})</span>
                <button class="btn-secondary" style="width: auto; padding: 4px 10px; font-size: 11px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                  Re-evaluate
                </button>
              </div>
            `;
          } else {
            actionHtml = `
              <button class="btn-primary" style="width: auto; padding: 6px 14px; font-size: 12px;" onclick="window.openFacultyReviewModal('${sub.id}', '${sub.studentName}', '${sub.milestoneTitle}')">
                Grade &amp; Approve &rarr;
              </button>
            `;
          }

          return `
            <tr>
              <td><strong>${sub.studentName}</strong><br><span style="font-size: 11px; color:#94a3b8;">${sub.studentRegNo}</span></td>
              <td>${sub.projectTitle}</td>
              <td><strong>${sub.milestoneTitle}</strong></td>
              <td>${sub.submittedAt}</td>
              <td><a href="${sub.repoUrl || 'https://github.com'}" target="_blank" style="color:#4f46e5; text-decoration:underline; font-size:12px;">Inspect Repository &rarr;</a></td>
              <td><span class="status-badge ${sub.status === 'Approved' ? 'status-completed' : (sub.status === 'Pending Review' ? 'status-review' : 'status-active')}">${sub.status}</span></td>
              <td>${actionHtml}</td>
            </tr>
          `;
        }).join('');
      }
    }

    this.renderRoster();
    this.renderSchedule();
    this.renderReport();
  }

  renderRoster() {
    const roster = document.getElementById('facultyProjectsRoster');
    if (!roster) return;

    roster.innerHTML = store.state.projects.map(p => {
      const completed = (p.milestones || []).filter(m => m.completed).length;
      const total = (p.milestones || []).length;
      const pct = total ? Math.round((completed / total) * 100) : 0;

      return `
        <div class="intern-card">
          <div class="intern-card-header">
            <div class="company-logo">📊</div>
            <div>
              <h4 class="intern-role-title">${p.title}</h4>
              <div class="intern-company-meta">Team Lead: ${p.leadName} (${p.leadRegNo})</div>
            </div>
            <span class="status-badge ${pct === 100 ? 'status-completed' : 'status-active'}">${pct === 100 ? 'Complete' : 'On Track'}</span>
          </div>
          <div style="font-size: 12px; color: #475569; margin: 10px 0;">
            <div><strong>Active Sprint Tasks:</strong> ${(p.tasks || []).length} items</div>
            <div><strong>Completed Milestones:</strong> ${completed} / ${total} (${pct}%)</div>
            <div style="margin-top: 4px;"><strong>Tech Stack:</strong> ${(p.techStack || []).join(', ')}</div>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            <a href="${p.repoUrl}" target="_blank" style="font-size: 12px; color: #4f46e5; text-decoration: underline;">Inspect Code Repo &rarr;</a>
            <button class="btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="window.openScheduleVivaForProject('${p.id}', '${p.title}', '${p.leadName}')">
              Schedule Viva
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderSchedule() {
    const tbody = document.getElementById('facultyScheduleTableBody');
    if (!tbody) return;

    const list = store.state.facultySchedule || [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#94a3b8;">No viva sessions scheduled yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.projectTitle}</strong></td>
        <td>${item.studentLead}</td>
        <td><span class="status-badge status-review">${item.type || item.sessionType || 'Viva Defense'}</span></td>
        <td><strong>${item.dateTime || (item.date ? `${item.date} • ${item.time}` : 'Scheduled')}</strong></td>
        <td style="font-size: 12px; color: #64748b;">${item.agenda || item.venue || 'Milestone verification'}</td>
        <td><span class="status-badge status-active">${item.status || 'Scheduled'}</span></td>
        <td>
          <a href="${item.meetingLink || item.meetUrl || 'https://meet.google.com'}" target="_blank" class="btn-primary" style="display:inline-block; width:auto; padding:4px 12px; font-size:11px; text-decoration:none;">
            Join Meet &rarr;
          </a>
        </td>
      </tr>
    `).join('');
  }

  renderReport() {
    const tbody = document.getElementById('facultyReportTableBody');
    if (!tbody) return;

    tbody.innerHTML = store.state.projects.map(p => {
      const completed = (p.milestones || []).filter(m => m.completed).length;
      const total = (p.milestones || []).length;
      const members = (p.members || []).map(m => m.name).join(', ') || p.leadName;
      const avgGrade = completed > 0 ? '9.4 / 10 (Grade S)' : 'Pending Evaluation';

      return `
        <tr>
          <td><strong>${p.title}</strong><br><span style="font-size:11px; color:#64748b;">Lead: ${p.leadName} (${p.leadRegNo})</span></td>
          <td>${members}</td>
          <td><strong>${completed} / ${total}</strong> Approved</td>
          <td><strong style="color:#059669;">${avgGrade}</strong></td>
          <td><span class="status-badge status-completed">Recommended for Credits</span></td>
        </tr>
      `;
    }).join('');
  }
}

// =============================================================================
// 12. RECRUITER & TALENT PIPELINE MODULE (Pipeline, Interviews, Offers, Analytics)
// =============================================================================
class RecruiterModule {
  constructor() {
    appEventBus.subscribe('applications:updated', () => {
      this.renderPipeline();
      this.renderFunnel();
    });
    appEventBus.subscribe('internships:updated', () => this.renderJobsTable());
    appEventBus.subscribe('recruiter:interviews_updated', () => this.renderInterviews());
    appEventBus.subscribe('recruiter:offers_updated', () => this.renderOffers());
    appEventBus.subscribe('store:ready', () => {
      this.renderPipeline();
      this.renderJobsTable();
      this.renderInterviews();
      this.renderOffers();
      this.renderFunnel();
    });
    appEventBus.subscribe('user:switched', () => {
      this.renderPipeline();
      this.renderJobsTable();
      this.renderInterviews();
      this.renderOffers();
      this.renderFunnel();
    });
  }

  renderPipeline() {
    const board = document.getElementById('recruiterPipelineBoard');
    const statApplicants = document.getElementById('statRecruiterApplicants');
    const statShortlisted = document.getElementById('statRecruiterShortlisted');
    const statInterviews = document.getElementById('statRecruiterInterviews');

    const apps = store.state.applications;

    if (statApplicants) statApplicants.textContent = String(apps.length);
    if (statShortlisted) statShortlisted.textContent = String(apps.filter(a => a.stage === 'Shortlisted').length);
    if (statInterviews) statInterviews.textContent = String(apps.filter(a => a.stage === 'Interview Scheduled').length);

    if (!board) return;

    const stages = [
      { id: 'Received', title: 'Received', icon: '📥' },
      { id: 'Under Review', title: 'Under Review', icon: '🔍' },
      { id: 'Shortlisted', title: 'Shortlisted', icon: '⭐' },
      { id: 'Interview Scheduled', title: 'Interview Scheduled', icon: '🗓️' },
      { id: 'Offer Extended', title: 'Offer Extended', icon: '🎉' }
    ];

    board.innerHTML = stages.map(st => {
      const candidates = apps.filter(a => a.stage === st.id);
      return `
        <div class="pipeline-col">
          <div class="pipeline-col-header">
            <div class="pipeline-col-title">
              <span>${st.icon}</span>
              <span>${st.title}</span>
            </div>
            <span class="pipeline-badge-count">${candidates.length}</span>
          </div>

          <div class="pipeline-cards-list">
            ${candidates.length === 0 ? `<div style="font-size: 11px; color:#94a3b8; text-align:center; padding: 24px 0;">No candidates</div>` : ''}
            ${candidates.map(c => `
              <div class="candidate-card" onclick="window.openCandidateModal('${c.id}')">
                <div class="candidate-card-top">
                  <div class="candidate-avatar">${c.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
                  <span class="status-badge status-review" style="font-size: 10px;">CGPA ${c.studentCgpa || '8.4'}</span>
                </div>
                <div class="candidate-name">${c.studentName}</div>
                <div class="candidate-meta">${c.internshipTitle}</div>
                <div class="candidate-meta" style="font-size: 11px; color: #94a3b8;">Applied: ${c.appliedDate}</div>
                <div class="candidate-tags">
                  <span class="candidate-tag">ATS 94%</span>
                  <span class="candidate-tag">Resume Attached</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  renderJobsTable() {
    const tbody = document.getElementById('recruiterJobsTableBody');
    const jobsCountEl = document.getElementById('statRecruiterJobs');

    if (jobsCountEl) jobsCountEl.textContent = String(store.state.internships.length).padStart(2, '0');
    if (!tbody) return;

    tbody.innerHTML = store.state.internships.map(job => `
      <tr>
        <td><strong>${job.title}</strong><br><span style="font-size: 11px; color:#94a3b8;">${job.company}</span></td>
        <td>${job.type}</td>
        <td>${job.stipend}</td>
        <td><strong>${job.applicants || 0}</strong> applicants</td>
        <td>${job.deadline}</td>
        <td><span class="status-badge status-active">${job.status || 'Active'}</span></td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; background:#fef2f2; color:#991b1b; border-color:#fecaca;" onclick="window.deleteJobPosting('${job.id}')">
            Close Role
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderInterviews() {
    const tbody = document.getElementById('recruiterInterviewsTableBody');
    if (!tbody) return;

    const list = store.state.recruiterInterviews || [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#94a3b8;">No candidate interviews scheduled yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.candidateName}</strong></td>
        <td>${item.roleTitle}</td>
        <td><span class="status-badge status-review">${item.round}</span></td>
        <td><strong>${item.dateTime || (item.date ? `${item.date} • ${item.time}` : 'Scheduled')}</strong></td>
        <td><a href="${item.link || item.meetUrl || 'https://meet.google.com'}" target="_blank" style="color:#4f46e5; text-decoration:underline; font-size:12px;">${item.link || item.meetUrl || 'Join Video Meet'}</a></td>
        <td>${item.interviewer}</td>
        <td><span class="status-badge status-active">${item.status || 'Confirmed'}</span></td>
      </tr>
    `).join('');
  }

  renderOffers() {
    const tbody = document.getElementById('recruiterOffersTableBody');
    if (!tbody) return;

    const list = store.state.recruiterOffers || [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#94a3b8;">No formal job offers extended yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.candidateName}</strong></td>
        <td>${item.roleTitle}</td>
        <td><strong style="color:#059669;">${item.stipend}</strong></td>
        <td>${item.joiningDate || item.startDate || 'Nov 15, 2026'}</td>
        <td style="font-size:12px; color:#64748b;">${item.duration || '6 Months'} &bull; <a href="${item.letterUrl || 'https://portal.hyperscale.ai/offers/OFFER-2026.pdf'}" target="_blank" style="color:#4f46e5; text-decoration:underline;">View Letter</a></td>
        <td><span class="status-badge status-completed">${item.status || 'Extended'}</span></td>
      </tr>
    `).join('');
  }

  renderFunnel() {
    // updates funnel metrics if visible
  }
}

// =============================================================================
// 12. AUTHENTICATION MODULE (Role Selection First -> Sign In / Sign Up)
// =============================================================================
class AuthModule {
  constructor() {
    this.authForm = document.getElementById('authForm');
    this.registerForm = document.getElementById('registerForm');
    this.forgotForm = document.getElementById('forgotForm');
    this.selectedRole = 'student';

    this.initEvents();
  }

  initEvents() {
    if (this.authForm) {
      this.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('authLoginError');
        if (errEl) errEl.style.display = 'none';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
          const res = await api.post('/api/auth/login', { email, password, role: this.selectedRole });
          store.state.currentUser = res.user;
          store.state.isLoggedIn = true;
          sessionStorage.setItem('auth_session_active', 'true');
          if (res.token) localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          localStorage.setItem('auth_user_id', res.user.id);

          await store.init();
          window.notificationService.show(`Welcome, ${res.user.name}! Connected to ${res.user.role.toUpperCase()} Workspace.`, 'success');
          window.appRouter.updateRoleUi(res.user.role);
        } catch (err) {
          if (errEl) {
            errEl.textContent = `⚠️ ${err.message}`;
            errEl.style.display = 'block';
          }
          window.notificationService.show(err.message, 'error');
        }
      });
    }

    if (this.registerForm) {
      this.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('authRegisterError');
        if (errEl) errEl.style.display = 'none';

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const regNo = document.getElementById('regExtra').value.trim();
        const dept = document.getElementById('regDept').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
          const payload = {
            name,
            email,
            role: this.selectedRole,
            regNo: this.selectedRole === 'student' ? regNo : undefined,
            company: this.selectedRole === 'recruiter' ? regNo : undefined,
            employeeId: this.selectedRole === 'faculty' ? regNo : undefined,
            department: dept,
            password
          };

          const res = await api.post('/api/auth/register', payload);
          store.state.currentUser = res.user;
          store.state.isLoggedIn = true;
          sessionStorage.setItem('auth_session_active', 'true');
          if (res.token) localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          localStorage.setItem('auth_user_id', res.user.id);

          await store.init();
          window.notificationService.show(`Account registered successfully as ${this.selectedRole.toUpperCase()}!`, 'success');
          window.appRouter.updateRoleUi(res.user.role);
        } catch (err) {
          if (errEl) {
            errEl.textContent = `⚠️ ${err.message}`;
            errEl.style.display = 'block';
          }
          window.notificationService.show(err.message, 'error');
        }
      });
    }

    if (this.forgotForm) {
      this.forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        try {
          const res = await api.post('/api/auth/forgot-password', { email });
          window.notificationService.show(res.message, 'success');
          window.switchAuthTab('signin');
        } catch (err) {
          window.notificationService.show(err.message, 'error');
        }
      });
    }
  }

  setRole(role) {
    this.selectedRole = role;

    // Highlight active card
    const cardS = document.getElementById('cardRoleStudent');
    const cardF = document.getElementById('cardRoleFaculty');
    const cardR = document.getElementById('cardRoleRecruiter');

    [cardS, cardF, cardR].forEach(c => c && c.classList.remove('active'));
    if (role === 'student' && cardS) cardS.classList.add('active');
    if (role === 'faculty' && cardF) cardF.classList.add('active');
    if (role === 'recruiter' && cardR) cardR.classList.add('active');

    // Clear any previous error messages
    const errLogin = document.getElementById('authLoginError');
    const errReg = document.getElementById('authRegisterError');
    if (errLogin) errLogin.style.display = 'none';
    if (errReg) errReg.style.display = 'none';

    // Tailor the Step 2 Header & Form Labels
    const step2Title = document.getElementById('authStep2Title');
    const lblEmail = document.getElementById('lblLoginEmail');
    const inputEmail = document.getElementById('loginEmail');
    const inputPass = document.getElementById('loginPassword');
    const btnSubmit = document.getElementById('btnSubmitAuth');
    const btnReg = document.getElementById('btnSubmitRegister');
    const lblExtra = document.getElementById('lblRegExtra');
    const inputExtra = document.getElementById('regExtra');

    if (inputPass) inputPass.value = '';

    if (role === 'student') {
      if (step2Title) step2Title.textContent = 'Step 2: Sign In as Student';
      if (lblEmail) lblEmail.textContent = 'Institutional Student Email';
      if (inputEmail) {
        inputEmail.placeholder = 'srishti.jain2024@vitstudent.ac.in';
        inputEmail.value = 'srishti.jain2024@vitstudent.ac.in';
      }
      if (btnSubmit) btnSubmit.textContent = 'Sign In to Student Dashboard →';
      if (btnReg) btnReg.textContent = 'Create Student Account →';
      if (lblExtra) lblExtra.textContent = 'Registration No. *';
      if (inputExtra) inputExtra.placeholder = 'e.g. 24BRS1412';
    } else if (role === 'faculty') {
      if (step2Title) step2Title.textContent = 'Step 2: Sign In as Faculty Mentor';
      if (lblEmail) lblEmail.textContent = 'Institutional Faculty Email';
      if (inputEmail) {
        inputEmail.placeholder = 'faculty@vit.ac.in';
        inputEmail.value = 'faculty@vit.ac.in';
      }
      if (btnSubmit) btnSubmit.textContent = 'Sign In to Faculty Portal →';
      if (btnReg) btnReg.textContent = 'Create Faculty Mentor Account →';
      if (lblExtra) lblExtra.textContent = 'Employee ID *';
      if (inputExtra) inputExtra.placeholder = 'e.g. VIT-FAC-4081';
    } else if (role === 'recruiter') {
      if (step2Title) step2Title.textContent = 'Step 2: Sign In as Recruiter';
      if (lblEmail) lblEmail.textContent = 'Work / Recruiter Email';
      if (inputEmail) {
        inputEmail.placeholder = 'recruiter@hyperscale.ai';
        inputEmail.value = 'recruiter@hyperscale.ai';
      }
      if (btnSubmit) btnSubmit.textContent = 'Sign In to Recruiter Hub →';
      if (btnReg) btnReg.textContent = 'Create Recruiter / Employer Account →';
      if (lblExtra) lblExtra.textContent = 'Company Name *';
      if (inputExtra) inputExtra.placeholder = 'e.g. HyperScale AI';
    }
  }
}

// =============================================================================
// 13. GLOBAL WINDOW ACTIONS (Interactive Handlers & Modals)
// =============================================================================

// Modal Control
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

// Role Selection in Login Gateway
window.selectAuthRole = function(role) {
  if (window.authModule) {
    window.authModule.setRole(role);
  }
};

// Global Resume Upload State for Applications
window.selectedApplicationResume = null;

window.handleApplicationResumeUpload = function(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  window.selectedApplicationResume = {
    fileName: file.name,
    fileSize: sizeStr
  };

  const dropZone = document.getElementById('applyResumeDropZone');
  const uploadText = document.getElementById('applyResumeUploadText');
  const uploadSub = document.getElementById('applyResumeUploadSub');
  const customOption = document.getElementById('applyResumeCustomOption');
  const resumeSelect = document.getElementById('applyResumeSelect');

  if (dropZone) {
    dropZone.style.borderColor = '#10b981';
    dropZone.style.background = '#ecfdf5';
  }
  if (uploadText) {
    uploadText.textContent = `✓ Attached: ${file.name}`;
    uploadText.style.color = '#065f46';
  }
  if (uploadSub) {
    uploadSub.textContent = `File size: ${sizeStr} • Verified & ready to upload`;
    uploadSub.style.color = '#047857';
  }
  if (customOption) {
    customOption.disabled = false;
    customOption.value = file.name;
    customOption.textContent = `Custom Upload: ${file.name} (${sizeStr})`;
  }
  if (resumeSelect) {
    resumeSelect.value = file.name;
  }
  window.notificationService.show(`Resume '${file.name}' attached to application!`, 'success');
};

window.handleApplicationResumeSelect = function(e) {
  if (e.target.value === 'profile') {
    window.selectedApplicationResume = null;
    const uploadText = document.getElementById('applyResumeUploadText');
    const uploadSub = document.getElementById('applyResumeUploadSub');
    const dropZone = document.getElementById('applyResumeDropZone');
    if (uploadText) {
      uploadText.textContent = 'Click to browse & upload a custom resume file';
      uploadText.style.color = '#1e293b';
    }
    if (uploadSub) {
      uploadSub.textContent = 'Supported formats: PDF, DOC, DOCX (Max 5MB)';
      uploadSub.style.color = '#64748b';
    }
    if (dropZone) {
      dropZone.style.borderColor = '#cbd5e1';
      dropZone.style.background = '#f8fafc';
    }
  }
};

window.logoutUser = async function() {
  try {
    await api.post('/api/auth/logout', {});
  } catch (e) {}
  sessionStorage.removeItem('auth_session_active');
  store.logout();
  window.notificationService.show('You have been signed out. Please choose a role to sign in.', 'info');
};

window.navigateToRoleDashboard = function() {
  if (!store.state.currentUser || !store.state.isLoggedIn) {
    window.appRouter.navigateTo('auth');
    return;
  }
  const role = store.state.currentUser.role;
  if (role === 'student') window.appRouter.navigateTo('dashboard');
  else if (role === 'faculty') window.appRouter.navigateTo('faculty');
  else if (role === 'recruiter') window.appRouter.navigateTo('recruiter');
  else window.appRouter.navigateTo('auth');
};

window.switchAuthTab = function(tab) {
  const fSign = document.getElementById('authForm');
  const fReg = document.getElementById('registerForm');
  const fForg = document.getElementById('forgotForm');
  const tSign = document.getElementById('tabSignIn');
  const tReg = document.getElementById('tabRegister');
  const tForg = document.getElementById('tabForgot');
  const step2Title = document.getElementById('authStep2Title');
  const curRole = window.authModule ? window.authModule.selectedRole : 'student';

  const errLogin = document.getElementById('authLoginError');
  const errReg = document.getElementById('authRegisterError');
  if (errLogin) errLogin.style.display = 'none';
  if (errReg) errReg.style.display = 'none';

  [tSign, tReg, tForg].forEach(t => t && t.classList.remove('active'));

  if (tab === 'signin') {
    if (fSign) fSign.style.display = 'block';
    if (fReg) fReg.style.display = 'none';
    if (fForg) fForg.style.display = 'none';
    if (tSign) tSign.classList.add('active');
    if (step2Title) step2Title.textContent = `Step 2: Sign In as ${curRole.charAt(0).toUpperCase() + curRole.slice(1)}`;
  } else if (tab === 'register') {
    if (fSign) fSign.style.display = 'none';
    if (fReg) fReg.style.display = 'block';
    if (fForg) fForg.style.display = 'none';
    if (tReg) tReg.classList.add('active');
    if (step2Title) step2Title.textContent = `Step 2: Sign Up (Register) as ${curRole.charAt(0).toUpperCase() + curRole.slice(1)}`;
  } else if (tab === 'forgot') {
    if (fSign) fSign.style.display = 'none';
    if (fReg) fReg.style.display = 'none';
    if (fForg) fForg.style.display = 'block';
    if (tForg) tForg.classList.add('active');
    if (step2Title) step2Title.textContent = `Account Password Recovery`;
  }
};

// Application Modal Handlers
let currentApplyingInternshipId = null;
window.openApplyModal = function(internshipId) {
  currentApplyingInternshipId = internshipId;
  window.selectedApplicationResume = null;
  const opp = store.state.internships.find(i => i.id === internshipId);
  const info = document.getElementById('applyModalRoleInfo');
  if (info && opp) {
    info.innerHTML = `<strong>${opp.title}</strong> &bull; ${opp.company}<br><span style="color:#64748b;">${opp.type} &bull; Stipend: ${opp.stipend} &bull; Deadline: ${opp.deadline}</span>`;
  }

  // Reset resume upload zone
  const dropZone = document.getElementById('applyResumeDropZone');
  const uploadText = document.getElementById('applyResumeUploadText');
  const uploadSub = document.getElementById('applyResumeUploadSub');
  const customOption = document.getElementById('applyResumeCustomOption');
  const fileInput = document.getElementById('applyResumeFileInput');
  const resumeSelect = document.getElementById('applyResumeSelect');

  if (dropZone) { dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = '#f8fafc'; }
  if (uploadText) { uploadText.textContent = 'Click to browse & upload a custom resume file'; uploadText.style.color = '#1e293b'; }
  if (uploadSub) { uploadSub.textContent = 'Supported formats: PDF, DOC, DOCX (Max 5MB)'; uploadSub.style.color = '#64748b'; }
  if (fileInput) fileInput.value = '';
  if (customOption) { customOption.disabled = true; customOption.textContent = 'No custom file uploaded yet'; }
  if (resumeSelect) resumeSelect.value = 'profile';

  window.openModal('applyModal');
};

window.submitInternshipApplication = async function() {
  if (!currentApplyingInternshipId) return;
  const coverLetter = document.getElementById('applyCoverLetter').value;
  const resumeSelect = document.getElementById('applyResumeSelect');

  let resumeName = 'Srishti_Jain_Resume.pdf';
  let resumeSize = '1.4 MB';
  if (window.selectedApplicationResume) {
    resumeName = window.selectedApplicationResume.fileName;
    resumeSize = window.selectedApplicationResume.fileSize;
  } else if (resumeSelect && resumeSelect.value !== 'profile') {
    resumeName = resumeSelect.value;
  } else if (store.state.currentUser && store.state.currentUser.resume) {
    resumeName = store.state.currentUser.resume.fileName;
    resumeSize = store.state.currentUser.resume.fileSize;
  }

  try {
    const res = await api.post('/api/applications', {
      internshipId: currentApplyingInternshipId,
      coverLetter,
      resumeName,
      resumeSize
    });
    window.closeModal('applyModal');
    window.notificationService.show(res.message, 'success');
    window.selectedApplicationResume = null;
    await Promise.all([
      store.fetchInternships(),
      store.fetchApplications(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.resetInternshipFilters = function() {
  const search = document.getElementById('internSearchInput');
  const type = document.getElementById('filterType');
  const tag = document.getElementById('filterTag');
  if (search) search.value = '';
  if (type) type.value = 'all';
  if (tag) tag.value = 'all';
  store.fetchInternships();
};

// Recruiter Handlers
window.openPostJobModal = function() {
  window.openModal('postJobModal');
};

window.submitNewJob = async function() {
  const title = document.getElementById('jobTitle').value;
  const company = document.getElementById('jobCompany').value;
  const type = document.getElementById('jobType').value;
  const stipend = document.getElementById('jobStipend').value;
  const duration = document.getElementById('jobDuration').value;
  const deadline = document.getElementById('jobDeadline').value;
  const tags = document.getElementById('jobTags').value;
  const desc = document.getElementById('jobDesc').value;

  try {
    const res = await api.post('/api/internships', {
      title, company, type, stipend, duration, deadline, tags, desc
    });
    window.closeModal('postJobModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchInternships(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.deleteJobPosting = async function(id) {
  try {
    const res = await api.delete(`/api/internships/${id}`);
    window.notificationService.show(res.message, 'info');
    await Promise.all([
      store.fetchInternships(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

let currentCandidateAppId = null;
window.openCandidateModal = function(appId) {
  currentCandidateAppId = appId;
  const app = store.state.applications.find(a => a.id === appId);
  const details = document.getElementById('candidateModalDetails');
  const stageSelect = document.getElementById('candidateStageSelect');
  const notesInput = document.getElementById('candidateNotesInput');

  if (details && app) {
    details.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; font-size:13px; line-height:1.6;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong>${app.studentName} (${app.studentRegNo || '24BRS1412'})</strong>
          <span class="status-badge status-review">${app.stage}</span>
        </div>
        <div><strong>Applied For:</strong> ${app.internshipTitle} &bull; ${app.appliedDate}</div>
        <div><strong>CGPA:</strong> ${app.studentCgpa || '8.42'} / 10.0 &bull; <strong>ATS Resume:</strong> ${app.resumeName || 'Resume.pdf'} (94% Match)</div>
        <div style="margin-top:10px; padding:10px; background:white; border:1px solid #e2e8f0; border-radius:6px;">
          <em>"${app.coverLetter || 'No cover letter provided.'}"</em>
        </div>
      </div>
    `;
    if (stageSelect) stageSelect.value = app.stage;
    if (notesInput) notesInput.value = app.recruiterNotes || '';
  }
  window.openModal('candidateModal');
};

window.saveCandidatePipelineDecision = async function() {
  if (!currentCandidateAppId) return;
  const stage = document.getElementById('candidateStageSelect').value;
  const recruiterNotes = document.getElementById('candidateNotesInput').value;

  try {
    const res = await api.patch(`/api/applications/${currentCandidateAppId}/stage`, { stage, recruiterNotes });
    window.closeModal('candidateModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchApplications(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.switchRecruiterTab = function(tab) {
  const pView = document.getElementById('recruiterPipelineView');
  const jView = document.getElementById('recruiterJobsView');
  const tPip = document.getElementById('tabRecruiterPipeline');
  const tJob = document.getElementById('tabRecruiterJobs');

  if (tab === 'pipeline') {
    if (pView) pView.style.display = 'block';
    if (jView) jView.style.display = 'none';
    if (tPip) tPip.classList.add('active');
    if (tJob) tJob.classList.remove('active');
  } else {
    if (pView) pView.style.display = 'none';
    if (jView) jView.style.display = 'block';
    if (tPip) tPip.classList.remove('active');
    if (tJob) tJob.classList.add('active');
  }
};

// Projects & Kanban Handlers
window.switchProjectTab = function(tab) {
  const kView = document.getElementById('projectKanbanView');
  const mView = document.getElementById('projectMilestonesView');
  const dView = document.getElementById('projectDirectoryView');
  const tKan = document.getElementById('tabProjectKanban');
  const tMil = document.getElementById('tabProjectMilestones');
  const tDir = document.getElementById('tabProjectDirectory');

  [kView, mView, dView].forEach(v => v && (v.style.display = 'none'));
  [tKan, tMil, tDir].forEach(t => t && t.classList.remove('active'));

  if (tab === 'kanban') {
    if (kView) kView.style.display = 'block';
    if (tKan) tKan.classList.add('active');
  } else if (tab === 'milestones') {
    if (mView) mView.style.display = 'block';
    if (tMil) tMil.classList.add('active');
  } else if (tab === 'directory') {
    if (dView) dView.style.display = 'block';
    if (tDir) tDir.classList.add('active');
  }
};

window.openNewProjectModal = function() {
  window.openModal('newProjectModal');
};

window.submitNewProject = async function() {
  const title = document.getElementById('projTitleInput').value;
  const tagline = document.getElementById('projTaglineInput').value;
  const techStack = document.getElementById('projTechInput').value;
  const repoUrl = document.getElementById('projRepoInput').value;

  try {
    const res = await api.post('/api/projects', { title, tagline, techStack, repoUrl });
    window.closeModal('newProjectModal');
    window.notificationService.show(res.message, 'success');
    await store.fetchProjects();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.openAddTaskModal = function(col = 'todo') {
  const sel = document.getElementById('taskColumnSelect');
  if (sel) sel.value = col;
  window.openModal('addTaskModal');
};

window.submitNewTask = async function() {
  const title = document.getElementById('taskTitleInput').value;
  const column = document.getElementById('taskColumnSelect').value;
  const priority = document.getElementById('taskPrioritySelect').value;
  const assignee = document.getElementById('taskAssigneeInput').value;
  const proj = store.state.projects[0];
  if (!proj) return;

  try {
    const res = await api.post(`/api/projects/${proj.id}/tasks`, { title, column, priority, assignee });
    window.closeModal('addTaskModal');
    window.notificationService.show('Task added to sprint column!', 'success');
    await store.fetchProjects();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.moveTask = async function(projId, taskId, targetCol) {
  try {
    await api.patch(`/api/projects/${projId}/tasks/${taskId}`, { column: targetCol });
    await store.fetchProjects();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

let currentJoinProjId = null;
window.openJoinProjectModal = function(projId, title) {
  currentJoinProjId = projId;
  const info = document.getElementById('joinModalProjectInfo');
  if (info) info.innerHTML = `Project: <strong>${title}</strong>`;
  window.openModal('joinProjectModal');
};

window.submitJoinRequest = async function() {
  if (!currentJoinProjId) return;
  const pitch = document.getElementById('joinPitchInput').value;
  try {
    const res = await api.post(`/api/projects/${currentJoinProjId}/join-requests`, { pitch });
    window.closeModal('joinProjectModal');
    window.notificationService.show(res.message, 'success');
    await store.fetchProjects();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.respondJoinRequest = async function(projId, reqId, status) {
  try {
    const res = await api.patch(`/api/projects/${projId}/join-requests/${reqId}`, { status });
    window.notificationService.show(res.message, 'info');
    await store.fetchProjects();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

// Milestone Submission & Faculty Review Handlers
window.openSubmitMilestoneModal = function(milestoneId) {
  const sel = document.getElementById('submitMilestoneSelect');
  if (sel && milestoneId) sel.value = milestoneId;
  window.openModal('submitMilestoneModal');
};

window.submitMilestoneToFaculty = async function() {
  const proj = store.state.projects[0];
  if (!proj) return;
  const milestoneId = document.getElementById('submitMilestoneSelect').value;
  const repoUrl = document.getElementById('submitMilestoneRepo').value;
  const deliverables = document.getElementById('submitMilestoneDeliverables').value;

  try {
    const res = await api.post(`/api/projects/${proj.id}/milestones/${milestoneId}/submit`, { repoUrl, deliverables });
    window.closeModal('submitMilestoneModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchProjects(),
      store.fetchFacultySubmissions()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

let currentFacultySubId = null;
window.openFacultyReviewModal = function(subId, student, milestone) {
  currentFacultySubId = subId;
  const sub = store.state.facultySubmissions.find(s => s.id === subId);
  const details = document.getElementById('reviewModalDetails');
  const gradeInput = document.getElementById('facultyGradeInput');
  const feedbackInput = document.getElementById('facultyFeedbackInput');

  if (details) {
    details.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div><strong>Student Candidate:</strong> ${student}</div>
        <span class="status-badge ${sub && sub.status === 'Approved' ? 'status-completed' : (sub && sub.status === 'Needs Revision' ? 'status-active' : 'status-review')}">${sub ? sub.status : 'Pending Review'}</span>
      </div>
      <div style="margin-bottom:4px;"><strong>Project Title:</strong> ${sub ? sub.projectTitle : ''}</div>
      <div style="margin-bottom:6px;"><strong>Milestone Deliverable:</strong> ${milestone}</div>
      ${sub && sub.repoUrl ? `<div style="margin-top:6px;"><a href="${sub.repoUrl}" target="_blank" style="color:#4f46e5; text-decoration:underline;">Inspect Deliverables / Code Release &rarr;</a></div>` : ''}
      ${sub && sub.deliverables ? `<div style="margin-top:8px; padding:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; color:#475569; font-size:12px;">"${sub.deliverables}"</div>` : ''}
    `;
  }

  if (sub) {
    if (gradeInput) gradeInput.value = sub.grade || '9.5/10';
    if (feedbackInput) feedbackInput.value = sub.facultyNotes || '';
  }

  window.openModal('reviewModal');
};

window.submitFacultyDecision = async function(status) {
  if (!currentFacultySubId) return;
  const grade = document.getElementById('facultyGradeInput').value;
  const facultyNotes = document.getElementById('facultyFeedbackInput').value;

  try {
    const res = await api.patch(`/api/faculty/submissions/${currentFacultySubId}/review`, { status, grade, facultyNotes });
    window.closeModal('reviewModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchFacultySubmissions(),
      store.fetchProjects(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

// Profile & Resume Handlers
window.openEditProfileModal = function() {
  const u = store.state.currentUser;
  if (!u) return;
  const name = document.getElementById('editProfileName');
  const prog = document.getElementById('editProfileProgram');
  const cgpa = document.getElementById('editProfileCgpa');
  const grad = document.getElementById('editProfileGrad');
  const bio = document.getElementById('editProfileBio');
  const skills = document.getElementById('editProfileSkills');

  if (name) name.value = u.name || '';
  if (prog) prog.value = u.program || '';
  if (cgpa) cgpa.value = u.cgpa || '';
  if (grad) grad.value = u.graduationYear || '';
  if (bio) bio.value = u.bio || '';
  if (skills) skills.value = (u.skills || []).join(', ');

  window.openModal('editProfileModal');
};

window.saveStudentProfile = async function() {
  const name = document.getElementById('editProfileName').value;
  const program = document.getElementById('editProfileProgram').value;
  const cgpa = document.getElementById('editProfileCgpa').value;
  const graduationYear = document.getElementById('editProfileGrad').value;
  const bio = document.getElementById('editProfileBio').value;
  const skillsStr = document.getElementById('editProfileSkills').value;
  const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const res = await api.put('/api/profile', { name, program, cgpa, graduationYear, bio, skills });
    store.state.currentUser = res.profile;
    window.closeModal('editProfileModal');
    window.notificationService.show(res.message, 'success');
    appEventBus.publish('user:switched', res.profile);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.openResumePreviewModal = function() {
  const u = store.state.currentUser;
  const rName = document.getElementById('resumePreviewName');
  if (rName && u && u.resume) rName.textContent = u.resume.fileName;
  window.openModal('resumePreviewModal');
};

window.simulateResumeUpload = async function() {
  try {
    const res = await api.post('/api/profile/resume', {
      fileName: 'Srishti_Jain_Updated_Resume.pdf',
      fileSize: '1.6 MB',
      atsScore: '96% Match'
    });
    if (store.state.currentUser) store.state.currentUser.resume = res.resume;
    window.closeModal('resumePreviewModal');
    window.notificationService.show('New ATS Resume PDF uploaded and analyzed: 96% Match!', 'success');
    appEventBus.publish('user:switched', store.state.currentUser);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

// =============================================================================
// 14. RECRUITER & FACULTY COORDINATION MODAL HANDLERS
// =============================================================================

// Faculty Viva Defense Handlers
window.openScheduleVivaModal = function() {
  const dtInput = document.getElementById('vivaDateTimeInput');
  if (dtInput) {
    const now = new Date();
    now.setDate(now.getDate() + 3);
    now.setHours(14, 0, 0, 0);
    dtInput.value = now.toISOString().slice(0, 16);
  }
  window.openModal('scheduleVivaModal');
};

window.openScheduleVivaForProject = function(projId, title, lead) {
  const sel = document.getElementById('vivaProjectSelect');
  if (sel) {
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value.includes(projId) || sel.options[i].value.includes(title)) {
        sel.selectedIndex = i;
        break;
      }
    }
  }
  window.openScheduleVivaModal();
};

window.updateVivaTeamDetails = function(val) {
  // Option value contains teamId|projectTitle|studentLead
  console.log('Selected capstone project for viva:', val);
};

window.submitScheduleViva = async function() {
  const selVal = document.getElementById('vivaProjectSelect').value;
  const parts = selVal.split('|');
  const projectTitle = parts[1] || 'Capstone Project';
  const studentLead = parts[2] || 'Srishti Jain';
  const type = document.getElementById('vivaTypeSelect').value;
  const dateTime = document.getElementById('vivaDateTimeInput').value;
  const venue = document.getElementById('vivaVenueInput').value;
  const panel = document.getElementById('vivaPanelInput').value;

  if (!dateTime) {
    window.notificationService.show('Please select a date and time for the viva defense.', 'warning');
    return;
  }

  try {
    const res = await api.post('/api/faculty/schedule', {
      projectTitle,
      studentLead,
      type,
      dateTime,
      venue,
      panel,
      meetingLink: 'https://meet.google.com/vit-capstone-defense'
    });
    window.closeModal('scheduleVivaModal');
    window.notificationService.show(res.message, 'success');
    await store.fetchFacultySchedule();
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

// Recruiter Interview Scheduler Handlers
window.openScheduleInterviewModal = function(appId = null, name = null, role = null) {
  const dtInput = document.getElementById('scheduleInterviewDateTime');
  if (dtInput) {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(11, 30, 0, 0);
    dtInput.value = now.toISOString().slice(0, 16);
  }

  const app = appId ? store.state.applications.find(a => a.id === appId) : store.state.applications[0];
  const cName = name || (app ? app.studentName : 'Srishti Jain');
  const cRole = role || (app ? app.internshipTitle : 'Applied Candidate');
  const cAppId = appId || (app ? app.id : 'app_1');

  const nameText = document.getElementById('scheduleCandidateNameText');
  const roleText = document.getElementById('scheduleCandidateRoleText');
  const idInput = document.getElementById('scheduleCandidateAppId');
  const nameInput = document.getElementById('scheduleCandidateName');
  const roleInput = document.getElementById('scheduleCandidateRole');

  if (nameText) nameText.textContent = cName;
  if (roleText) roleText.textContent = `${cRole} • Application ID: ${cAppId}`;
  if (idInput) idInput.value = cAppId;
  if (nameInput) nameInput.value = cName;
  if (roleInput) roleInput.value = cRole;

  window.openModal('scheduleInterviewModal');
};

window.submitScheduleInterview = async function() {
  const applicationId = document.getElementById('scheduleCandidateAppId').value;
  const candidateName = document.getElementById('scheduleCandidateName').value;
  const roleTitle = document.getElementById('scheduleCandidateRole').value;
  const round = document.getElementById('scheduleInterviewRound').value;
  const dateTime = document.getElementById('scheduleInterviewDateTime').value;
  const interviewer = document.getElementById('scheduleInterviewInterviewer').value;
  const link = document.getElementById('scheduleInterviewLink').value;

  if (!dateTime) {
    window.notificationService.show('Please choose interview date and time.', 'warning');
    return;
  }

  try {
    const res = await api.post('/api/recruiter/interviews', {
      applicationId,
      candidateName,
      roleTitle,
      round,
      dateTime,
      interviewer,
      link
    });
    window.closeModal('scheduleInterviewModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchRecruiterInterviews(),
      store.fetchApplications(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

// Recruiter Offer Extension Handlers
window.openExtendOfferModal = function(appId = null, name = null, role = null) {
  const app = appId ? store.state.applications.find(a => a.id === appId) : store.state.applications[0];
  const cName = name || (app ? app.studentName : 'Srishti Jain');
  const cRole = role || (app ? app.internshipTitle : 'Applied Candidate');
  const cAppId = appId || (app ? app.id : 'app_1');

  const nameText = document.getElementById('offerCandidateNameText');
  const roleText = document.getElementById('offerCandidateRoleText');
  const idInput = document.getElementById('offerCandidateAppId');
  const nameInput = document.getElementById('offerCandidateName');
  const roleInput = document.getElementById('offerCandidateRole');
  const dateInput = document.getElementById('offerJoiningDateInput');

  if (nameText) nameText.textContent = cName;
  if (roleText) roleText.textContent = `${cRole} • Issue Formal Offer`;
  if (idInput) idInput.value = cAppId;
  if (nameInput) nameInput.value = cName;
  if (roleInput) roleInput.value = cRole;
  if (dateInput) dateInput.value = '2026-11-01';

  window.openModal('extendOfferModal');
};

window.submitExtendOffer = async function() {
  const applicationId = document.getElementById('offerCandidateAppId').value;
  const candidateName = document.getElementById('offerCandidateName').value;
  const roleTitle = document.getElementById('offerCandidateRole').value;
  const stipend = document.getElementById('offerStipendInput').value;
  const joiningDate = document.getElementById('offerJoiningDateInput').value;
  const duration = document.getElementById('offerDurationInput').value;
  const letterUrl = document.getElementById('offerLetterUrlInput').value;

  if (!joiningDate) {
    window.notificationService.show('Please specify expected joining date.', 'warning');
    return;
  }

  try {
    const res = await api.post('/api/recruiter/offers', {
      applicationId,
      candidateName,
      roleTitle,
      stipend,
      joiningDate,
      duration,
      letterUrl
    });
    window.closeModal('extendOfferModal');
    window.notificationService.show(res.message, 'success');
    await Promise.all([
      store.fetchRecruiterOffers(),
      store.fetchApplications(),
      store.fetchStats()
    ]);
  } catch (err) {
    window.notificationService.show(err.message, 'error');
  }
};

window.openCandidateScheduleInterview = function() {
  if (!currentCandidateAppId) return;
  const app = store.state.applications.find(a => a.id === currentCandidateAppId);
  window.closeModal('candidateModal');
  if (app) {
    window.openScheduleInterviewModal(app.id, app.studentName, app.internshipTitle);
  }
};

window.openCandidateExtendOffer = function() {
  if (!currentCandidateAppId) return;
  const app = store.state.applications.find(a => a.id === currentCandidateAppId);
  window.closeModal('candidateModal');
  if (app) {
    window.openExtendOfferModal(app.id, app.studentName, app.internshipTitle);
  }
};

window.switchRecruiterCoordinationTab = function(tab) {
  const iTab = document.getElementById('recruiterInterviewsSubTab');
  const oTab = document.getElementById('recruiterOffersSubTab');
  const btnI = document.getElementById('tabRecruiterInterviewsList');
  const btnO = document.getElementById('tabRecruiterOffersList');

  if (tab === 'interviews') {
    if (iTab) iTab.style.display = 'block';
    if (oTab) oTab.style.display = 'none';
    if (btnI) btnI.classList.add('active');
    if (btnO) btnO.classList.remove('active');
  } else {
    if (iTab) iTab.style.display = 'none';
    if (oTab) oTab.style.display = 'block';
    if (btnI) btnI.classList.remove('active');
    if (btnO) btnO.classList.add('active');
  }
};

window.printReport = function(role) {
  window.print();
};

// =============================================================================
// 15. APPLICATION INITIALIZATION LIFECYCLE
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  window.notificationService = new NotificationService();
  window.appRouter = new NavigationRouter();
  window.authModule = new AuthModule();
  window.studentDash = new StudentDashboardModule();
  window.studentReport = new StudentReportModule();
  window.internshipsModule = new InternshipsModule();
  window.projectsModule = new ProjectsModule();
  window.profileModule = new ProfileModule();
  window.facultyModule = new FacultyModule();
  window.recruiterModule = new RecruiterModule();

  // Keyboard shortcut Ctrl+K
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }
  });

  // Global search redirect
  const globalInput = document.getElementById('globalSearchInput');
  if (globalInput) {
    globalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          window.appRouter.navigateTo('internships');
          const internSearch = document.getElementById('internSearchInput');
          if (internSearch) {
            internSearch.value = query;
            window.internshipsModule.applyFilters();
          }
        }
      }
    });
  }

  // Initialize store and role router
  await store.init();

  if (store.state.isLoggedIn && store.state.currentUser) {
    window.appRouter.updateRoleUi(store.state.currentUser.role);
  } else {
    // Show login page at first if not logged in
    window.appRouter.updateRoleUi(null);
    window.selectAuthRole('student');
  }

  console.log('🚀 Full-Stack Collaboration Platform with Multi-Role Sync & Login Gateway Initialized.');
});
