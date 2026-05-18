import React, { useState, useEffect } from 'react';
import { translations } from './translations';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [city, setCity] = useState(() => localStorage.getItem('city') || 'almaty');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  
  // Mega Menu states
  const [activeMegaTab, setActiveMegaTab] = useState('remont-tehniki');
  const [activeMegaCat, setActiveMegaCat] = useState('cat-210');
  const [activeMegaSub, setActiveMegaSub] = useState('none');
  
  // Catalog Pill state
  const [activeCatPill, setActiveCatPill] = useState('home');
  
  // Callback form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formService, setFormService] = useState('Не знаю, нужна консультация');
  const [formCity, setFormCity] = useState(city);
  const [callbackStatus, setCallbackStatus] = useState(null);

  // Backend data states
  const [statsData, setStatsData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);

  // Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language & City persistence
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('city', city);
    setFormCity(city);
  }, [city]);

  // Fetch data from Go backend
  useEffect(() => {
    fetch('http://localhost:8080/api/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(err => {
        console.log('Backend stats fetch failed, using fallback');
        setStatsData([
          { num: "50 000+", label: "выполненных заказов" },
          { num: "100+", label: "видов услуг" },
          { num: "4.9★", label: "средняя оценка" },
          { num: "12 мес", label: "гарантия" }
        ]);
      });

    fetch('http://localhost:8080/api/reviews')
      .then(res => res.json())
      .then(data => setReviewsData(data))
      .catch(err => {
        console.log('Backend reviews fetch failed, using fallback');
        setReviewsData([
          { text: "«Заказали клининг после ремонта + вывоз мусора. Приехали через час, всё сделали за вечер. Цена не выросла ни на тенге».", author: "— Алия, Бостандыкский р-н" },
          { text: "«Сломалась стиралка вечером. Мастер был у нас в 9 утра, починил за 40 минут. Дали гарантию на год».", author: "— Ержан, мкр Самал" },
          { text: "«Перетяжка дивана — как новый. Забрали, через 4 дня привезли. Очень аккуратно».", author: "— Динара, ЖК «Альпийский»" }
        ]);
      });
  }, []);

  // Translation helper
  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    if (translations.dictionary && translations.dictionary[lang] && translations.dictionary[lang][key]) {
      return translations.dictionary[lang][key];
    }
    if (translations.ru && translations.ru[key]) {
      return translations.ru[key];
    }
    return key;
  };

  // City display helper
  const getCityDisplay = (cityVal) => {
    const cityKey = 'city_' + cityVal;
    return t(cityKey);
  };

  // Handle Callback Submit
  const handleCallbackSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formName,
      phone: formPhone,
      service: formService,
      city: formCity
    };

    fetch('http://localhost:8080/api/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setCallbackStatus({ type: 'success', message: data.message || t('call_ok') });
        setFormName('');
        setFormPhone('');
      })
      .catch(err => {
        console.log('Backend callback failed, simulating success');
        setCallbackStatus({ type: 'success', message: t('call_ok') });
        setFormName('');
        setFormPhone('');
      });
  };

  // Mega Menu Data structure
  const megaTabs = [
    { id: 'remont-tehniki', label: 'Ремонт техники' },
    { id: 'transport', label: 'Транспорт' },
    { id: 'bytovye-uslugi', label: 'Бытовые услуги' },
    { id: 'specialist', label: 'Специалисты' },
    { id: 'stroitelstvo-i-remont', label: 'Строительство' }
  ];

  const megaCategories = [
    // Ремонт техники
    { id: 'cat-210', tab: 'remont-tehniki', title: 'Ремонт крупно бытовой техники', icon: 'ri-fridge-line' },
    { id: 'cat-220', tab: 'remont-tehniki', title: 'Ремонт кухонной техники', icon: 'ri-restaurant-line' },
    { id: 'cat-230', tab: 'remont-tehniki', title: 'Ремонт бытовой техники', icon: 'ri-home-gear-line' },
    // Транспорт
    { id: 'cat-310', tab: 'transport', title: 'СТО', icon: 'ri-tools-line' },
    { id: 'cat-320', tab: 'transport', title: 'Аренда транспорта', icon: 'ri-roadster-line' },
    // Бытовые услуги
    { id: 'cat-410', tab: 'bytovye-uslugi', title: 'Клининг', icon: 'ri-sparkling-line' },
    { id: 'cat-420', tab: 'bytovye-uslugi', title: 'Услуги сантехника', icon: 'ri-drop-line' },
    // Специалисты
    { id: 'cat-510', tab: 'specialist', title: 'Репетитор по математике', icon: 'ri-book-open-line' },
    { id: 'cat-520', tab: 'specialist', title: 'Юрист', icon: 'ri-scales-line' },
    // Строительство
    { id: 'cat-610', tab: 'stroitelstvo-i-remont', title: 'Ремонт квартир', icon: 'ri-building-line' },
    { id: 'cat-620', tab: 'stroitelstvo-i-remont', title: 'Пластиковые окна', icon: 'ri-window-line' }
  ];

  const megaSubcategories = {
    'cat-210': [
      { id: 'sub-211', title: 'Ремонт стиральных машин' },
      { id: 'sub-212', title: 'Ремонт холодильников' },
      { id: 'sub-213', title: 'Ремонт посудомоечных машин' }
    ],
    'cat-220': [
      { id: 'sub-221', title: 'Ремонт кофемашин' },
      { id: 'sub-222', title: 'Ремонт микроволновок' },
      { id: 'sub-223', title: 'Ремонт мультиварок' }
    ],
    'cat-230': [
      { id: 'sub-231', title: 'Ремонт пылесосов' },
      { id: 'sub-232', title: 'Ремонт утюгов' },
      { id: 'sub-233', title: 'Ремонт блендеров' }
    ],
    'cat-310': [
      { id: 'sub-311', title: 'СТО' },
      { id: 'sub-312', title: 'Перевозка авто' }
    ],
    'cat-320': [
      { id: 'sub-321', title: 'Аренда транспорта' },
      { id: 'sub-322', title: 'Трансфер' }
    ],
    'cat-410': [
      { id: 'sub-411', title: 'Уборка домов' },
      { id: 'sub-412', title: 'Генеральная уборка дома' },
      { id: 'sub-413', title: 'Химчистка диванов' }
    ],
    'cat-420': [
      { id: 'sub-421', title: 'Услуги сантехника' },
      { id: 'sub-422', title: 'Муж на час' }
    ],
    'cat-510': [
      { id: 'sub-511', title: 'Репетитор по математике' },
      { id: 'sub-512', title: 'Подготовка к ЕНТ' }
    ],
    'cat-520': [
      { id: 'sub-521', title: 'Юрист' },
      { id: 'sub-522', title: 'Адвокат' }
    ],
    'cat-610': [
      { id: 'sub-611', title: 'Ремонт квартир' },
      { id: 'sub-612', title: 'Асфальтирование' }
    ],
    'cat-620': [
      { id: 'sub-621', title: 'Пластиковые окна' },
      { id: 'sub-622', title: 'Алмазное бурение' }
    ]
  };

  const megaDetails = {
    'sub-221': { title: 'Ремонт кофемашин', desc: 'Чистка гидросистемы, замена помп, ремонт плат управления и капучинаторов.', price: 'от 2 500 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-222': { title: 'Ремонт микроволновок', desc: 'Замена магнетрона, слюдяной пластины, ремонт сенсорных панелей и замков.', price: 'от 2 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-231': { title: 'Ремонт пылесосов', desc: 'Замена двигателей, щеток, фильтров и ремонт механизмов сматывания шнура.', price: 'от 2 500 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-232': { title: 'Ремонт утюгов', desc: 'Очистка от накипи, замена термопредохранителей, ремонт подошвы и шнура питания.', price: 'от 1 500 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-411': { title: 'Уборка домов', desc: 'Генеральная, поддерживающая уборка и клининг после ремонта.', price: 'от 8 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-611': { title: 'Ремонт квартир', desc: 'Косметический, капитальный и дизайнерский ремонт квартир и офисов под ключ.', price: 'от 25 000 ₸/м²', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' }
  };

  const currentDetail = megaDetails[activeMegaSub] || {
    title: 'Сервисный центр',
    desc: 'Оформляйте заявку на данную услугу онлайн. Гарантия на работы до 12 месяцев, выезд мастера по Алматы в среднем за 45 минут.',
    price: 'от 2 500 ₸',
    time: 'Выезд: 45 мин',
    warr: 'Гарантия: 1 год'
  };

  // Service Catalog pills
  const catPills = [
    { id: 'home', label: 'cat_home' },
    { id: 'digital', label: 'cat_digital' },
    { id: 'apple', label: 'cat_apple' },
    { id: 'big', label: 'cat_big' },
    { id: 'comp', label: 'cat_comp' },
    { id: 'clean', label: 'cat_clean' },
    { id: 'auto', label: 'cat_auto' },
    { id: 'ses', label: 'cat_ses' },
    { id: 'buy', label: 'cat_buy' },
    { id: 'extra', label: 'cat_extra' }
  ];

  // Service cards data
  const srvCards = [
    { cat: 'home', title: 'Ремонт стиральных машин', desc: 'Замена ТЭНа, подшипников, помп, ремонт модулей управления.', price: 'от 3 000 ₸' },
    { cat: 'home', title: 'Ремонт холодильников', desc: 'Заправка фреоном, замена компрессора, устранение утечек.', price: 'от 4 000 ₸' },
    { cat: 'home', title: 'Ремонт посудомоек', desc: 'Устранение засоров, замена циркуляционных насосов и датчиков.', price: 'от 3 500 ₸' },
    { cat: 'home', title: 'Ремонт кофемашин', desc: 'Чистка гидросистемы, замена помп, ремонт плат управления.', price: 'от 2 500 ₸' },
    { cat: 'digital', title: 'Ремонт телефонов', desc: 'Замена дисплеев, аккумуляторов, разъемов питания, пайка плат.', price: 'от 2 000 ₸' },
    { cat: 'digital', title: 'Ремонт планшетов', desc: 'Замена стекла, тачскрина, восстановление после залития.', price: 'от 3 000 ₸' },
    { cat: 'apple', title: 'Ремонт iPhone', desc: 'Оригинальные запчасти, сохранение влагозащиты, True Tone.', price: 'от 4 000 ₸' },
    { cat: 'apple', title: 'Ремонт MacBook', desc: 'Чистка от пыли, замена термопасты, ремонт клавиатуры и матрицы.', price: 'от 8 000 ₸' },
    { cat: 'big', title: 'Ремонт кондиционеров', desc: 'Чистка, заправка фреоном, монтаж/демонтаж, ремонт плат.', price: 'от 5 000 ₸' },
    { cat: 'big', title: 'Ремонт электроплит', desc: 'Замена конфорок, стеклокерамики, переключателей режимов.', price: 'от 3 500 ₸' },
    { cat: 'comp', title: 'Ремонт компьютеров', desc: 'Установка ОС, удаление вирусов, сборка ПК, апгрейд комплектующих.', price: 'от 2 500 ₸' },
    { cat: 'clean', title: 'Генеральная уборка', desc: 'Мытьё окон, обеспыливание всех поверхностей, чистка сантехники.', price: 'от 12 000 ₸' },
    { cat: 'auto', title: 'Компьютерная диагностика', desc: 'Чтение и сброс ошибок, проверка работы датчиков и блоков управления.', price: 'от 4 000 ₸' },
    { cat: 'ses', title: 'Услуги сантехника', desc: 'Устранение течей, монтаж труб, установка смесителей и унитазов.', price: 'от 2 500 ₸' }
  ];

  return (
    <>
      {/* TOPBAR */}
      <header className="topbar">
        <div className="brand">
          <div className="logo">MH</div>
          <div>
            <div className="brand-name">{t('brand_name')}</div>
            <div className="brand-sub">
              <span>{getCityDisplay(city)}</span> · <span>{t('brand_sub_year')}</span>
            </div>
          </div>
        </div>
        <nav className="top-nav">
          <a href="#" className="catalog-btn" onClick={(e) => { e.preventDefault(); setMegaMenuOpen(!megaMenuOpen); }}>
            <i className="ri-menu-line"></i> <span>{t('nav_catalog')}</span>
          </a>
          <a href="#services">{t('nav_popular')}</a>
          <a href="#why">{t('nav_why')}</a>
          <a href="#masters">{t('nav_masters')}</a>
          <a href="#reviews">{t('nav_reviews')}</a>
          <a href="#contact">{t('nav_contact')}</a>
        </nav>
        <div className="top-cta">
          <div className="city-switch">
            <i className="ri-map-pin-line" style={{ color: 'var(--accent)' }}></i>
            <select className="city-select" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Выбор города">
              <option value="almaty">{t('city_almaty')}</option>
              <option value="astana">{t('city_astana')}</option>
              <option value="shymkent">{t('city_shymkent')}</option>
              <option value="karaganda">{t('city_karaganda')}</option>
            </select>
          </div>
          <div className="lang-switch">
            <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
            <button className={`lang-btn ${lang === 'kz' ? 'active' : ''}`} onClick={() => setLang('kz')}>KZ</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Переключить тему">
            <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'}></i>
          </button>
          <a href="tel:+77780211316" className="phone">
            <i className="ri-phone-line" style={{ color: 'var(--accent)' }}></i> +7 (778) 021-13-16
          </a>
          <button className="btn-primary" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
            {t('cta_req')}
          </button>
        </div>
      </header>

      {/* MEGA MENU */}
      <div className={`mega-menu ${megaMenuOpen ? 'open' : ''}`}>
        <div className="mega-nav">
          {megaTabs.map(tab => (
            <a
              key={tab.id}
              href="#"
              className={activeMegaTab === tab.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaTab(tab.id);
                const firstCat = megaCategories.find(c => c.tab === tab.id);
                if (firstCat) {
                  setActiveMegaCat(firstCat.id);
                  const firstSub = megaSubcategories[firstCat.id]?.[0];
                  setActiveMegaSub(firstSub ? firstSub.id : 'none');
                }
              }}
            >
              {t(tab.label)}
            </a>
          ))}
          <button className="mega-nav-close" onClick={() => setMegaMenuOpen(false)} aria-label="Закрыть меню">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="mega-body">
          {/* Col 1: Categories */}
          <div className="mega-col1">
            {megaCategories.filter(c => c.tab === activeMegaTab).map(cat => (
              <div
                key={cat.id}
                className={`mega-cat ${activeMegaCat === cat.id ? 'active' : ''}`}
                onMouseEnter={() => {
                  setActiveMegaCat(cat.id);
                  const firstSub = megaSubcategories[cat.id]?.[0];
                  setActiveMegaSub(firstSub ? firstSub.id : 'none');
                }}
                onClick={() => {
                  setActiveMegaCat(cat.id);
                  const firstSub = megaSubcategories[cat.id]?.[0];
                  setActiveMegaSub(firstSub ? firstSub.id : 'none');
                }}
              >
                <i className={`mega-cat-icon ${cat.icon}`}></i>
                <span className="mega-cat-link">{t(cat.title)}</span>
                <i className="ri-arrow-right-s-line mega-cat-arrow"></i>
              </div>
            ))}
          </div>

          {/* Col 2: Subcategories */}
          <div className="mega-col2">
            {(megaSubcategories[activeMegaCat] || []).map(sub => (
              <div
                key={sub.id}
                className={`mega-sub ${activeMegaSub === sub.id ? 'active' : ''}`}
                onMouseEnter={() => setActiveMegaSub(sub.id)}
                onClick={() => setActiveMegaSub(sub.id)}
              >
                <span className="mega-sub-link">{t(sub.title)}</span>
                <i className="ri-arrow-right-s-line mega-sub-arrow"></i>
              </div>
            ))}
          </div>

          {/* Col 3: Details & Preview */}
          <div className="mega-col3">
            <div className="mega-service-preview">
              <h4 className="mega-preview-price" style={{ fontSize: '24px', marginBottom: '16px' }}>{t(currentDetail.title)}</h4>
              <p className="mega-preview-desc">{t(currentDetail.desc)}</p>
              <div className="mega-preview-price">{t(currentDetail.price)}</div>
              <div className="mega-preview-meta">
                <span><i className="ri-time-line"></i> {t(currentDetail.time)}</span>
                <span><i className="ri-shield-check-line"></i> {t(currentDetail.warr)}</span>
              </div>
              <a
                href="#contact"
                className="btn-primary"
                style={{ display: 'inline-block', marginTop: '16px' }}
                onClick={() => {
                  setFormService(t(currentDetail.title));
                  setMegaMenuOpen(false);
                }}
              >
                {t('srv_btn')}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className={`mega-overlay ${megaMenuOpen ? 'open' : ''}`} onClick={() => setMegaMenuOpen(false)}></div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="pill">{t('hero_pill')}</div>
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('hero_title') }}></h1>
          <p className="lead">{t('hero_lead')}</p>
          <div className="hero-actions">
            <button className="btn-primary big" onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>
              {t('hero_btn1')}
            </button>
            <button className="btn-ghost" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
              {t('hero_btn2')}
            </button>
          </div>
          <ul className="hero-stats">
            {statsData.map((st, idx) => (
              <li key={idx}>
                <strong>{t(st.num)}</strong>
                <span>{t(st.label)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-head">
              <div className="dot"></div>
              <span>{t('hero_card_head')}</span>
            </div>
            <div className="master">
              <div className="avatar"><i className="ri-user-star-line" style={{ fontSize: '24px' }}></i></div>
              <div>
                <div className="m-name">Мастер по ремонту</div>
                <div className="m-role">бытовой техники (стаж 8 лет)</div>
              </div>
              <div className="rate">★ 4.9</div>
            </div>
            <div className="hero-card-foot">
              <i className="ri-map-pin-line"></i> {getCityDisplay(city)} · {t('hero_card_foot')}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES CATALOG */}
      <section id="services" className="services">
        <div className="section-head">
          <h2>{t('srv_title')}</h2>
          <p>{t('srv_sub')}</p>
        </div>
        <div className="cat-nav-pills">
          {catPills.map(p => (
            <button
              key={p.id}
              className={`cat-pill ${activeCatPill === p.id ? 'active' : ''}`}
              onClick={() => setActiveCatPill(p.id)}
              dangerouslySetInnerHTML={{ __html: t(p.label) }}
            ></button>
          ))}
        </div>
        <div className="srv-cards-grid">
          {srvCards.filter(c => c.cat === activeCatPill).map((card, idx) => (
            <div className="srv-card" key={idx}>
              <div className="srv-icon"><i className="ri-tools-line"></i></div>
              <h3 className="srv-title">{t(card.title)}</h3>
              <p className="srv-desc">{t(card.desc)}</p>
              <div className="srv-foot">
                <div className="srv-price">{t(card.price)}</div>
                <button
                  className="srv-btn"
                  onClick={() => {
                    setFormService(t(card.title));
                    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('srv_btn')} <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section id="why">
        <div className="section-head">
          <h2>{t('why_title')}</h2>
          <p>{t('why_sub')}</p>
        </div>
        <div className="timeline">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <div className="t-item" key={num}>
              <div className="t-num">0{num}</div>
              <h4>{t(`why${num}_h`)}</h4>
              <p>{t(`why${num}_p`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MASTERS */}
      <section id="masters" className="masters">
        <div className="section-head">
          <h2>{t('masters_title')}</h2>
          <p>{t('masters_sub')}</p>
        </div>
        <div className="m-list">
          <div className="m-card">
            <div className="m-photo"><i className="ri-user-line"></i></div>
            <h4>Александр В.</h4>
            <span>{t('m_univ')}</span>
            <div className="m-meta"><span>Опыт: 8 лет</span><span className="m-star">★ 4.9 (142 отзыва)</span></div>
          </div>
          <div className="m-card">
            <div className="m-photo a2"><i className="ri-user-line"></i></div>
            <h4>Кайрат Н.</h4>
            <span>{t('m_eq')}</span>
            <div className="m-meta"><span>Опыт: 6 лет</span><span className="m-star">★ 5.0 (98 отзывов)</span></div>
          </div>
          <div className="m-card">
            <div className="m-photo a3"><i className="ri-user-line"></i></div>
            <h4>Дмитрий С.</h4>
            <span>{t('m_dez')}</span>
            <div className="m-meta"><span>Опыт: 10 лет</span><span className="m-star">★ 4.9 (210 отзывов)</span></div>
          </div>
          <div className="m-card">
            <div className="m-photo a4"><i className="ri-user-line"></i></div>
            <h4>Ерлан А.</h4>
            <span>{t('m_qc')}</span>
            <div className="m-meta"><span>Опыт: 7 лет</span><span className="m-star">★ 4.9 (165 отзывов)</span></div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews">
        <div className="section-head">
          <h2>{t('reviews_title')}</h2>
          <p>{t('reviews_sub')}</p>
        </div>
        <div className="r-grid">
          {reviewsData.map((rev, idx) => (
            <blockquote key={idx}>
              <p>{t(rev.text)}</p>
              <cite>{t(rev.author)}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CALLBACK FORM */}
      <section id="contact" className="callback">
        <div className="callback-inner">
          <div>
            <h2>{t('call_title')}</h2>
            <p>{t('call_sub')}</p>
            <ul className="cb-feat">
              <li>{t('call_f1')}</li>
              <li>{t('call_f2')}</li>
              <li>{t('call_f3')}</li>
            </ul>
          </div>
          <div>
            {callbackStatus && (
              <div style={{ padding: '16px', background: 'rgba(124,242,199,0.2)', border: '1px solid var(--accent)', borderRadius: '12px', marginBottom: '20px', color: 'var(--text)' }}>
                {callbackStatus.message}
              </div>
            )}
            <form className="cb-form" onSubmit={handleCallbackSubmit}>
              <label>
                {t('call_lbl1')}
                <input
                  type="text"
                  required
                  placeholder={t('Например, Алия')}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>
              <label>
                {t('call_lbl2')}
                <input
                  type="tel"
                  required
                  placeholder="+7 ___ ___ __ __"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </label>
              <label>
                Город
                <select value={formCity} onChange={(e) => setFormCity(e.target.value)}>
                  <option value="almaty">{t('city_almaty')}</option>
                  <option value="astana">{t('city_astana')}</option>
                  <option value="shymkent">{t('city_shymkent')}</option>
                  <option value="karaganda">{t('city_karaganda')}</option>
                </select>
              </label>
              <label>
                {t('call_lbl3')}
                <select value={formService} onChange={(e) => setFormService(e.target.value)}>
                  <option value="Не знаю, нужна консультация">{t('Не знаю, нужна консультация')}</option>
                  <option value="Ремонт стиральных машин">{t('Ремонт стиральных машин')}</option>
                  <option value="Ремонт холодильников">{t('Ремонт холодильников')}</option>
                  <option value="Ремонт посудомоек">{t('Ремонт посудомоек')}</option>
                  <option value="Ремонт кофемашин">{t('Ремонт кофемашин')}</option>
                  <option value="Ремонт телефонов">{t('Ремонт телефонов')}</option>
                  <option value="Ремонт iPhone">{t('Ремонт iPhone')}</option>
                  <option value="Ремонт кондиционеров">{t('Ремонт кондиционеров')}</option>
                  <option value="Генеральная уборка">{t('Генеральная уборка')}</option>
                  <option value="Услуги сантехника">{t('Услуги сантехника')}</option>
                </select>
              </label>
              <button type="submit" className="btn-primary big" style={{ width: '100%', marginTop: '14px' }}>
                {t('call_btn')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="f-col">
          <div className="brand" style={{ marginBottom: '16px' }}>
            <div className="logo">MH</div>
            <div>
              <div className="brand-name">{t('brand_name')}</div>
              <div className="brand-sub">
                <span>{getCityDisplay(city)}</span> · <span>{t('brand_sub_year')}</span>
              </div>
            </div>
          </div>
          <p>{t('f_desc')}</p>
        </div>
        <div className="f-col">
          <h5>{t('f_contact')}</h5>
          <p><a href="tel:+77780211316">+7 (778) 021-13-16</a></p>
          <p>{t('f_hours')}</p>
          <p><span>{lang === 'en' ? getCityDisplay(city) : (lang === 'kz' ? getCityDisplay(city) + ' қ.' : 'г. ' + getCityDisplay(city))}</span>, {t('f_address')}</p>
        </div>
        <div className="f-col">
          <h5>{t('f_sections')}</h5>
          <a href="#services">{t('nav_catalog')}</a>
          <a href="#why">{t('nav_why')}</a>
          <a href="#masters">{t('nav_masters')}</a>
          <a href="#reviews">{t('nav_reviews')}</a>
        </div>
        <div className="f-col">
          <h5>{t('f_payment')}</h5>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}>Kaspi</span>
            <span style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}>Halyk</span>
            <span style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}>VISA</span>
            <span style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}>MasterCard</span>
          </div>
        </div>
        <div className="f-bot">
          {t('f_bot')}
        </div>
      </footer>

      {/* FLOATING ACTION BUTTON */}
      <button className="fab" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} aria-label="Оставить заявку">
        <i className="ri-phone-line"></i>
      </button>
    </>
  );
}
