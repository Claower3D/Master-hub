document.querySelectorAll('.cat-pill').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const cat=btn.dataset.cat;
    document.querySelectorAll('.cat-pill').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('.cat-panel-view').forEach(c=>{
      c.classList.toggle('active',c.dataset.cat===cat);
    });
  });
});

// Run initApp immediately or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const themeToggle = document.getElementById('themeToggle');
  const catalogBtn = document.getElementById('catalogBtn');
  const megaMenu = document.getElementById('megaMenu');
  const megaOverlay = document.getElementById('megaOverlay');
  const megaMenuClose = document.getElementById('megaMenuClose');
  const megaNavTabs = document.querySelectorAll('.mega-nav a');
  const megaCats = document.querySelectorAll('.mega-col1 .mega-cat');
  const megaSubGroups = document.querySelectorAll('.mega-col2 .mega-sub-group');
  const megaDetailGroups = document.querySelectorAll('.mega-col3 .mega-detail-group');
  const megaPreviewGroup = document.getElementById('megaPreviewGroup');
  const megaPreviewTitle = document.getElementById('megaPreviewTitle');
  const megaPreviewBtn = document.getElementById('megaPreviewBtn');
  const citySelect = document.getElementById('citySelect');
  const selectedCity = document.getElementById('selectedCity');
  const footerCity = document.getElementById('footerCity');

  // Theme Toggle Logic
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.innerHTML = '<i class="ri-moon-line"></i>';
    } else {
      themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
    }

    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.innerHTML = isLight ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
    });
  }

  // Dictionary Init: store original Russian text in data-ru for dynamic dictionary translation
  function initDictionary() {
    if (window.dictInitialized) return;
    const selectors = [
      '.mega-nav a', '.mega-cat span', '.mega-cat-link', 
      '.srv-title', '.srv-desc', '.srv-price', '.srv-btn',
      '.mega-detail-title', '.mega-detail-section-title', '.mega-detail-grid a',
      '.mega-preview-desc', '.mega-preview-price', '.mega-preview-meta span',
      'select option', '.cb-form label', '.stat-num', '.stat-lbl', '.hero-lead',
      '.hero-card-title', '.hero-card-status', '.hero-card-desc', '.hero-card-meta'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el => {
      if (!el.hasAttribute('data-i18n') && !el.hasAttribute('data-ru')) {
        let textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '');
        if (textNode) {
          el.setAttribute('data-ru', textNode.nodeValue.trim());
        } else if (el.children.length === 0) {
          el.setAttribute('data-ru', el.textContent.trim());
        }
      }
    });
    window.dictInitialized = true;
  }

  initDictionary();

  // City Switcher Logic
  function updateCityDisplay(cityVal, lang) {
    const cityKey = 'city_' + cityVal;
    let cityName = "Алматы";
    if (translations && translations[lang] && translations[lang][cityKey]) {
      cityName = translations[lang][cityKey];
    } else if (translations && translations['ru'][cityKey]) {
      cityName = translations['ru'][cityKey];
    }
    if (selectedCity) selectedCity.textContent = cityName;
    const footerBrandCity = document.getElementById('footerBrandCity');
    if (footerBrandCity) footerBrandCity.textContent = cityName;
    if (footerCity) footerCity.textContent = (lang === 'en' ? cityName : (lang === 'kz' ? cityName + ' қ.' : 'г. ' + cityName));
  }

  if (citySelect) {
    const savedCity = localStorage.getItem('city') || 'almaty';
    citySelect.value = savedCity;
    citySelect.addEventListener('change', (e) => {
      const newCity = e.target.value;
      localStorage.setItem('city', newCity);
      const currentLang = localStorage.getItem('lang') || 'ru';
      updateCityDisplay(newCity, currentLang);
    });
  }

  // Language Switcher Logic
  function setLanguage(lang) {
    if (typeof translations === 'undefined' || !translations[lang]) return;
    
    // 1. Translate data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    // 2. Translate dictionary elements
    document.querySelectorAll('[data-ru]').forEach(el => {
      const ruText = el.getAttribute('data-ru');
      let newText = ruText;
      if (lang !== 'ru' && translations.dictionary && translations.dictionary[lang] && translations.dictionary[lang][ruText]) {
        newText = translations.dictionary[lang][ruText];
      }
      let textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '');
      if (textNode) {
        textNode.nodeValue = newText;
      } else if (el.children.length === 0) {
        el.textContent = newText;
      }
    });

    // 3. Update active buttons & state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);

    // 4. Update city display with new language
    const currentCity = localStorage.getItem('city') || (citySelect ? citySelect.value : 'almaty');
    updateCityDisplay(currentCity, lang);
  }

  window.setLanguage = setLanguage;
  const savedLang = localStorage.getItem('lang') || 'ru';
  setLanguage(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  function closeMegaMenu() {
    if (megaMenu) megaMenu.classList.remove('open');
    if (megaOverlay) megaOverlay.classList.remove('open');
  }

  // 1. Toggle Mega Menu
  if (catalogBtn && megaMenu) {
    catalogBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = megaMenu.classList.toggle('open');
      if (megaOverlay) megaOverlay.classList.toggle('open', isOpen);
    });
  }

  if (megaMenuClose) {
    megaMenuClose.addEventListener('click', closeMegaMenu);
  }

  if (megaOverlay) {
    megaOverlay.addEventListener('click', closeMegaMenu);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && megaMenu && megaMenu.classList.contains('open')) {
      closeMegaMenu();
    }
  });

  // Helper: Activate specific Detail Group or Preview Card
  function activateDetail(detailId, fallbackTitle = '', fallbackHref = '#') {
    let found = false;
    megaDetailGroups.forEach(group => {
      if (group.dataset.detail === detailId) {
        group.classList.add('active');
        found = true;
      } else {
        group.classList.remove('active');
      }
    });

    if (!found && megaPreviewGroup) {
      megaPreviewGroup.classList.add('active');
      if (megaPreviewTitle) megaPreviewTitle.textContent = fallbackTitle || 'Сервисный центр';
      if (megaPreviewBtn) megaPreviewBtn.setAttribute('href', fallbackHref || '#');
    } else if (found && megaPreviewGroup) {
      megaPreviewGroup.classList.remove('active');
    }
  }

  // Helper: Activate Sub Group and its first item
  function activateSubGroup(catId) {
    megaSubGroups.forEach(group => {
      if (group.dataset.for === catId) {
        group.classList.add('active');
        const firstSub = group.querySelector('.mega-sub');
        if (firstSub) { 
          group.querySelectorAll('.mega-sub').forEach(s => s.classList.remove('active'));
          firstSub.classList.add('active');
          const subId = firstSub.dataset.sub;
          const title = firstSub.textContent.trim();
          const href = firstSub.getAttribute('href') || (firstSub.querySelector('a') ? firstSub.querySelector('a').getAttribute('href') : '#');
          activateDetail(subId, title, href);
        } else {
          const activeCat = document.querySelector(`.mega-cat[data-cat="${catId}"]`);
          const title = activeCat ? activeCat.textContent.trim() : 'Услуга';
          const href = activeCat && activeCat.querySelector('a') ? activeCat.querySelector('a').getAttribute('href') : '#';
          activateDetail('none', title, href);
        }
      } else {
        group.classList.remove('active');
      }
    });
  }

  // Helper: Switch Tab in Mega Nav
  function switchTab(tabId) {
    megaNavTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });

    let firstVisibleCat = null;
    megaCats.forEach(cat => {
      if (cat.dataset.tab === tabId) {
        cat.style.display = 'flex';
        if (!firstVisibleCat) firstVisibleCat = cat;
      } else {
        cat.style.display = 'none';
        cat.classList.remove('active');
      }
    });

    if (firstVisibleCat) {
      firstVisibleCat.classList.add('active');
      activateSubGroup(firstVisibleCat.dataset.cat);
    }
  }

  // 2. Tab Click Logic
  megaNavTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = tab.dataset.tab;
      if (tabId) {
        e.preventDefault();
        switchTab(tabId);
      }
    });
  });

  // 3. Category Hover / Click Logic (col1)
  megaCats.forEach(cat => {
    const handler = (e) => {
      if (cat.classList.contains('active')) return;
      
      megaCats.forEach(c => {
        if (c.dataset.tab === cat.dataset.tab) c.classList.remove('active');
      });
      cat.classList.add('active');
      activateSubGroup(cat.dataset.cat);
    };

    cat.addEventListener('mouseenter', handler);
    cat.addEventListener('click', handler);
  });

  // 4. Subcategory Hover / Click Logic (col2)
  megaSubGroups.forEach(group => {
    const subs = group.querySelectorAll('.mega-sub');
    subs.forEach(sub => {
      const handler = (e) => {
        if (sub.classList.contains('active')) return;

        subs.forEach(s => s.classList.remove('active'));
        sub.classList.add('active');

        const subId = sub.dataset.sub;
        const title = sub.textContent.trim();
        const href = sub.getAttribute('href') || (sub.querySelector('a') ? sub.querySelector('a').getAttribute('href') : '#');
        activateDetail(subId, title, href);
      };

      sub.addEventListener('mouseenter', handler);
      sub.addEventListener('click', handler);
    });
  });
}
