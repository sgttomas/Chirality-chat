#!/usr/bin/env node
/**
 * Documentation Index Generator
 * 
 * Automatically updates FRONTEND_DOCUMENTATION_INDEX.md with current documentation
 * status, file links, and metadata. Scans the docs directory structure and maintains
 * an up-to-date index of all frontend documentation.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_ROOT = path.join(process.cwd(), 'docs');
const INDEX_FILE = path.join(DOCS_ROOT, 'FRONTEND_DOCUMENTATION_INDEX.md');
const PROJECT_ROOT = process.cwd();

// Documentation categories and their expected files
const DOCUMENTATION_STRUCTURE = {
  'Core Development': {
    files: [
      { path: 'FRONTEND_DEVELOPMENT.md', title: 'Frontend Development Guide', required: true },
      { path: 'CLAUDE_FRONTEND.md', title: 'Claude Frontend Development', required: true },
      { path: 'DEVELOPER-TOOLS.md', title: 'Developer Tools Setup', required: false }
    ]
  },
  'Design System': {
    files: [
      { path: 'docs/UI_DESIGN_SYSTEM.md', title: 'UI Design System', required: true },
      { path: 'ACCESSIBILITY.md', title: 'Accessibility Guidelines', required: true }
    ]
  },
  'Architecture': {
    files: [
      { path: 'docs/adr/frontend/008-react-app-router.md', title: 'React App Router ADR', required: true },
      { path: 'docs/adr/frontend/009-zustand-state-management.md', title: 'Zustand State Management ADR', required: true },
      { path: 'docs/adr/frontend/010-tailwind-design-system.md', title: 'Tailwind CSS ADR', required: true },
      { path: 'docs/adr/frontend/011-sse-streaming-pattern.md', title: 'SSE Streaming ADR', required: true },
      { path: 'docs/adr/frontend/012-component-composition.md', title: 'Component Composition ADR', required: true }
    ]
  },
  'Components': {
    files: [
      { path: 'docs/components/README.md', title: 'Component Library Overview', required: false },
      { path: 'docs/components/atoms/Button.md', title: 'Button Component', required: false },
      { path: 'docs/components/organisms/ChatWindow.md', title: 'ChatWindow Component', required: false }
    ]
  }
};

/**
 * Check if a file exists and get its metadata
 */
function getFileInfo(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  try {
    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      lastModified: stats.mtime,
      size: stats.size
    };
  } catch (error) {
    return {
      exists: false,
      lastModified: null,
      size: 0
    };
  }
}

/**
 * Generate status badge for a file
 */
function getStatusBadge(fileInfo, required) {
  if (fileInfo.exists) {
    return '✅ Complete';
  } else if (required) {
    return '❌ Missing';
  } else {
    return '⏳ Planned';
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate the documentation index content
 */
function generateIndex() {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `# Frontend Documentation Index

Complete reference for frontend development in the Chirality Chat application. This index provides organized access to all frontend documentation, following industry standards and best practices.

*Last updated: ${timestamp} (automatically generated)*

## 📋 Documentation Overview

| Category | Status | Files | Description |
|----------|---------|-------|-------------|
`;

  // Generate category overview
  for (const [category, info] of Object.entries(DOCUMENTATION_STRUCTURE)) {
    const totalFiles = info.files.length;
    const existingFiles = info.files.filter(file => getFileInfo(file.path).exists).length;
    const status = existingFiles === totalFiles ? '✅ Complete' : 
                   existingFiles === 0 ? '❌ Missing' : 
                   `⚠️ Partial (${existingFiles}/${totalFiles})`;
    
    content += `| **${category}** | ${status} | ${existingFiles}/${totalFiles} | ${getCategoryDescription(category)} |\n`;
  }

  content += `
## 📚 Detailed Documentation Status

`;

  // Generate detailed file listings for each category
  for (const [category, info] of Object.entries(DOCUMENTATION_STRUCTURE)) {
    content += `### ${category}\n\n`;
    content += `| File | Status | Size | Last Modified | Description |\n`;
    content += `|------|---------|------|---------------|-------------|\n`;
    
    for (const file of info.files) {
      const fileInfo = getFileInfo(file.path);
      const status = getStatusBadge(fileInfo, file.required);
      const size = fileInfo.exists ? formatFileSize(fileInfo.size) : '-';
      const lastModified = fileInfo.exists ? 
        fileInfo.lastModified.toISOString().split('T')[0] : '-';
      const link = fileInfo.exists ? `[${file.title}](../${file.path})` : file.title;
      
      content += `| ${link} | ${status} | ${size} | ${lastModified} | ${file.title} |\n`;
    }
    
    content += `\n`;
  }

  // Add quick navigation section
  content += `## 🔗 Quick Navigation

### For New Developers
1. **Start Here**: [Frontend Development Guide](../FRONTEND_DEVELOPMENT.md) - Complete overview
2. **Setup**: [Developer Tools](../DEVELOPER-TOOLS.md) - Development environment
3. **Design**: [UI Design System](../docs/UI_DESIGN_SYSTEM.md) - Design principles
4. **Accessibility**: [Accessibility Guidelines](../ACCESSIBILITY.md) - WCAG compliance

### For AI Assistants (Claude Code)
1. **Primary Reference**: [Claude Frontend Guide](../CLAUDE_FRONTEND.md)
2. **Architecture**: [Frontend ADRs](../docs/adr/frontend/) - Technical decisions
3. **Components**: [Component Library](../docs/components/) - Reusable components
4. **Patterns**: [Development Patterns](../FRONTEND_DEVELOPMENT.md#development-patterns)

### For Designers
1. **Design System**: [UI Design System](../docs/UI_DESIGN_SYSTEM.md)
2. **Components**: [Component Library](../docs/components/)
3. **Accessibility**: [Accessibility Guidelines](../ACCESSIBILITY.md)
4. **Patterns**: [Design Patterns](../docs/UI_DESIGN_SYSTEM.md#component-guidelines)

## 📊 Documentation Health

`;

  // Generate health metrics
  const totalFiles = Object.values(DOCUMENTATION_STRUCTURE)
    .reduce((sum, category) => sum + category.files.length, 0);
  const existingFiles = Object.values(DOCUMENTATION_STRUCTURE)
    .reduce((sum, category) => 
      sum + category.files.filter(file => getFileInfo(file.path).exists).length, 0);
  const requiredFiles = Object.values(DOCUMENTATION_STRUCTURE)
    .reduce((sum, category) => 
      sum + category.files.filter(file => file.required).length, 0);
  const existingRequiredFiles = Object.values(DOCUMENTATION_STRUCTURE)
    .reduce((sum, category) => 
      sum + category.files.filter(file => file.required && getFileInfo(file.path).exists).length, 0);

  const completionRate = Math.round((existingFiles / totalFiles) * 100);
  const requiredCompletionRate = Math.round((existingRequiredFiles / requiredFiles) * 100);

  content += `- **Total Files**: ${existingFiles}/${totalFiles} (${completionRate}% complete)
- **Required Files**: ${existingRequiredFiles}/${requiredFiles} (${requiredCompletionRate}% complete)
- **Optional Files**: ${existingFiles - existingRequiredFiles}/${totalFiles - requiredFiles}
- **Health Status**: ${getHealthStatus(requiredCompletionRate)}

## 🛠️ Maintenance

This documentation index is automatically generated by \`scripts/update-docs-index.js\`.

### To Update
\`\`\`bash
npm run update-docs-index
\`\`\`

### Adding New Documentation
1. Add the file to the appropriate category in \`scripts/update-docs-index.js\`
2. Run \`npm run update-docs-index\` to regenerate this index
3. Commit both the new documentation and updated index

---

*Generated on ${new Date().toISOString()} by the documentation index generator.*
`;

  return content;
}

/**
 * Get category description
 */
function getCategoryDescription(category) {
  const descriptions = {
    'Core Development': 'Architecture, patterns, and development workflows',
    'Design System': 'Visual design tokens, patterns, and guidelines',
    'Architecture': 'Technical decisions and implementation rationale',
    'Components': 'Reusable UI components and usage guidelines'
  };
  return descriptions[category] || 'Documentation category';
}

/**
 * Get overall health status
 */
function getHealthStatus(completionRate) {
  if (completionRate >= 90) return '🟢 Excellent';
  if (completionRate >= 75) return '🟡 Good';
  if (completionRate >= 50) return '🟠 Needs Attention';
  return '🔴 Critical';
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('📝 Generating documentation index...');
    
    // Ensure docs directory exists
    if (!fs.existsSync(DOCS_ROOT)) {
      fs.mkdirSync(DOCS_ROOT, { recursive: true });
      console.log('📁 Created docs directory');
    }
    
    // Generate the index content
    const indexContent = generateIndex();
    
    // Write the index file
    fs.writeFileSync(INDEX_FILE, indexContent);
    
    // Calculate some metrics for the summary
    const totalFiles = Object.values(DOCUMENTATION_STRUCTURE)
      .reduce((sum, category) => sum + category.files.length, 0);
    const existingFiles = Object.values(DOCUMENTATION_STRUCTURE)
      .reduce((sum, category) => 
        sum + category.files.filter(file => getFileInfo(file.path).exists).length, 0);
    
    console.log('✅ Documentation index generated successfully!');
    console.log(`📊 Status: ${existingFiles}/${totalFiles} files documented`);
    console.log(`📍 Location: ${INDEX_FILE}`);
    
  } catch (error) {
    console.error('❌ Error generating documentation index:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateIndex, getFileInfo, DOCUMENTATION_STRUCTURE };