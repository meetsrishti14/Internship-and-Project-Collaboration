const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = __dirname;
const screensDir = path.join(baseDir, 'screens');
const tempDir = path.join(baseDir, 'temp_screens');

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Read the main HTML
const fullHtml = fs.readFileSync(path.join(baseDir, 'render_enhanced_screens.html'), 'utf-8');

// Extract head and style
const headMatch = fullHtml.match(/<head>([\s\S]*?)<\/head>/);
const headContent = headMatch ? headMatch[1] : '';

// 6 screens
const screenIds = [
  { id: 'screen-1', file: '01_login_screen.png', title: 'Login & Authentication' },
  { id: 'screen-2', file: '02_student_dashboard.png', title: 'Student Dashboard' },
  { id: 'screen-3', file: '03_browse_internships.png', title: 'Browse Internships' },
  { id: 'screen-4', file: '04_project_collaboration.png', title: 'Project Collaboration' },
  { id: 'screen-5', file: '05_student_profile.png', title: 'Student Profile' },
  { id: 'screen-6', file: '06_faculty_dashboard.png', title: 'Faculty Dashboard' }
];

// Locate Chrome or Edge
let browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(browserPath)) {
  browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
}

console.log(`Using browser for rendering: ${browserPath}`);

screenIds.forEach((screen, index) => {
  // Extract screen HTML
  const regex = new RegExp(`(<div class="screen-canvas" id="${screen.id}">[\\s\\S]*?)(?=<div class="screen-canvas"|</body>)`, 'i');
  const match = fullHtml.match(regex);
  if (!match) {
    console.error(`Could not find markup for ${screen.id}`);
    return;
  }

  const screenMarkup = match[1];
  const singlePageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}
<style>
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 1920px !important;
    height: 1080px !important;
    overflow: hidden !important;
    background: #0f172a !important;
  }
  .screen-canvas {
    width: 1920px !important;
    height: 1080px !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
</style>
</head>
<body>
${screenMarkup}
</body>
</html>`;

  const tempHtmlPath = path.join(tempDir, `${screen.id}.html`);
  fs.writeFileSync(tempHtmlPath, singlePageHtml);

  const outPngPath = path.join(screensDir, screen.file);
  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;

  console.log(`Rendering [${index + 1}/6] ${screen.title} -> ${screen.file}...`);
  const cmd = `"${browserPath}" --headless --disable-gpu --hide-scrollbars --window-size=1920,1080 --screenshot="${outPngPath}" "${fileUrl}"`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✓ Generated ${screen.file} (${fs.statSync(outPngPath).size} bytes)`);
  } catch (err) {
    console.error(`Error rendering ${screen.file}:`, err.message);
  }
});

// Remove temp files
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Cleaned up temporary screen markup files.');
} catch (e) {}

console.log('\nAll 6 high-fidelity mockup screens rendered successfully!');
