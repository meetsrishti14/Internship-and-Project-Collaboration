# User Stories

> **Note:** These user stories have been migrated to GitHub Issues for project tracking. The GitHub Issues are the primary source for managing and tracking project progress.

---
## Epic 1: Authentication & Access Control

### User Story 1: Student Account Registration
**As a** student,  
**I want to** create an account using my institutional email,  
**So that** I can access verified internships, project collaborations, and platform features.

**Acceptance Criteria**
- User can register with a valid email address and password.
- System validates required fields (First Name, Last Name, Email, Password, Role).
- System sends an email verification link before allowing full account access.
- Confirmation message and toast notification display upon successful form submission.

---

### User Story 2: Secure User Authentication
**As a** registered platform user,  
**I want to** log in securely using my credentials,  
**So that** I can access my personalized dashboard and role-specific workspace.

**Acceptance Criteria**
- Valid credentials grant access and redirect the user to their role-specific dashboard (Student, Mentor, or Organization).
- Invalid credentials display clear, security-conscious error messages without revealing sensitive system details.
- User session persists securely using authentication tokens (JWT or secure cookies).
- Option for "Remember Me" is available during login.

---

### User Story 3: Password Recovery
**As a** user who forgot their password,  
**I want to** request a password reset via email,  
**So that** I can securely regain access to my account.

**Acceptance Criteria**
- User can enter their registered email to initiate a password reset.
- A time-bound, secure reset link is dispatched to the user's email within 2 minutes.
- User can set a new password complying with security rules (minimum 8 characters, special characters, numbers).
- Old session tokens are invalidated upon successful password update.

---

## Epic 2: Student Profile & Portfolio Management

### User Story 4: Profile Creation & Skill Mapping
**As a** student,  
**I want to** build a comprehensive profile showcasing my skills and academic background,  
**So that** organizations and mentors can discover and evaluate my qualifications.

**Acceptance Criteria**
- Form supports adding personal info, educational background, degree program, and graduation year.
- Skills section supports auto-complete tag selection (e.g., Python, React, UI/UX).
- Profile completion meter visually indicates missing sections to encourage completeness.
- Saved profile changes are reflected immediately on the public/mentor preview page.

---

### User Story 5: Dynamic Profile Updates
**As a** student,  
**I want to** update my profile details and portfolio projects at any time,  
**So that** my profile reflects my latest achievements and skills.

**Acceptance Criteria**
- User can edit any section of their profile directly from the profile setting view.
- Real-time client-side validation prevents submitting invalid formatting (e.g., malformed URLs or invalid phone numbers).
- Confirmation notification confirms when profile modifications are successfully saved.

---

### User Story 6: Resume & Document Management
**As a** student,  
**I want to** upload and manage my resume files,  
**So that** I can easily attach updated resumes to internship applications.

**Acceptance Criteria**
- Resume upload supports PDF format up to 5MB.
- Users can preview uploaded resumes directly within the browser view.
- Users can replace or delete existing resume files at any time.
- Files are stored securely in cloud storage with restricted access controls.

---

## Epic 3: Internship & Talent Acquisition

### User Story 7: Internship Discovery
**As a** student,  
**I want to** browse active internship and research openings,  
**So that** I can identify suitable opportunities matching my background.

**Acceptance Criteria**
- Display a paginated/scrollable list of active internship cards.
- Each card prominently highlights job title, company name, location/remote status, stipend, and application deadline.
- Clicking an internship opens a detailed view containing responsibilities, requirements, and company info.

---

### User Story 8: Search & Advanced Filtering
**As a** student,  
**I want to** search and filter internship listings by specific criteria,  
**So that** I can quickly narrow down relevant postings.

**Acceptance Criteria**
- Keyword search matches query against job titles, descriptions, and company names.
- Multi-select filters allow filtering by location (On-site, Remote, Hybrid), required skills, and duration.
- Filter criteria apply dynamically without requiring a full page refresh.
- Clear "Reset Filters" button resets all active selections back to default.

---

### User Story 9: One-Click Application Submission
**As a** student,  
**I want to** apply for an internship directly through the platform,  
**So that** organizations can instantly review my application and profile.

**Acceptance Criteria**
- Application drawer lets students attach their saved resume or upload a custom version for the specific application.
- Optional text area provided for a cover letter or brief message to recruiters.
- Duplicate applications for the same opening are automatically prevented.
- Student receives an immediate visual confirmation and an email receipt upon successful submission.

---

### User Story 10: Internship Opportunity Posting
**As an** organization representative,  
**I want to** create and publish detailed internship opportunities,  
**So that** eligible students can view and apply for open roles.

**Acceptance Criteria**
- Form supports defining job title, role description, skill tags, location type, deadline, and application capacity.
- Organization can save postings as "Draft" or publish directly to the live platform.
- Published listings appear immediately in the public student job board.
- Organizations can edit or close listings at any time.

---

### User Story 11: Candidate Review & Applicant Pipeline
**As an** organization recruiter,  
**I want to** view and evaluate student applications for posted roles,  
**So that** I can shortlist and contact top candidates efficiently.

**Acceptance Criteria**
- Recruiter dashboard displays candidate applications grouped by opportunity.
- Recruiter can view candidate profiles, download attached resumes, and read cover notes.
- Applicants can be moved across pipeline stages (e.g., Received, Shortlisted, Interviewed, Rejected, Accepted).
- Changing an applicant's status triggers an automated notification to the student.

---

## Epic 4: Project Workspace & Collaboration

### User Story 12: Workspace & Project Creation
**As a** student project lead,  
**I want to** initialize a workspace for a new academic or side project,  
**So that** I can build a team and organize our collaborative work.

**Acceptance Criteria**
- Creator inputs project title, detailed description, required roles, repository links, and visibility settings (Public/Private).
- Project creator automatically receives "Project Lead / Admin" permissions.
- Project appears in the open project discovery directory if set to public.

---

### User Story 13: Team Recruitment & Invitation Management
**As a** project lead,  
**I want to** invite teammates and respond to student join requests,  
**So that** we can assemble a cross-functional team for project execution.

**Acceptance Criteria**
- Project lead can send direct email or platform invitations to specific registered users.
- Students can browse public projects and submit a "Request to Join" with a custom note.
- Invited users receive notifications with simple "Accept" and "Decline" action buttons.
- Accepted members are automatically added to the project workspace with team-member permissions.
