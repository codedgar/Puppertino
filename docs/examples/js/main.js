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

      // Execute script tags (innerHTML doesn't execute them automatically)
      const scripts = element.querySelectorAll('script');
      scripts.forEach(oldScript => {
        // Skip importmap scripts as they need to be in the document before any module loads
        if (oldScript.type === 'importmap') {
          return;
        }

        const newScript = document.createElement('script');

        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy inline script content or set src
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }

        // Replace old script with new one to trigger execution
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
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
    <a href="../" class="p-btn p-btn-scope p-btn-scope-unactive">Puppertino</a>
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

// Function to initialize ninja-keys search
async function initializeSearch() {
  try {
    // Wait for the ninja-keys custom element to be defined
    await customElements.whenDefined('ninja-keys');

    // Add a small delay to ensure the element is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    const ninja = document.querySelector('ninja-keys');
    if (!ninja) {
      return;
    }

    // Convert pagesConfig to ninja-keys data format
    const searchData = [
      {
        id: 'overview',
        title: 'Overview',
        section: 'Pages',
        handler: () => {
          window.location.href = 'index.html';
        }
      },
      ...pagesConfig.map(page => ({
        id: page.filename,
        title: page.title,
        description: page.description,
        section: page.category === 'getting-started' ? 'Getting Started' :
                 page.category === 'components' ? 'Components' : 'Design',
        icon: page.icon,
        handler: () => {
          window.location.href = page.filename;
        }
      }))
    ];

    ninja.data = searchData;

    // Set up the search trigger button
    const searchTrigger = document.getElementById('search-trigger');
    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => {
        if (ninja && typeof ninja.open === 'function') {
          ninja.open();
        } else {
          console.error('ninja.open is not a function. Available methods:', Object.keys(ninja));
        }
      });
    }

    // Add keyboard shortcut (Cmd+K or Ctrl+K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (ninja && typeof ninja.open === 'function') {
          ninja.open();
        } else {
          console.error('ninja.open is not a function');
        }
      }
    });

  } catch (error) {
    console.error('Error initializing search:', error);
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

  // Initialize search - this will wait for the custom element to be defined
  initializeSearch().catch(err => {
    console.error('Failed to initialize search:', err);
  });

  // Wait for HighlightJS to load and initialize it
  const waitForHljs = setInterval(() => {
    if (typeof hljs !== 'undefined') {
      clearInterval(waitForHljs);
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    }
  }, 100);

  // Make body visible after everything is loaded
  document.body.style.opacity = '1';
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}
