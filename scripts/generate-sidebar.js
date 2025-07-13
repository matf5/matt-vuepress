const fs = require('fs');
const path = require('path');
const { format } = require('util');

const DOCS_PATH = path.resolve(__dirname, '../docs');
const PAGES_PATH = path.resolve(DOCS_PATH, 'pages');
const CONFIG_PATH = path.resolve(DOCS_PATH, '.vuepress/config.js');

function getTitleFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^#\s+(.*)/m);
    if (match) {
      return match[1].trim();
    }
  } catch (e) {
    console.error(`Error reading file ${filePath}:`, e);
  }
  return null;
}

function generateNewSidebar() {
  // Dynamically require the config to get the existing sidebar.
  // We clear the cache first to ensure we get the latest version from disk.
  delete require.cache[require.resolve(CONFIG_PATH)];
  const existingConfig = require(CONFIG_PATH);
  const titleMap = new Map();

  // Learn existing titles from the current config
  if (existingConfig.themeConfig && existingConfig.themeConfig.sidebar) {
    for (const group of existingConfig.themeConfig.sidebar) {
      const groupDirName = group.path ? path.basename(group.path) : (group.children && group.children.length > 0 ? path.basename(path.dirname(group.children[0].path)) : null);
      if (groupDirName) {
        titleMap.set(groupDirName, group.title);
      }

      if (group.children) {
        for (const item of group.children) {
          titleMap.set(item.path, item.title);
        }
      }
    }
  }

  const newSidebar = [];
  const dirs = fs.readdirSync(PAGES_PATH).filter(dir => {
    const dirPath = path.join(PAGES_PATH, dir);
    return fs.statSync(dirPath).isDirectory();
  });

  for (const dir of dirs.sort()) {
    const dirPath = path.join(PAGES_PATH, dir);
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md') && file !== 'index.md');

    const children = files.sort().map(file => {
      const filePath = path.join(dirPath, file);
      const pagePath = `/pages/${dir}/${file}`;
      const fileTitle = getTitleFromFile(filePath) || path.basename(file, '.md');

      return {
        title: titleMap.get(pagePath) || fileTitle,
        path: pagePath
      };
    });

    // Find if an index.md exists, which acts as the group's main page.
    const indexFilePath = path.join(dirPath, 'index.md');
    if (fs.existsSync(indexFilePath)) {
      const indexChild = {
        title: getTitleFromFile(indexFilePath) || titleMap.get(dir) || dir,
        path: `/pages/${dir}/`
      }
      // Add it to the beginning of the children array
      children.unshift(indexChild);
    }

    if (children.length > 0) {
      newSidebar.push({
        title: titleMap.get(dir) || dir,
        collapsable: true, // You can change this default
        children: children
      });
    }
  }

  return newSidebar;
}

function updateConfigFile(sidebar) {
  let configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');

  const sidebarRegex = /sidebar\s*:\s*\[[\s\S]*?\](?=\s*\}\s*\})/s;

  const newSidebarString = JSON.stringify(sidebar, null, 4);
  const finalSidebarString = newSidebarString.replace(/"([^"]+)":/g, '$1:');

  const newConfigContent = configContent.replace(sidebarRegex, `sidebar: ${finalSidebarString}`);

  if (!sidebarRegex.test(configContent)) {
    console.warn('⚠️  Could not find sidebar in config file to replace. No changes were made.');
    return;
  }

  fs.writeFileSync(CONFIG_PATH, newConfigContent, 'utf-8');
  console.log('✅  .vuepress/config.js has been updated successfully.');
}

try {
  const newSidebar = generateNewSidebar();
  updateConfigFile(newSidebar);
} catch (error) {
  console.error('❌ Error updating sidebar configuration:', error);
} 