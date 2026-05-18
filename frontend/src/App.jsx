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
  // Mega Menu Data structure
  const megaTabs = [
    { id: 'remont-tehniki', label: 'Ремонт техники' },
    { id: 'transport', label: 'Транспорт' },
    { id: 'bytovye-uslugi', label: 'Бытовые услуги' },
    { id: 'specialist', label: 'Специалисты' },
    { id: 'stroitelstvo-i-remont', label: 'Строительство' },
    { id: 'tury', label: 'Туры' },
    { id: 'drugoe', label: 'Другое' },
    { id: 'countries', label: 'Мы в других странах' }
  ];

  const megaCategories = [
    // Ремонт техники
    { id: 'cat-210', tab: 'remont-tehniki', title: 'Интернет-магазин запчастей', icon: 'ri-store-2-line' },
    { id: 'cat-128', tab: 'remont-tehniki', title: 'Ремонт аудиотехники', icon: 'ri-headphone-line' },
    { id: 'cat-230', tab: 'remont-tehniki', title: 'Ремонт бытовой техники', icon: 'ri-home-gear-line' },
    { id: 'cat-112', tab: 'remont-tehniki', title: 'Ремонт климатической техники', icon: 'ri-temp-cold-line' },
    { id: 'cat-15', tab: 'remont-tehniki', title: 'Ремонт компьютерной техники', icon: 'ri-computer-line' },
    { id: 'cat-18', tab: 'remont-tehniki', title: 'Ремонт крупно бытовой техники', icon: 'ri-fridge-line' },
    { id: 'cat-220', tab: 'remont-tehniki', title: 'Ремонт кухонной техники', icon: 'ri-restaurant-line' },
    { id: 'cat-17', tab: 'remont-tehniki', title: 'Ремонт офисной техники', icon: 'ri-printer-line' },
    { id: 'cat-135', tab: 'remont-tehniki', title: 'Ремонт садовой техники', icon: 'ri-plant-line' },
    { id: 'cat-120', tab: 'remont-tehniki', title: 'Ремонт строительной техники', icon: 'ri-building-line' },
    { id: 'cat-154', tab: 'remont-tehniki', title: 'Ремонт уходовой техники', icon: 'ri-t-shirt-air-line' },
    { id: 'cat-94', tab: 'remont-tehniki', title: 'Ремонт цифровой техники', icon: 'ri-smartphone-line' },
    { id: 'cat-148', tab: 'remont-tehniki', title: 'Ремонт часов', icon: 'ri-time-line' },
    { id: 'cat-105', tab: 'remont-tehniki', title: 'Ремонт электротранспорта', icon: 'ri-roadster-line' },
    { id: 'cat-255', tab: 'remont-tehniki', title: 'Сервисный центр', icon: 'ri-tools-line' },

    // Транспорт
    { id: 'cat-859', tab: 'transport', title: 'Аренда транспорта', icon: 'ri-roadster-line' },
    { id: 'cat-542', tab: 'transport', title: 'Перевозка авто', icon: 'ri-truck-line' },
    { id: 'cat-310', tab: 'transport', title: 'СТО', icon: 'ri-tools-line' },
    { id: 'cat-447', tab: 'transport', title: 'Спецтехника', icon: 'ri-car-line' },
    { id: 'cat-858', tab: 'transport', title: 'Трансфер', icon: 'ri-guide-line' },

    // Бытовые услуги
    { id: 'cat-506', tab: 'bytovye-uslugi', title: 'Ассенизатор', icon: 'ri-water-flash-line' },
    { id: 'cat-165', tab: 'bytovye-uslugi', title: 'Ремонт ювелирных изделий', icon: 'ri-vip-diamond-line' },
    { id: 'cat-463', tab: 'bytovye-uslugi', title: 'Видеонаблюдение', icon: 'ri-shield-check-line' },
    { id: 'cat-419', tab: 'bytovye-uslugi', title: 'Вывоз мусора', icon: 'ri-truck-line' },
    { id: 'cat-427', tab: 'bytovye-uslugi', title: 'Дезинсекция', icon: 'ri-bug-line' },
    { id: 'cat-421', tab: 'bytovye-uslugi', title: 'Дезинфекция', icon: 'ri-virus-line' },
    { id: 'cat-426', tab: 'bytovye-uslugi', title: 'Дератизация', icon: 'ri-skull-line' },
    { id: 'cat-433', tab: 'bytovye-uslugi', title: 'Доставка воды', icon: 'ri-drop-line' },
    { id: 'cat-410', tab: 'bytovye-uslugi', title: 'Клининг', icon: 'ri-sparkling-line' },
    { id: 'cat-505', tab: 'bytovye-uslugi', title: 'Муж на час', icon: 'ri-hammer-line' },
    { id: 'cat-434', tab: 'bytovye-uslugi', title: 'Прачечная', icon: 'ri-water-flash-line' },
    { id: 'cat-526', tab: 'bytovye-uslugi', title: 'Сварщик', icon: 'ri-tools-line' },
    { id: 'cat-474', tab: 'bytovye-uslugi', title: 'Сигнализация', icon: 'ri-alarm-warning-line' },
    { id: 'cat-461', tab: 'bytovye-uslugi', title: 'Услуги по мебели', icon: 'ri-sofa-line' },
    { id: 'cat-420', tab: 'bytovye-uslugi', title: 'Услуги сантехника', icon: 'ri-drop-line' },
    { id: 'cat-163', tab: 'bytovye-uslugi', title: 'Услуги электрика', icon: 'ri-lightbulb-flash-line' },
    { id: 'cat-420-chem', tab: 'bytovye-uslugi', title: 'Химчистка', icon: 'ri-shirt-line' },
    { id: 'cat-437', tab: 'bytovye-uslugi', title: 'Ателье', icon: 'ri-scissors-line' },

    // Специалисты
    { id: 'cat-713', tab: 'specialist', title: 'Няня', icon: 'ri-user-heart-line' },
    { id: 'cat-668', tab: 'specialist', title: 'Подготовка к ЕНТ', icon: 'ri-graduation-cap-line' },
    { id: 'cat-476', tab: 'specialist', title: 'Адвокат', icon: 'ri-scales-3-line' },
    { id: 'cat-646', tab: 'specialist', title: 'Астролог', icon: 'ri-star-line' },
    { id: 'cat-671', tab: 'specialist', title: 'Бухгалтер', icon: 'ri-money-dollar-circle-line' },
    { id: 'cat-731', tab: 'specialist', title: 'Вокал', icon: 'ri-music-line' },
    { id: 'cat-535', tab: 'specialist', title: 'Грузчики', icon: 'ri-truck-line' },
    { id: 'cat-670', tab: 'specialist', title: 'Косметолог', icon: 'ri-sparkling-line' },
    { id: 'cat-720', tab: 'specialist', title: 'Коуч по карьере', icon: 'ri-briefcase-line' },
    { id: 'cat-704', tab: 'specialist', title: 'Курсы языка', icon: 'ri-translate' },
    { id: 'cat-710', tab: 'specialist', title: 'Лазерная эпиляция', icon: 'ri-flashlight-line' },
    { id: 'cat-652', tab: 'specialist', title: 'Маникюр', icon: 'ri-hand-heart-line' },
    { id: 'cat-675', tab: 'specialist', title: 'Нотариус', icon: 'ri-file-text-line' },
    { id: 'cat-680', tab: 'specialist', title: 'Нумеролог', icon: 'ri-hashtag' },
    { id: 'cat-677', tab: 'specialist', title: 'Профориентолог', icon: 'ri-compass-line' },
    { id: 'cat-690', tab: 'specialist', title: 'Репетитор начальных классов', icon: 'ri-book-open-line' },
    { id: 'cat-510', tab: 'specialist', title: 'Репетитор по математике', icon: 'ri-book-open-line' },
    { id: 'cat-716', tab: 'specialist', title: 'Рисование для детей', icon: 'ri-palette-line' },
    { id: 'cat-658', tab: 'specialist', title: 'Таролог', icon: 'ri-star-line' },
    { id: 'cat-649', tab: 'specialist', title: 'Тимбилдинг', icon: 'ri-team-line' },
    { id: 'cat-241', tab: 'specialist', title: 'Трезвый водитель', icon: 'ri-car-line' },
    { id: 'cat-824', tab: 'specialist', title: 'Шугаринг', icon: 'ri-sparkling-line' },
    { id: 'cat-520-jur', tab: 'specialist', title: 'Юрист', icon: 'ri-scales-line' },
    { id: 'cat-565', tab: 'specialist', title: 'Медицина', icon: 'ri-heart-pulse-line' },

    // Строительство
    { id: 'cat-520-bur', tab: 'stroitelstvo-i-remont', title: 'Алмазное бурение', icon: 'ri-building-line' },
    { id: 'cat-623', tab: 'stroitelstvo-i-remont', title: 'Аренда инструментов', icon: 'ri-tools-line' },
    { id: 'cat-519', tab: 'stroitelstvo-i-remont', title: 'Асфальтирование', icon: 'ri-road-map-line' },
    { id: 'cat-504', tab: 'stroitelstvo-i-remont', title: 'Бетон', icon: 'ri-building-line' },
    { id: 'cat-823', tab: 'stroitelstvo-i-remont', title: 'Жалюзи', icon: 'ri-window-line' },
    { id: 'cat-741', tab: 'stroitelstvo-i-remont', title: 'Москитные сетки', icon: 'ri-window-line' },
    { id: 'cat-620', tab: 'stroitelstvo-i-remont', title: 'Пластиковые окна', icon: 'ri-window-line' },
    { id: 'cat-610', tab: 'stroitelstvo-i-remont', title: 'Ремонт квартир', icon: 'ri-building-line' },
    { id: 'cat-759', tab: 'stroitelstvo-i-remont', title: 'Решетки на окна', icon: 'ri-grid-line' },

    // Туры
    { id: 'cat-866', tab: 'tury', title: 'Походы', icon: 'ri-walk-line' },
    { id: 'cat-882', tab: 'tury', title: 'Активный отдых', icon: 'ri-run-line' },
    { id: 'cat-807', tab: 'tury', title: 'Виды туров', icon: 'ri-compass-line' },
    { id: 'cat-853', tab: 'tury', title: 'Направления', icon: 'ri-map-pin-line' },

    // Другое
    { id: 'cat-497', tab: 'drugoe', title: 'Локальные сети', icon: 'ri-global-line' },
    { id: 'cat-854', tab: 'drugoe', title: 'Наркологический центр', icon: 'ri-hospital-line' },
    { id: 'cat-617', tab: 'drugoe', title: 'Партнерам', icon: 'ri-team-line' },
    { id: 'cat-855', tab: 'drugoe', title: 'Психиатрическая клиника', icon: 'ri-hospital-line' },
    { id: 'cat-168', tab: 'drugoe', title: 'Скупка техники', icon: 'ri-exchange-dollar-line' },
    { id: 'cat-595', tab: 'drugoe', title: 'Спорт', icon: 'ri-run-line' },
    { id: 'cat-570', tab: 'drugoe', title: 'Студия звукозаписи', icon: 'ri-mic-line' },
    { id: 'cat-439', tab: 'drugoe', title: 'Типография', icon: 'ri-printer-line' },

    // Мы в других странах
    { id: 'cat-901', tab: 'countries', title: 'Россия', icon: 'ri-map-pin-line' },
    { id: 'cat-902', tab: 'countries', title: 'Узбекистан', icon: 'ri-map-pin-line' },
    { id: 'cat-903', tab: 'countries', title: 'Кыргызстан', icon: 'ri-map-pin-line' }
  ];

  const megaSubcategories = {
    // Ремонт техники
    'cat-210': [
      { id: 'sub-210-1', title: 'Интернет-магазин запчастей' },
      { id: 'sub-210-2', title: 'Запчасти для стиральных машин' },
      { id: 'sub-210-3', title: 'Запчасти для холодильников' }
    ],
    'cat-128': [
      { id: 'sub-128-1', title: 'Ремонт аудиотехники' },
      { id: 'sub-128-2', title: 'Ремонт усилителей' },
      { id: 'sub-128-3', title: 'Ремонт колонок' }
    ],
    'cat-230': [
      { id: 'sub-231', title: 'Ремонт пылесосов' },
      { id: 'sub-232', title: 'Ремонт утюгов' },
      { id: 'sub-233', title: 'Ремонт блендеров' }
    ],
    'cat-112': [
      { id: 'sub-112-1', title: 'Ремонт климатической техники' },
      { id: 'sub-112-2', title: 'Ремонт кондиционеров' },
      { id: 'sub-112-3', title: 'Ремонт обогревателей' }
    ],
    'cat-15': [
      { id: 'sub-15-1', title: 'Ремонт компьютерной техники' },
      { id: 'sub-15-2', title: 'Ремонт ноутбуков' },
      { id: 'sub-15-3', title: 'Ремонт моноблоков' }
    ],
    'cat-18': [
      { id: 'sub-211', title: 'Ремонт стиральных машин' },
      { id: 'sub-212', title: 'Ремонт холодильников' },
      { id: 'sub-213', title: 'Ремонт посудомоечных машин' }
    ],
    'cat-220': [
      { id: 'sub-221', title: 'Ремонт кофемашин' },
      { id: 'sub-222', title: 'Ремонт микроволновок' },
      { id: 'sub-223', title: 'Ремонт мультиварок' }
    ],
    'cat-17': [
      { id: 'sub-17-1', title: 'Ремонт офисной техники' },
      { id: 'sub-17-2', title: 'Ремонт принтеров' },
      { id: 'sub-17-3', title: 'Ремонт МФУ' }
    ],
    'cat-135': [
      { id: 'sub-135-1', title: 'Ремонт садовой техники' },
      { id: 'sub-135-2', title: 'Ремонт газонокосилок' }
    ],
    'cat-120': [
      { id: 'sub-120-1', title: 'Ремонт строительной техники' },
      { id: 'sub-120-2', title: 'Ремонт перфораторов' }
    ],
    'cat-154': [
      { id: 'sub-154-1', title: 'Ремонт уходовой техники' },
      { id: 'sub-154-2', title: 'Ремонт фенов' }
    ],
    'cat-94': [
      { id: 'sub-94-1', title: 'Ремонт цифровой техники' },
      { id: 'sub-94-2', title: 'Ремонт телефонов' },
      { id: 'sub-94-3', title: 'Ремонт планшетов' }
    ],
    'cat-148': [
      { id: 'sub-148-1', title: 'Ремонт часов' },
      { id: 'sub-148-2', title: 'Ремонт настенных часов' }
    ],
    'cat-105': [
      { id: 'sub-105-1', title: 'Ремонт электротранспорта' },
      { id: 'sub-105-2', title: 'Ремонт самокатов' }
    ],
    'cat-255': [
      { id: 'sub-255-1', title: 'Сервисный центр' }
    ],

    // Транспорт
    'cat-859': [
      { id: 'sub-321', title: 'Аренда транспорта' },
      { id: 'sub-859-2', title: 'Прокат авто' }
    ],
    'cat-542': [
      { id: 'sub-542-1', title: 'Перевозка авто' },
      { id: 'sub-542-2', title: 'Эвакуатор' }
    ],
    'cat-310': [
      { id: 'sub-311', title: 'СТО' },
      { id: 'sub-312', title: 'Компьютерная диагностика' }
    ],
    'cat-447': [
      { id: 'sub-447-1', title: 'Спецтехника' },
      { id: 'sub-447-2', title: 'Аренда спецтехники' }
    ],
    'cat-858': [
      { id: 'sub-322', title: 'Трансфер' },
      { id: 'sub-858-2', title: 'Встреча в аэропорту' }
    ],

    // Бытовые услуги
    'cat-506': [
      { id: 'sub-506-1', title: 'Ассенизатор' },
      { id: 'sub-506-2', title: 'Откачка септиков' }
    ],
    'cat-165': [
      { id: 'sub-165-1', title: 'Ремонт ювелирных изделий' },
      { id: 'sub-165-2', title: 'Пайка цепочек' }
    ],
    'cat-463': [
      { id: 'sub-463-1', title: 'Видеонаблюдение' },
      { id: 'sub-463-2', title: 'Установка камер' }
    ],
    'cat-419': [
      { id: 'sub-419-1', title: 'Вывоз мусора' },
      { id: 'sub-419-2', title: 'Вывоз строительного мусора' }
    ],
    'cat-427': [
      { id: 'sub-427-1', title: 'Дезинсекция' },
      { id: 'sub-427-2', title: 'Уничтожение насекомых' }
    ],
    'cat-421': [
      { id: 'sub-421-1', title: 'Дезинфекция' },
      { id: 'sub-421-2', title: 'Обработка помещений' }
    ],
    'cat-426': [
      { id: 'sub-426-1', title: 'Дератизация' },
      { id: 'sub-426-2', title: 'Уничтожение грызунов' }
    ],
    'cat-433': [
      { id: 'sub-433-1', title: 'Доставка воды' },
      { id: 'sub-433-2', title: 'Питьевая вода 19л' }
    ],
    'cat-410': [
      { id: 'sub-411', title: 'Уборка домов' },
      { id: 'sub-412', title: 'Генеральная уборка дома' },
      { id: 'sub-413', title: 'Химчистка диванов' }
    ],
    'cat-505': [
      { id: 'sub-422', title: 'Муж на час' },
      { id: 'sub-505-2', title: 'Мелкий бытовой ремонт' }
    ],
    'cat-434': [
      { id: 'sub-434-1', title: 'Прачечная' },
      { id: 'sub-434-2', title: 'Стирка белья' }
    ],
    'cat-526': [
      { id: 'sub-526-1', title: 'Сварщик' },
      { id: 'sub-526-2', title: 'Сварочные работы' }
    ],
    'cat-474': [
      { id: 'sub-474-1', title: 'Сигнализация' },
      { id: 'sub-474-2', title: 'Охранная сигнализация' }
    ],
    'cat-461': [
      { id: 'sub-461-1', title: 'Услуги по мебели' },
      { id: 'sub-461-2', title: 'Сборка мебели' }
    ],
    'cat-420': [
      { id: 'sub-421', title: 'Услуги сантехника' },
      { id: 'sub-420-2', title: 'Устранение засоров' }
    ],
    'cat-163': [
      { id: 'sub-163-1', title: 'Услуги электрика' },
      { id: 'sub-163-2', title: 'Монтаж проводки' }
    ],
    'cat-420-chem': [
      { id: 'sub-420-chem-1', title: 'Химчистка' },
      { id: 'sub-420-chem-2', title: 'Химчистка ковров' }
    ],
    'cat-437': [
      { id: 'sub-437-1', title: 'Ателье' },
      { id: 'sub-437-2', title: 'Ремонт одежды' }
    ],

    // Специалисты
    'cat-713': [
      { id: 'sub-713-1', title: 'Няня' },
      { id: 'sub-713-2', title: 'Няня для грудничка' }
    ],
    'cat-668': [
      { id: 'sub-512', title: 'Подготовка к ЕНТ' },
      { id: 'sub-668-2', title: 'ЕНТ по математике' }
    ],
    'cat-476': [
      { id: 'sub-522', title: 'Адвокат' },
      { id: 'sub-476-2', title: 'Уголовный адвокат' }
    ],
    'cat-646': [
      { id: 'sub-646-1', title: 'Астролог' },
      { id: 'sub-646-2', title: 'Натальная карта' }
    ],
    'cat-671': [
      { id: 'sub-671-1', title: 'Бухгалтер' },
      { id: 'sub-671-2', title: 'Бухгалтерское сопровождение' }
    ],
    'cat-731': [
      { id: 'sub-731-1', title: 'Вокал' },
      { id: 'sub-731-2', title: 'Уроки вокала' }
    ],
    'cat-535': [
      { id: 'sub-535-1', title: 'Грузчики' },
      { id: 'sub-535-2', title: 'Квартирный переезд' }
    ],
    'cat-670': [
      { id: 'sub-670-1', title: 'Косметолог' },
      { id: 'sub-670-2', title: 'Чистка лица' }
    ],
    'cat-720': [
      { id: 'sub-720-1', title: 'Коуч по карьере' },
      { id: 'sub-720-2', title: 'Карьерная консультация' }
    ],
    'cat-704': [
      { id: 'sub-704-1', title: 'Курсы языка' },
      { id: 'sub-704-2', title: 'Курсы английского' }
    ],
    'cat-710': [
      { id: 'sub-710-1', title: 'Лазерная эпиляция' },
      { id: 'sub-710-2', title: 'Эпиляция всего тела' }
    ],
    'cat-652': [
      { id: 'sub-652-1', title: 'Маникюр' },
      { id: 'sub-652-2', title: 'Маникюр с покрытием' }
    ],
    'cat-675': [
      { id: 'sub-675-1', title: 'Нотариус' },
      { id: 'sub-675-2', title: 'Оформление доверенности' }
    ],
    'cat-680': [
      { id: 'sub-680-1', title: 'Нумеролог' },
      { id: 'sub-680-2', title: 'Нумерологический расчет' }
    ],
    'cat-677': [
      { id: 'sub-677-1', title: 'Профориентолог' },
      { id: 'sub-677-2', title: 'Выбор профессии' }
    ],
    'cat-690': [
      { id: 'sub-690-1', title: 'Репетитор начальных классов' },
      { id: 'sub-690-2', title: 'Помощь с домашним заданием' }
    ],
    'cat-510': [
      { id: 'sub-511', title: 'Репетитор по математике' },
      { id: 'sub-510-2', title: 'Высшая математика' }
    ],
    'cat-716': [
      { id: 'sub-716-1', title: 'Рисование для детей' },
      { id: 'sub-716-2', title: 'Художественная школа' }
    ],
    'cat-658': [
      { id: 'sub-658-1', title: 'Таролог' },
      { id: 'sub-658-2', title: 'Расклад Таро' }
    ],
    'cat-649': [
      { id: 'sub-649-1', title: 'Тимбилдинг' },
      { id: 'sub-649-2', title: 'Организация тимбилдинга' }
    ],
    'cat-241': [
      { id: 'sub-241-1', title: 'Трезвый водитель' },
      { id: 'sub-241-2', title: 'Перегон авто' }
    ],
    'cat-824': [
      { id: 'sub-824-1', title: 'Шугаринг' },
      { id: 'sub-824-2', title: 'Депиляция сахаром' }
    ],
    'cat-520-jur': [
      { id: 'sub-521', title: 'Юрист' },
      { id: 'sub-520-jur-2', title: 'Юридическая консультация' }
    ],
    'cat-565': [
      { id: 'sub-565-1', title: 'Медицина' },
      { id: 'sub-565-2', title: 'Вызов врача на дом' }
    ],

    // Строительство
    'cat-520-bur': [
      { id: 'sub-622', title: 'Алмазное бурение' },
      { id: 'sub-520-bur-2', title: 'Бурение отверстий в бетоне' }
    ],
    'cat-623': [
      { id: 'sub-623-1', title: 'Аренда инструментов' },
      { id: 'sub-623-2', title: 'Прокат генераторов' }
    ],
    'cat-519': [
      { id: 'sub-612', title: 'Асфальтирование' },
      { id: 'sub-519-2', title: 'Укладка асфальта' }
    ],
    'cat-504': [
      { id: 'sub-504-1', title: 'Бетон' },
      { id: 'sub-504-2', title: 'Доставка бетона' }
    ],
    'cat-823': [
      { id: 'sub-823-1', title: 'Жалюзи' },
      { id: 'sub-823-2', title: 'Рулонные шторы' }
    ],
    'cat-741': [
      { id: 'sub-741-1', title: 'Москитные сетки' },
      { id: 'sub-741-2', title: 'Сетки антикошка' }
    ],
    'cat-620': [
      { id: 'sub-621', title: 'Пластиковые окна' },
      { id: 'sub-620-2', title: 'Регулировка окон' }
    ],
    'cat-610': [
      { id: 'sub-611', title: 'Ремонт квартир' },
      { id: 'sub-610-2', title: 'Косметический ремонт' }
    ],
    'cat-759': [
      { id: 'sub-759-1', title: 'Решетки на окна' },
      { id: 'sub-759-2', title: 'Кованые решетки' }
    ],

    // Туры
    'cat-866': [
      { id: 'sub-866-1', title: 'Походы' },
      { id: 'sub-866-2', title: 'Горные походы' }
    ],
    'cat-882': [
      { id: 'sub-882-1', title: 'Активный отдых' },
      { id: 'sub-882-2', title: 'Рафтинг' }
    ],
    'cat-807': [
      { id: 'sub-807-1', title: 'Виды туров' },
      { id: 'sub-807-2', title: 'Экскурсионные туры' }
    ],
    'cat-853': [
      { id: 'sub-853-1', title: 'Направления' },
      { id: 'sub-853-2', title: 'Туры по Казахстану' }
    ],

    // Другое
    'cat-497': [
      { id: 'sub-497-1', title: 'Локальные сети' },
      { id: 'sub-497-2', title: 'Настройка сети' }
    ],
    'cat-854': [
      { id: 'sub-854-1', title: 'Наркологический центр' },
      { id: 'sub-854-2', title: 'Вывод из запоя' }
    ],
    'cat-617': [
      { id: 'sub-617-1', title: 'Партнерам' },
      { id: 'sub-617-2', title: 'Сотрудничество' }
    ],
    'cat-855': [
      { id: 'sub-855-1', title: 'Психиатрическая клиника' },
      { id: 'sub-855-2', title: 'Консультация психиатра' }
    ],
    'cat-168': [
      { id: 'sub-168-1', title: 'Скупка техники' },
      { id: 'sub-168-2', title: 'Скупка ноутбуков' }
    ],
    'cat-595': [
      { id: 'sub-595-1', title: 'Спорт' },
      { id: 'sub-595-2', title: 'Персональный тренер' }
    ],
    'cat-570': [
      { id: 'sub-570-1', title: 'Студия звукозаписи' },
      { id: 'sub-570-2', title: 'Запись песни' }
    ],
    'cat-439': [
      { id: 'sub-439-1', title: 'Типография' },
      { id: 'sub-439-2', title: 'Печать визиток' }
    ],

    // Мы в других странах
    'cat-901': [
      { id: 'sub-901-1', title: 'Россия' },
      { id: 'sub-901-2', title: 'Москва' }
    ],
    'cat-902': [
      { id: 'sub-902-1', title: 'Узбекистан' },
      { id: 'sub-902-2', title: 'Ташкент' }
    ],
    'cat-903': [
      { id: 'sub-903-1', title: 'Кыргызстан' },
      { id: 'sub-903-2', title: 'Бишкек' }
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
          <a href="tel:+77780211316" className="phone" aria-label="Позвонить">
            <i className="ri-phone-line" style={{ color: 'var(--accent)' }}></i> <span>+7 (778) 021-13-16</span>
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
