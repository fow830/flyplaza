// Популярные аэропорты с IATA кодами
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Топ-10 самых загруженных аэропортов Европы по пассажиропотоку (2024-2025, последние 12 месяцев)
export const TOP_10_EUROPEAN_AIRPORTS: Airport[] = [
  { code: 'IST', name: 'Стамбул', city: 'Стамбул', country: 'Турция' }, // 64.3 млн пассажиров
  { code: 'LHR', name: 'Хитроу', city: 'Лондон', country: 'Великобритания' }, // 61.6 млн
  { code: 'CDG', name: 'Шарль-де-Голль', city: 'Париж', country: 'Франция' }, // 57.5 млн
  { code: 'AMS', name: 'Схипхол', city: 'Амстердам', country: 'Нидерланды' }, // 52.5 млн
  { code: 'FRA', name: 'Франкфурт', city: 'Франкфурт', country: 'Германия' }, // 50.9 млн
  { code: 'MAD', name: 'Мадрид-Барахас', city: 'Мадрид', country: 'Испания' }, // 49.4 млн
  { code: 'BCN', name: 'Барселона-Эль-Прат', city: 'Барселона', country: 'Испания' }, // 47.2 млн
  { code: 'MUC', name: 'Мюнхен', city: 'Мюнхен', country: 'Германия' }, // 45.3 млн
  { code: 'FCO', name: 'Рим-Фьюмичино', city: 'Рим', country: 'Италия' }, // 43.1 млн
  { code: 'LGW', name: 'Гатвик', city: 'Лондон', country: 'Великобритания' }, // 41.8 млн
];

// Расширенная база данных аэропортов (ключ - IATA код)
export const AIRPORTS_DATABASE: Record<string, Airport> = {
  // Россия
  'LED': { code: 'LED', name: 'Пулково', city: 'Санкт-Петербург', country: 'Россия' },
  'SVO': { code: 'SVO', name: 'Шереметьево', city: 'Москва', country: 'Россия' },
  'DME': { code: 'DME', name: 'Домодедово', city: 'Москва', country: 'Россия' },
  'VKO': { code: 'VKO', name: 'Внуково', city: 'Москва', country: 'Россия' },
  'AER': { code: 'AER', name: 'Сочи', city: 'Сочи', country: 'Россия' },
  'KRR': { code: 'KRR', name: 'Краснодар', city: 'Краснодар', country: 'Россия' },
  'ROV': { code: 'ROV', name: 'Ростов-на-Дону', city: 'Ростов-на-Дону', country: 'Россия' },
  'KZN': { code: 'KZN', name: 'Казань', city: 'Казань', country: 'Россия' },
  'UFA': { code: 'UFA', name: 'Уфа', city: 'Уфа', country: 'Россия' },
  'EK': { code: 'EK', name: 'Екатеринбург', city: 'Екатеринбург', country: 'Россия' },
  'NSK': { code: 'NSK', name: 'Новосибирск', city: 'Новосибирск', country: 'Россия' },
  'OVB': { code: 'OVB', name: 'Толмачево', city: 'Новосибирск', country: 'Россия' },
  'IKT': { code: 'IKT', name: 'Иркутск', city: 'Иркутск', country: 'Россия' },
  'VVO': { code: 'VVO', name: 'Владивосток', city: 'Владивосток', country: 'Россия' },
  
  // Турция
  'IST': { code: 'IST', name: 'Стамбул', city: 'Стамбул', country: 'Турция' },
  'SAW': { code: 'SAW', name: 'Стамбул Сабиха Гекчен', city: 'Стамбул', country: 'Турция' },
  'AYT': { code: 'AYT', name: 'Анталья', city: 'Анталья', country: 'Турция' },
  'ADB': { code: 'ADB', name: 'Измир', city: 'Измир', country: 'Турция' },
  'BOD': { code: 'BOD', name: 'Бодрум', city: 'Бодрум', country: 'Турция' },
  'DLM': { code: 'DLM', name: 'Даламан', city: 'Даламан', country: 'Турция' },
  
  // Европа
  'AMS': { code: 'AMS', name: 'Схипхол', city: 'Амстердам', country: 'Нидерланды' },
  'CDG': { code: 'CDG', name: 'Шарль де Голль', city: 'Париж', country: 'Франция' },
  'ORY': { code: 'ORY', name: 'Орли', city: 'Париж', country: 'Франция' },
  'FRA': { code: 'FRA', name: 'Франкфурт', city: 'Франкфурт', country: 'Германия' },
  'MUC': { code: 'MUC', name: 'Мюнхен', city: 'Мюнхен', country: 'Германия' },
  'TXL': { code: 'TXL', name: 'Тегель', city: 'Берлин', country: 'Германия' },
  'LHR': { code: 'LHR', name: 'Хитроу', city: 'Лондон', country: 'Великобритания' },
  'LGW': { code: 'LGW', name: 'Гатвик', city: 'Лондон', country: 'Великобритания' },
  'FCO': { code: 'FCO', name: 'Фьюмичино', city: 'Рим', country: 'Италия' },
  'MXP': { code: 'MXP', name: 'Мальпенса', city: 'Милан', country: 'Италия' },
  'BCN': { code: 'BCN', name: 'Барселона', city: 'Барселона', country: 'Испания' },
  'MAD': { code: 'MAD', name: 'Мадрид', city: 'Мадрид', country: 'Испания' },
  'VIE': { code: 'VIE', name: 'Вена', city: 'Вена', country: 'Австрия' },
  'ZRH': { code: 'ZRH', name: 'Цюрих', city: 'Цюрих', country: 'Швейцария' },
  'ATH': { code: 'ATH', name: 'Афины', city: 'Афины', country: 'Греция' },
  'PRG': { code: 'PRG', name: 'Прага', city: 'Прага', country: 'Чехия' },
  'WAW': { code: 'WAW', name: 'Варшава', city: 'Варшава', country: 'Польша' },
  'CPH': { code: 'CPH', name: 'Копенгаген', city: 'Копенгаген', country: 'Дания' },
  'ARN': { code: 'ARN', name: 'Стокгольм', city: 'Стокгольм', country: 'Швеция' },
  'OSL': { code: 'OSL', name: 'Осло', city: 'Осло', country: 'Норвегия' },
  'HEL': { code: 'HEL', name: 'Хельсинки', city: 'Хельсинки', country: 'Финляндия' },
  
  // Азия
  'DXB': { code: 'DXB', name: 'Дубай', city: 'Дубай', country: 'ОАЭ' },
  'AUH': { code: 'AUH', name: 'Абу-Даби', city: 'Абу-Даби', country: 'ОАЭ' },
  'DOH': { code: 'DOH', name: 'Доха', city: 'Доха', country: 'Катар' },
  'BKK': { code: 'BKK', name: 'Бангкок', city: 'Бангкок', country: 'Таиланд' },
  'SIN': { code: 'SIN', name: 'Сингапур', city: 'Сингапур', country: 'Сингапур' },
  'HKG': { code: 'HKG', name: 'Гонконг', city: 'Гонконг', country: 'Китай' },
  'PEK': { code: 'PEK', name: 'Пекин', city: 'Пекин', country: 'Китай' },
  'PVG': { code: 'PVG', name: 'Шанхай Пудун', city: 'Шанхай', country: 'Китай' },
  'NRT': { code: 'NRT', name: 'Нарита', city: 'Токио', country: 'Япония' },
  'HND': { code: 'HND', name: 'Ханеда', city: 'Токио', country: 'Япония' },
  'ICN': { code: 'ICN', name: 'Инчхон', city: 'Сеул', country: 'Южная Корея' },
  
  // США
  'JFK': { code: 'JFK', name: 'Кеннеди', city: 'Нью-Йорк', country: 'США' },
  'LAX': { code: 'LAX', name: 'Лос-Анджелес', city: 'Лос-Анджелес', country: 'США' },
  'SFO': { code: 'SFO', name: 'Сан-Франциско', city: 'Сан-Франциско', country: 'США' },
  'MIA': { code: 'MIA', name: 'Майами', city: 'Майами', country: 'США' },
  'ORD': { code: 'ORD', name: 'О\'Хара', city: 'Чикаго', country: 'США' },
  'BOS': { code: 'BOS', name: 'Логан', city: 'Бостон', country: 'США' },
  'SEA': { code: 'SEA', name: 'Сиэтл', city: 'Сиэтл', country: 'США' },
  'LAS': { code: 'LAS', name: 'Лас-Вегас', city: 'Лас-Вегас', country: 'США' },
  
  // Другие популярные
  'YYZ': { code: 'YYZ', name: 'Торонто', city: 'Торонто', country: 'Канада' },
  'YVR': { code: 'YVR', name: 'Ванкувер', city: 'Ванкувер', country: 'Канада' },
  'SYD': { code: 'SYD', name: 'Сидней', city: 'Сидней', country: 'Австралия' },
  'MEL': { code: 'MEL', name: 'Мельбурн', city: 'Мельбурн', country: 'Австралия' },
};

// Популярные аэропорты (для обратной совместимости)
export const POPULAR_AIRPORTS: Airport[] = Object.values(AIRPORTS_DATABASE);

// Функция для получения аэропорта по коду
export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS_DATABASE[code.toUpperCase()];
}

// Функция для форматирования названия аэропорта для отображения
export function formatAirportName(airport: Airport): string {
  return `${airport.city} (${airport.code}) - ${airport.name}`;
}

// Функция для получения полного названия аэропорта
export function getAirportFullName(code: string): string | null {
  const airport = getAirportByCode(code);
  if (!airport) return null;
  return `${airport.city}, ${airport.name}`;
}
