# Puppertino Documentation System

This documentation uses a dynamic loading system that makes it easy to create and maintain documentation pages.

## How the Documentation System Works

The Puppertino documentation system is built on a dynamic loading architecture that eliminates repetition and ensures consistency across all pages. Here's how it works:

### Dynamic Component Loading

Instead of copying the same HTML across every page, common elements are stored as reusable partials:

- **Head Partial** (`partials/head.html`): Contains all meta tags, stylesheets, and common `<head>` elements
- **Footer Partial** (`partials/footer.html`): Contains shared JavaScript libraries and footer scripts
- **Sidebar Partial** (`partials/sidebar.html`): Template for the navigation sidebar

When a page loads, JavaScript fetches these partials and injects them into the appropriate locations, ensuring every page has the same foundation without code duplication.

### Automatic Navigation Generation

The system automatically generates navigation elements:

- **Breadcrumb Routes**: Created dynamically based on the current page's filename and category
- **Sidebar Navigation**: Built automatically from the pages configuration file
- **Active Page Highlighting**: The current page is highlighted in the sidebar

### Centralized Configuration

All pages are registered in `js/pages-config.js`, which serves as the single source of truth for:

- Page titles and descriptions
- File locations
- Icons for sidebar navigation
- Category organization
- Page ordering

This centralized approach means adding a new page only requires updating one configuration file.

### JavaScript Architecture

The main script (`js/main.js`) orchestrates the system:

1. Loads all partial HTML files
2. Injects them into placeholder elements
3. Determines the current page from the URL
4. Generates breadcrumb navigation
5. Builds the sidebar from the configuration
6. Updates the page title dynamically

## How to Contribute Documentation

Contributing new documentation pages is straightforward. Follow these steps:

### Step 1: Copy the Template

Start by copying the page template to create your new documentation page:

```bash
cp page-template.html my-new-page.html
```

Choose a descriptive filename that uses kebab-case (lowercase with hyphens).

### Step 2: Edit the Page Content

Open your new page and customize it:

1. **Update the Title and Description** in the `<head>` section:
   ```html
   <title>My New Component - Puppertino Framework</title>
   <meta name="description" content="Documentation for my new component">
   ```

2. **Add Your Content** inside the `<div class="main-content">` section:
   - Write your documentation using clear headings and examples
   - Include code snippets with proper syntax highlighting
   - Add live examples where applicable
   - Use the existing page structure for consistency

3. **Keep the Structure Intact**: Don't remove the placeholder divs for head, footer, sidebar, or breadcrumbs—these are populated dynamically.

### Step 3: Register Your Page

Add your new page to the configuration file at `js/pages-config.js`:

```javascript
{
  title: 'My New Component',
  filename: 'my-new-page.html',
  description: 'Brief description of what this page covers',
  icon: '<svg>...</svg>', // Copy an appropriate icon from existing pages
  category: 'components' // Choose: 'getting-started', 'components', or 'design'
}
```

**Important**: Place your page entry in the appropriate position within its category to control the sidebar ordering.

### Categories Explained

Organize your page into one of these categories:

- **getting-started**: Installation guides, setup instructions, and introductory content
- **components**: Individual UI components (buttons, modals, forms, etc.)
- **design**: Design utilities, color systems, layout guides, and icons

### Testing Your Contribution

After creating your page:

1. Open the page in a browser to verify it loads correctly
2. Check that the sidebar displays your page in the right category
3. Verify the breadcrumb navigation shows the correct path
4. Test all links and code examples
5. Check the browser console for any JavaScript errors

## Modifying Common Elements

### Updating Global Styles or Scripts

If you need to modify elements that appear on all pages:

- **Head Elements**: Edit `partials/head.html` to change stylesheets, meta tags, or analytics
- **Footer Scripts**: Edit `partials/footer.html` to update JavaScript libraries or footer code
- **Sidebar Behavior**: Edit `js/main.js` to change how the sidebar is generated or functions
- **Sidebar Styling**: Modify the sidebar styles in `doc.css` under the `/* Sidebar styles */` section

### Adding a New Category

To add a new category for organizing pages:

1. Add pages with the new category name to `js/pages-config.js`
2. Update the sidebar generation logic in `js/main.js` if needed
3. Consider adding a category heading or visual separator

## Benefits of This System

This architecture provides several advantages:

1. **DRY Principle**: Common elements are defined once and reused everywhere
2. **Easy Maintenance**: Update head, footer, or sidebar in one place to affect all pages
3. **Consistent Navigation**: All pages automatically receive proper navigation elements
4. **Fast Page Creation**: Copy, edit content, register—done
5. **Scalable**: Adding pages or categories requires minimal effort
6. **Version Control Friendly**: Changes are localized and easy to track

## Troubleshooting

If your page isn't displaying correctly:

1. **Check Script Tags**: Ensure both `pages-config.js` and `main.js` are included at the bottom of your page
2. **Verify Registration**: Confirm your page is properly registered in `js/pages-config.js`
3. **Browser Console**: Check for JavaScript errors that might prevent dynamic loading
4. **File Paths**: Ensure all paths to partials and scripts are correct
5. **Template Structure**: Verify your page structure matches the template with all placeholder divs

## Best Practices for Contributors

When contributing documentation:

- **Be Clear and Concise**: Write for developers who may be new to Puppertino
- **Include Examples**: Show, don't just tell—code examples are essential
- **Follow Existing Patterns**: Look at existing pages for formatting and structure guidance
- **Test Thoroughly**: Always test your page before submitting
- **Use Semantic HTML**: Maintain accessibility standards in your examples
- **Stay Consistent**: Match the tone and style of existing documentation

## Future Enhancements

The documentation system is continuously evolving. Potential improvements include:

- Search functionality across all pages
- Dark mode toggle in the sidebar
- Previous/next page navigation at the bottom of content
- Mobile-responsive sidebar toggle
- Live component preview with editable code
- Version selector for different Puppertino releases