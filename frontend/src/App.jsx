import React, { useState, useEffect } from 'react';
import { translations } from './translations';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : '';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [city, setCity] = useState(() => localStorage.getItem('city') || 'almaty');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  
  // Mega Menu states
  const [activeMegaTab, setActiveMegaTab] = useState('okna');
  const [activeMegaCat, setActiveMegaCat] = useState('cat-okna-1');
  const [activeMegaSub, setActiveMegaSub] = useState('none');
  const [megaSearchQuery, setMegaSearchQuery] = useState('');
  
  // Dedicated Category Page & Modal States
  const [activePage, setActivePage] = useState(() => {
    return window.location.hash === '#/admin' ? 'admin' : 'home';
  }); // 'home' | 'category' | 'admin'
  const [selectedCategoryPageObj, setSelectedCategoryPageObj] = useState(null);
  const [selectedModalItem, setSelectedModalItem] = useState(null); // { title, type: 'brand' | 'service', parentTitle }
  
  // Catalog Pill state
  const [activeCatPill, setActiveCatPill] = useState('okna');
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMasterCat, setActiveMasterCat] = useState('okna');
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % 3);
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  
  // Callback form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formService, setFormService] = useState('Не знаю, нужна консультация');
  const [formCity, setFormCity] = useState(city);
  const [callbackStatus, setCallbackStatus] = useState(null);

  // Assistant Modal State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    { sender: 'ai', text: 'Здравствуйте! Я виртуальный ассистент MasterHub. Помогу подобрать услугу, рассчитать стоимость или вызвать мастера. Какой у вас вопрос?' }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [showAssistantTooltip, setShowAssistantTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAssistantTooltip(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Admin panel states
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminCallbacks, setAdminCallbacks] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilterDate, setAdminFilterDate] = useState('');
  const [adminFilterStatus, setAdminFilterStatus] = useState('all');

  // Hash routing: detect #/admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/admin') {
        setActivePage('admin');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleResponse = async (res) => {
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  };

  const fetchAdminCallbacks = (tok) => {
    const t = tok || token;
    if (!t) return;
    setAdminLoading(true);
    fetch(API_BASE + '/api/callbacks', {
      headers: { 'Authorization': `Bearer ${t}` }
    })
      .then(res => { if (!res.ok) throw new Error('fail'); return res.json(); })
      .then(data => setAdminCallbacks(data || []))
      .catch(err => console.error('Admin fetch error:', err))
      .finally(() => setAdminLoading(false));
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAdminError('');
    fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    })
      .then(handleResponse)
      .then(data => {
        if (data.user?.role !== 'admin') throw new Error('Доступ только для администраторов');
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAdminAuthed(true);
        fetchAdminCallbacks(data.token);
      })
      .catch(err => setAdminError(err.message));
  };

  const handleAdminStatusChange = (id, newStatus) => {
    fetch(API_BASE + '/api/callbacks/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, status: newStatus })
    })
      .then(res => { if (!res.ok) throw new Error('fail'); fetchAdminCallbacks(); })
      .catch(err => console.error(err));
  };

  // Auto-auth admin if already logged in as admin
  useEffect(() => {
    if (activePage === 'admin' && user?.role === 'admin' && token) {
      setAdminAuthed(true);
      fetchAdminCallbacks(token);
    }
  }, [activePage]);

  // Auth & Cabinet states
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCity, setAuthCity] = useState(city);

  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [myCallbacks, setMyCallbacks] = useState([]);
  const [callbacksLoading, setCallbacksLoading] = useState(false);
  const [cabinetTab, setCabinetTab] = useState('dashboard'); // 'dashboard' | 'profile' | 'support'
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditCity(user.city);
    }
  }, [user]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    fetch(API_BASE + '/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: editName,
        phone: editPhone,
        city: editCity,
        password: editPassword
      })
    })
      .then(handleResponse)
      .then(data => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setProfileSuccess(t('cab_profile_updated'));
        setEditPassword('');
      })
      .catch(err => setProfileError(err.message));
  };

  const fetchMyCallbacks = () => {
    if (!token) return;
    setCallbacksLoading(true);
    
    // Refresh user info to get latest bonuses balance
    fetch(API_BASE + '/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => { if (res.ok) return res.json(); })
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(err => console.log('Error refreshing user details:', err));

    fetch(API_BASE + '/api/callbacks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch callbacks');
        return res.json();
      })
      .then(data => {
        setMyCallbacks(data || []);
      })
      .catch(err => console.log('Error fetching callbacks:', err))
      .finally(() => setCallbacksLoading(false));
  };

  useEffect(() => {
    if (token) {
      fetchMyCallbacks();
    } else {
      setMyCallbacks([]);
    }
  }, [token]);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword })
    })
      .then(handleResponse)
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
      })
      .catch(err => setAuthError(err.message));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: authName,
        email: authEmail,
        phone: authPhone,
        city: authCity,
        password: authPassword
      })
    })
      .then(handleResponse)
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthName('');
        setAuthEmail('');
        setAuthPhone('');
        setAuthPassword('');
      })
      .catch(err => setAuthError(err.message));
  };

  const handleLogout = () => {
    fetch(API_BASE + '/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).finally(() => {
      setToken('');
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsCabinetOpen(false);
    });
  };

  const handleUpdateStatus = (callbackId, newStatus) => {
    fetch(API_BASE + '/api/callbacks/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: callbackId, status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status');
        fetchMyCallbacks();
      })
      .catch(err => console.error(err));
  };

  const handleAssistantSend = (textToSend) => {
    const query = textToSend || assistantInput;
    if (!query.trim()) return;

    const newMsgs = [...assistantMessages, { sender: 'user', text: query }];
    setAssistantMessages(newMsgs);
    if (!textToSend) setAssistantInput('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiReply = "Спасибо за обращение! Наш специалист свяжется с вами в течение 5 минут для точного расчета.";
      const qLower = query.toLowerCase();
      if (qLower.includes('цен') || qLower.includes('стоим') || qLower.includes('прайс')) {
        aiReply = "Стоимость большинства услуг начинается от 2 500 ₸. Выезд мастера и диагностика при продолжении работ — бесплатно! Хотите оставить заявку на точный расчет?";
      } else if (qLower.includes('срочн') || qLower.includes('быстр') || qLower.includes('выезд')) {
        aiReply = "Среднее время прибытия мастера по городу — всего 45 минут! У нас 14 дежурных мастеров онлайн. Оформим срочный выезд?";
      } else if (qLower.includes('гарант')) {
        aiReply = "Мы предоставляем официальную гарантию до 12 месяцев на все виды работ и комплектующие. Выдаем акт выполненных работ!";
      } else if (qLower.includes('график') || qLower.includes('работ')) {
        aiReply = "Мы работаем ежедневно, без выходных с 09:00 до 21:00. Готовы принять вашу заявку прямо сейчас!";
      }

      setAssistantMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    }, 600);
  };

  // Backend data states
  const [statsData, setStatsData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);

  // Reviews submit states
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Color customizer states
  const [accentColor, setAccentColor] = useState('#7cf2c7');
  const [accent2Color, setAccent2Color] = useState('#5b8cff');
  const [accent3Color, setAccent3Color] = useState('#ff7a59');
  const [isColorPanelOpen, setIsColorPanelOpen] = useState(false);

  // Load color values depending on active theme
  useEffect(() => {
    if (theme === 'light') {
      const savedAccent = localStorage.getItem('accent-color-light') || '#f97316';
      const savedAccent2 = localStorage.getItem('accent-2-color-light') || '#ea580c';
      const savedAccent3 = localStorage.getItem('accent-3-color-light') || '#10b981';
      setAccentColor(savedAccent);
      setAccent2Color(savedAccent2);
      setAccent3Color(savedAccent3);
    } else {
      const savedAccent = localStorage.getItem('accent-color-dark') || '#7cf2c7';
      const savedAccent2 = localStorage.getItem('accent-2-color-dark') || '#5b8cff';
      const savedAccent3 = localStorage.getItem('accent-3-color-dark') || '#ff7a59';
      setAccentColor(savedAccent);
      setAccent2Color(savedAccent2);
      setAccent3Color(savedAccent3);
    }
  }, [theme]);

  useEffect(() => {
    document.body.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--accent', accentColor);
    const key = theme === 'light' ? 'accent-color-light' : 'accent-color-dark';
    localStorage.setItem(key, accentColor);
  }, [accentColor, theme]);

  useEffect(() => {
    document.body.style.setProperty('--accent-2', accent2Color);
    document.documentElement.style.setProperty('--accent-2', accent2Color);
    const key = theme === 'light' ? 'accent-2-color-light' : 'accent-2-color-dark';
    localStorage.setItem(key, accent2Color);
  }, [accent2Color, theme]);

  useEffect(() => {
    document.body.style.setProperty('--accent-3', accent3Color);
    document.documentElement.style.setProperty('--accent-3', accent3Color);
    const key = theme === 'light' ? 'accent-3-color-light' : 'accent-3-color-dark';
    localStorage.setItem(key, accent3Color);
  }, [accent3Color, theme]);

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
    fetch(API_BASE + '/api/stats')
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

    fetch(API_BASE + '/api/reviews')
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

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewSuccess('');
    setReviewError('');

    if (!reviewText.trim()) {
      setReviewError(lang === 'ru' ? 'Введите текст отзыва' : lang === 'kz' ? 'Пікір мәтінін енгізіңіз' : 'Please enter review text');
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(API_BASE + '/api/reviews/new', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        author: reviewAuthor.trim() || (user ? user.name : ''),
        text: reviewText,
        rating: reviewRating
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit review');
        return res.json();
      })
      .then(newRev => {
        setReviewsData(prev => [newRev, ...prev]);
        setReviewText('');
        setReviewAuthor('');
        setReviewRating(5);
        setReviewSuccess(lang === 'ru' ? 'Отзыв успешно добавлен!' : lang === 'kz' ? 'Пікір сәтті қосылды!' : 'Review added successfully!');
      })
      .catch(err => setReviewError(err.message));
  };

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

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(API_BASE + '/api/callback', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setCallbackStatus({ type: 'success', message: data.message || t('call_ok') });
        setFormName('');
        setFormPhone('');
        if (token) {
          fetchMyCallbacks();
        }
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
    { id: 'okna', label: 'Окна' },
    { id: 'servis', label: 'Сервис' },
    { id: 'mebel', label: 'Мебель' }
  ];

  const megaCategories = [
    // Окна
    { id: 'cat-okna-1', tab: 'okna', title: 'Москитные сетки', icon: 'ri-window-line' },
    { id: 'cat-okna-2', tab: 'okna', title: 'Детская защита и решетки', icon: 'ri-shield-check-line' },
    { id: 'cat-okna-3', tab: 'okna', title: 'Ремонт окон', icon: 'ri-tools-line' },
    { id: 'cat-okna-4', tab: 'okna', title: 'Изготовление окон', icon: 'ri-building-line' },
    { id: 'cat-okna-5', tab: 'okna', title: 'Ролл-шторы и жалюзи', icon: 'ri-layout-top-line' },

    // Сервис
    { id: 'cat-srv-1', tab: 'servis', title: 'Ремонт стиральных машин', icon: 'ri-t-shirt-air-line' },
    { id: 'cat-srv-2', tab: 'servis', title: 'Ремонт холодильников', icon: 'ri-fridge-line' },
    { id: 'cat-srv-3', tab: 'servis', title: 'Ремонт кондиционеров и посудомоечных машин', icon: 'ri-temp-cold-line' },
    { id: 'cat-srv-4', tab: 'servis', title: 'Установка/Ремонт вытяжек', icon: 'ri-windy-line' },
    { id: 'cat-srv-5', tab: 'servis', title: 'Установка/Ремонт кондиционеров', icon: 'ri-temp-cold-line' },
    { id: 'cat-srv-6', tab: 'servis', title: 'Сварка', icon: 'ri-flashlight-line' },
    { id: 'cat-srv-7', tab: 'servis', title: 'Металлоконструкции', icon: 'ri-grid-line' },
    { id: 'cat-srv-8', tab: 'servis', title: 'Электрика', icon: 'ri-lightbulb-flash-line' },

    // Мебель
    { id: 'cat-meb-1', tab: 'mebel', title: 'Мебель на заказ (корпусная, мягкая)', icon: 'ri-sofa-line' }
  ];

  const megaSubcategories = {
    // Окна
    'cat-okna-1': [
      { id: 'sub-okna-1-1', title: 'Москитные сетки Стандарт' },
      { id: 'sub-okna-1-2', title: 'Сетки Антикошка' },
      { id: 'sub-okna-1-3', title: 'Сетки Антипыль' }
    ],
    'cat-okna-2': [
      { id: 'sub-okna-2-1', title: 'Детские замки на окна' },
      { id: 'sub-okna-2-2', title: 'Металлические решетки' },
      { id: 'sub-okna-2-3', title: 'Защитные тросики' }
    ],
    'cat-okna-3': [
      { id: 'sub-okna-3-1', title: 'Регулировка окон' },
      { id: 'sub-okna-3-2', title: 'Замена стеклопакетов' },
      { id: 'sub-okna-3-3', title: 'Замена уплотнителей' },
      { id: 'sub-okna-3-4', title: 'Замена ручек и навесов' },
      { id: 'sub-okna-3-5', title: 'Сложное открывание' },
      { id: 'sub-okna-3-6', title: 'Детский замок' },
      { id: 'sub-okna-3-7', title: 'Замок курильщика' }
    ],
    'cat-okna-4': [
      { id: 'sub-okna-4-1', title: 'Пластиковые окна ПВХ' },
      { id: 'sub-okna-4-2', title: 'Алюминиевые окна' },
      { id: 'sub-okna-4-3', title: 'Остекление балконов и лоджий' }
    ],
    'cat-okna-5': [
      { id: 'sub-okna-5-1', title: 'Рулонные шторы (Ролл-шторы)' },
      { id: 'sub-okna-5-2', title: 'Горизонтальные жалюзи' },
      { id: 'sub-okna-5-3', title: 'Вертикальные жалюзи' }
    ],

    // Сервис
    'cat-srv-1': [
      { id: 'sub-srv-1-1', title: 'Замена ТЭНа' },
      { id: 'sub-srv-1-2', title: 'Замена подшипников' },
      { id: 'sub-srv-1-3', title: 'Замена сливного насоса (помпы)' },
      { id: 'sub-srv-1-4', title: 'Ремонт модуля управления' }
    ],
    'cat-srv-2': [
      { id: 'sub-srv-2-1', title: 'Заправка фреоном' },
      { id: 'sub-srv-2-2', title: 'Замена компрессора' },
      { id: 'sub-srv-2-3', title: 'Замена термостата' },
      { id: 'sub-srv-2-4', title: 'Ремонт системы No Frost' }
    ],
    'cat-srv-3': [
      { id: 'sub-srv-3-1', title: 'Ремонт кондиционеров' },
      { id: 'sub-srv-3-2', title: 'Ремонт посудомоечных машин' },
      { id: 'sub-srv-3-3', title: 'Чистка и заправка сплит-систем' }
    ],
    'cat-srv-4': [
      { id: 'sub-srv-4-1', title: 'Установка кухонных вытяжек' },
      { id: 'sub-srv-4-2', title: 'Ремонт двигателей и плат вытяжек' },
      { id: 'sub-srv-4-3', title: 'Замена фильтров' }
    ],
    'cat-srv-5': [
      { id: 'sub-srv-5-1', title: 'Монтаж кондиционеров' },
      { id: 'sub-srv-5-2', title: 'Демонтаж сплит-систем' },
      { id: 'sub-srv-5-3', title: 'Сервисное обслуживание' }
    ],
    'cat-srv-6': [
      { id: 'sub-srv-6-1', title: 'Сварочные работы с выездом' },
      { id: 'sub-srv-6-2', title: 'Сварка труб и каркасов' },
      { id: 'sub-srv-6-3', title: 'Электродуговая и аргонная сварка' }
    ],
    'cat-srv-7': [
      { id: 'sub-srv-7-1', title: 'Изготовление металлоконструкций' },
      { id: 'sub-srv-7-2', title: 'Навесы и козырьки' },
      { id: 'sub-srv-7-3', title: 'Заборы и ворота' }
    ],
    'cat-srv-8': [
      { id: 'sub-srv-8-1', title: 'Монтаж электропроводки' },
      { id: 'sub-srv-8-2', title: 'Установка розеток и выключателей' },
      { id: 'sub-srv-8-3', title: 'Сборка электрощитов' },
      { id: 'sub-srv-8-4', title: 'Устранение короткого замыкания' }
    ],

    // Мебель
    'cat-meb-1': [
      { id: 'sub-meb-1-1', title: 'Корпусная мебель на заказ' },
      { id: 'sub-meb-1-2', title: 'Мягкая мебель на заказ' },
      { id: 'sub-meb-1-3', title: 'Кухни и шкафы-купе' },
      { id: 'sub-meb-1-4', title: 'Перетяжка и ремонт мебели' }
    ]
  };

  const megaDetails = {
    'sub-okna-1-1': { title: 'Москитные сетки Стандарт', desc: 'Надежная защита от насекомых, тополиного пуха и пыли. Быстрое изготовление и установка по размеру вашего окна.', price: 'от 2 500 ₸', time: 'Изготовление: 1 день', warr: 'Гарантия: 1 год' },
    'sub-okna-1-2': { title: 'Сетки Антикошка', desc: 'Усиленное полотно из прочных нитей, устойчивое к когтям домашних животных. Гарантирует безопасность вашего питомца.', price: 'от 5 000 ₸', time: 'Изготовление: 1 день', warr: 'Гарантия: 1 год' },
    'sub-okna-1-3': { title: 'Сетки Антипыль', desc: 'Специальное мелкоячеистое полотно, задерживающее уличную пыль и аллергены. Идеально для аллергиков и семей с детьми.', price: 'от 4 500 ₸', time: 'Изготовление: 1 день', warr: 'Гарантия: 1 год' },
    'sub-okna-2-1': { title: 'Детские замки на окна', desc: 'Блокираторы открывания створки с ключом. Позволяют откидывать окно на проветривание, не открывая его нараспашку.', price: 'от 2 000 ₸', time: 'Установка: 30 мин', warr: 'Гарантия: 1 год' },
    'sub-okna-2-2': { title: 'Металлические решетки', desc: 'Прочные сварные и кованые решетки на окна для защиты от взлома и выпадения детей.', price: 'от 12 000 ₸/м²', time: 'Изготовление: от 2 дней', warr: 'Гарантия: 3 года' },
    'sub-okna-3-1': { title: 'Регулировка окон', desc: 'Устранение провисания створок, продуваний, настройка прижима зима/лето, смазка фурнитуры.', price: 'от 1 500 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-okna-3-2': { title: 'Замена стеклопакетов', desc: 'Замена разбитых, треснувших или запотевающих стеклопакетов на новые энергосберегающие.', price: 'от 15 000 ₸', time: 'Изготовление: 1-2 дня', warr: 'Гарантия: 3 года' },
    'sub-okna-3-3': { title: 'Замена уплотнителей', desc: 'Демонтаж старой резины и установка качественного немецкого или российского уплотнителя (EPDM/KBE/REHAU).', price: 'от 800 ₸/м', time: 'Выезд: 45 мин', warr: 'Гарантия: 5 лет' },
    'sub-okna-3-4': { title: 'Замена ручек и навесов', desc: 'Замена сломанных ручек, установка ручек с замком, ремонт и замена оконных петель и навесов.', price: 'от 2 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-okna-3-5': { title: 'Сложное открывание', desc: 'Модернизация поворотной створки в поворотно-откидную (сложное открывание) без замены самого окна.', price: 'от 12 000 ₸', time: 'Работа: 1 час', warr: 'Гарантия: 2 года' },
    'sub-okna-3-6': { title: 'Детский замок', desc: 'Надежная защита створки от случайного открывания детьми. Ключ в комплекте.', price: 'от 2 000 ₸', time: 'Установка: 30 мин', warr: 'Гарантия: 1 год' },
    'sub-okna-3-7': { title: 'Замок курильщика', desc: 'Балконная защелка (замок курильщика), позволяющая фиксировать балконную дверь снаружи.', price: 'от 1 500 ₸', time: 'Установка: 20 мин', warr: 'Гарантия: 1 год' },
    'sub-okna-4-1': { title: 'Пластиковые окна ПВХ', desc: 'Изготовление и монтаж высококачественных пластиковых окон из профилей Rehau, Veka, KBE, Funke.', price: 'от 35 000 ₸', time: 'Изготовление: 3-5 дней', warr: 'Гарантия: 5 лет' },
    'sub-okna-5-1': { title: 'Рулонные шторы (Ролл-шторы)', desc: 'Большой выбор тканей (блэкаут, день-ночь, зебра). Индивидуальный замер и профессиональная установка.', price: 'от 5 000 ₸', time: 'Изготовление: 1-2 дня', warr: 'Гарантия: 1 год' },
    'sub-srv-1-1': { title: 'Замена ТЭНа', desc: 'Замена нагревательного элемента стиральной машины при отсутствии нагрева воды или выбивании автоматов.', price: 'от 4 500 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-1-2': { title: 'Замена подшипников', desc: 'Профессиональная разборка бака и замена сальников и подшипников при сильном шуме и гуле во время отжима.', price: 'от 12 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-2-1': { title: 'Заправка фреоном', desc: 'Поиск и устранение утечки хладагента, вакуумирование системы и заправка фреоном (R600a, R134a).', price: 'от 6 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-3-1': { title: 'Ремонт кондиционеров', desc: 'Чистка сплит-систем, дозаправка фреоном, устранение течи конденсата, ремонт плат управления и компрессоров.', price: 'от 5 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-4-1': { title: 'Установка кухонных вытяжек', desc: 'Монтаж купольных, встраиваемых, островных вытяжек, подключение к вентиляционному каналу и электросети.', price: 'от 5 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-5-1': { title: 'Монтаж кондиционеров', desc: 'Профессиональная установка сплит-систем любой мощности с использованием качественной медной трассы.', price: 'от 15 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 2 года' },
    'sub-srv-6-1': { title: 'Сварочные работы с выездом', desc: 'Услуги квалифицированного сварщика со своим профессиональным оборудованием. Сварка труб, петель, каркасов.', price: 'от 5 000 ₸', time: 'Выезд: 45 мин', warr: 'Гарантия: 1 год' },
    'sub-srv-7-1': { title: 'Изготовление металлоконструкций', desc: 'Проектирование, сварка и монтаж навесов, козырьков, лестниц, заборов, ворот и стеллажей по вашим размерам.', price: 'от 15 000 ₸/м²', time: 'Изготовление: от 3 дней', warr: 'Гарантия: 3 года' },
    'sub-srv-8-1': { title: 'Монтаж электропроводки', desc: 'Полная или частичная замена электропроводки в квартирах, домах и офисах по современным стандартам ПУЭ.', price: 'от 2 000 ₸/точка', time: 'Выезд: 45 мин', warr: 'Гарантия: 3 года' },
    'sub-meb-1-1': { title: 'Корпусная мебель на заказ', desc: 'Индивидуальный дизайн и изготовление кухонных гарнитуров, шкафов-купе, гардеробных, столов и тумб из ЛДСП/МДФ.', price: 'от 45 000 ₸/п.м.', time: 'Изготовление: от 5 дней', warr: 'Гарантия: 2 года' },
    'sub-meb-1-2': { title: 'Мягкая мебель на заказ', desc: 'Изготовление стильных и комфортных диванов, кресел, кроватей, пуфов по индивидуальным размерам и эскизам.', price: 'от 60 000 ₸', time: 'Изготовление: от 7 дней', warr: 'Гарантия: 2 года' }
  };

  const activeSubObj = Object.values(megaSubcategories).flat().find(s => s.id === activeMegaSub);
  const activeCatObj = megaCategories.find(c => c.id === activeMegaCat);
  const fallbackTitle = activeSubObj ? activeSubObj.title : (activeCatObj ? activeCatObj.title : 'Сервисный центр');

  const currentDetail = megaDetails[activeMegaSub] || {
    title: fallbackTitle,
    desc: 'Оформляйте заявку на данную услугу онлайн. Гарантия на работы до 12 месяцев, выезд мастера по Алматы в среднем за 45 минут.',
    price: 'от 2 500 ₸',
    time: 'Выезд: 45 мин',
    warr: 'Гарантия: 1 год'
  };

  // Helper to filter categories and subcategories
  const getMegaSearchResults = () => {
    if (!megaSearchQuery.trim()) return { categories: [], subcategories: [] };
    const query = megaSearchQuery.toLowerCase();
    
    // Find matching categories
    const matchingCats = megaCategories.filter(cat => {
      const translatedTitle = t(cat.title).toLowerCase();
      const rawTitle = cat.title.toLowerCase();
      return rawTitle.includes(query) || translatedTitle.includes(query);
    });

    // Find matching subcategories
    const matchingSubs = [];
    Object.entries(megaSubcategories).forEach(([catId, subList]) => {
      const parentCat = megaCategories.find(c => c.id === catId);
      if (!parentCat) return;
      subList.forEach(sub => {
        const translatedTitle = t(sub.title).toLowerCase();
        const rawTitle = sub.title.toLowerCase();
        if (rawTitle.includes(query) || translatedTitle.includes(query)) {
          matchingSubs.push({
            ...sub,
            parentCat
          });
        }
      });
    });

    return { categories: matchingCats, subcategories: matchingSubs };
  };

  const searchResults = getMegaSearchResults();
  const hasSearchResults = megaSearchQuery.trim().length > 0;

  // Service Catalog pills
  const catPills = [
    { id: 'okna', label: 'Окна' },
    { id: 'servis', label: 'Сервис' },
    { id: 'mebel', label: 'Мебель' }
  ];

  // Service cards data
  const srvCards = [
    // Окна
    { cat: 'okna', title: 'Москитные сетки', desc: 'Надежная защита от насекомых, тополиного пуха и пыли. Быстрое изготовление и установка.', price: 'от 2 500 ₸', img: './cat_moskit.png' },
    { cat: 'okna', title: 'Детская защита и решетки', desc: 'Блокираторы с ключом, детские замки и прочные металлические решетки для безопасности детей.', price: 'от 2 000 ₸', img: './cat_child.png' },
    { cat: 'okna', title: 'Ремонт окон (Регулировка, замена стеклопакетов, замена уплотнителей, замена ручек, навесов, сложное открывание, детский замок, замок курильщика)', desc: 'Устранение продуваний, замена уплотнителей, ручек, стеклопакетов и сложного открывания.', price: 'от 1 500 ₸', img: './cat_win_repair.png' },
    { cat: 'okna', title: 'Изготовление окон', desc: 'Производство и профессиональный монтаж окон из немецких профилей Rehau, Veka, KBE.', price: 'от 35 000 ₸', img: './cat_win_make.png' },
    { cat: 'okna', title: 'Ролл-шторы и жалюзи', desc: 'Огромный выбор тканей и текстур (блэкаут, день-ночь). Индивидуальный замер и установка.', price: 'от 5 000 ₸', img: './cat_blinds.png' },

    // Сервис
    { cat: 'servis', title: 'Ремонт стиральных машин', desc: 'Замена ТЭНа, подшипников, сливных помп, ремонт модулей управления с гарантией.', price: 'от 3 000 ₸', img: './cat_washing.png' },
    { cat: 'servis', title: 'Ремонт холодильников', desc: 'Заправка фреоном, замена компрессора, термостата, ремонт системы No Frost.', price: 'от 4 000 ₸', img: './cat_fridge.png' },
    { cat: 'servis', title: 'Ремонт кондиционеров и посудомоечных машин', desc: 'Чистка, заправка сплит-систем, устранение засоров и замена насосов посудомоечных машин.', price: 'от 5 000 ₸', img: './cat_washing.png' },
    { cat: 'servis', title: 'Установка/Ремонт вытяжек', desc: 'Монтаж кухонных вытяжек, подключение к вентиляции, замена фильтров и ремонт двигателей.', price: 'от 4 000 ₸', img: './slide_appliances.png' },
    { cat: 'servis', title: 'Установка/Ремонт кондиционеров', desc: 'Профессиональный монтаж, демонтаж и сервисное обслуживание климатической техники.', price: 'от 15 000 ₸', img: './cat_washing.png' },
    { cat: 'servis', title: 'Сварка', desc: 'Услуги квалифицированного сварщика с выездом. Сварка труб, петель, каркасов.', price: 'от 5 000 ₸', img: './cat_win_repair.png' },
    { cat: 'servis', title: 'Металлоконструкции', desc: 'Изготовление навесов, козырьков, лестниц, заборов, ворот и стеллажей на заказ.', price: 'от 15 000 ₸/м²', img: './cat_win_make.png' },
    { cat: 'servis', title: 'Электрика', desc: 'Монтаж проводки, установка розеток, выключателей, сборка щитов, устранение замыканий.', price: 'от 2 000 ₸', img: './cat_electric.png' },

    // Мебель
    { cat: 'mebel', title: 'Мебель на заказ (корпусная, мягкая)', desc: 'Индивидуальный дизайн и изготовление кухонь, шкафов-купе, гардеробных, диванов и кроватей.', price: 'от 45 000 ₸', img: './slide_furniture.png' }
  ];

  // Dynamic Category Page Data Generator
    const getCategoryPageData = (pageObj, currentLang) => {
    if (!pageObj) return { brands: [], services: [], parentTabLabel: 'Окна', parentCatTitle: 'Москитные сетки' };
    
    const baseTitle = t(pageObj.title);
    const parentCat = megaCategories.find(c => c.id === pageObj.parentCatId) || { title: 'Москитные сетки', tab: 'okna' };
    const parentTab = megaTabs.find(t => t.id === pageObj.parentTabId || t.id === parentCat.tab) || { label: 'Окна' };

    
const pageDataMap = {
      // --- ОКНА ---
      'cat-okna-1': {
        brands: ['Фибергласс (Стандарт)', 'PetScreen (Антикошка)', 'MicroMesh (Антипыль)', 'Алюминиевый профиль', 'Усиленные крепления'],
        services: ['Замер и подбор полотна', 'Изготовление каркаса по размерам', 'Установка металлических креплений', 'Замена старого полотна сетки', 'Ремонт уголков и ручек сетки']
      },
      'sub-okna-1-1': {
        brands: ['Фибергласс (США)', 'Fiberglass Standard', 'Российское полотно', 'Немецкий профиль рамки'],
        services: ['Точный замер оконного проема', 'Изготовление сетки Стандарт за 1 день', 'Установка z-креплений (металл/пластик)', 'Замена порванного полотна Стандарт']
      },
      'sub-okna-1-2': {
        brands: ['PetScreen (США)', 'Антикошка Усиленная', 'Многослойный полиэстер с ПВХ', 'Металлические кронштейны'],
        services: ['Замер под сетку Антикошка', 'Монтаж на усиленные металлические зацепы', 'Проверка полотна на разрыв когтями', 'Изготовление двери-сетки Антикошка']
      },
      'sub-okna-1-3': {
        brands: ['MicroMesh (Антипыль)', 'Poll-Tex (Нидерланды)', 'Гипоаллергенное полотно', 'Нейлоновая мембрана'],
        services: ['Замер под сетку Антипыль', 'Изготовление сетки с защитой от пыльцы', 'Установка плотного контура уплотнения', 'Инструктаж по уходу и мытью полотна']
      },

      'cat-okna-2': {
        brands: ['Penkid', 'BSL (Baby Safety Lock)', 'Maco', 'Roto', 'Сварные решетки Сталь', 'Кованые элементы'],
        services: ['Установка блокираторов с ключом', 'Монтаж защитных металлических решеток', 'Установка стальных тросиков', 'Укрепление оконных створок от детей', 'Проверка безопасности фурнитуры']
      },
      'sub-okna-2-1': {
        brands: ['BSL (Baby Safety Lock)', 'Penkid (Турция)', 'Roto (Германия)', 'Maco (Австрия)'],
        services: ['Установка нижнего замка-блокиратора', 'Монтаж ручки с встроенным замком и ключом', 'Экспресс-установка за 20 минут', 'Регулировка створки после монтажа замка']
      },
      'sub-okna-2-2': {
        brands: ['Сталь 3 (ГОСТ)', 'Кованые решетки Премиум', 'Порошковая окраска RAL', 'Усиленные анкерные болты'],
        services: ['Замер и согласование эскиза решетки', 'Сварка и покраска металлической решетки', 'Монтаж решеток на любом этаже', 'Антикоррозийная обработка швов']
      },
      'sub-okna-2-3': {
        brands: ['Penkid Cable', 'Jackloc (Великобритания)', 'Стальной многожильный трос', 'Усиленный корпус замка'],
        services: ['Монтаж гибкого защитного тросика', 'Настройка ограничения ширины распахивания', 'Тестирование троса на разрывную нагрузку (до 500кг)']
      },

      'cat-okna-3': {
        brands: ['Rehau', 'Veka', 'KBE', 'Maco', 'Roto', 'Siegenia', 'Winkhaus', 'EPDM (Германия)'],
        services: ['Полная регулировка оконной створки', 'Замена разбитых стеклопакетов', 'Замена изношенного уплотнителя', 'Ремонт и замена фурнитуры', 'Устранение продувания и промерзания']
      },
      'sub-okna-3-1': {
        brands: ['Maco', 'Roto', 'Siegenia-Aubi', 'Winkhaus', 'Vorne', 'Kale'],
        services: ['Регулировка прижима створки (зима/лето)', 'Выравнивание геометрии провисшей створки', 'Смазка и чистка рабочих механизмов', 'Устранение заклинивания ручки']
      },
      'sub-okna-3-2': {
        brands: ['Guardian Glass', 'AGC Glass', 'Pilkington', 'Энергосберегающие i-стекла', 'Мультифункциональные стеклопакеты'],
        services: ['Замер точных габаритов стеклопакета', 'Изготовление 1, 2, 3-камерных пакетов', 'Срочная замена разбитого стекла за 1 день', 'Установка тонированных и бронированных стекол']
      },
      'sub-okna-3-3': {
        brands: ['EPDM (Германия)', 'KBE 228', 'Rehau Raucell', 'Силиконовые уплотнители', 'Полиуретановые контуры Q-Lon'],
        services: ['Удаление старого рассохшегося уплотнителя', 'Очистка и обезжиривание паза', 'Укладка нового уплотнителя единым контуром', 'Проверка герметичности тепловизором']
      },
      'sub-okna-3-4': {
        brands: ['Hoppe Secustik', 'Roto Line', 'Maco Harmony', 'Усиленные петли Siegenia', 'Металлические гребенки'],
        services: ['Замена сломанной оконной ручки', 'Установка ручек-ракушек (для балкона)', 'Замена и усиление оконных навесов (петель)', 'Ремонт механизма запирания']
      },
      'sub-okna-3-5': {
        brands: ['Maco Multi-Matic', 'Roto NX', 'Siegenia Titan AF', 'Winkhaus activPilot'],
        services: ['Демонтаж простой поворотной обвязки', 'Установка комплекта сложного (откидного) открывания', 'Установка щелевого микропроветривания', 'Финальная балансировка створки']
      },
      'sub-okna-3-6': {
        brands: ['BSL Original', 'Penkid Pentilt', 'Замки-защелки с ключом'],
        services: ['Монтаж детского замка в нижнюю часть створки', 'Проверка надежности фиксации', 'Выдача запасных ключей']
      },
      'sub-okna-3-7': {
        brands: ['Maco (Защелка)', 'Roto (Балконный узел)', 'Магнитные защелки', 'Алюминиевые ручки-тянучки'],
        services: ['Установка механической балконной защелки', 'Монтаж магнитной защелки (бесшумной)', 'Установка внешней ручки курильщика (металл/пластик)']
      },

      'cat-okna-4': {
        brands: ['Rehau', 'Veka', 'KBE', 'Salamander', 'Gealan', 'Alutech (Алюминий)', 'Hoffen', 'Funke'],
        services: ['Бесплатный профессиональный замер', 'Демонтаж старых деревянных/пластиковых окон', 'Монтаж оконных конструкций по ГОСТу', 'Установка подоконников, отливов и откосов', 'Остекление под ключ с гарантией 5 лет']
      },
      'sub-okna-4-1': {
        brands: ['Rehau (Германия)', 'Veka (Германия)', 'KBE (Германия)', 'Salamander', 'Funke Kunststoffe'],
        services: ['Изготовление 3, 5, 7-камерных пластиковых окон', 'Монтаж с использованием паро- и гидроизоляционных лент', 'Установка премиум подоконников (Danke, Moeller)', 'Теплая отделка внутренних откосов']
      },
      'sub-okna-4-2': {
        brands: ['Alutech', 'Schüco', 'Татпроф', 'КраМЗ', 'Холодный и теплый алюминий'],
        services: ['Проектирование и расчет алюминиевых конструкций', 'Изготовление панорамных и витражных окон', 'Монтаж входных алюминиевых групп', 'Окраска профиля в любой цвет по каталогу RAL']
      },
      'sub-okna-4-3': {
        brands: ['Rehau Euro', 'Veka Euroline', 'Alutech Alt100', 'Слайдорс (Slidors)'],
        services: ['Теплое остекление балконов (ПВХ)', 'Холодное раздвижное остекление (алюминий)', 'Усиление парапета и вынос балкона', 'Полное утепление и внутренняя обшивка лоджии']
      },

      'cat-okna-5': {
        brands: ['Sunless', 'Amigo', 'Benthin', 'Coulisse', 'Ткани Блэкаут (Blackout)', 'День-Ночь (Зебра)'],
        services: ['Выезд мастера с каталогом тканей', 'Изготовление ролл-штор по индивидуальным размерам', 'Монтаж на створки без сверления', 'Установка кассетных систем (Уни-1, Уни-2)', 'Автоматизация штор (электропривод)']
      },
      'sub-okna-5-1': {
        brands: ['Ткани Blackout (100% защита)', 'Зебра (День-Ночь)', 'Солнцеотражающие ткани Скрин (Screen)', 'Системы Мини и Кассета'],
        services: ['Индивидуальный замер оконных створок', 'Пошив и сборка рулонных штор', 'Установка с боковой фиксацией (леска/направляющие)', 'Химчистка и замена старой ткани штор']
      },
      'sub-okna-5-2': {
        brands: ['Алюминиевые ламели 16/25мм', 'Holz (Деревянные жалюзи)', 'Перфорированные ламели', 'Amigo System'],
        services: ['Замер горизонтальных жалюзи', 'Монтаж в проем или на створку', 'Ремонт поворотного механизма и замена шнура', 'Установка межрамных горизонтальных жалюзи']
      },
      'sub-okna-5-3': {
        brands: ['Тканевые ламели 89мм', 'Пластиковые вертикальные жалюзи', 'Мультифактурные жалюзи', 'Солнцезащитные карнизы'],
        services: ['Замер и подбор фактуры для офиса/дома', 'Монтаж карниза к потолку или стене', 'Замена поврежденных нижних грузиков и цепочки', 'Укорачивание длины ламелей']
      },

      // --- СЕРВИС ---
      'cat-srv-1': {
        brands: ['LG', 'Samsung', 'Bosch', 'Indesit', 'Beko', 'Candy', 'Electrolux', 'Атлант', 'Zanussi'],
        services: ['Замена сгоревшего ТЭНа', 'Замена подшипников и сальников бака', 'Замена сливной помпы (насоса)', 'Ремонт и прошивка модуля управления', 'Замена манжеты люка и щеток двигателя']
      },
      'sub-srv-1-1': {
        brands: ['Thermowatt (Италия)', 'IRCA (Италия)', 'Bleckmann (Австрия)', 'Kawasaki', 'Оригинальные ТЭНы LG/Samsung'],
        services: ['Диагностика цепи нагрева воды', 'Демонтаж старого ТЭНа и очистка посадочного места от накипи', 'Установка нового ТЭНа с датчиком температуры', 'Проверка отсутствия утечек тока на корпус']
      },
      'sub-srv-1-2': {
        brands: ['SKF (Швеция/Франция)', 'FAG (Германия)', 'NSK (Япония)', 'Сальники Corteco (Италия)', 'Специальная влагостойкая смазка Hydra-2'],
        services: ['Полная разборка стиральной машины', 'Распил неразборного бака (при необходимости)', 'Выпрессовка старых и запрессовка новых подшипников SKF', 'Герметичная сборка бака и тестирование отжима']
      },
      'sub-srv-1-3': {
        brands: ['Askoll (Италия)', 'Plaset (Италия)', 'Leili (Китай)', 'Copreci', 'Оригинальные помпы Bosch/Indesit'],
        services: ['Диагностика отсутствия слива воды', 'Удаление засора из фильтра и патрубков', 'Замена сливного насоса на новый Askoll', 'Тестирование циклов полоскания и слива']
      },
      'sub-srv-1-4': {
        brands: ['Платы управления LG/Samsung', 'Модули Arcadia (Indesit/Ariston)', 'Платы Bosch/Siemens', 'Процессоры Freescale/NEC'],
        services: ['Диагностика ошибок (F01, LE, 5E, 3E и др.)', 'Перепайка сгоревших реле, симисторов и цепей питания', 'Прошивка и восстановление ПО микроконтроллера', 'Замена модуля управления в сборе']
      },

      'cat-srv-2': {
        brands: ['Samsung', 'LG', 'Атлант', 'Bosch', 'Liebherr', 'Beko', 'Indesit', 'Haier', 'Бирюса', 'Stinol'],
        services: ['Заправка фреоном и устранение утечек', 'Замена мотор-компрессора', 'Замена терморегулятора и пускового реле', 'Ремонт системы No Frost (ТЭН, датчики, таймер)', 'Перевешивание дверей и замена уплотнителя']
      },
      'sub-srv-2-1': {
        brands: ['Фреон R600a (Изобутан)', 'Фреон R134a', 'Фреон R404a', 'Медные трубки Halcor', 'Припой с серебром (Германия)'],
        services: ['Опрессовка системы азотом и поиск микроутечки', 'Устранение утечки в запененной части или контуре обогрева', 'Замена фильтра-осушителя', 'Вакуумирование контура и заправка фреоном по весам']
      },
      'sub-srv-2-2': {
        brands: ['Secop (Danfoss)', 'Jiaxipera', 'Embraco Aspera', 'Атлант (Барановичи)', 'Инверторные компрессоры LG/Samsung'],
        services: ['Демонтаж заклинившего мотор-компрессора', 'Монтаж нового оригинального компрессора', 'Пайка стыков серебряным припоем', 'Полный цикл вакуумирования и заправки системы']
      },
      'sub-srv-2-3': {
        brands: ['Ranco (Италия)', 'Danfoss', 'ТАМ-133 / ТАМ-145 (Россия)', 'Электронные датчики NTC (Samsung/Bosch)'],
        services: ['Диагностика отсутствия отключения или перемораживания', 'Замена механического термостата', 'Замена электронных сенсоров температуры', 'Калибровка температурного режима']
      },
      'sub-srv-2-4': {
        brands: ['Датчики оттайки (Дефростеры)', 'ТЭНы оттайки испарителя', 'Таймеры TMDE/TD-20', 'Плавкие предохранители No Frost'],
        services: ['Разморозка испарителя и проверка дренажа', 'Замена сгоревшего ТЭНа оттайки', 'Замена дефростера и плавкого предохранителя', 'Замена вентилятора обдува испарителя']
      },

      'cat-srv-3': {
        brands: ['Bosch', 'Siemens', 'Electrolux', 'Midea', 'Gree', 'Daikin', 'LG', 'Beko', 'Hansa', 'Candy'],
        services: ['Ремонт посудомоечных машин (замена помпы, ТЭНа, чистка)', 'Ремонт и чистка кондиционеров', 'Устранение протечек и ошибок посудомоек', 'Заправка кондиционеров фреоном R410a/R32', 'Замена циркуляционного насо']
      },
      'sub-srv-3-1': {
        brands: ['Gree', 'Midea', 'Daikin', 'Mitsubishi Electric', 'LG', 'Samsung', 'Almacom', 'TCL'],
        services: ['Диагностика сплит-системы во всех режимах', 'Чистка внутреннего и внешнего блоков с дезинфекцией', 'Устранение течи конденсата из внутреннего блока', 'Ремонт инверторных плат управления внешнего блока']
      },
      'sub-srv-3-2': {
        brands: ['Bosch', 'Siemens', 'Electrolux', 'Beko', 'Hansa', 'Gorenje', 'Midea', 'Indesit'],
        services: ['Замена циркуляционного насоса (помпы с ТЭНом Bosch)', 'Устранение ошибки E09, E15, E24, i30', 'Замена сливного насоса и прессостата', 'Чистка засоров гидросистемы и аквастопа (AquaStop)']
      },
      'sub-srv-3-3': {
        brands: ['Фреон R410a (Sanmei/Dupont)', 'Фреон R32', 'Фреон R22', 'Антибактериальная пена для чистки'],
        services: ['Промывка теплообменника аппаратом высокого давления', 'Дезинфекция испарителя от грибка и неприятного запаха', 'Проверка рабочего давления в контуре', 'Точная дозаправка сплит-системы фреоном']
      },

      'cat-srv-4': {
        brands: ['Elikor', 'Krona', 'Cata', 'Elica', 'Falmec', 'Jetair', 'Maunfeld', 'Lex', 'Bosch'],
        services: ['Монтаж купольных, наклонных и встраиваемых вытяжек', 'Подключение вытяжки к вентиляционной шахте (гофра/пластик)', 'Ремонт и замена двигателя вентилятора', 'Замена кнопочного или сенсорного блока управления', 'Замена угольных и жироулавливающих фильтров']
      },
      'sub-srv-4-1': {
        brands: ['Krona', 'Elikor', 'Maunfeld', 'Elica', 'Пластиковые каналы Vents', 'Алюминиевая гофра'],
        services: ['Разметка и крепление вытяжки к стене или в шкаф', 'Прокладка эстетичного пластикового воздуховода', 'Установка обратного клапана (защита от запахов из шахты)', 'Подключение к электросети без висящих проводов']
      },
      'sub-srv-4-2': {
        brands: ['Оригинальные моторы Elikor/Krona', 'Турбины Elica', 'Блоки переключателей скорости', 'Трансформаторы и LED-лампы'],
        services: ['Диагностика повышенного шума или отсутствия тяги', 'Замена или ремонт электродвигателя вытяжки', 'Перепайка сгоревших контактов кнопочного поста', 'Замена ламп подсветки на современные LED']
      },
      'sub-srv-4-3': {
        brands: ['Угольные фильтры (Carbon)', 'Алюминиевые жироулавливающие сетки', 'Универсальные фильтры Filtero', 'Оригинальные кассеты Krona/Bosch'],
        services: ['Подбор угольного фильтра под вашу модель вытяжки', 'Ультразвуковая чистка металлических жировых сеток', 'Замена одноразовых акриловых фильтров', 'Обработка внутренних полостей от жирового налета']
      },

      'cat-srv-5': {
        brands: ['Daikin', 'Mitsubishi Electric', 'Gree', 'Midea', 'LG', 'Samsung', 'Almacom', 'Haier', 'TCL', 'Hisense'],
        services: ['Профессиональный монтаж кондиционеров (сплит-систем)', 'Закладка фреоновой трассы на стадии ремонта', 'Аккуратный демонтаж кондиционера с сохранением фреона', 'Полное сервисное обслуживание (чистка, заправка)', 'Ремонт компрессора и замена пусковых конденсаторов']
      },
      'sub-srv-5-1': {
        brands: ['Медная труба Majdanpek / Halcor', 'Качественная теплоизоляция K-Flex', 'Кронштейны ГОСТ (толщина 2мм)', 'Кабель ПВС (ГОСТ)'],
        services: ['Бурение отверстия буром SDS-Max без пыли', 'Монтаж внешнего блока на надежные кронштейны', 'Навеска внутреннего блока по лазерному уровню', 'Вакуумирование трассы и пусконаладочные работы']
      },
      'sub-srv-5-2': {
        brands: ['Специнструмент Value', 'Манометрические станции', 'Заглушки для герметизации портов'],
        services: ['Перекачка и перекрытие фреона во внешнем блоке', 'Аккуратный демонтаж внутреннего и внешнего блоков', 'Герметизация медных трубок от попадания влаги и пыли', 'Упаковка кондиционера для безопасной транспортировки']
      },
      'sub-srv-5-3': {
        brands: ['Мойка высокого давления Karcher', 'Химсредства Advanced Engineering', 'Фреоны R410a/R32 (Оригинал)'],
        services: ['Глубокая антибактериальная чистка парогенератором', 'Промывка дренажного поддона и патрубка', 'Замер пусковых токов и проверка изоляции', 'Дозаправка хладагентом до нормы']
      },

      'cat-srv-6': {
        brands: ['Ресанта', 'Сварог', 'Kemppi', 'Lincoln Electric', 'Esab', 'Электроды МР-3 / УОНИ', 'Сварочная проволока СВ08Г2С'],
        services: ['Сварочные работы с выездом мастера на объект', 'Электродуговая сварка (ММА) металлоконструкций', 'Полуавтоматическая сварка (MIG/MAG)', 'Аргонодуговая сварка (TIG) нержавейки и алюминия', 'Сварка труб водоснабжения и отопления']
      },
      'sub-srv-6-1': {
        brands: ['Инверторы Ресанта ПРОФ', 'Kemppi Minarc', 'Автономные бензогенераторы (для участков без света)'],
        services: ['Срочный выезд сварщика со всем оборудованием', 'Сварка петель ворот, калиток, дверей', 'Ремонт металлических лестниц, стеллажей, заборов', 'Усиление несущих металлоконструкций швеллером']
      },
      'sub-srv-6-2': {
        brands: ['Трубы ВГП (ГОСТ 3262-75)', 'Профильные трубы Северсталь', 'Качественные электроды Esab / Kobelco'],
        services: ['Сварка стояков водоснабжения и отопления', 'Изготовление металлических каркасов под лестницы', 'Сварка каркасов для теплиц, навесов и беседок', 'Герметичная заварка свищей в трубах под давлением']
      },
      'sub-srv-6-3': {
        brands: ['Сварог TIG 200 AC/DC', 'Вольфрамовые электроды WL-20', 'Присадочные прутки ER308L / ER4043', 'Чистый Аргон (99.99%)'],
        services: ['Аргонная сварка алюминиевых поддонов и блоков ДВС', 'Сварка трубок кондиционера и радиаторов', 'Сварка перил и баков из пищевой нержавейки', 'Декоративный (ювелирный) сварочный шов']
      },

      'cat-srv-7': {
        brands: ['Металлопрокат ГОСТ', 'Профильные трубы ММК / Северсталь', 'Поликарбонат Lexan / Carboglass', 'Краска Хаммерайт (Hammerite)'],
        services: ['Проектирование и 3D-моделирование металлоконструкций', 'Изготовление автомобильных навесов и козырьков', 'Сварка и монтаж металлических заборов и ворот', 'Изготовление наружных и межэтажных лестниц', 'Производство складских стеллажей и ферм']
      },
      'sub-srv-7-1': {
        brands: ['Профильная труба 80x80, 100x100', 'Швеллер и Двутавр (ГОСТ 8239-89)', 'Антикоррозийный грунт ГФ-021', 'Эмаль 3 в 1'],
        services: ['Индивидуальный расчет нагрузок конструкции', 'Распил и профессиональная сварка каркаса', 'Грунтование и покраска в покрасочной камере', 'Монтаж тяжелых конструкций с помощью автокрана']
      },
      'sub-srv-7-2': {
        brands: ['Сотовый поликарбонат 8-10мм (УФ-защита)', 'Монолитный поликарбонат', 'Металлочерепица Grand Line', 'Профлист МП-20'],
        services: ['Изготовление навесов для автомобилей (односкатные/арочные)', 'Сварка козырьков над крыльцом с коваными элементами', 'Бетонирование опорных столбов навеса', 'Герметичный монтаж кровельного покрытия']
      },
      'sub-srv-7-3': {
        brands: ['Профнастил С-8 / МП-20', '3D-сетка Гиттер (Gitter)', 'Кованые пики и вензеля', 'Автоматика для ворот Came / Faac / Nice'],
        services: ['Монтаж заборов из профлиста и евроштакетника', 'Изготовление распашных и откатных ворот', 'Установка автоматического электропривода на ворота', 'Врезка надежных замков и задвижек в калитки']
      },

      'cat-srv-8': {
        brands: ['Legrand', 'Schneider Electric', 'ABB', 'IEK', 'Кабель ВВГнг-LS (ГОСТ)', 'Автоматы защиты ABB/Schneider', 'WAGO'],
        services: ['Полная или частичная замена электропроводки', 'Установка и перенос розеток, выключателей, светильников', 'Сборка и монтаж электрических щитов (УЗО, Дифавтоматы)', 'Поиск и устранение короткого замыкания (обрыва цепи)', 'Подключение мощной бытовой техники (плиты, духовки)']
      },
      'sub-srv-8-1': {
        brands: ['Кабель ВВГнг(А)-LS (ГОСТ)', 'NYM (Севкабель)', 'Гофротруба ДКС (DKC)', 'Подрозетники Schneider Electric'],
        services: ['Штробление стен штроборезом с пылесосом без пыли', 'Прокладка кабеля по потолку, стенам и в floor', 'Монтаж и вмазка подрозетников и распаечных коробок', 'Соединение проводов сваркой или клеммами WAGO']
      },
      'sub-srv-8-2': {
        brands: ['Schneider Electric (AtlasDesign, Glossa)', 'Legrand (Valena, Etika)', 'ABB (Basic 55)', 'Werkel'],
        services: ['Установка и замена электрических розеток', 'Монтаж одно-, двух-, трехклавишных и проходных выключателей', 'Установка диммеров (регуляторов света)', 'Монтаж влагозащищенных розеток IP44/IP65 в ванной']
      },
      'sub-srv-8-3': {
        brands: ['Боксы ABB Mistral / Tekfor', 'Автоматы ABB серии S200 / SH200', 'УЗО и Дифавтоматы Schneider Electric iK60N', 'Реле напряжения Зубр (RBUZ)'],
        services: ['Расчет нагрузок по группам потребителей', 'Профессиональная сборка и маркировка электрощита', 'Установка реле защиты от скачков напряжения (Зубр)', 'Подключение вводного кабеля и проверка заземления']
      },
      'sub-srv-8-4': {
        brands: ['Мультиметры Fluke / Mastech', 'Трассоискатели MS6818', 'Изолента 3M', 'Термоусадочные трубки с клеем'],
        services: ['Срочный выезд электрика при отключении света', 'Диагностика электропроводки и поиск места обрыва/КЗ', 'Восстановление поврежденного кабеля в стене', 'Замена сгоревших автоматических выключателей']
      },

      // --- МЕБЕЛЬ ---
      'cat-meb-1': {
        brands: ['Blum (Австрия)', 'Hettich (Германия)', 'Boyard', 'Egger (ЛДСП)', 'Kronospan', 'AGT (МДФ)', 'Hafele', 'Arpa (Пластик)'],
        services: ['Изготовление корпусной мебели (кухни, шкафы, гардеробные)', 'Изготовление мягкой мебели (диваны, кровати, пуфы)', 'Профессиональная перетяжка и реставрация старой мебели', 'Замена кухонных фасадов, столешниц и фурнитуры', 'Разработка 3D-дизайн проекта и замер помещения']
      },
      'sub-meb-1-1': {
        brands: ['Egger (Австрия)', 'Kronospan', 'Фурнитура Blum / Hettich / Boyard', 'Алюминиевые профили Modus / Aristo'],
        services: ['Проектирование и изготовление шкафов-купе и гардеробных', 'Производство офисной мебели (столы, тумбы, стеллажи)', 'Изготовление детских комнат и прихожих по индивидуальным размерам', 'Сборка и регулировка мебели на объекте заказчика']
      },
      'sub-meb-1-2': {
        brands: ['Велюр, Рогожка, Флок, Жаккард (Союз-М / Арбен)', 'Натуральная кожа и экокожа Премиум', 'ППУ Elax / HR (Высокоэластичный)', 'Независимые пружинные блоки Pocket Spring'],
        services: ['Изготовление дизайнерских диванов (прямые, угловые, модульные)', 'Производство интерьерных кроватей с мягким изголовьем', 'Изготовление пуфов, банкеток и кресел для дома и HoReCa', 'Подбор обивочной ткани с выездом дизайнера']
      },
      'sub-meb-1-3': {
        brands: ['МДФ фасады AGT / Alvic Luxe / Эмаль RAL', 'Столешницы Egger / Кедр / Искусственный камень', 'Подъемные механизмы Blum Aventos', 'Выдвижные системы Tandembox / Направляющие скрытого монтажа'],
        services: ['Замер помещения с учетом выводов сантехники и электрики', 'Создание фотореалистичного 3D-проекта кухни', 'Изготовление кухонного гарнитура под ключ', 'Врезка мойки, варочной панели и подключение вытяжки']
      },
      
      'sub-meb-1-4': {
        brands: ['Качественный пенополиуретан (ППУ)', 'Специальные мебельные ткани с пропиткой Easy Clean', 'Мебельные скобы Bea / Prebena', 'Оригинальные механизмы трансформации (Книжка, Дельфин, Аккордеон)'],
        services: ['Полная или частичная перетяжка диванов, кресел, стульев', 'Замена просевшего поролона и пружинных блоков', 'Ремонт и замена механизмов раскладывания дивана', 'Реставрация деревянных элементов и столярные работы']
      }
    };

    const specificData = pageDataMap[pageObj.id] || pageDataMap[pageObj.parentCatId];
    if (specificData) {
      return {
        parentTabLabel: parentTab.label,
        parentCatTitle: parentCat.title,
        brands: specificData.brands,
        services: specificData.services
      };
    }

    if (parentTab.id === 'okna') {
      return {
        parentTabLabel: parentTab.label,
        parentCatTitle: parentCat.title,
        brands: ['Rehau', 'Veka', 'KBE', 'Salamander', 'Gealan', 'Trocal', 'Maco', 'Roto'],
        services: ['Бесплатный замер и консультация', 'Экспресс-ремонт за 45 минут', 'Замена фурнитуры и уплотнителей', 'Изготовление москитных сеток', 'Монтаж по ГОСТу с гарантией']
      };
    }

    if (parentTab.id === 'servis') {
      return {
        parentTabLabel: parentTab.label,
        parentCatTitle: parentCat.title,
        brands: ['LG', 'Samsung', 'Bosch', 'Indesit', 'Beko', 'Electrolux', 'Gorenje', 'Ariston'],
        services: ['Срочная диагностика с выездом', 'Замена оригинальных запчастей', 'Ремонт электронных плат управления', 'Пайка и устранение утечек', 'Гарантийное и постгарантийное обслуживание']
      };
    }

    if (parentTab.id === 'mebel') {
      return {
        parentTabLabel: parentTab.label,
        parentCatTitle: parentCat.title,
        brands: ['Blum', 'Hettich', 'Boyard', 'Egger', 'Kronospan', 'Hafele'],
        services: ['Разработка 3D-дизайн проекта', 'Распил и кромление плитных материалов', 'Сборка и монтаж корпусной мебели', 'Замена фасадов и столешниц', 'Перетяжка и реставрация мягкой мебели']
      };
    }

    return {
      parentTabLabel: parentTab.label,
      parentCatTitle: parentCat.title,
      brands: ['Премиум качество', 'Проверенные партнеры', 'Официальная гарантия'],
      services: ['Базовая услуга: ' + baseTitle, 'Экспресс-обслуживание']
    };
  };

  const catPageData = getCategoryPageData(selectedCategoryPageObj, lang);

  // ========================
  // ADMIN PANEL RENDER
  // ========================
  if (activePage === 'admin') {
    const filteredCallbacks = adminCallbacks.filter(cb => {
      if (adminFilterStatus !== 'all' && cb.status !== adminFilterStatus) return false;
      if (adminFilterDate) {
        const cbDate = new Date(cb.created_at).toISOString().split('T')[0];
        if (cbDate !== adminFilterDate) return false;
      }
      return true;
    });

    const statusLabel = (s) => {
      if (s === 'pending') return 'Новая';
      if (s === 'in_progress') return 'В работе';
      if (s === 'completed') return 'Выполнена';
      return s;
    };

    const stats = [
      { label: 'Всего заявок', value: adminCallbacks.length, icon: 'ri-file-list-3-line', color: '#7cf2c7', class: 'total' },
      { label: 'Новые', value: adminCallbacks.filter(c => c.status === 'pending').length, icon: 'ri-time-line', color: '#5b8cff', class: 'pending' },
      { label: 'В работе', value: adminCallbacks.filter(c => c.status === 'in_progress').length, icon: 'ri-loader-4-line', color: '#ff7a59', class: 'progress' },
      { label: 'Выполнены', value: adminCallbacks.filter(c => c.status === 'completed').length, icon: 'ri-checkbox-circle-line', color: '#7cf2c7', class: 'completed' },
    ];

    return (
      <div className="admin-page">
        {/* Admin Topbar */}
        <div className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'grid', placeItems: 'center',
              fontSize: '16px', fontWeight: '900', color: '#0b1020'
            }}>MH</div>
            <div>
              <div className="admin-header-title">MasterHub Admin</div>
              <div className="admin-header-subtitle">Панель мониторинга</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Переключить тему" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: '18px', padding: '8px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'}></i>
            </button>
            {adminAuthed && (
              <>
                <div className="admin-header-user">
                  <i className="ri-user-line" style={{ color: 'var(--accent)' }}></i>
                  <span className="admin-header-username">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={() => { setAdminAuthed(false); setToken(''); setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); }}
                  style={{
                    background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.3)',
                    color: '#ff7a59', borderRadius: '8px', padding: '6px 14px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <i className="ri-logout-box-line"></i> Выйти
                </button>
              </>
            )}
          </div>
        </div>

        {/* Admin Content */}
        <div style={{ paddingTop: '60px', minHeight: '100vh' }}>
          {!adminAuthed ? (
            /* LOGIN FORM */
            <div className="admin-login-container">
              <div className="admin-login-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div className="admin-login-icon-box">
                    <i className="ri-shield-keyhole-line"></i>
                  </div>
                  <div className="admin-login-title">Вход в панель</div>
                  <div className="admin-login-subtitle">Доступ только для администраторов MasterHub</div>
                </div>

                {adminError && (
                  <div style={{
                    background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.25)',
                    borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                    fontSize: '13px', color: '#ff7a59', fontWeight: '600'
                  }}>
                    <i className="ri-error-warning-line"></i> {adminError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Электронная почта</label>
                    <input
                      type="email" required autoComplete="email"
                      value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Пароль (мин. 6 символов)</label>
                    <input
                      type="password" required minLength={6} autoComplete="current-password"
                      value={adminPass} onChange={e => setAdminPass(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '16px', borderRadius: '14px', fontSize: '15px' }}>
                    <i className="ri-login-box-line"></i> Войти
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ADMIN DASHBOARD */
            <div className="admin-dashboard-container">

              {/* Stats Cards */}
              <div className="admin-stats-grid" style={{ marginBottom: '32px' }}>
                {stats.map((s, i) => (
                  <div key={i} className={`admin-stat-card ${s.class}`}>
                    <div className="admin-stat-card-glow"></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="admin-stat-icon-wrapper">
                        <i className={s.icon}></i>
                      </div>
                      <span className="admin-stat-label">{s.label}</span>
                    </div>
                    <div className="admin-stat-value">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Filters Row */}
              <div className="admin-filters-bar" style={{ marginBottom: '20px' }}>
                <div className="admin-filters-title">
                  <i className="ri-filter-3-line"></i> Фильтры:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="admin-filter-date-label">Дата:</label>
                  <input
                    type="date" value={adminFilterDate} onChange={e => setAdminFilterDate(e.target.value)}
                    className="admin-filter-date-input"
                  />
                  {adminFilterDate && (
                    <button onClick={() => setAdminFilterDate('')} style={{
                      background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.2)',
                      color: '#ff7a59', borderRadius: '6px', padding: '6px 10px',
                      fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
                    }}>✕ Сброс</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['all', 'pending', 'in_progress', 'completed'].map(st => (
                    <button key={st}
                      onClick={() => setAdminFilterStatus(st)}
                      className={`admin-status-filter-btn ${adminFilterStatus === st ? 'active' : ''}`}
                    >
                      {st === 'all' ? 'Все' : statusLabel(st)}
                    </button>
                  ))}
                </div>
                <button onClick={() => fetchAdminCallbacks()} style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(124,242,199,0.1)', border: '1px solid rgba(124,242,199,0.2)',
                  color: 'var(--accent)', borderRadius: '8px', padding: '7px 14px',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  <i className={`ri-refresh-line ${adminLoading ? 'ri-spin' : ''}`}></i> Обновить
                </button>
              </div>

              {/* Orders Table */}
              <div className="admin-table-card">
                <div className="admin-table-card-header">
                  <div className="admin-table-card-title">
                    <i className="ri-file-list-3-line" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                    Заявки
                    <span className="admin-table-card-badge">{filteredCallbacks.length}</span>
                  </div>
                </div>

                {adminLoading ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                    <i className="ri-loader-4-line ri-spin" style={{ fontSize: '32px', color: 'var(--accent)' }}></i>
                    <div style={{ marginTop: '16px', fontSize: '14px' }}>Загрузка...</div>
                  </div>
                ) : filteredCallbacks.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                    <i className="ri-inbox-line" style={{ fontSize: '40px', marginBottom: '12px', display: 'block', opacity: 0.4 }}></i>
                    Заявки не найдены
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          {['ID', 'Имя', 'Телефон', 'Услуга', 'Город', 'Дата', 'Статус'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCallbacks.map((cb, idx) => (
                          <tr key={cb.id} className="admin-table-row">
                            <td style={{ padding: '14px 16px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: '12px' }}>#{cb.id}</td>
                            <td style={{ padding: '14px 16px', fontWeight: '600' }}>{cb.name}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: '13px' }}>{cb.phone}</td>
                            <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cb.service}</div>
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>{getCityDisplay(cb.city)}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {new Date(cb.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <select
                                value={cb.status}
                                onChange={e => handleAdminStatusChange(cb.id, e.target.value)}
                                className={`admin-status-select ${cb.status}`}
                              >
                                <option value="pending" style={{ background: 'var(--surface)', color: 'var(--text)' }}>Новая</option>
                                <option value="in_progress" style={{ background: 'var(--surface)', color: 'var(--text)' }}>В работе</option>
                                <option value="completed" style={{ background: 'var(--surface)', color: 'var(--text)' }}>Выполнена</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="topbar">
        <div 
          className="brand" 
          style={{ cursor: 'pointer' }} 
          onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          title="На главную"
        >
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
              <option value="aktobe">{t('city_aktobe')}</option>
              <option value="taraz">{t('city_taraz')}</option>
              <option value="pavlodar">{t('city_pavlodar')}</option>
              <option value="oskemen">{t('city_oskemen')}</option>
              <option value="semey">{t('city_semey')}</option>
              <option value="atyrau">{t('city_atyrau')}</option>
              <option value="aktau">{t('city_aktau')}</option>
              <option value="kostanay">{t('city_kostanay')}</option>
              <option value="kyzylorda">{t('city_kyzylorda')}</option>
              <option value="oral">{t('city_oral')}</option>
              <option value="petropavl">{t('city_petropavl')}</option>
              <option value="taldykorgan">{t('city_taldykorgan')}</option>
              <option value="kokshetau">{t('city_kokshetau')}</option>
              <option value="turkistan">{t('city_turkistan')}</option>
              <option value="zhezkazgan">{t('city_zhezkazgan')}</option>
              <option value="konaev">{t('city_konaev')}</option>
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
          <a href="tel:+77780211316" className="phone" aria-label="Позвонить">
            <i className="ri-phone-line" style={{ color: 'var(--accent)' }}></i> <span>+7 (778) 021-13-16</span>
          </a>
          
          {user ? (
            <button className="auth-trigger-btn" onClick={() => setIsCabinetOpen(true)}>
              <i className="ri-user-line"></i> <span>{t('nav_cabinet')}</span>
            </button>
          ) : (
            <button className="auth-trigger-btn" onClick={() => { setAuthTab('login'); setIsAuthModalOpen(true); }}>
              <i className="ri-login-box-line"></i> <span>{t('nav_login')}</span>
            </button>
          )}

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
              onDoubleClick={(e) => {
                e.preventDefault();
                const firstCat = megaCategories.find(c => c.tab === tab.id);
                if (firstCat) {
                  setSelectedCategoryPageObj({
                    id: firstCat.id,
                    title: firstCat.title,
                    parentCatId: firstCat.id,
                    parentTabId: tab.id
                  });
                  setActivePage('category');
                  setMegaMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              title="Дважды нажмите, чтобы открыть раздел целиком"
            >
              {t(tab.label)}
            </a>
          ))}
        </div>

        {/* Search Bar Row */}
        <div className="mega-search-container" style={{
          padding: '16px 3vw',
          borderBottom: '1px solid var(--line)',
          background: theme === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="ri-search-line" style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              fontSize: '18px'
            }}></i>
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск услуг и категорий... (например: сетки, ремонт, кондиционеры)' : lang === 'kz' ? 'Қызметтер мен санаттарды іздеу...' : 'Search services and categories...'}
              value={megaSearchQuery}
              onChange={(e) => setMegaSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                border: theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: theme === 'light' ? 'var(--text)' : '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
            {megaSearchQuery && (
              <button
                onClick={() => setMegaSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                <i className="ri-close-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        <div className="mega-body" style={hasSearchResults ? { display: 'block', minHeight: '300px', paddingBottom: '30px' } : undefined}>
          {/* Mobile Only Controls */}
          <div className="mega-mobile-controls">
            <div className="city-switch">
              <i className="ri-map-pin-line" style={{ color: 'var(--accent)' }}></i>
              <select className="city-select" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Выбор города">
                <option value="almaty">{t('city_almaty')}</option>
                <option value="astana">{t('city_astana')}</option>
                <option value="shymkent">{t('city_shymkent')}</option>
                <option value="karaganda">{t('city_karaganda')}</option>
                <option value="aktobe">{t('city_aktobe')}</option>
                <option value="taraz">{t('city_taraz')}</option>
                <option value="pavlodar">{t('city_pavlodar')}</option>
                <option value="oskemen">{t('city_oskemen')}</option>
                <option value="semey">{t('city_semey')}</option>
                <option value="atyrau">{t('city_atyrau')}</option>
                <option value="aktau">{t('city_aktau')}</option>
                <option value="kostanay">{t('city_kostanay')}</option>
                <option value="kyzylorda">{t('city_kyzylorda')}</option>
                <option value="oral">{t('city_oral')}</option>
                <option value="petropavl">{t('city_petropavl')}</option>
                <option value="taldykorgan">{t('city_taldykorgan')}</option>
                <option value="kokshetau">{t('city_kokshetau')}</option>
                <option value="turkistan">{t('city_turkistan')}</option>
                <option value="zhezkazgan">{t('city_zhezkazgan')}</option>
                <option value="konaev">{t('city_konaev')}</option>
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

            {user ? (
              <button className="auth-trigger-btn mobile-only" onClick={() => { setIsCabinetOpen(true); setMegaMenuOpen(false); }} style={{ padding: '8px 12px', fontSize: '12px' }}>
                <i className="ri-user-line"></i> <span>{t('nav_cabinet')}</span>
              </button>
            ) : (
              <button className="auth-trigger-btn mobile-only" onClick={() => { setAuthTab('login'); setIsAuthModalOpen(true); setMegaMenuOpen(false); }} style={{ padding: '8px 12px', fontSize: '12px' }}>
                <i className="ri-login-box-line"></i> <span>{t('nav_login')}</span>
              </button>
            )}
          </div>

          {hasSearchResults ? (
            <div className="mega-search-results" style={{ padding: '20px 3vw', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Category matches */}
              {searchResults.categories.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'ru' ? 'Категории' : lang === 'kz' ? 'Санаттар' : 'Categories'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {searchResults.categories.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryPageObj({
                            id: cat.id,
                            title: cat.title,
                            parentCatId: cat.id,
                            parentTabId: cat.tab
                          });
                          setActivePage('category');
                          setMegaMenuOpen(false);
                          setMegaSearchQuery('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--line)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s'
                        }}
                        className="search-result-item"
                      >
                        <i className={cat.icon} style={{ fontSize: '20px', color: 'var(--accent)' }}></i>
                        <div>
                          <div style={{ fontWeight: '750', fontSize: '14px', color: theme === 'light' ? 'var(--text)' : '#fff' }}>{t(cat.title)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                            {cat.tab === 'okna' ? (lang === 'ru' ? 'Раздел: Окна' : 'Windows') : cat.tab === 'servis' ? (lang === 'ru' ? 'Раздел: Сервис' : 'Service') : (lang === 'ru' ? 'Раздел: Мебель' : 'Furniture')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategory matches */}
              {searchResults.subcategories.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'ru' ? 'Услуги и виды работ' : lang === 'kz' ? 'Қызметтер мен жұмыс түрлері' : 'Services & Works'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {searchResults.subcategories.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedCategoryPageObj({
                            id: sub.parentCat.id,
                            title: sub.parentCat.title,
                            parentCatId: sub.parentCat.id,
                            parentTabId: sub.parentCat.tab
                          });
                          setActivePage('category');
                          setMegaMenuOpen(false);
                          setMegaSearchQuery('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setTimeout(() => {
                            setSelectedModalItem({
                              title: sub.title,
                              type: 'service',
                              parentTitle: sub.parentCat.title
                            });
                          }, 300);
                        }}
                        style={{
                          background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--line)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s'
                        }}
                        className="search-result-item"
                      >
                        <i className="ri-tools-line" style={{ fontSize: '20px', color: 'var(--accent-2)' }}></i>
                        <div>
                          <div style={{ fontWeight: '750', fontSize: '14px', color: theme === 'light' ? 'var(--text)' : '#fff' }}>{t(sub.title)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                            {t(sub.parentCat.title)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {searchResults.categories.length === 0 && searchResults.subcategories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <i className="ri-search-eye-line" style={{ fontSize: '48px', color: 'var(--line)', marginBottom: '15px', display: 'block' }}></i>
                  <p style={{ fontSize: '15px' }}>
                    {lang === 'ru' ? 'Ничего не найдено по вашему запросу' : lang === 'kz' ? 'Сұранысыңыз бойынша ештеңе табылмады' : 'No results found for your query'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
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
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '11px', marginLeft: 'auto', zIndex: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryPageObj({
                          id: cat.id,
                          title: cat.title,
                          parentCatId: cat.id,
                          parentTabId: activeMegaTab
                        });
                        setActivePage('category');
                        setMegaMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title="Открыть страницу категории"
                    >
                      Открыть ↗
                    </button>
                  </div>
                ))}
              </div>

              {/* Col 2: Subcategories */}
              <div className="mega-col2">
                {megaCategories.find(c => c.id === activeMegaCat) && (
                  <div
                    className="mega-sub all-cat-link"
                    style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '12px', color: 'var(--accent)', fontWeight: '700' }}
                    onClick={() => {
                      const currCat = megaCategories.find(c => c.id === activeMegaCat);
                      setSelectedCategoryPageObj({
                        id: currCat.id,
                        title: currCat.title,
                        parentCatId: currCat.id,
                        parentTabId: activeMegaTab
                      });
                      setActivePage('category');
                      setMegaMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span className="mega-sub-link">⚡ Все услуги: {t(megaCategories.find(c => c.id === activeMegaCat)?.title)}</span>
                    <i className="ri-arrow-right-line mega-sub-arrow" style={{ color: 'var(--accent)' }}></i>
                  </div>
                )}
                {(megaSubcategories[activeMegaCat] || []).map(sub => (
                  <div
                    key={sub.id}
                    className={`mega-sub ${activeMegaSub === sub.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveMegaSub(sub.id)}
                    onClick={() => {
                      setActiveMegaSub(sub.id);
                      setSelectedCategoryPageObj({
                        id: sub.id,
                        title: sub.title,
                        parentCatId: activeMegaCat,
                        parentTabId: activeMegaTab
                      });
                      setActivePage('category');
                      setMegaMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <a
                      href="#contact"
                      className="btn-primary"
                      onClick={() => {
                        setFormService(t(currentDetail.title));
                        setMegaMenuOpen(false);
                      }}
                    >
                      {t('srv_btn')}
                    </a>
                    <button
                      className="btn-ghost"
                      style={{ padding: '10px 20px', fontSize: '13px' }}
                      onClick={() => {
                        setSelectedCategoryPageObj({
                          id: activeMegaSub,
                          title: currentDetail.title,
                          parentCatId: activeMegaCat,
                          parentTabId: activeMegaTab
                        });
                        setActivePage('category');
                        setMegaMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {t('srv_more_btn')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`mega-overlay ${megaMenuOpen ? 'open' : ''}`} onClick={() => setMegaMenuOpen(false)}></div>

      {/* HERO & MAIN SECTIONS CONDITIONAL */}
      {activePage === 'category' && selectedCategoryPageObj ? (
        <section className="category-page-container" style={{ padding: '40px 6vw', minHeight: '70vh', animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumbs */}
          <div className="breadcrumbs" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--muted)', flexWrap: 'wrap' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('home'); }} style={{ color: 'var(--accent)', fontWeight: '600' }}>Главная</a>
            <span>/</span>
            <span>{t(catPageData.parentTabLabel)}</span>
            <span>/</span>
            <span>{t(catPageData.parentCatTitle)}</span>
            <span>/</span>
            <span style={{ color: 'var(--text)', fontWeight: '700' }}>{t(selectedCategoryPageObj.title)}</span>
            
            <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '12px' }} onClick={() => setActivePage('home')}>
              ← Назад на главную
            </button>
          </div>

          {/* Custom Rich Themed Category Block */}
          {(() => {
            const catId = selectedCategoryPageObj.parentCatId || selectedCategoryPageObj.id;
            
            // Map category data specifically
            const categoryMetaMap = {
              'cat-okna-1': {
                img: './cat_moskit.png',
                desc: 'Профессиональное изготовление и качественный монтаж москитных сеток любого типа: Стандартные рамные сетки, усиленные Антикошка (для безопасности питомцев), гипоаллергенные Антипыль (защита от мелкодисперсной пыли и пыльцы) и удобные раздвижные дверные сетки.',
                features: ['Защита питомцев от падения (высокопрочное полотно PetScreen)', 'Задержка мелкодисперсной пыльцы растений (мембрана Poll-Tex)', 'Усиленный цельнотянутый алюминиевый профиль рамки', 'Бесплатный точный замер и выезд при установке'],
                specs: [
                  { label: 'Изготовление', value: 'за 24 часа' },
                  { label: 'Материал полотна', value: 'Нейлон / ПЭ' },
                  { label: 'Профиль рамки', value: 'Алюминий 1мм' }
                ]
              },
              'cat-okna-2': {
                img: './cat_child.png',
                desc: 'Комплексная защита ваших окон от случайного открывания детьми и выпадения домашних животных. Установка надежных детских замков-блокираторов с ключом, защитных замков с гибким стальным тросом Jackloc, а также прочных сварных и раздвижных металлических решеток на окна.',
                features: ['Блокираторы BSL с прочным стальным ключом в комплекте', 'Усиленные многожильные стальные тросики безопасности (нагрузка до 500кг)', 'Качественные стальные оконные решетки по ГОСТу с порошковой покраской', 'Установка на любые типы окон без нарушения герметичности профиля'],
                specs: [
                  { label: 'Время установки', value: 'от 20 минут' },
                  { label: 'Защитный трос', value: 'Сталь в ПВХ' },
                  { label: 'Прочность замка', value: 'усиленный сплав' }
                ]
              },
              'cat-okna-3': {
                img: './cat_win_repair.png',
                desc: 'Профессиональный ремонт, сложная регулировка и техническое обслуживание оконных систем любых производителей. Быстрое устранение продувания и промерзания, замена изношенного уплотнителя, регулировка провисания створки, замена треснувших стеклопакетов и сломанной фурнитуры.',
                features: ['Устранение сквозняков, свиста и наледи на окнах', 'Замена уплотнителя на премиальный EPDM (Германия) или Q-Lon Schlegel', 'Регулировка фурнитуры в режим повышенного зимнего/летнего прижима', 'Ремонт и замена запирающих механизмов (Maco, Roto, Siegenia)'],
                specs: [
                  { label: 'Выезд мастера', value: 'за 45 минут' },
                  { label: 'Гарантия на ремонт', value: '12 месяцев' },
                  { label: 'Диагностика', value: 'Бесплатно' }
                ]
              },
              'cat-okna-4': {
                img: './cat_win_make.png',
                desc: 'Проектирование, производство и профессиональный монтаж современных оконных систем под ключ. Используем исключительно оригинальные профили ведущих европейских брендов: Rehau, Veka, KBE, Salamander с качественной фурнитурой Maco и Roto. Полное соответствие стандартам ГОСТ.',
                features: ['Качественные 3-, 5- и 7-камерные пластиковые профили', 'Энергосберегающие мультифункциональные стеклопакеты с аргоном', 'Герметичный монтаж с использованием гидро- и пароизоляционных лент', 'Собственное современное автоматизированное производство окон'],
                specs: [
                  { label: 'Срок изготовления', value: '3-5 дней' },
                  { label: 'Гарантия на профиль', value: 'до 5 лет' },
                  { label: 'Замер проемов', value: 'Бесплатно' }
                ]
              },
              'cat-okna-5': {
                img: './cat_blinds.png',
                desc: 'Индивидуальный пошив, изготовление и монтаж стильных солнцезащитных систем: ролл-шторы (рулонные шторы), горизонтальные и вертикальные жалюзи, кассетные системы Зебра (День-Ночь) и шторы с электроприводом. Огромный каталог качественных европейских тканей высокой плотности.',
                features: ['Ткани со 100% светоблокировкой Blackout для крепкого сна', 'Компактные кассетные системы UNI-1 и UNI-2 с направляющими', 'Монтаж на створки без сверления пластикового профиля окон', 'Широкая цветовая гамма коробов и комплектующих жалюзи'],
                specs: [
                  { label: 'Изготовление', value: '1-2 дня' },
                  { label: 'Защита от солнца', value: 'до 100%' },
                  { label: 'Выезд с каталогом', value: 'Бесплатно' }
                ]
              },
              'cat-srv-1': {
                img: './cat_washing.png',
                desc: 'Срочный ремонт автоматических стиральных машин всех марок и моделей на дому. Выполняем устранение любых неисправностей: замену сгоревших ТЭНов, сливных помп и манжет, перепрессовку подшипников бака, ремонт и перепрошивку сгоревших электронных модулей управления.',
                features: ['Срочный выезд мастера по городу в течение 45 минут', 'Использование оригинальных итальянских ТЭНов Thermowatt', 'Установка надежных износостойких шведских подшипников SKF', 'Официальная письменная гарантия на выполненный ремонт до 1 года'],
                specs: [
                  { label: 'Время ремонта', value: 'от 40 минут' },
                  { label: 'Запчасти в наличии', value: 'Оригинал 100%' },
                  { label: 'Выезд на дом', value: 'Бесплатно' }
                ]
              },
              'cat-srv-2': {
                img: './cat_fridge.png',
                desc: 'Качественная диагностика и профессиональный ремонт бытовых холодильников на дому за один визит. Устранение утечек хладагента и заправка фреоном R600a/R134a, замена заклинивших мотор-компрессоров, замена термостатов, пусковых реле и ремонт системы No Frost (оттайка, вентиляторы).',
                features: ['Замена компрессоров на новые оригинальные Secop (Danfoss) и Embraco', 'Точная опрессовка контура азотом для надежного поиска микроутечек', 'Замена сгоревших ТЭНов оттайки испарителя и датчиков дефроста', 'Выезд мастера и полная компьютерная диагностика системы'],
                specs: [
                  { label: 'Срок ремонта', value: 'за 1 визит' },
                  { label: 'Марка фреона', value: 'R600a / R134a' },
                  { label: 'Гарантийный акт', value: '12 месяцев' }
                ]
              },
              'cat-srv-3': {
                img: './slide_appliances.png',
                desc: 'Профессиональный ремонт кондиционеров и посудомоечных машин всех популярных брендов. Полное устранение протечек, засоров гидравлики, замена циркуляционных насосов и ТЭНов нагрева воды посудомоек, а также качественный ремонт инверторных плат управления сплит-систем.',
                features: ['Замена циркуляционных насосов и ТЭНов в сборе (Bosch, Electrolux)', 'Устранение системных ошибок посудомоечных машин (E15, E24, i30)', 'Глубокая антибактериальная мойка испарителя кондиционера', 'Точная дозаправка сплит-систем качественным фреоном R410a/R32'],
                specs: [
                  { label: 'Выезд мастера', value: 'за 45 минут' },
                  { label: 'Запчасти', value: 'Оригинал' },
                  { label: 'Гарантия', value: 'до 1 года' }
                ]
              },
              'cat-srv-4': {
                img: './why_bg.png',
                desc: 'Монтаж кухонных вытяжек, подключение их к вентиляционной шахте и профессиональный ремонт. Быстрое устранение неисправностей: замена кнопочных и сенсорных блоков управления, ремонт сгоревших обмоток двигателя вентилятора, подбор и замена угольных и жировых фильтров.',
                features: ['Разметка, прочное крепление к стене или интеграция в шкаф под ключ', 'Прокладка герметичных воздуховодов из эстетичного ПВХ или гофры', 'Установка обратного клапана для защиты от посторонних запахов', 'Деликатное подключение вытяжки к электросети без видимых проводов'],
                specs: [
                  { label: 'Установка', value: 'за 1.5 часа' },
                  { label: 'Воздуховоды', value: 'Пластик / Гофра' },
                  { label: 'Фильтры в наличии', value: 'Угольные / Жировые' }
                ]
              },
              'cat-srv-5': {
                img: './slide_appliances.png',
                desc: 'Профессиональная установка, чистка, обслуживание и дозаправка кондиционеров всех классов. Гарантируем идеальную герметичность фреонового контура, надежное крепление блоков на фасаде здания, вакуумирование магистрали и бережное бурение стен без лишней пыли.',
                features: ['Бурение отверстий профессиональным инструментом без сколов фасада', 'Прокладка толстостенной медной трассы в защитной теплоизоляции K-Flex', 'Обязательное глубокое вакуумирование контура перед пуском фреона', 'Демонтаж оборудования с полной перекачкой хладагента в компрессор'],
                specs: [
                  { label: 'Время монтажа', value: 'от 2 часов' },
                  { label: 'Материал трассы', value: 'Медь Majdanpek' },
                  { label: 'Сервис', value: 'Чистка / Заправка' }
                ]
              },
              'cat-srv-8': {
                img: './cat_electric.png',
                desc: 'Полный перечень электромонтажных работ любой сложности в жилых и коммерческих помещениях. Квалифицированные электрики с допусками выполнят штробление стен без пыли, монтаж и перенос розеток, сборку электрических щитов с защитой от скачков напряжения и устранят замыкания.',
                features: ['Выполнение штробления стен штроборезом со строительным пылесосом', 'Сборка и монтаж щитов на оригинальных автоматах ABB и Schneider Electric', 'Быстрый поиск скрытого обрыва провода или КЗ с помощью трассоискателя', 'Полное соблюдение правил ПУЭ и использование кабелей по ГОСТу'],
                specs: [
                  { label: 'Мастер в пути', value: '45 минут' },
                  { label: 'Стандарты', value: 'ПУЭ / ГОСТ' },
                  { label: 'Марка кабелей', value: 'ВВГнг-LS (ГОСТ)' }
                ]
              }
            };
            
            const meta = categoryMetaMap[catId] || {
              img: './slide_windows.png',
              desc: 'Профессиональные услуги и оригинальные комплектующие от сервисного центра MasterHub. Выезд квалифицированного специалиста по городу в течение 45 минут. Письменная официальная гарантия на все выполненные работы до 12 месяцев.',
              features: ['Бесплатный выезд специалиста на дом при проведении работ', 'Только проверенные оригинальные запчасти и комплектующие', 'Использование современного профессионального инструмента', 'Прозрачный прайс-лист без скрытых доплат и наценок'],
              specs: [
                { label: 'Выезд мастера', value: 'за 45 минут' },
                { label: 'Диагностика', value: 'Бесплатно' },
                { label: 'Гарантия', value: 'до 12 месяцев' }
              ]
            };
            
            return (
              <div className="cat-page-split-hero" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center', marginBottom: '56px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '24px', padding: '40px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}></div>
                
                {/* Left details */}
                <div>
                  <div className="pill" style={{ marginBottom: '16px', display: 'inline-block', background: 'rgba(124, 242, 199, 0.08)', border: '1px solid rgba(124, 242, 199, 0.2)', color: 'var(--accent)', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
                    {t(catPageData.parentCatTitle)}
                  </div>
                  <h1 className="cat-page-title" style={{ fontSize: '36px', fontWeight: '850', marginBottom: '20px', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                    {t(selectedCategoryPageObj.title)}
                  </h1>
                  <p className="cat-page-desc" style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '28px' }}>
                    {meta.desc}
                  </p>
                  
                  {/* Category Features list */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '32px' }}>
                    {meta.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', fontWeight: '600' }}>
                        <i className="ri-checkbox-circle-fill" style={{ color: 'var(--accent)', fontSize: '18px', marginTop: '1px' }}></i>
                        <span style={{ color: 'var(--text)' }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn-primary big" style={{ padding: '16px 36px', fontSize: '15px' }} onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                      Вызвать мастера на дом <i className="ri-arrow-right-line"></i>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                      <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>14 мастеров рядом</span>
                    </div>
                  </div>
                </div>
                
                {/* Right theme photo with HUD specs */}
                <div className="cat-page-hero-img-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--line)' }}>
                  <img src={meta.img} alt={t(selectedCategoryPageObj.title)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'all 0.5s ease' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.9) 0%, rgba(11,16,32,0.1) 60%)' }}></div>
                  
                  {/* Floating HUD metrics on image */}
                  <div className="cat-page-hud" style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'rgba(20, 27, 52, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124, 242, 199, 0.25)', borderRadius: '12px', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', zIndex: 5 }}>
                    {meta.specs.map((spec, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', borderRight: sIdx < 2 ? '1px solid var(--line)' : 'none' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: '700', letterSpacing: '0.5px' }}>{spec.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)' }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section: Бренды */}
          <div className="cat-page-section">
            <h2 className="cat-page-section-title">
              <i className="ri-award-line" style={{ color: 'var(--accent)' }}></i> Бренды
            </h2>
            <div className="cat-page-grid">
              {catPageData.brands.map((brand, idx) => {
                const itemTitle = selectedCategoryPageObj.title.includes('кофемаш') ? `Запчасти для кофемашин ${brand}` : `${brand}`;
                return (
                  <div
                    key={idx}
                    className="cat-page-card"
                    onClick={() => {
                      setFormService(itemTitle);
                      setSelectedModalItem({ title: itemTitle, type: 'brand', parentTitle: t(selectedCategoryPageObj.title) });
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Бренд</div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>{itemTitle}</h3>
                    </div>
                    <div className="cat-page-card-foot">
                      <span>от 2 500 ₸</span>
                      <span className="cat-page-card-link">Открыть <i className="ri-arrow-right-line"></i></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Услуги / Детали */}
          <div className="cat-page-section">
            <h2 className="cat-page-section-title">
              <i className="ri-tools-line" style={{ color: 'var(--accent)' }}></i> Услуги и детали
            </h2>
            <div className="cat-page-grid">
              {catPageData.services.map((srv, idx) => (
                <div
                  key={idx}
                  className="cat-page-card"
                  onClick={() => {
                    setFormService(srv);
                    setSelectedModalItem({ title: srv, type: 'service', parentTitle: t(selectedCategoryPageObj.title) });
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Услуга / Деталь</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>{srv}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
                      Быстрая диагностика, замена и ремонт с использованием профессионального оборудования.
                    </p>
                  </div>
                  <div className="cat-page-card-foot" style={{ marginTop: '20px' }}>
                    <span>от 2 500 ₸</span>
                    <span className="cat-page-card-link">Открыть <i className="ri-arrow-right-line"></i></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
            {/* HERO */}
          <section className="hero" style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 60px 0' }}>
            {/* Ambient High-Tech Visual Layers */}
            <div className="hero-glow hero-glow-1"></div>
            <div className="hero-glow hero-glow-2"></div>
            <div className="hero-glow hero-glow-3"></div>
            <div className="hero-grid-overlay"></div>

            {(() => {
              const heroSlides = [
                {
                  pill: lang === 'ru' ? '🔧 Направление: Окна и оконные системы' : (lang === 'kz' ? '🔧 Бағыт: Терезе және окон жүйелері' : '🔧 Category: Windows and window systems'),
                  title: lang === 'ru' ? 'Профессиональный ремонт и<br/>регулировка <span class="accent">окон под ключ</span>' : (lang === 'kz' ? 'Терезелерді кәсіби жөндеу және<br/><span class="accent">реттеу</span>' : 'Professional repair and<br/>adjustment of <span class="accent">windows</span>'),
                  lead: lang === 'ru' ? 'Устраним продувание, заменим уплотнитель, отрегулируем фурнитуру с гарантией до 12 месяцев. Быстрый выезд мастера.' : (lang === 'kz' ? 'Соғуды жоямыз, тығыздауышты ауыстырамыз, 12 айға дейінгі кепілдікпен фурнитураны реттейміз. Шебердің жылдам келуі.' : 'We eliminate drafts, replace seals, and adjust hardware under a 12-month warranty. Fast master arrival.'),
                  btnText: lang === 'ru' ? 'Вызвать оконщика' : (lang === 'kz' ? 'Шеберді шақыру' : 'Call a window master'),
                  img: './slide_windows.png',
                  cat: 'okna',
                  widget1: { icon: 'ri-window-line', label: lang === 'ru' ? 'Регулировка' : (lang === 'kz' ? 'Реттеу' : 'Adjustment'), value: lang === 'ru' ? 'от 2 500 ₸' : (lang === 'kz' ? '2 500 ₸ бастап' : 'from 2,500 ₸') },
                  widget2: { icon: 'ri-shield-check-line', label: lang === 'ru' ? 'Гарантия' : (lang === 'kz' ? 'Кепілдік' : 'Warranty'), value: lang === 'ru' ? 'до 12 месяцев' : (lang === 'kz' ? '12 айға дейін' : 'up to 12 months') },
                  widget3: { icon: 'ri-flashlight-line', label: lang === 'ru' ? 'Устранение' : (lang === 'kz' ? 'Жою' : 'Drafts'), value: lang === 'ru' ? 'Продуваний' : (lang === 'kz' ? 'Соғуды жою' : 'Elimination') },
                  master: { name: 'Александр В.', role: lang === 'ru' ? 'Мастер по окнам (стаж 8 лет)' : (lang === 'kz' ? 'Терезе шебері (өтілі 8 жыл)' : 'Window Master (8 yrs exp)'), rating: '4.9' }
                },
                {
                  pill: lang === 'ru' ? '⚡ Направление: Бытовая техника' : (lang === 'kz' ? '⚡ Бағыт: Тұрмыстық техника' : '⚡ Category: Home Appliances'),
                  title: lang === 'ru' ? 'Срочный и надежный ремонт<br/><span class="accent">бытовой техники</span> на дому' : (lang === 'kz' ? 'Тұрмыстық техниканы үйге<br/>барып <span class="accent">шұғыл жөндеу</span>' : 'Urgent and reliable repair of<br/><span class="accent">home appliances</span> at home'),
                  lead: lang === 'ru' ? 'Ремонт холодильников, стиральных и посудомоечных машин. Оригинальные запчасти в наличии, выезд мастера за 45 минут.' : (lang === 'kz' ? 'Тоңазытқыштарды, кір жуғыш және ыдыс жуғыш машиналарды жөндеу. Түпнұсқа бөлшектер бар, шебер 45 минутта келеді.' : 'Repair of refrigerators, washing machines, and dishwashewers. Original parts in stock, master arrival in 45 minutes.'),
                  btnText: lang === 'ru' ? 'Вызвать мастера' : (lang === 'kz' ? 'Шеберді шақыру' : 'Call a master'),
                  img: './slide_appliances.png',
                  cat: 'servis',
                  widget1: { icon: 'ri-tools-line', label: lang === 'ru' ? 'Диагностика' : (lang === 'kz' ? 'Диагностика' : 'Diagnostics'), value: lang === 'ru' ? 'Бесплатно' : (lang === 'kz' ? 'Тегін' : 'Free') },
                  widget2: { icon: 'ri-speed-mini-fill', label: lang === 'ru' ? 'Срочный выезд' : (lang === 'kz' ? 'Шұғыл келу' : 'Urgent Arrival'), value: lang === 'ru' ? 'за 45 минут' : (lang === 'kz' ? '45 минутта' : 'in 45 mins') },
                  widget3: { icon: 'ri-heart-pulse-line', label: lang === 'ru' ? 'Запчасти' : (lang === 'kz' ? 'Бөлшектер' : 'Parts'), value: lang === 'ru' ? 'Оригиналы' : (lang === 'kz' ? 'Түпнұсқалар' : 'Originals') },
                  master: { name: 'Кайрат Н.', role: lang === 'ru' ? 'Мастер по быт. технике (стаж 6 лет)' : (lang === 'kz' ? 'Тұрмыстық техника шебері (өтілі 6 жыл)' : 'Appliances Master (6 yrs exp)'), rating: '5.0' }
                },
                {
                  pill: lang === 'ru' ? '🛋️ Направление: Ремонт и сборка мебели' : (lang === 'kz' ? '🛋️ Бағыт: Жиһаз құрастыру және жөндеу' : '🛋️ Category: Furniture Assembly & Repair'),
                  title: lang === 'ru' ? 'Качественная сборка и<br/>реставрация <span class="accent">вашей мебели</span>' : (lang === 'kz' ? 'Жиһаздарды сапалы құрастыру<br/>және <span class="accent">қалпына келтіру</span>' : 'High-quality assembly and<br/>restoration of <span class="accent">your furniture</span>'),
                  lead: lang === 'ru' ? 'Сборка кухонь, шкафов-купе, ремонт каркасов и перетяжка мягкой мебели с премиальной фурнитурой и гарантией качества.' : (lang === 'kz' ? 'Асүй жиһазын, шкафтарды құрастыру, қаңқаларды жөндеу және сапалы фурнитурамен жұмсақ жиһазды қаптау.' : 'Assembly of kitchens, sliding wardrobes, frame repairs, and reupholstering of upholstered furniture with premium hardware.'),
                  btnText: lang === 'ru' ? 'Вызвать мебельщика' : (lang === 'kz' ? 'Шеберді шақыру' : 'Call a furniture master'),
                  img: './slide_furniture.png',
                  cat: 'mebel',
                  widget1: { icon: 'ri-sofa-line', label: lang === 'ru' ? 'Перетяжка' : (lang === 'kz' ? 'Қаптау' : 'Reupholstery'), value: lang === 'ru' ? 'от 8 000 ₸' : (lang === 'kz' ? '8 000 ₸ бастап' : 'from 8,000 ₸') },
                  widget2: { icon: 'ri-pantone-line', label: lang === 'ru' ? 'Дизайн-проект' : (lang === 'kz' ? 'Дизайн-жоба' : 'Design Project'), value: lang === 'ru' ? '3D бесплатно' : (lang === 'kz' ? '3D тегін' : '3D free') },
                  widget3: { icon: 'ri-compasses-2-line', label: lang === 'ru' ? 'Сборка' : (lang === 'kz' ? 'Құрастыру' : 'Assembly'), value: lang === 'ru' ? 'Любая сложность' : (lang === 'kz' ? 'Кез келген қиындық' : 'Any complexity') },
                  master: { name: 'Азамат Т.', role: lang === 'ru' ? 'Реставратор мебели (стаж 12 лет)' : (lang === 'kz' ? 'Жиһаз реставраторы (өтілі 12 жыл)' : 'Furniture Restorer (12 yrs exp)'), rating: '5.0' }
                }
              ];

              return (
                <div className="hero-slides-viewport" style={{ overflow: 'hidden', width: '100%', padding: '0 6vw' }}>
                  <div 
                    className="hero-slides-wrapper" 
                    style={{ 
                      display: 'flex', 
                      width: '300%', 
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
                      transform: `translateX(-${currentHeroSlide * 33.3333}%)` 
                    }}
                  >
                    {heroSlides.map((slide, slideIdx) => (
                                            <div 
                        key={slideIdx} 
                        className="hero-slide-container" 
                        style={{ 
                          width: '33.3333%', 
                          flexShrink: 0, 
                          position: 'relative', 
                          filter: slideIdx === currentHeroSlide ? 'none' : 'blur(6px)', 
                          opacity: slideIdx === currentHeroSlide ? 1 : 0.3, 
                          transition: 'filter 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                        }}
                      >
                        <div className="hero-content">
                          <div className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            {slide.pill}
                          </div>
                          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: slide.title }}></h1>
                          <p className="hero-lead">{slide.lead}</p>
                          <div className="hero-actions">
                            <button className="btn-primary big" onClick={() => {
                              setActiveCatPill(slide.cat);
                              document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
                            }}>
                              {slide.btnText}
                            </button>
                            <button className="btn-ghost" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                              {t('hero_btn2')}
                            </button>
                          </div>

                          {/* Hero Slide Navigation Dots */}
                          <div className="hero-dots">
                            {heroSlides.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                onClick={() => setCurrentHeroSlide(dotIdx)}
                                className={`hero-dot ${currentHeroSlide === dotIdx ? 'active' : ''}`}
                                aria-label={`Перейти к слайду ${dotIdx + 1}`}
                              ></button>
                            ))}
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
                          <div className="hero-visual-stack">
                            {/* Floating Interactive Widget 1 */}
                            <div className="hero-floating-widget widget-1">
                              <div className="widget-icon"><i className={slide.widget1.icon}></i></div>
                              <div>
                                <div className="widget-label">{slide.widget1.label}</div>
                                <div className="widget-value">{slide.widget1.value}</div>
                              </div>
                            </div>

                            {/* Floating Interactive Widget 2 */}
                            <div className="hero-floating-widget widget-2">
                              <div className="widget-icon"><i className={slide.widget2.icon}></i></div>
                              <div>
                                <div className="widget-label">{slide.widget2.label}</div>
                                <div className="widget-value">{slide.widget2.value}</div>
                              </div>
                            </div>

                            {/* Floating Interactive Widget 3 */}
                            <div className="hero-floating-widget widget-3">
                              <div className="widget-icon"><i className={slide.widget3.icon}></i></div>
                              <div>
                                <div className="widget-label">{slide.widget3.label}</div>
                                <div className="widget-value">{slide.widget3.value}</div>
                              </div>
                            </div>

                            {/* Main Premium Category Visual Illustration Container */}
                            <div className="hero-img-container" style={{ position: 'relative', overflow: 'visible' }}>
                              <div className="hero-img-inner-wrapper" style={{ position: 'absolute', inset: 0, borderRadius: '24px', overflow: 'hidden' }}>
                                <img src={slide.img} alt="MasterHub Premium Service" className="hero-main-img" style={{ transform: 'scale(1.02)', transition: 'all 0.5s ease' }} />
                                <div className="hero-img-overlay"></div>
                              </div>
                              <div className="hero-card-container" style={{ bottom: '-35px' }}>
                                <div className="hero-card">
                                  <div className="hero-card-head">
                                    <div className="dot"></div>
                                    <span>{t('hero_card_head')}</span>
                                  </div>
                                  <div className="master">
                                    <div className="avatar"><i className="ri-user-star-line"></i></div>
                                    <div>
                                      <div className="m-name">{slide.master.name}</div>
                                      <div className="m-role">{slide.master.role}</div>
                                    </div>
                                    <div className="rate">★ {slide.master.rating}</div>
                                  </div>
                                  <div className="hero-card-foot">
                                    <i className="ri-map-pin-line"></i> {getCityDisplay(city)} · {t('hero_card_foot')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>

          {/* QUICK STEPS */}
          <section className="quick-steps">
            <div className="quick-steps-grid">
              <div className="quick-step-item">
                <div className="quick-step-icon"><i className="ri-hand-coin-line"></i></div>
                <div>
                  <h4 className="quick-step-title">1. Выбираете услугу</h4>
                  <p className="quick-step-desc">Фиксированный прайс без скрытых наценок</p>
                </div>
              </div>
              <div className="quick-step-item">
                <div className="quick-step-icon"><i className="ri-timer-flash-line"></i></div>
                <div>
                  <h4 className="quick-step-title">2. Выезд за 45 минут</h4>
                  <p className="quick-step-desc">Мастер прибудет в среднем за 45 минут</p>
                </div>
              </div>
              <div className="quick-step-item">
                <div className="quick-step-icon"><i className="ri-shield-star-line"></i></div>
                <div>
                  <h4 className="quick-step-title">3. Гарантия 1 год</h4>
                  <p className="quick-step-desc">Официальная гарантия и страхование работ</p>
                </div>
              </div>
            </div>
          </section>

          {/* WHAT WE DO SLIDER */}
          <section id="about" className="what-we-do">
            <div className="section-head" style={{ marginBottom: '40px' }}>
              <h2>Чем мы занимаемся</h2>
              <p>Три ключевых направления нашего мультисервиса с гарантией качества и фиксированным прайсом.</p>
            </div>
            
            {/* Slider Tabs */}
            <div className="what-we-do-tabs">
              {[
                {
                  id: 'okna',
                  title: 'Окна и оконные системы',
                  subtitle: 'Москитные сетки, детская защита, регулировка и сложный ремонт окон любой конфигурации.',
                  img: './slide_windows.png',
                  features: ['Замена стеклопакетов и уплотнителей', 'Установка детских замков и решеток', 'Изготовление и монтаж под ключ'],
                  pillCat: 'okna'
                },
                {
                  id: 'servis',
                  title: 'Сервис и ремонт техники',
                  subtitle: 'Профессиональный ремонт стиральных машин, холодильников, кондиционеров и посудомоечных машин.',
                  img: './slide_appliances.png',
                  features: ['Срочный выезд мастера за 45 минут', 'Оригинальные запчасти в наличии', 'Гарантия на все работы до 12 месяцев'],
                  pillCat: 'servis'
                },
                {
                  id: 'mebel',
                  title: 'Мебель на заказ и реставрация',
                  subtitle: 'Изготовление корпусной и мягкой мебели по индивидуальным проектам, перетяжка и ремонт.',
                  img: './slide_furniture.png',
                  features: ['Разработка 3D-дизайн проекта', 'Премиальные материалы и фурнитура', 'Распил, кромление и сборка'],
                  pillCat: 'mebel'
                }
              ].map((slide, idx, arr) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`what-we-do-tab-btn ${activeSlide === idx ? 'active' : ''}`}
                >
                  <i className={slide.id === 'okna' ? 'ri-window-line' : (slide.id === 'servis' ? 'ri-tools-line' : 'ri-sofa-line')}></i>
                  {slide.title}
                </button>
              ))}
            </div>

            {/* Slide Content */}
            {(() => {
              const slides = [
                {
                  id: 'okna',
                  title: 'Окна и оконные системы',
                  subtitle: 'Москитные сетки, детская защита, регулировка и сложный ремонт окон любой конфигурации.',
                  img: './slide_windows.png',
                  features: ['Замена стеклопакетов и уплотнителей', 'Установка детских замков и решеток', 'Изготовление и монтаж под ключ'],
                  pillCat: 'okna'
                },
                {
                  id: 'servis',
                  title: 'Сервис и ремонт техники',
                  subtitle: 'Профессиональный ремонт стиральных машин, холодильников, кондиционеров и посудомоечных машин.',
                  img: './slide_appliances.png',
                  features: ['Срочный выезд мастера за 45 минут', 'Оригинальные запчасти в наличии', 'Гарантия на все работы до 12 месяцев'],
                  pillCat: 'servis'
                },
                {
                  id: 'mebel',
                  title: 'Мебель на заказ и реставрация',
                  subtitle: 'Изготовление корпусной и мягкой мебели по индивидуальным проектам, перетяжка и ремонт.',
                  img: './slide_furniture.png',
                  features: ['Разработка 3D-дизайн проекта', 'Премиальные материалы и фурнитура', 'Распил, кромление и сборка'],
                  pillCat: 'mebel'
                }
              ];
              return (
                <div className="what-we-do-viewport">
                  <div 
                    className="what-we-do-wrapper" 
                    style={{ 
                      display: 'flex', 
                      width: '300%', 
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
                      transform: `translateX(-${activeSlide * 33.3333}%)` 
                    }}
                  >
                    {slides.map((currentSlide, sIdx) => (
                      <div 
                        key={currentSlide.id} 
                        className="what-we-do-slide" 
                        style={{ 
                          width: '33.3333%', 
                          flexShrink: 0,
                          display: 'grid',
                          gridTemplateColumns: '1.1fr 1fr',
                          alignItems: 'stretch'
                        }}
                      >
                        <div className="what-we-do-content">
                          <div className="what-we-do-tag">
                            Направление 0{sIdx + 1}
                          </div>
                          <h3 className="what-we-do-title">
                            {currentSlide.title}
                          </h3>
                          <p className="what-we-do-subtitle">
                            {currentSlide.subtitle}
                          </p>
                          <ul className="what-we-do-features">
                            {currentSlide.features.map((feat, fIdx) => (
                              <li key={fIdx} className="what-we-do-feature-item">
                                <i className="ri-checkbox-circle-fill"></i> {feat}
                              </li>
                            ))}
                          </ul>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              setActiveCatPill(currentSlide.pillCat);
                              document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', fontSize: '16px', alignSelf: 'flex-start' }}
                          >
                            Перейти в каталог услуг <i className="ri-arrow-right-line"></i>
                          </button>
                        </div>
                        <div className="what-we-do-image-wrapper">
                          <img
                            src={currentSlide.img}
                            alt={currentSlide.title}
                            className="what-we-do-image"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
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
                <div className="srv-card" key={idx} style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                  {card.img && (
                    <div className="srv-img-wrapper" style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={card.img} 
                        alt={t(card.title)} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        className="srv-card-img"
                      />
                      <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--accent)', width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 5 }}>
                        <i className="ri-tools-line"></i>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 className="srv-title" style={{ marginTop: 0 }}>{t(card.title)}</h3>
                    <p className="srv-desc" style={{ flex: 1 }}>{t(card.desc)}</p>
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
            <div className="cat-nav-pills" style={{ marginBottom: '32px' }}>
              {catPills.map(p => (
                <button
                  key={p.id}
                  className={`cat-pill ${activeMasterCat === p.id ? 'active' : ''}`}
                  onClick={() => setActiveMasterCat(p.id)}
                  dangerouslySetInnerHTML={{ __html: t(p.label) }}
                ></button>
              ))}
            </div>
            <div className="m-list">
              {[
                { cat: 'okna', name: 'Александр В.', role: 'Мастер по окнам', exp: '8 лет', rating: '4.9', reviews: 142, photo: 'a1' },
                { cat: 'okna', name: 'Дмитрий С.', role: 'Остекление и балконы', exp: '10 лет', rating: '4.9', reviews: 210, photo: 'a3' },
                { cat: 'okna', name: 'Тимур Р.', role: 'Ремонт и фурнитура', exp: '5 лет', rating: '4.8', reviews: 85, photo: 'a4' },
                { cat: 'okna', name: 'Сергей М.', role: 'Монтажник', exp: '12 лет', rating: '5.0', reviews: 310, photo: 'a2' },

                { cat: 'servis', name: 'Кайрат Н.', role: 'Мастер по быт. технике', exp: '6 лет', rating: '5.0', reviews: 98, photo: 'a2' },
                { cat: 'servis', name: 'Ерлан А.', role: 'Ремонт кондиционеров', exp: '7 лет', rating: '4.9', reviews: 165, photo: 'a4' },
                { cat: 'servis', name: 'Максим Д.', role: 'Стиральные машины', exp: '9 лет', rating: '4.8', reviews: 190, photo: 'a1' },
                { cat: 'servis', name: 'Асет К.', role: 'Электрик', exp: '11 лет', rating: '5.0', reviews: 275, photo: 'a3' },

                { cat: 'mebel', name: 'Иван П.', role: 'Сборщик мебели', exp: '5 лет', rating: '4.8', reviews: 112, photo: 'a1' },
                { cat: 'mebel', name: 'Азамат Т.', role: 'Реставратор мебели', exp: '12 лет', rating: '5.0', reviews: 245, photo: 'a2' },
                { cat: 'mebel', name: 'Руслан Б.', role: 'Мягкая мебель', exp: '8 лет', rating: '4.9', reviews: 134, photo: 'a4' },
                { cat: 'mebel', name: 'Денис В.', role: 'Корпусная мебель', exp: '6 лет', rating: '4.7', reviews: 95, photo: 'a3' },
              ].filter(m => m.cat === activeMasterCat).map((m, idx) => (
                <div className="m-card" key={idx}>
                  <div className={`m-photo ${m.photo === 'a1' ? '' : m.photo}`}><i className="ri-user-line"></i></div>
                  <h4>{m.name}</h4>
                  <span>{m.role}</span>
                  <div className="m-meta"><span>Опыт: {m.exp}</span><span className="m-star">★ {m.rating} ({m.reviews} отзывов)</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* WHY US */}
          <section id="why" className="why">
            <div className="section-head">
              <h2>{t('why_title')}</h2>
              <p>{t('why_sub')}</p>
            </div>
            <div className="timeline">
              {[
                { num: 1, icon: 'ri-stack-line' },
                { num: 2, icon: 'ri-speed-mini-fill' },
                { num: 3, icon: 'ri-shield-star-line' },
                { num: 4, icon: 'ri-user-heart-line' },
                { num: 5, icon: 'ri-verified-badge-line' },
                { num: 6, icon: 'ri-camera-lens-line' },
                { num: 7, icon: 'ri-wallet-3-line' },
                { num: 8, icon: 'ri-hand-heart-line' },
                { num: 9, icon: 'ri-safe-2-line' }
              ].map(item => (
                <div className="t-item" key={item.num}>
                  <div className="t-item-icon-wrapper">
                    <div className="t-item-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div className="t-num">0{item.num}</div>
                  </div>
                  <h4>{t(`why${item.num}_h`)}</h4>
                  <p>{t(`why${item.num}_p`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* REVIEWS */}
          

          {/* REVIEWS */}
          <section id="reviews">
            <div className="section-head">
              <h2>{t('reviews_title')}</h2>
              <p>{t('reviews_sub')}</p>
            </div>
            <div className="r-grid">
              {reviewsData.map((rev, idx) => (
                <blockquote key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ color: '#ffcc00', fontSize: '14px', display: 'flex', gap: '2px' }}>
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <i key={i} className="ri-star-fill"></i>
                    ))}
                  </div>
                  <p>{t(rev.text)}</p>
                  <cite style={{ marginTop: 'auto' }}>{t(rev.author)}</cite>
                </blockquote>
              ))}
            </div>

            {/* REVIEW FORM */}
            <div className="review-form-container" style={{
              marginTop: '40px',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 27, 52, 0.6)',
              backdropFilter: 'blur(20px)',
              border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '600px',
              marginInline: 'auto'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '850', marginBottom: '15px', color: theme === 'light' ? 'var(--text)' : '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ri-message-3-line" style={{ color: 'var(--accent)' }}></i>
                {lang === 'ru' ? 'Оставить отзыв' : lang === 'kz' ? 'Пікір қалдыру' : 'Leave a Review'}
              </h3>

              {reviewSuccess && (
                <div style={{ padding: '12px', background: 'rgba(0, 230, 115, 0.1)', border: '1px solid #00e673', borderRadius: '10px', color: '#00e673', fontSize: '13px', marginBottom: '15px' }}>
                  {reviewSuccess}
                </div>
              )}

              {reviewError && (
                <div style={{ padding: '12px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid #ff3232', borderRadius: '10px', color: '#ff3232', fontSize: '13px', marginBottom: '15px' }}>
                  {reviewError}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'ru' ? 'Оценка:' : lang === 'kz' ? 'Бағалау:' : 'Rating:'}
                  </label>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '20px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={reviewRating >= star ? "ri-star-fill" : "ri-star-line"}
                        style={{ color: '#ffcc00', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                        onClick={() => setReviewRating(star)}
                      ></i>
                    ))}
                  </div>
                </div>

                {!user && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {lang === 'ru' ? 'Ваше имя:' : lang === 'kz' ? 'Атыңыз:' : 'Your Name:'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'ru' ? 'Аноним' : lang === 'kz' ? 'Аноним' : 'Anonymous'}
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      style={{
                        width: '100%',
                        background: theme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                        border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: theme === 'light' ? 'var(--text)' : '#fff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {user && (
                  <div style={{ fontSize: '13px', color: 'var(--muted)', background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: theme === 'light' ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.04)' }}>
                    <i className="ri-user-line" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>
                    {lang === 'ru' ? 'Вы пишите отзыв от имени: ' : lang === 'kz' ? 'Сіз келесі атпен пікір жазып жатырсыз: ' : 'Posting as: '} 
                    <strong style={{ color: theme === 'light' ? 'var(--text)' : '#fff' }}>{user.name}</strong>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'ru' ? 'Текст отзыва:' : lang === 'kz' ? 'Пікір мәтіні:' : 'Review Text:'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={lang === 'ru' ? 'Напишите ваше мнение о качестве услуг...' : lang === 'kz' ? 'Қызмет көрсету сапасы туралы пікіріңізді жазыңыз...' : 'Write your review here...'}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      width: '100%',
                      background: theme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                      border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: theme === 'light' ? 'var(--text)' : '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button type="submit" style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  border: 'none',
                  borderRadius: '10px',
                  color: theme === 'light' ? '#fff' : '#0b1020',
                  padding: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.15s ease, opacity 0.15s ease'
                }}>
                  <i className="ri-send-plane-line"></i>
                  {lang === 'ru' ? 'Отправить отзыв' : lang === 'kz' ? 'Пікірді жіберу' : 'Submit Review'}
                </button>
              </form>
            </div>
          </section>
        </>
      )}

      {/* CALLBACK FORM */}
      {activePage !== 'admin' && (
      <section id="contact" className="callback" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <img src="./why_bg.png" alt="Smart Home Interior" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'blur(3px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'var(--callback-overlay)' }}></div>
        </div>
        <div className="callback-inner" style={{ position: 'relative', zIndex: 2, background: 'var(--callback-bg)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,242,199,0.2)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
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
                  <option value="aktobe">{t('city_aktobe')}</option>
                  <option value="taraz">{t('city_taraz')}</option>
                  <option value="pavlodar">{t('city_pavlodar')}</option>
                  <option value="oskemen">{t('city_oskemen')}</option>
                  <option value="semey">{t('city_semey')}</option>
                  <option value="atyrau">{t('city_atyrau')}</option>
                  <option value="aktau">{t('city_aktau')}</option>
                  <option value="kostanay">{t('city_kostanay')}</option>
                  <option value="kyzylorda">{t('city_kyzylorda')}</option>
                  <option value="oral">{t('city_oral')}</option>
                  <option value="petropavl">{t('city_petropavl')}</option>
                  <option value="taldykorgan">{t('city_taldykorgan')}</option>
                  <option value="kokshetau">{t('city_kokshetau')}</option>
                  <option value="turkistan">{t('city_turkistan')}</option>
                  <option value="zhezkazgan">{t('city_zhezkazgan')}</option>
                  <option value="konaev">{t('city_konaev')}</option>
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
      )}

      {/* FOOTER */}
      <footer>
        <div className="f-col">
          <div 
            className="brand" 
            style={{ marginBottom: '16px', cursor: 'pointer' }} 
            onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            title="На главную"
          >
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

      {/* CATEGORY ITEM MODAL - CYBERNETIC COCKPIT LAYOUT */}
      {selectedModalItem && (
        <div className="cyber-modal-overlay" onClick={() => setSelectedModalItem(null)}>
          <div className="cyber-modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Left Column: Tech Status Panel */}
            <div className="cyber-tech-panel">
              <div>
                <div className="cyber-panel-header">
                  <div className="cyber-status-pulse"></div>
                  <span>STATUS: ACTIVE</span>
                </div>
                
                <div className="cyber-metric-list">
                  <div className="cyber-metric-item">
                    <span className="cyber-metric-label">{lang === 'ru' ? 'Свободные мастера' : (lang === 'kz' ? 'Бос шеберлер' : 'Free Masters')}</span>
                    <span className="cyber-metric-value">
                      <i className="ri-team-line"></i>
                      {lang === 'ru' ? '3 мастера в сети' : (lang === 'kz' ? 'Желіде 3 шебер' : '3 masters online')}
                    </span>
                    <div className="cyber-progress-track">
                      <div className="cyber-progress-fill"></div>
                    </div>
                  </div>
                  
                  <div className="cyber-metric-item">
                    <span className="cyber-metric-label">{lang === 'ru' ? 'Комплектующие' : (lang === 'kz' ? 'Қосалқы бөлшектер' : 'Components')}</span>
                    <span className="cyber-metric-value">
                      <i className="ri-shield-check-line"></i>
                      {lang === 'ru' ? 'Оригинал 100%' : (lang === 'kz' ? 'Түпнұсқа 100%' : '100% Original')}
                    </span>
                  </div>

                  <div className="cyber-metric-item">
                    <span className="cyber-metric-label">{lang === 'ru' ? 'Диагностика' : (lang === 'kz' ? 'Диагностика' : 'Diagnostics')}</span>
                    <span className="cyber-metric-value" style={{ color: 'var(--accent)' }}>
                      <i className="ri-flashlight-line"></i>
                      {lang === 'ru' ? '0 ₸ Бесплатно' : (lang === 'kz' ? '0 ₸ Тегін' : '0 ₸ Free')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  System ID
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text)', opacity: 0.7, marginTop: '4px' }}>
                  MH-SERV-P2{selectedModalItem.parentTitle ? selectedModalItem.parentTitle.substring(0,2).toUpperCase() : 'XX'}
                </div>
              </div>
            </div>

            {/* Right Column: Console Details */}
            <div className="cyber-content-console">
              <button
                className="cyber-close-btn"
                onClick={() => setSelectedModalItem(null)}
                aria-label="Закрыть"
              >
                <i className="ri-close-line"></i>
              </button>
              
              <div className="cyber-tag">
                {selectedModalItem.type === 'brand' 
                  ? (lang === 'ru' ? 'Бренд / Производитель' : (lang === 'kz' ? 'Бренд / Өндіруші' : 'Brand / Manufacturer'))
                  : (lang === 'ru' ? 'Услуга / Ремонтная деталь' : (lang === 'kz' ? 'Қызмет / Жөндеу бөлшегі' : 'Service / Spare Part'))
                }
              </div>
              
              <h3 className="cyber-title">{selectedModalItem.title}</h3>
              
              <p className="cyber-desc">
                {lang === 'ru' ? (
                  `Вы выбрали «${selectedModalItem.title}» в категории «${selectedModalItem.parentTitle}». Мы обеспечиваем профессиональный ремонт, настройку и замену деталей с официальной письменной гарантией до 12 месяцев.`
                ) : (lang === 'kz' ? (
                  `Сіз «${selectedModalItem.parentTitle}» санатындағы «${selectedModalItem.title}» таңдадыңыз. Біз 12 айға дейінгі ресми жазбаша кепілдікпен кәсіби жөндеуді, баптауды және бөлшектерді ауыстыруды қамтамасыз етеміз.`
                ) : (
                  `You selected "${selectedModalItem.title}" under "${selectedModalItem.parentTitle}". We provide expert repair, tuning, and parts replacement with a formal written guarantee of up to 12 months.`
                ))}
              </p>

              {/* Unique Interactive Feature Checklist */}
              <div className="cyber-features-grid">
                <div className="cyber-feature-check">
                  <i className="ri-checkbox-circle-fill"></i>
                  <span>{lang === 'ru' ? 'Выезд опытного мастера' : (lang === 'kz' ? 'Тәжірибелі шебердің келуі' : 'Experienced master arrival')}</span>
                </div>
                <div className="cyber-feature-check">
                  <i className="ri-checkbox-circle-fill"></i>
                  <span>{lang === 'ru' ? 'Диагностика на спец. оборудовании' : (lang === 'kz' ? 'Арнайы жабдықта диагностикалау' : 'Diagnostics on specialized equipment')}</span>
                </div>
                <div className="cyber-feature-check">
                  <i className="ri-checkbox-circle-fill"></i>
                  <span>{lang === 'ru' ? 'Премиум комплектующие' : (lang === 'kz' ? 'Премиум қосалқы бөлшектер' : 'Premium spare parts')}</span>
                </div>
              </div>

              {/* Data Row Card */}
              <div className="cyber-data-card">
                <div className="cyber-data-col">
                  <span className="cyber-data-label">{lang === 'ru' ? 'Стоимость' : (lang === 'kz' ? 'Құны' : 'Cost')}</span>
                  <span className="cyber-data-value">{lang === 'ru' ? 'от 2 500 ₸' : (lang === 'kz' ? '2 500 ₸ бастап' : 'from 2,500 ₸')}</span>
                </div>
                <div className="cyber-data-col" style={{ borderLeft: '1px solid var(--line)', paddingLeft: '20px' }}>
                  <span className="cyber-data-label">{lang === 'ru' ? 'Быстрый выезд' : (lang === 'kz' ? 'Жылдам келу' : 'Quick Arrival')}</span>
                  <span className="cyber-data-sub">~ {lang === 'ru' ? '45 минут' : (lang === 'kz' ? '45 минут' : '45 minutes')}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary big"
                  style={{ flex: 2, minWidth: '200px' }}
                  onClick={() => {
                    setFormService(selectedModalItem.title);
                    setSelectedModalItem(null);
                    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {lang === 'ru' ? 'Оформить быструю заявку' : (lang === 'kz' ? 'Жылдам өтінім беру' : 'Submit Quick Request')}
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ flex: 1, minWidth: '100px' }}
                  onClick={() => setSelectedModalItem(null)}
                >
                  {lang === 'ru' ? 'Закрыть' : (lang === 'kz' ? 'Жабу' : 'Close')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING ASSISTANT BUTTON & POPUP */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {/* Assistant Popup Window */}
        {isAssistantOpen && (
          <div style={{ width: '360px', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', marginBottom: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.25s ease' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: '#0b1020', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '700' }}>
                  <i className="ri-robot-2-fill"></i>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Айя · Ассистент</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }}></span> Онлайн
                  </div>
                </div>
              </div>
              <button onClick={() => setIsAssistantOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ padding: '20px', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', background: 'var(--surface)' }}>
              {assistantMessages.map((m, idx) => (
                <div key={idx} style={{ alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end', background: m.sender === 'ai' ? 'var(--surface-2)' : 'var(--accent)', color: m.sender === 'ai' ? 'var(--text)' : '#0b1020', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: m.sender === 'ai' ? '4px' : '16px', borderTopRightRadius: m.sender === 'user' ? '4px' : '16px', maxWidth: '85%', lineHeight: '1.5', fontWeight: m.sender === 'user' ? '600' : '500' }}>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Quick Chips */}
            <div style={{ padding: '0 20px 12px 20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['⚡ Срочный выезд', '💰 Узнать цены', '📅 График работы', '🔧 Гарантия'].map((chip, cIdx) => (
                <button key={cIdx} onClick={() => handleAssistantSend(chip)} style={{ padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: '999px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                  {chip}
                </button>
              ))}
            </div>

            {/* CTA Button in Chat */}
            <div style={{ padding: '0 20px 16px 20px' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  setIsAssistantOpen(false);
                  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Оформить заявку <i className="ri-arrow-right-line"></i>
              </button>
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px', background: 'var(--surface-2)' }}>
              <input
                type="text"
                placeholder="Напишите вопрос..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()}
                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--text)', padding: '8px 14px', borderRadius: '999px', fontSize: '13px', outline: 'none' }}
              />
              <button
                onClick={() => handleAssistantSend()}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: '#0b1020', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <i className="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>
        )}

        {/* Floating Greeting Bubble */}
        {showAssistantTooltip && !isAssistantOpen && (
          <div
            className="assistant-tooltip"
            onClick={() => {
              setIsAssistantOpen(true);
              setShowAssistantTooltip(false);
            }}
          >
            <div className="assistant-tooltip-arrow"></div>
            <i className="ri-robot-line" style={{ color: 'var(--accent)', marginRight: '6px' }}></i>
            <span>Айя: Нужна помощь с выбором услуги? 🤖</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAssistantTooltip(false);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', marginLeft: '8px', cursor: 'pointer', fontSize: '14px' }}
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => {
            setIsAssistantOpen(prev => !prev);
            setShowAssistantTooltip(false);
          }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#0b1020',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            fontSize: '28px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(124,242,199,0.5)',
            transition: 'all 0.3s ease',
            transform: isAssistantOpen ? 'scale(0.9)' : 'scale(1)'
          }}
          aria-label="Ассистент по сайту"
          title="Ассистент по сайту"
        >
          <i className={isAssistantOpen ? "ri-close-line" : "ri-robot-2-line"}></i>
        </button>
      </div>

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="auth-modal" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setIsAuthModalOpen(false)} aria-label="Закрыть">
              <i className="ri-close-line"></i>
            </button>
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} 
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
              >
                {t('auth_title_login')}
              </button>
              <button 
                className={`auth-tab ${authTab === 'register' ? 'active' : ''}`} 
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
              >
                {t('auth_title_register')}
              </button>
            </div>
            
            {authError && <div className="auth-error">{authError}</div>}

            {authTab === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-form-group">
                  <label>{t('auth_email')}</label>
                  <input 
                    type="email" 
                    className="auth-input" 
                    required 
                    placeholder="email@example.com" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div className="auth-form-group">
                  <label>{t('auth_password')}</label>
                  <input 
                    type="password" 
                    className="auth-input" 
                    required 
                    placeholder="••••••••" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-submit-btn">
                  {t('auth_btn_login')}
                </button>
                <button 
                  type="button" 
                  className="auth-switch" 
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
                >
                  {t('auth_switch_to_register')}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-form-group">
                  <label>{t('auth_name')}</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    required 
                    placeholder="Алексей" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
                <div className="auth-form-group">
                  <label>{t('auth_email')}</label>
                  <input 
                    type="email" 
                    className="auth-input" 
                    required 
                    placeholder="email@example.com" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div className="auth-form-group">
                  <label>{t('auth_phone')}</label>
                  <input 
                    type="tel" 
                    className="auth-input" 
                    required 
                    placeholder="+7 (707) 123-45-67" 
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                  />
                </div>
                <div className="auth-form-group">
                  <label>{t('auth_city')}</label>
                  <select 
                    className="auth-select" 
                    value={authCity} 
                    onChange={(e) => setAuthCity(e.target.value)}
                  >
                    <option value="almaty">{t('city_almaty')}</option>
                    <option value="astana">{t('city_astana')}</option>
                    <option value="shymkent">{t('city_shymkent')}</option>
                    <option value="karaganda">{t('city_karaganda')}</option>
                    <option value="aktobe">{t('city_aktobe')}</option>
                    <option value="taraz">{t('city_taraz')}</option>
                    <option value="pavlodar">{t('city_pavlodar')}</option>
                    <option value="oskemen">{t('city_oskemen')}</option>
                    <option value="semey">{t('city_semey')}</option>
                    <option value="atyrau">{t('city_atyrau')}</option>
                    <option value="aktau">{t('city_aktau')}</option>
                    <option value="kostanay">{t('city_kostanay')}</option>
                    <option value="kyzylorda">{t('city_kyzylorda')}</option>
                    <option value="oral">{t('city_oral')}</option>
                    <option value="petropavl">{t('city_petropavl')}</option>
                    <option value="taldykorgan">{t('city_taldykorgan')}</option>
                    <option value="kokshetau">{t('city_kokshetau')}</option>
                    <option value="turkistan">{t('city_turkistan')}</option>
                    <option value="zhezkazgan">{t('city_zhezkazgan')}</option>
                    <option value="konaev">{t('city_konaev')}</option>
                  </select>
                </div>
                <div className="auth-form-group">
                  <label>{t('auth_password')}</label>
                  <input 
                    type="password" 
                    className="auth-input" 
                    required 
                    placeholder="••••••••" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-submit-btn">
                  {t('auth_btn_register')}
                </button>
                <button 
                  type="button" 
                  className="auth-switch" 
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                >
                  {t('auth_switch_to_login')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* USER CABINET */}
      {isCabinetOpen && user && (
        <div className="cabinet-modal" onClick={() => setIsCabinetOpen(false)}>
          <div className="cabinet-content" onClick={(e) => e.stopPropagation()}>
            <div className="cabinet-header">
              <div className="cabinet-user-info">
                <div className="cabinet-avatar">{user.name[0].toUpperCase()}</div>
                <div>
                  <div className="cabinet-name">{user.name}</div>
                  <div className="cabinet-meta">
                    {user.email}
                  </div>
                </div>
              </div>
              <button className="auth-modal-close" onClick={() => setIsCabinetOpen(false)} style={{ position: 'static' }} aria-label="Закрыть">
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            {/* CABINET NAVIGATION TABS */}
            <div className="cabinet-tabs">
              <button 
                className={`cabinet-tab-btn ${cabinetTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCabinetTab('dashboard')}
              >
                <i className="ri-dashboard-3-line"></i> Панель
              </button>
              <button 
                className={`cabinet-tab-btn ${cabinetTab === 'warranty' ? 'active' : ''}`}
                onClick={() => setCabinetTab('warranty')}
              >
                <i className="ri-shield-check-line"></i> {lang === 'ru' ? 'Гарантии' : lang === 'kz' ? 'Кепілдіктер' : 'Warranties'}
              </button>
              <button 
                className={`cabinet-tab-btn ${cabinetTab === 'profile' ? 'active' : ''}`}
                onClick={() => { setCabinetTab('profile'); setProfileSuccess(''); setProfileError(''); }}
              >
                <i className="ri-user-settings-line"></i> {t('cab_edit_profile')}
              </button>
              <button 
                className={`cabinet-tab-btn ${cabinetTab === 'support' ? 'active' : ''}`}
                onClick={() => setCabinetTab('support')}
              >
                <i className="ri-customer-service-2-line"></i> Поддержка
              </button>
              <button 
                className="cabinet-tab-btn logout-tab-btn"
                onClick={handleLogout}
              >
                <i className="ri-logout-box-r-line"></i> {t('auth_logout')}
              </button>
            </div>

            <div className="cabinet-body">
              {cabinetTab === 'dashboard' && (
                <div className="cabinet-tab-content">
                  {/* Bonus Balance Card */}
                  <div className="bonus-card">
                    <div className="bonus-card-glow"></div>
                    <div className="bonus-header">
                      <div>
                        <div className="bonus-title">{t('cab_bonus_balance')}</div>
                        <div className="bonus-amount">{user.bonuses || 0} ✨</div>
                      </div>
                      <div className="bonus-coin-icon">
                        <i className="ri-copper-coin-line"></i>
                      </div>
                    </div>
                    <div className="bonus-details">
                      <div className="bonus-desc">{t('cab_bonus_earn_desc')}</div>
                      <div className="bonus-qr-placeholder">
                        <i className="ri-qr-code-line"></i> {t('cab_bonus_qr_coming')}
                      </div>
                    </div>
                  </div>

                  {/* Active Request Tracker */}
                  {myCallbacks.length > 0 && myCallbacks[0].status !== 'completed' && (
                    <div className="request-tracker">
                      <h4 className="tracker-title">Отслеживание текущей заявки #{myCallbacks[0].id}</h4>
                      <div className="tracker-service-name">{myCallbacks[0].service}</div>
                      
                      <div className="tracker-steps">
                        <div className={`tracker-step ${myCallbacks[0].status === 'pending' || myCallbacks[0].status === 'in_progress' ? 'active' : ''}`}>
                          <div className="step-circle"><i className="ri-file-list-3-line"></i></div>
                          <div className="step-label">Заявка принята</div>
                        </div>
                        <div className={`tracker-line ${myCallbacks[0].status === 'in_progress' ? 'active' : ''}`}></div>
                        <div className={`tracker-step ${myCallbacks[0].status === 'in_progress' ? 'active' : ''}`}>
                          <div className="step-circle"><i className="ri-user-shared-line"></i></div>
                          <div className="step-label">Назначен мастер</div>
                        </div>
                        <div className="tracker-line"></div>
                        <div className="tracker-step">
                          <div className="step-circle"><i className="ri-checkbox-circle-line"></i></div>
                          <div className="step-label">Выполнено</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Requests History List */}
                  <div style={{ marginTop: '30px' }}>
                    <h3 className="cabinet-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '850', marginBottom: '16px' }}>
                      {t('cab_my_callbacks')}
                      {callbacksLoading && <i className="ri-loader-4-line ri-spin" style={{ color: 'var(--accent)' }}></i>}
                    </h3>

                    {myCallbacks.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: '12px', color: 'var(--muted)', fontSize: '14px' }}>
                        {t('cab_no_callbacks')}
                      </div>
                    ) : (
                      <div className="cabinet-table-wrapper">
                        <table className="cabinet-table">
                          <thead>
                            <tr>
                              <th>{t('cab_col_id')}</th>
                              <th>{t('cab_col_service')}</th>
                              <th>{t('cab_col_city')}</th>
                              <th>{t('cab_col_status')}</th>
                              <th>{t('cab_col_date')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myCallbacks.map((cb) => (
                              <tr key={cb.id}>
                                <td>#{cb.id}</td>
                                <td>{cb.service}</td>
                                <td>{getCityDisplay(cb.city)}</td>
                                <td>
                                  <span className={`status-pill status-${cb.status}`}>
                                    {t(`cab_status_${cb.status}`)}
                                  </span>
                                </td>
                                <td>
                                  {new Date(cb.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kz' ? 'kk-KZ' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cabinetTab === 'warranty' && (
                <div className="cabinet-tab-content">
                  <h3 className="cabinet-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '850', marginBottom: '20px' }}>
                    <i className="ri-shield-check-line" style={{ color: 'var(--accent)' }}></i>
                    {lang === 'ru' ? 'Гарантийные листы и Бонусы' : lang === 'kz' ? 'Кепілдік парақтары және Бонустар' : 'Warranty Certificates & Bonuses'}
                  </h3>

                  {myCallbacks.filter(cb => cb.status === 'completed').length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: '16px', color: 'var(--muted)', fontSize: '14px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                      <i className="ri-shield-flash-line" style={{ fontSize: '36px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '15px' }}></i>
                      {lang === 'ru' 
                        ? 'У вас пока нет выполненных заказов с активной гарантией.' 
                        : lang === 'kz' 
                        ? 'Сізде әлі белсенді кепілдігі бар орындалған тапсырыстар жоқ.' 
                        : 'You do not have any completed orders with active warranty yet.'}
                    </div>
                  ) : (
                    <div className="warranties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                      {myCallbacks.filter(cb => cb.status === 'completed').map(cb => {
                        const compDate = new Date(cb.created_at);
                        const expiryDate = new Date(compDate.getTime() + 90 * 24 * 60 * 60 * 1000);
                        const isExpired = new Date() > expiryDate;
                        
                        return (
                          <div key={cb.id} className="warranty-card" style={{
                            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.9) 0%, rgba(30, 30, 40, 0.9) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-20%',
                              right: '-20%',
                              width: '120px',
                              height: '120px',
                              background: isExpired ? 'radial-gradient(circle, rgba(100,100,100,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
                              pointerEvents: 'none'
                            }}></div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <span style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>
                                  MASTERHUB GUARANTEE
                                </span>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: isExpired ? 'rgba(255,255,255,0.05)' : 'rgba(0, 230, 115, 0.1)',
                                  color: isExpired ? '#aaa' : '#00e673',
                                  border: isExpired ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0, 230, 115, 0.2)'
                                }}>
                                  {isExpired 
                                    ? (lang === 'ru' ? 'ИСТЕКЛА' : lang === 'kz' ? 'МЕРЗІМІ БІТТІ' : 'EXPIRED') 
                                    : (lang === 'ru' ? 'АКТИВНА' : lang === 'kz' ? 'БЕЛСЕНДІ' : 'ACTIVE')}
                                </span>
                              </div>

                              <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: '0 0 5px 0' }}>
                                MH-G-{cb.id}
                              </h4>
                              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 15px 0' }}>
                                {cb.service}
                              </p>

                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                  <span style={{ color: 'var(--muted)' }}>
                                    {lang === 'ru' ? 'Дата оформления:' : lang === 'kz' ? 'Ресімделген күні:' : 'Issued Date:'}
                                  </span>
                                  <span style={{ color: '#fff', fontWeight: '600' }}>
                                    {compDate.toLocaleDateString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                  <span style={{ color: 'var(--muted)' }}>
                                    {lang === 'ru' ? 'Срок действия:' : lang === 'kz' ? 'Күшін жою күні:' : 'Expiry Date:'}
                                  </span>
                                  <span style={{ color: '#fff', fontWeight: '600' }}>
                                    {expiryDate.toLocaleDateString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                  <span style={{ color: 'var(--muted)' }}>
                                    {lang === 'ru' ? 'Начислено бонусов:' : lang === 'kz' ? 'Бонустар есептелді:' : 'Bonuses Credited:'}
                                  </span>
                                  <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                                    +1,000 ✨
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{
                              background: 'rgba(255,255,255,0.02)',
                              padding: '10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: 'var(--muted)',
                              lineHeight: '1.4',
                              border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                              <i className="ri-information-line" style={{ marginRight: '5px', color: 'var(--accent)' }}></i>
                              {lang === 'ru' 
                                ? 'Гарантия покрывает все выполненные работы. При возникновении гарантийного случая обратитесь в поддержку.' 
                                : lang === 'kz' 
                                ? 'Кепілдік барлық жұмыстарды қамтиды. Кепілдік жағдайы туындаса, қолдау қызметіне хабарласыңыз.' 
                                : 'The warranty covers all completed works. In case of a warranty event, contact support.'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {cabinetTab === 'profile' && (
                <div className="cabinet-tab-content">
                  <h3 className="cabinet-section-title" style={{ fontSize: '18px', fontWeight: '850', marginBottom: '20px' }}>
                    {t('cab_edit_profile')}
                  </h3>

                  {profileSuccess && <div className="profile-alert alert-success">{profileSuccess}</div>}
                  {profileError && <div className="profile-alert alert-danger">{profileError}</div>}

                  <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="profile-form-group">
                      <label>Имя</label>
                      <input 
                        type="text" 
                        className="profile-input" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="profile-form-group">
                      <label>Телефон</label>
                      <input 
                        type="tel" 
                        className="profile-input" 
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                    <div className="profile-form-group">
                      <label>Город</label>
                      <select 
                        className="profile-select" 
                        value={editCity} 
                        onChange={(e) => setEditCity(e.target.value)}
                      >
                        <option value="almaty">{t('city_almaty')}</option>
                        <option value="astana">{t('city_astana')}</option>
                        <option value="shymkent">{t('city_shymkent')}</option>
                        <option value="karaganda">{t('city_karaganda')}</option>
                        <option value="aktobe">{t('city_aktobe')}</option>
                        <option value="taraz">{t('city_taraz')}</option>
                        <option value="pavlodar">{t('city_pavlodar')}</option>
                        <option value="oskemen">{t('city_oskemen')}</option>
                        <option value="semey">{t('city_semey')}</option>
                        <option value="atyrau">{t('city_atyrau')}</option>
                        <option value="aktau">{t('city_aktau')}</option>
                        <option value="kostanay">{t('city_kostanay')}</option>
                        <option value="kyzylorda">{t('city_kyzylorda')}</option>
                        <option value="oral">{t('city_oral')}</option>
                        <option value="petropavl">{t('city_petropavl')}</option>
                        <option value="taldykorgan">{t('city_taldykorgan')}</option>
                        <option value="kokshetau">{t('city_kokshetau')}</option>
                        <option value="turkistan">{t('city_turkistan')}</option>
                        <option value="zhezkazgan">{t('city_zhezkazgan')}</option>
                        <option value="konaev">{t('city_konaev')}</option>
                      </select>
                    </div>
                    <div className="profile-form-group">
                      <label>{t('cab_new_password')}</label>
                      <input 
                        type="password" 
                        className="profile-input" 
                        placeholder="••••••••" 
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="profile-save-btn">
                      {t('cab_save_changes')}
                    </button>
                  </form>
                </div>
              )}

              {cabinetTab === 'support' && (
                <div className="cabinet-tab-content">
                  <h3 className="cabinet-section-title" style={{ fontSize: '18px', fontWeight: '850', marginBottom: '20px' }}>
                    Служба поддержки
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                    Есть вопросы по качеству услуг, стоимости или ходу выполнения работы? Свяжитесь с нами удобным способом:
                  </p>

                  <div className="support-actions">
                    <a href="https://wa.me/77780211316" target="_blank" rel="noopener noreferrer" className="support-btn whatsapp-btn">
                      <i className="ri-whatsapp-line"></i> Написать в WhatsApp
                    </a>
                    <a href="tel:+77780211316" className="support-btn phone-btn">
                      <i className="ri-phone-line"></i> Позвонить оператору
                    </a>
                  </div>

                  <div className="faq-section" style={{ marginTop: '30px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '750', marginBottom: '12px' }}>Часто задаваемые вопросы:</h4>
                    <div className="faq-item" style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Как быстро приедет мастер?</strong>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Среднее время выезда — 45 минут, в зависимости от дорожной ситуации и вашего района.</span>
                    </div>
                    <div className="faq-item" style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Какая гарантия на работу?</strong>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Мы предоставляем официальную письменную гарантию до 12 месяцев на все услуги.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* COLOR SCHEME CUSTOMIZER WIDGET */}
      <div className="color-customizer" style={{
        position: 'fixed',
        right: isColorPanelOpen ? '20px' : '-320px',
        top: '25%',
        width: '300px',
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 21, 43, 0.88)',
        backdropFilter: 'blur(20px)',
        border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: theme === 'light' ? '0 20px 50px rgba(0,0,0,0.15)' : '0 20px 50px rgba(0,0,0,0.5)',
        zIndex: 10000,
        transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        color: theme === 'light' ? '#0f172a' : '#fff'
      }}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsColorPanelOpen(!isColorPanelOpen)}
          style={{
            position: 'absolute',
            left: '-50px',
            top: '20px',
            width: '50px',
            height: '50px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px 0 0 12px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '-4px 4px 15px rgba(0,0,0,0.15)',
            outline: 'none'
          }}
          aria-label="Настройка цвета"
        >
          <i className={`ri-palette-line ${isColorPanelOpen ? '' : 'ri-spin'}`}></i>
        </button>

        <h4 style={{ fontSize: '15px', fontWeight: '850', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ri-settings-4-line"></i>
          {lang === 'ru' ? 'Цветовая палитра' : lang === 'kz' ? 'Түс палитрасы' : 'Color Customizer'}
        </h4>

        {/* Preset Palettes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
            {lang === 'ru' ? 'Предустановки:' : lang === 'kz' ? 'Дайын жинақтар:' : 'Presets:'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {(theme === 'light' ? [
              { name: lang === 'ru' ? 'Оранжевый (ум)' : 'Orange (Def)', colors: ['#f97316', '#ea580c', '#10b981'] },
              { name: lang === 'ru' ? 'Синий Премиум' : 'Royal Blue', colors: ['#2563eb', '#1d4ed8', '#f59e0b'] },
              { name: lang === 'ru' ? 'Тиффани' : 'Teal Emerald', colors: ['#0d9488', '#0f766e', '#84cc16'] },
              { name: lang === 'ru' ? 'Коралл' : 'Soft Coral', colors: ['#f43f5e', '#e11d48', '#10b981'] },
              { name: lang === 'ru' ? 'Фиолетовый' : 'Vivid Violet', colors: ['#8b5cf6', '#7c3aed', '#f43f5e'] },
              { name: lang === 'ru' ? 'Роза' : 'Gold Rose', colors: ['#db2777', '#be185d', '#eab308'] }
            ] : [
              { name: lang === 'ru' ? 'Мята (ум)' : 'Mint (Def)', colors: ['#7cf2c7', '#5b8cff', '#ff7a59'] },
              { name: lang === 'ru' ? 'Оранжевый' : 'Orange Glow', colors: ['#ff7a59', '#ffcc00', '#ff3300'] },
              { name: lang === 'ru' ? 'Киберпанк' : 'Cyberpunk', colors: ['#ff007f', '#9900ff', '#00f2fe'] },
              { name: lang === 'ru' ? 'Океан' : 'Ocean Blue', colors: ['#00e6ff', '#0072ff', '#00f2fe'] },
              { name: lang === 'ru' ? 'Изумруд' : 'Emerald', colors: ['#00ff87', '#60efff', '#00a86b'] },
              { name: lang === 'ru' ? 'Рубин' : 'Ruby Red', colors: ['#ff0055', '#ff5500', '#7a001e'] }
            ]).map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAccentColor(p.colors[0]);
                  setAccent2Color(p.colors[1]);
                  setAccent3Color(p.colors[2]);
                }}
                style={{
                  background: theme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                  border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: theme === 'light' ? '#0f172a' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
              >
                <span>{p.name}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {p.colors.map((c, i) => (
                    <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }}></div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Pickers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: theme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {lang === 'ru' ? 'Свой выбор:' : lang === 'kz' ? 'Өз түсіңіз:' : 'Custom Choice:'}
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {lang === 'ru' ? 'Основной цвет:' : 'Primary Accent:'}
            </span>
            <input 
              type="color" 
              value={accentColor} 
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ width: '40px', height: '24px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {lang === 'ru' ? 'Вторичный цвет:' : 'Secondary Accent:'}
            </span>
            <input 
              type="color" 
              value={accent2Color} 
              onChange={(e) => setAccent2Color(e.target.value)}
              style={{ width: '40px', height: '24px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {lang === 'ru' ? 'Третичный цвет:' : 'Tertiary Accent:'}
            </span>
            <input 
              type="color" 
              value={accent3Color} 
              onChange={(e) => setAccent3Color(e.target.value)}
              style={{ width: '40px', height: '24px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (theme === 'light') {
              setAccentColor('#f97316');
              setAccent2Color('#ea580c');
              setAccent3Color('#10b981');
            } else {
              setAccentColor('#7cf2c7');
              setAccent2Color('#5b8cff');
              setAccent3Color('#ff7a59');
            }
          }}
          style={{
            marginTop: '15px',
            width: '100%',
            background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: theme === 'light' ? '#0f172a' : '#fff',
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {lang === 'ru' ? 'Сбросить цвета' : 'Reset Colors'}
        </button>
      </div>
    </>
  );
}
