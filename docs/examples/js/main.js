// Main JavaScript file for dynamic loading of partials and navigation

// Function to load HTML partial into an element
async function loadPartial(elementId, partialPath) {
  try {
    const response = await fetch(partialPath);
    if (!response.ok) throw new Error(`Failed to load ${partialPath}`);
    const html = await response.text();
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading partial:', error);
  }
}

// Function to generate breadcrumb route
function generateRoute() {
  const routeElement = document.getElementById('route-breadcrumb');
  if (!routeElement) return;

  const currentPageConfig = getCurrentPageConfig();
  const currentFilename = getCurrentPageFilename();
  const isIndexPage = currentFilename === 'index.html';

  let routeHTML = `
    <a href="https://codedgar.github.io/Puppertino/" class="p-btn p-btn-scope p-btn-scope-unactive">Puppertino</a>
    <p>/</p>
    <a href="index.html" class="p-btn p-btn-scope ${isIndexPage ? '' : 'p-btn-scope-unactive'}">Examples</a>
  `;

  if (!isIndexPage && currentPageConfig) {
    routeHTML += `
      <p>/</p>
      <a href="${currentPageConfig.filename}" class="p-btn p-btn-scope">${currentPageConfig.title}</a>
    `;
  }

  routeElement.innerHTML = routeHTML;
}

// Function to generate sidebar navigation
function generateSidebar() {
  const sidebarNav = document.getElementById('sidebar-navigation');
  if (!sidebarNav) return;

  const currentFilename = getCurrentPageFilename();

  // Group pages by category
  const categories = {
    'getting-started': { title: 'Getting Started', pages: [] },
    'components': { title: 'Components', pages: [] },
    'design': { title: 'Design', pages: [] }
  };

  pagesConfig.forEach(page => {
    if (categories[page.category]) {
      categories[page.category].pages.push(page);
    }
  });

  let sidebarHTML = '';

  // Add "Overview" link
  sidebarHTML += `
    <li class="sidebar-item ${currentFilename === 'index.html' ? 'active' : ''}">
      <a href="index.html">
        <span class="sidebar-icon">
          <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M7.5 1.5l.197-.46a.5.5 0 00-.394 0l.197.46zm-7 3l-.197-.46a.5.5 0 000 .92L.5 4.5zm7 3l-.197.46a.5.5 0 00.394 0L7.5 7.5zm7-3l.197.46a.5.5 0 000-.92l-.197.46zm-7 6l-.197.46.197.084.197-.084-.197-.46zm0 3l-.197.46.197.084.197-.084-.197-.46zM7.303 1.04l-7 3 .394.92 7-3-.394-.92zm-7 3.92l7 3 .394-.92-7-3-.394.92zm7.394 3l7-3-.394-.92-7 3 .394.92zm7-3.92l-7-3-.394.92 7 3 .394-.92zM.303 7.96l7 3 .394-.92-7-3-.394.92zm7.394 3l7-3-.394-.92-7 3 .394.92zm-7.394 0l7 3 .394-.92-7-3-.394.92zm7.394 3l7-3-.394-.92-7 3 .394.92z" fill="currentColor"></path>
          </svg>
        </span>
        <span class="sidebar-text">Overview</span>
      </a>
    </li>
  `;

  // Add categories and pages
  Object.keys(categories).forEach(categoryKey => {
    const category = categories[categoryKey];
    if (category.pages.length > 0) {
      sidebarHTML += `<li class="sidebar-category">${category.title}</li>`;

      category.pages.forEach(page => {
        const isActive = currentFilename === page.filename;
        sidebarHTML += `
          <li class="sidebar-item ${isActive ? 'active' : ''}">
            <a href="${page.filename}" title="${page.description}">
              <span class="sidebar-icon">${page.icon}</span>
              <span class="sidebar-text">${page.title}</span>
            </a>
          </li>
        `;
      });
    }
  });

  sidebarNav.innerHTML = sidebarHTML;
}

// Function to update page title
function updatePageTitle() {
  const currentPageConfig = getCurrentPageConfig();
  if (currentPageConfig) {
    document.title = `${currentPageConfig.title} - Puppertino Framework`;
  } else if (getCurrentPageFilename() === 'index.html') {
    document.title = 'Examples & Documentation - Puppertino Framework';
  }
}

// Initialize the page
async function initializePage() {
  // Load partials
  await Promise.all([
    loadPartial('head-content', 'partials/head.html'),
    loadPartial('sidebar-container', 'partials/sidebar.html'),
    loadPartial('footer-content', 'partials/footer.html')
  ]);

  // Generate dynamic content
  generateRoute();
  generateSidebar();
  updatePageTitle();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}
