(function() {
    'use strict';
  
    let isExpanded = false;
    let expandBtnRef;
  
    function createQuestButton() {
      if (!window.location.pathname.includes('/quest-home')) {
        const existingButton = document.getElementById('discord-quest-helper-btn');
        if (existingButton) {
          existingButton.remove();
        }
        const existingPanel = document.getElementById('quest-panel');
        if (existingPanel) {
          existingPanel.remove();
        }
        return;
      }
      
      if (document.getElementById('discord-quest-helper-btn')) {
        return;
      }
      const button = document.createElement('div');
      button.id = 'discord-quest-helper-btn';
      button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        color: black;
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 600;
        width: 180px;
      `;
  
      const icon = document.createElement('img');
      icon.src = 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d8014ea898f3a4b2156c_Symbol.svg';
      icon.alt = 'Symbol';
      icon.style.cssText = `
        width: 15px;
        height: 15px;
      `;
      button.appendChild(icon);
  
      const text = document.createElement('span');
      text.textContent = `Running Quests`;
      text.style.cssText = `
        flex: 1;
        text-align: center;
      `;
      button.appendChild(text);
  
      const expandBtn = document.createElement('button');
      expandBtn.innerHTML = '▼';
      expandBtn.style.cssText = `
        background: rgba(218, 218, 218, 0.1);
        border: 1px solid #eeededff;
        border-radius: 4px;
        color: black;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 7px;
        margin-left: 4px;
        transition: transform 0.3s ease;
        transform: rotate(0deg);
      `;
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExpanded();
      });
      button.appendChild(expandBtn);
      expandBtnRef = expandBtn;
  
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      });
  
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      });
  
      button.addEventListener('click', () => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
          console.error('Chrome runtime not available. Make sure the extension is loaded.');
          text.textContent = 'Extension Error';
          button.style.background = '#ff4444';
          button.style.color = 'white';
          icon.style.filter = 'brightness(0) invert(1)';
          expandBtn.style.filter = 'brightness(0) invert(1)';
          setTimeout(() => {
            text.textContent = `Running Quests`;
            button.style.background = 'white';
            button.style.color = 'black';
            icon.style.filter = '';
            expandBtn.style.filter = '';
          }, 2000);
          return;
        }
        chrome.runtime.sendMessage({ action: 'executeQuestCode' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            text.textContent = 'Error';
            button.style.background = '#000000ff';
            button.style.color = 'white';
            
            setTimeout(() => {
              text.textContent = `Running Quests`;
              button.style.background = 'white';
              button.style.color = 'black';
            }, 2000);
          } else if (response && response.success) {
            text.textContent = 'Code Executed';
            button.style.background = '#000000ff';
            button.style.color = 'white';
            icon.style.filter = 'brightness(0) invert(1)';
            expandBtn.style.filter = 'brightness(0) invert(1)';
            
            setTimeout(() => {
              text.textContent = `Running Quests`;
              button.style.background = 'white';
              button.style.color = 'black';
              icon.style.filter = '';
              expandBtn.style.filter = '';
            }, 2000);
          } else {
            text.textContent = 'Error';
            button.style.background = '#000000ff';
            button.style.color = 'white';
            icon.style.filter = 'brightness(0) invert(1)';
            expandBtn.style.filter = 'brightness(0) invert(1)';
            
            setTimeout(() => {
              text.textContent = `Running Quests`;
              button.style.background = 'white';
              button.style.color = 'black';
              icon.style.filter = '';
              expandBtn.style.filter = '';
            }, 2000);
          }
        });
      });
  
      document.body.appendChild(button);

      if (isExpanded) {
        createExpandedPanel();
      }
    }
  
    function createExpandedPanel() {
      if (document.getElementById('quest-panel')) return;
  
      const panel = document.createElement('div');
      panel.id = 'quest-panel';
      panel.style.cssText = `
        position: fixed;
        bottom: 65px;
        right: 20px;
        z-index: 9999;
        background: black;
        color: white;
        border-radius: 10px;
        padding: 16px;
        width: 180px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      `;
  
      const title = document.createElement('h3');
      title.textContent = 'Discord ID | Auto Quest';
      title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px; font-weight: bold;';
      panel.appendChild(title);
  
      const credit = document.createElement('p');
      credit.textContent = 'Credits by 6Together9';
      credit.style.cssText = 'margin: 0; font-size: 14px; color: #ccc;';
      panel.appendChild(credit);
  
      document.body.appendChild(panel);
    }
  
    function toggleExpanded() {
      isExpanded = !isExpanded;
      if (expandBtnRef) {
        expandBtnRef.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      }
      if (isExpanded) {
        createExpandedPanel();
      } else {
        const panel = document.getElementById('quest-panel');
        if (panel) panel.remove();
      }
    }
  
    function init() {
      createQuestButton();
  
      let lastUrl = window.location.href;
      new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          createQuestButton();
        }
      }).observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();