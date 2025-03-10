document.addEventListener('DOMContentLoaded', () => {
  const labelsList = document.getElementById('labels');
  const refreshButton = document.getElementById('refresh');
  const selectedLabelsDiv = document.getElementById('selected-labels');

  // 显示标签列表
  function displayLabels(labels) {
    labelsList.innerHTML = '';
    labels.forEach(label => {
      const li = document.createElement('li');
      li.className = 'label-item';

      // 创建复选框
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = label.name;
      checkbox.id = `checkbox-${label.name}`;

      // 创建标签文本
      const labelElement = document.createElement('label');
      labelElement.htmlFor = `checkbox-${label.name}`;
      labelElement.textContent = label.name;

      // 组装复选框和标签
      li.appendChild(checkbox);
      li.appendChild(labelElement);
      labelsList.appendChild(li);
    });

    // 监听复选框变化，更新选中内容并复制到剪贴板
    const updateSelectedLabels = () => {
      const checkedLabels = Array.from(labelsList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => `label:${checkbox.value}`);
      const selectedText = checkedLabels.length > 0 ? checkedLabels.join(' ') : '';
      selectedLabelsDiv.textContent = selectedText;

      // 复制到剪贴板
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
          console.log('Copied to clipboard:', selectedText);
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
          alert('Failed to copy to clipboard. Please copy manually.');
        });
      }
    };

    // 为所有复选框添加 change 事件监听器
    labelsList.addEventListener('change', updateSelectedLabels);
  }

  // 获取当前标签页并请求标签数据
  function fetchLabels() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_LABELS' });
      }
    });
  }

  // 监听来自 content script 的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'LABELS') {
      displayLabels(message.data);
    } else if (message.type === 'ERROR') {
      labelsList.innerHTML = `<li>错误: ${message.data}</li>`;
    }
  });

  // 刷新按钮点击事件
  refreshButton.addEventListener('click', fetchLabels);

  // 初次加载时获取标签
  fetchLabels();
});