function getLabels() {
  try {
    // 查找 Gmail 标签元素
    const labelElements = document.querySelectorAll('.TK .aim');
    console.log(`Found ${labelElements.length} elements under .TK`);

    let labels = [];

    labelElements.forEach((label, index) => {
      let labelName = label.textContent.trim();
      let fullName = labelName;

      console.log(`Processing element ${index}: ${labelName}`);

      // 获取包含链接的子元素作为起点
      const linkContainer = label.querySelector('.aio a.J-Ke')?.closest('.aio, .TN, .aY7xie, .TO');
      if (!linkContainer) {
        console.log(`No link container or parent found for ${labelName}`);
        console.log('Label outerHTML:', label.outerHTML);
        return;
      }

      // 获取父元素，尝试更宽松的匹配
      const parentElement = linkContainer.closest('.TN, .aY7xie, .TO, [role="link"]');
      if (!parentElement) {
        console.log(`No parent .TN, .aY7xie, .TO, or [role="link"] found for ${labelName}`);
        console.log('Link container outerHTML:', linkContainer.outerHTML);
        return;
      }

      // 调试父元素信息
      console.log(`Parent element classes: ${parentElement.className}`);
      console.log(`Parent element margin-left: ${parentElement.style.marginLeft}`);

      // 优先从 href 获取完整路径并解码，使用 / 连接
      const link = linkContainer.querySelector('a.J-Ke');
      if (link && link.href) {
        const url = new URL(link.href);
        const hash = url.hash;
        if (hash.includes('#label/')) {
          const path = hash.replace('#label/', '');
          console.log(`Raw path from href: ${path}`);
          // 先将 + 替换为 %20，然后解码
          const decodedPath = decodeURIComponent(path.replace(/\+/g, '%20'));
          const pathSegments = decodedPath.split('/').filter(Boolean);
          fullName = pathSegments.join('/'); // 使用 / 连接
          console.log(`Extracted from href (raw): ${path}`);
          console.log(`Extracted from href (decoded): ${fullName}`);
        }
      }

      // 如果 href 无效，尝试 data-label-name 并解码，使用 / 连接
      if (fullName === labelName) {
        const dataLabel = parentElement.querySelector('[data-label-name]')?.getAttribute('data-label-name');
        if (dataLabel && dataLabel.includes('/')) {
          console.log(`Raw data-label-name: ${dataLabel}`);
          // 先将 + 替换为 %20，然后解码
          const decodedDataLabel = decodeURIComponent(dataLabel.replace(/\+/g, '%20'));
          const path = decodedDataLabel.split('/').filter(Boolean);
          fullName = path.join('/'); // 使用 / 连接
          console.log(`Extracted from data-label-name (raw): ${dataLabel}`);
          console.log(`Extracted from data-label-name (decoded): ${fullName}`);
        }
      }

      // 如果仍无完整路径，基于缩进推断层级
      if (fullName === labelName) {
        const marginLeft = parseInt(parentElement.style.marginLeft || '0px');
        const indentLevel = Math.floor(marginLeft / 12);
        if (indentLevel > 0) {
          let hierarchy = [labelName];
          let currentElement = parentElement;
          for (let i = 0; i < indentLevel && currentElement; i++) {
            currentElement = currentElement.previousElementSibling;
            if (currentElement && currentElement.querySelector('.aim .aio a.J-Ke')) {
              const parentLabel = currentElement.querySelector('.aim .aio a.J-Ke').textContent.trim();
              hierarchy.unshift(parentLabel);
            }
          }
          fullName = hierarchy.join('-'); // 缩进推断仍使用 -，因为这是自定义层级
          console.log(`Extracted from indent: ${fullName}`);
        }
      }

      labels.push({ name: fullName });
    });

    // 系统标签列表（使用 / 分隔）
    const systemLabels = [
      'Inbox', 'Sent', 'Drafts', 'Trash', 'Spam',
      'Starred', 'Important', 'Chats', 'Scheduled',
      'All Mail', 'Snoozed', 'Archive', '[Imap]/草稿'
    ];

    // 过滤系统标签
    labels = labels.filter(label => {
      // 解码 label.name
      const decodedLabel = decodeURIComponent(label.name);
      const isSystem = systemLabels.includes(decodedLabel);
      console.log(`Filtering ${decodedLabel}: ${isSystem ? 'System' : 'Custom'}`);
      return !isSystem;
    });

    // 按名称排序
    labels.sort((a, b) => a.name.localeCompare(b.name));

    // 发送结果给 popup
    chrome.runtime.sendMessage({
      type: 'LABELS',
      data: labels
    });

    console.log('Extracted Labels:', labels);
  } catch (error) {
    console.error('Failed to get labels:', error);
    chrome.runtime.sendMessage({
      type: 'ERROR',
      data: error.message
    });
  }
}

// 页面加载时执行，并添加 MutationObserver 检测 DOM 变化
window.addEventListener('load', () => {
  getLabels();
  const observer = new MutationObserver((mutations) => {
    getLabels();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

// 监听 popup 请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_LABELS') {
    getLabels();
  }
});