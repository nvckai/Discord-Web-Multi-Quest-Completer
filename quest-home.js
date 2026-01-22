(function() {
  'use strict';

  let isPanelExpanded = false;
  let expandButtonReference;

  const STYLES = {
    button: `
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
    `,
    icon: `
      width: 15px;
      height: 15px;
    `,
    text: `
      flex: 1;
      text-align: center;
    `,
    expandButton: `
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
    `,
    panel: `
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
    `
  };

  function createQuestButton() {
    if (!window.location.pathname.includes('/quest-home')) {
      removeElements();
      return;
    }
    
    if (document.getElementById('DiscordQuestButton')) {return;}

    const button = document.createElement('div');
    button.id = 'DiscordQuestButton';
    button.style.cssText = STYLES.button;

    const icon = document.createElement('img');
    icon.src = 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d8014ea898f3a4b2156c_Symbol.svg';
    icon.alt = 'Quest Icon';
    icon.style.cssText = STYLES.icon;
    button.appendChild(icon);

    const textLabel = document.createElement('span');
    textLabel.textContent = 'Running Quests';
    textLabel.style.cssText = STYLES.text;
    button.appendChild(textLabel);

    const expandButton = document.createElement('button');
    const arrowIcon = document.createElement('img');
    arrowIcon.src = 'https://pic.onlinewebfonts.com/thumbnails/icons_378683.svg';
    arrowIcon.style.cssText = 'width: 10px; height: 10px; display: block; pointer-events: none;';
    expandButton.appendChild(arrowIcon);
    expandButton.style.cssText = STYLES.expandButton + ' padding: 4px; display: flex; align-items: center; justify-content: center;';
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    button.appendChild(expandButton);
    expandButtonReference = expandButton;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    });

    button.addEventListener('click', () => handleButtonClick(button, textLabel, icon, expandButton));

    document.body.appendChild(button);

    if (isPanelExpanded) {
      createExpandedPanel();
    }
  }

  function handleButtonClick(button, textLabel, icon, expandButton) {
    const elements = { button, textLabel, icon, expandButton };

    if (typeof chrome === 'undefined' || !chrome.runtime) {
      updateButtonState(elements, { message: 'Extension Error', bgColor: '#ff4444', textColor: 'white', invertIcons: true });
      return;
    }

    chrome.runtime.sendMessage({ action: 'executeQuestCode' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Discord Auto Quest Error:', chrome.runtime.lastError);
        updateButtonState(elements, { message: 'Error', bgColor: 'black', textColor: 'white', invertIcons: true });
      } else if (response && response.success) {
        updateButtonState(elements, { message: 'Code Executed', bgColor: 'black', textColor: 'white', invertIcons: true });
      } else {
        updateButtonState(elements, { message: 'Error', bgColor: 'black', textColor: 'white', invertIcons: true });
      }
    });
  }

  function updateButtonState(elements, state) {
    const { button, textLabel, icon, expandButton } = elements;
    const { message, bgColor, textColor, invertIcons } = state;

    textLabel.textContent = message;
    button.style.background = bgColor;
    button.style.color = textColor;
    
    if (invertIcons) {
      icon.style.filter = 'brightness(0) invert(1)';
      expandButton.style.filter = 'brightness(0) invert(1)';
    }

    setTimeout(() => {
      textLabel.textContent = 'Running Quests';
      button.style.background = 'white';
      button.style.color = 'black';
      icon.style.filter = '';
      expandButton.style.filter = '';
    }, 2000);
  }

  function createExpandedPanel() {
    if (document.getElementById('DiscordQuestPanel')) {return;}

    const panel = document.createElement('div');
    panel.id = 'DiscordQuestPanel';
    panel.style.cssText = STYLES.panel;

    const title = document.createElement('h3');
    title.textContent = 'Discord ID | Auto Quest';
    title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px; font-weight: bold;';
    panel.appendChild(title);

    const credit = document.createElement('p');
    credit.style.cssText = 'margin: 0; font-size: 14px; color: #ccc;';
    credit.innerHTML = 'Credits by <a href="https://github.com/nvckai/Discord-Web-Multi-Quest-Completer" target="_blank" style="color: #fff; font-weight: bold; text-decoration: none;">6Together9</a>';
    panel.appendChild(credit);

    document.body.appendChild(panel);
  }

  function removeElements() {
    const existingButton = document.getElementById('DiscordQuestButton');
    if (existingButton) {existingButton.remove();}
    
    const existingPanel = document.getElementById('DiscordQuestPanel');
    if (existingPanel) {existingPanel.remove();}
  }

  function togglePanel() {
    isPanelExpanded = !isPanelExpanded;
    if (expandButtonReference) {
      expandButtonReference.style.transform = isPanelExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    
    if (isPanelExpanded) {
      createExpandedPanel();
    } else {
      const panel = document.getElementById('DiscordQuestPanel');
      if (panel) {panel.remove();}
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
