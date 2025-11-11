'use client';

import { useState } from 'react';
import { FlightTicket } from '@/lib/flights';
import { getAirportByCode, Airport, TOP_10_EUROPEAN_AIRPORTS } from '@/lib/airports';

export default function FlightSearch() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<FlightTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchStarted, setSearchStarted] = useState(false);
  
  // Сортировка
  const [sortColumn, setSortColumn] = useState<'date' | 'price' | 'departureTime' | 'arrivalTime' | 'duration' | 'transfers'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Прогресс поиска
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    date: string;
    percentage: number;
    ticketsFound: number;
  } | null>(null);

  // Функция валидации IATA кода
  const validateIATACode = (code: string): boolean => {
    if (!code || code.length === 0) return false;
    if (code.length < 3) return false;
    const iataCodeRegex = /^[A-Z]{3}$/;
    return iataCodeRegex.test(code.toUpperCase());
  };

  // Параметры поиска
  const [origin, setOrigin] = useState(''); // Пустое поле по умолчанию
  const [destination, setDestination] = useState(''); // Пустое поле по умолчанию
  
  // Валидация кодов аэропортов
  const [originValid, setOriginValid] = useState<boolean | null>(null);
  const [destinationValid, setDestinationValid] = useState<boolean | null>(null);
  
  // Информация об аэропортах
  const [originAirport, setOriginAirport] = useState<Airport | undefined>(undefined);
  const [destinationAirports, setDestinationAirports] = useState<Airport[]>([]); // Массив выбранных аэропортов назначения
  const [startDate, setStartDate] = useState(''); // Пустое поле по умолчанию
  const [endDate, setEndDate] = useState(''); // Пустое поле по умолчанию
  const [maxTransfers, setMaxTransfers] = useState<number>(0); // Максимальное количество пересадок (0 = только прямые)
  
  // Результаты поиска городов/аэропортов
  const [originSearchResults, setOriginSearchResults] = useState<any[]>([]);
  const [destinationSearchResults, setDestinationSearchResults] = useState<any[]>([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestinationResults, setShowDestinationResults] = useState(false);

  // Поиск городов и аэропортов
  const searchCities = async (query: string): Promise<any[]> => {
    if (query.length < 2) {
      return [];
    }
    
    try {
      const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.results) {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error('Error searching cities:', error);
      return [];
    }
  };

  // Валидация через Aviasales API
  const validateAirportCode = async (code: string): Promise<{ valid: boolean; airport?: any }> => {
    try {
      const response = await fetch(`/api/airports/validate?code=${code}`);
      const data = await response.json();
      
      if (data.success && data.valid && data.airport) {
        // Формируем объект только с доступными данными
        const airport: any = {
          code: data.airport.code,
        };
        
        if (data.airport.name) {
          airport.name = data.airport.name;
        }
        
        if (data.airport.city || data.airport.cityName) {
          airport.city = data.airport.city || data.airport.cityName;
        }
        
        if (data.airport.country || data.airport.countryName) {
          airport.country = data.airport.country || data.airport.countryName;
        }
        
        return {
          valid: true,
          airport: Object.keys(airport).length > 1 ? airport : undefined, // Возвращаем только если есть дополнительная информация
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('Error validating airport:', error);
      return { valid: false };
    }
  };

  // Обработчик изменения кода аэропорта вылета
  const handleOriginChange = async (value: string) => {
    setOrigin(value);
    setShowOriginResults(true);
    
    // Если это 3-буквенный код в верхнем регистре, проверяем как IATA код
    const upperValue = value.toUpperCase();
    if (upperValue.length === 3 && /^[A-Z]{3}$/.test(upperValue)) {
      const isValidFormat = validateIATACode(upperValue);
      if (!isValidFormat) {
        setOriginValid(false);
        setOriginAirport(undefined);
        setOriginSearchResults([]);
        return;
      }
      
      // Показываем состояние загрузки
      setOriginValid(null);
      setOriginAirport(undefined);
      setOriginSearchResults([]);
      
      // Валидируем через API
      const validation = await validateAirportCode(upperValue);
      setOriginValid(validation.valid);
      if (validation.valid && validation.airport) {
        setOriginAirport(validation.airport);
        setShowOriginResults(false);
      } else {
        setOriginAirport(undefined);
      }
    } else if (value.length >= 2) {
      // Ищем города и аэропорты
      setOriginValid(null);
      setOriginAirport(undefined);
      const results = await searchCities(value);
      setOriginSearchResults(results);
    } else {
      setOriginValid(null);
      setOriginAirport(undefined);
      setOriginSearchResults([]);
    }
  };

  // Выбор результата поиска для вылета
  const handleOriginSelect = (result: any) => {
    setOrigin(result.airport.code);
    setOriginAirport({
      code: result.airport.code,
      name: result.airport.name,
      city: result.airport.city,
      country: result.city.country || '',
    });
    setOriginValid(true);
    setOriginSearchResults([]);
    setShowOriginResults(false);
  };

  // Обработчик изменения кода аэропорта прилета
  const handleDestinationChange = async (value: string) => {
    setDestination(value);
    setShowDestinationResults(true);
    
    // Проверяем специальную команду "top-10"
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'top-10' || lowerValue === 'top10') {
      // Добавляем все топ-10 аэропортов Европы
      const airportsToAdd = TOP_10_EUROPEAN_AIRPORTS.filter(
        airport => !destinationAirports.find(a => a.code === airport.code)
      );
      if (airportsToAdd.length > 0) {
        setDestinationAirports([...destinationAirports, ...airportsToAdd]);
      }
      setDestination('');
      setDestinationValid(null);
      setDestinationSearchResults([]);
      setShowDestinationResults(false);
      return;
    }
    
    // Если это 3-буквенный код в верхнем регистре, проверяем как IATA код
    const upperValue = value.toUpperCase();
    if (upperValue.length === 3 && /^[A-Z]{3}$/.test(upperValue)) {
      const isValidFormat = validateIATACode(upperValue);
      if (!isValidFormat) {
        setDestinationValid(false);
        setDestinationSearchResults([]);
        return;
      }
      
      // Показываем состояние загрузки
      setDestinationValid(null);
      setDestinationSearchResults([]);
      
      // Валидируем через API
      const validation = await validateAirportCode(upperValue);
      setDestinationValid(validation.valid);
      if (validation.valid && validation.airport) {
        // Автоматически добавляем в список, если еще не добавлен
        const airportData = getAirportByCode(upperValue);
        if (airportData && !destinationAirports.find(a => a.code === upperValue)) {
          setDestinationAirports([...destinationAirports, airportData]);
          setDestination('');
        }
        setShowDestinationResults(false);
      }
    } else if (value.length >= 2) {
      // Ищем города и аэропорты
      setDestinationValid(null);
      const results = await searchCities(value);
      setDestinationSearchResults(results);
    } else {
      setDestinationValid(null);
      setDestinationSearchResults([]);
    }
  };

  // Выбор результата поиска для прилета
  const handleDestinationSelect = (result: any) => {
    const newAirport: Airport = {
      code: result.airport.code,
      name: result.airport.name,
      city: result.airport.city,
      country: result.city.country || '',
    };
    
    // Проверяем, не добавлен ли уже этот аэропорт
    if (!destinationAirports.find(a => a.code === newAirport.code)) {
      setDestinationAirports([...destinationAirports, newAirport]);
    }
    
    setDestination('');
    setDestinationValid(null);
    setDestinationSearchResults([]);
    setShowDestinationResults(false);
  };

  // Удаление аэропорта из списка назначений
  const removeDestinationAirport = (code: string) => {
    setDestinationAirports(destinationAirports.filter(a => a.code !== code));
  };

  // Добавление топ-10 аэропортов Европы
  const addTopEuropeanAirports = () => {
    const newAirports = [...destinationAirports];
    TOP_10_EUROPEAN_AIRPORTS.forEach(airport => {
      // Добавляем только те, которые еще не добавлены
      if (!newAirports.find(a => a.code === airport.code)) {
        newAirports.push(airport);
      }
    });
    setDestinationAirports(newAirports);
  };

  const handleSearch = async () => {
    // Валидация
    if (!origin) {
      setError('Пожалуйста, введите код аэропорта вылета');
      return;
    }
    
    if (originValid !== true) {
      setError('Пожалуйста, введите корректный код аэропорта вылета');
      return;
    }
    
    if (destinationAirports.length === 0) {
      setError('Пожалуйста, выберите хотя бы один аэропорт прилета');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите период поиска');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('Дата начала не может быть позже даты окончания');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      setError('Дата начала не может быть в прошлом');
      return;
    }

    // Вычисляем количество дней
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff > 90) {
      setError('Период поиска не может превышать 90 дней');
      return;
    }

    setLoading(true);
    setError(null);
    setTickets([]);
    setSearchStarted(true);
    setProgress(null);

    try {
      const originCode = originAirport?.code || origin.toUpperCase();
      const allTickets: FlightTicket[] = [];
      
      // Генерируем массив дат
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);
      
      while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const totalRequests = dates.length * destinationAirports.length;
      let completedRequests = 0;

      // Проходим сначала по датам, затем по аэропортам
      for (const date of dates) {
        for (const destAirport of destinationAirports) {
          const destinationCode = destAirport.code;
          
          const params = new URLSearchParams({
            origin: originCode,
            destination: destinationCode,
            startDate: date,
            endDate: date, // Ищем только на одну дату
            passengers: '1',
            maxTransfers: maxTransfers.toString(),
          });

          const response = await fetch(`/api/flights/search?${params.toString()}`);
          
          if (!response.ok) {
            console.error(`Ошибка при поиске для ${destinationCode} на ${date}`);
            completedRequests++;
            setProgress({
              current: completedRequests,
              total: totalRequests,
              date: date,
              percentage: Math.round((completedRequests / totalRequests) * 100),
              ticketsFound: allTickets.length,
            });
            continue;
          }

          // Обрабатываем Server-Sent Events
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            completedRequests++;
            setProgress({
              current: completedRequests,
              total: totalRequests,
              date: date,
              percentage: Math.round((completedRequests / totalRequests) * 100),
              ticketsFound: allTickets.length,
            });
            continue;
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'progress') {
                    // Обновляем прогресс
                    setProgress({
                      current: completedRequests,
                      total: totalRequests,
                      date: date,
                      percentage: Math.round((completedRequests / totalRequests) * 100),
                      ticketsFound: allTickets.length,
                    });
                  } else if (data.type === 'complete') {
                    if (data.success && data.tickets) {
                      allTickets.push(...data.tickets);
                    }
                  } else if (data.type === 'error') {
                    console.error(`Ошибка при поиске для ${destinationCode} на ${date}:`, data.error);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          completedRequests++;
          setProgress({
            current: completedRequests,
            total: totalRequests,
            date: date,
            percentage: Math.round((completedRequests / totalRequests) * 100),
            ticketsFound: allTickets.length,
          });
        }
      }

      // Все запросы завершены
      if (allTickets.length === 0) {
        setError('Билеты не найдены. Попробуйте изменить параметры поиска.');
      } else {
        // Сортируем все билеты по цене
        allTickets.sort((a, b) => a.price - b.price);
        setTickets(allTickets);
      }
      
      setLoading(false);
      setProgress(null);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при выполнении запроса');
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Поисковая форма */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Поиск авиабилетов
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Аэропорты */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                Аэропорт вылета *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onFocus={() => setShowOriginResults(originSearchResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowOriginResults(false), 200)}
                  placeholder="Москва, Moscow, LED, SVO..."
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    originValid === true
                      ? 'border-emerald-400 bg-emerald-50'
                      : originValid === false
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {originValid === true && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                {originValid === false && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                )}
                {showOriginResults && originSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {originSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleOriginSelect(result)}
                        className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {result.airport.city} ({result.airport.code})
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.airport.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className={`text-xs mt-2 font-medium ${
                originValid === true
                  ? 'text-emerald-600'
                  : originValid === false
                  ? 'text-rose-600'
                  : 'text-gray-500'
              }`}>
                {origin.length === 0
                  ? 'Введите название города (Москва, Moscow) или код IATA (LED, SVO, IST)'
                  : originValid === true && originAirport && originAirport.city
                  ? `✓ ${originAirport.city}${originAirport.name ? `, ${originAirport.name}` : ''}`
                  : originValid === true
                  ? `✓ Код корректен`
                  : originValid === false
                  ? '✗ Аэропорт не найден'
                  : originSearchResults.length > 0
                  ? `Найдено ${originSearchResults.length} ${originSearchResults.length === 1 ? 'вариант' : 'вариантов'}, выберите из списка`
                  : origin.length >= 2
                  ? 'Поиск...'
                  : 'Введите минимум 2 символа'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  Аэропорты прилета *
                </label>
                <button
                  type="button"
                  onClick={addTopEuropeanAirports}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-2 border-amber-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Топ-10 Европы
                </button>
              </div>
              
              {/* Выбранные аэропорты */}
              {destinationAirports.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {destinationAirports.map((airport) => (
                    <span
                      key={airport.code}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-semibold shadow-sm border border-blue-200"
                    >
                      {airport.city} ({airport.code})
                      <button
                        type="button"
                        onClick={() => removeDestinationAirport(airport.code)}
                        className="ml-1 hover:text-blue-900 focus:outline-none"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => setShowDestinationResults(destinationSearchResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowDestinationResults(false), 200)}
                  placeholder="Стамбул, Istanbul, IST..."
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    destinationValid === true
                      ? 'border-emerald-400 bg-emerald-50'
                      : destinationValid === false
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {destinationValid === true && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                {destinationValid === false && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                )}
                {showDestinationResults && destinationSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {destinationSearchResults.map((result, index) => {
                      const isAlreadySelected = destinationAirports.some(a => a.code === result.airport.code);
                      return (
                        <div
                          key={index}
                          onClick={() => !isAlreadySelected && handleDestinationSelect(result)}
                          className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 ${
                            isAlreadySelected 
                              ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
                              : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {result.airport.city} ({result.airport.code})
                                {isAlreadySelected && <span className="ml-2 text-xs text-gray-500">(уже добавлен)</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.airport.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className={`text-xs mt-1 ${
                destinationValid === true
                  ? 'text-green-600'
                  : destinationValid === false
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}>
                {destination.length === 0
                  ? destinationAirports.length > 0
                    ? `Выбрано аэропортов: ${destinationAirports.length}. Введите еще для добавления`
                    : 'Введите название города (Стамбул, Istanbul) или код IATA (IST, SAW, LED)'
                  : destinationValid === true
                  ? `✓ Код корректен`
                  : destinationValid === false
                  ? '✗ Аэропорт не найден'
                  : destinationSearchResults.length > 0
                  ? `Найдено ${destinationSearchResults.length} ${destinationSearchResults.length === 1 ? 'вариант' : 'вариантов'}, выберите из списка`
                  : destination.length >= 2
                  ? 'Поиск...'
                  : 'Введите минимум 2 символа'}
              </p>
            </div>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Дата начала периода *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Дата окончания периода *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-pink-100 focus:border-pink-500 disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>
          </div>

          {/* Количество пересадок */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              Максимальное количество пересадок
            </label>
            <select
              value={maxTransfers}
              onChange={(e) => setMaxTransfers(parseInt(e.target.value, 10))}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-teal-100 focus:border-teal-500 disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-300"
            >
              <option value={0}>Только прямые рейсы (0 пересадок)</option>
              <option value={1}>До 1 пересадки</option>
              <option value={2}>До 2 пересадок</option>
              <option value={3}>До 3 пересадок</option>
              <option value={-1}>Любое количество пересадок</option>
            </select>
          </div>

          {/* Информация о поиске */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Направление</p>
                  <p className="text-sm text-gray-900 font-semibold">В одну сторону</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Пересадки</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    {maxTransfers === 0 
                      ? 'Прямые'
                      : maxTransfers === -1
                      ? 'Любые'
                      : `До ${maxTransfers}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Пассажиры</p>
                  <p className="text-sm text-gray-900 font-semibold">1 взрослый</p>
                </div>
              </div>
            </div>
            {startDate && endDate && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Будет проверено <strong className="text-blue-600">{Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</strong> {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 === 1 ? 'дата' : 'дат'} по <strong className="text-blue-600">{destinationAirports.length}</strong> {destinationAirports.length === 1 ? 'направлению' : 'направлениям'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || originValid !== true || destinationAirports.length === 0 || !startDate || !endDate}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Поиск билетов...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Найти самые дешевые билеты
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 rounded-2xl p-5 mb-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900 mb-1">Ошибка поиска</h3>
              <p className="text-rose-700 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && progress && (
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Поиск билетов...</h3>
              <p className="text-sm text-gray-500">Проверяю лучшие предложения</p>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700">Дата: {new Date(progress.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-gray-500">Прогресс</span>
              <span className="font-semibold text-gray-700">{progress.current} / {progress.total}</span>
            </div>
          </div>
        </div>
      )}

      {!loading && tickets.length > 0 && (() => {
        // Функция сортировки
        const sortedTickets = [...tickets].sort((a, b) => {
          let compareValue = 0;
          
          switch (sortColumn) {
            case 'date':
              compareValue = a.date.localeCompare(b.date);
              break;
            case 'price':
              compareValue = a.price - b.price;
              break;
            case 'departureTime':
              compareValue = (a.departureTime || '').localeCompare(b.departureTime || '');
              break;
            case 'arrivalTime':
              compareValue = (a.arrivalTime || '').localeCompare(b.arrivalTime || '');
              break;
            case 'duration':
              // Парсим длительность (например, "3ч 30м" -> 210 минут)
              const parseDuration = (duration: string): number => {
                if (!duration) return 0;
                const hoursMatch = duration.match(/(\d+)ч/);
                const minsMatch = duration.match(/(\d+)м/);
                const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
                const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
                return hours * 60 + mins;
              };
              compareValue = parseDuration(a.duration || '') - parseDuration(b.duration || '');
              break;
            case 'transfers':
              const aTransfers = a.isDirect ? 0 : (a.transfers ?? 999);
              const bTransfers = b.isDirect ? 0 : (b.transfers ?? 999);
              compareValue = aTransfers - bTransfers;
              break;
            default:
              return 0;
          }
          
          return sortDirection === 'asc' ? compareValue : -compareValue;
        });

        const handleSort = (column: typeof sortColumn) => {
          if (sortColumn === column) {
            // Переключаем направление сортировки
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            // Устанавливаем новую колонку и направление по умолчанию
            setSortColumn(column);
            setSortDirection('asc');
          }
        };

        const SortIcon = ({ column }: { column: typeof sortColumn }) => {
          if (sortColumn !== column) {
            return (
              <span className="ml-1 text-gray-400">
                <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </span>
            );
          }
          return (
            <span className="ml-1 text-blue-600">
              {sortDirection === 'asc' ? (
                <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          );
        };

        return (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Найденные билеты
                </h3>
                <p className="text-sm text-gray-500">
                  Найдено <span className="font-semibold text-emerald-600">{tickets.length}</span> предложений
                </p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border-2 border-gray-100 shadow-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <span className="flex items-center">
                        Дата
                        <SortIcon column="date" />
                      </span>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('departureTime')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Вылет
                        <SortIcon column="departureTime" />
                      </span>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('arrivalTime')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Прилет
                        <SortIcon column="arrivalTime" />
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Аэропорт прилета
                      </span>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('duration')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Длительность
                        <SortIcon column="duration" />
                      </span>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('transfers')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Пересадки
                        <SortIcon column="transfers" />
                      </span>
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Цена
                        <SortIcon column="price" />
                      </span>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ссылка
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedTickets.map((ticket, index) => {
                  const formatPrice = (price: number) => {
                    return new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      minimumFractionDigits: 0,
                    }).format(price);
                  };

                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return new Intl.DateTimeFormat('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(date);
                  };

                  const formatDateShort = (dateString: string) => {
                    const date = new Date(dateString);
                    return new Intl.DateTimeFormat('ru-RU', {
                      weekday: 'short',
                    }).format(date);
                  };

                  return (
                    <tr key={`${ticket.date}-${ticket.price}-${index}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150">
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-gray-900">{formatDate(ticket.date)}</div>
                        <div className="text-xs text-gray-500 font-medium">{formatDateShort(ticket.date)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.departureTime || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.arrivalTime || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const destCode = ticket.destination;
                          if (destCode) {
                            const airport = getAirportByCode(destCode);
                            if (airport) {
                              return (
                                <div>
                                  <div className="font-medium">{airport.city}</div>
                                  <div className="text-xs text-gray-500">{airport.name} ({destCode})</div>
                                </div>
                              );
                            }
                            return destCode;
                          }
                          return '—';
                        })()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                        {ticket.duration || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {ticket.isDirect ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Прямой
                          </span>
                        ) : ticket.transfers !== undefined && ticket.transfers > 0 ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            {ticket.transfers}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-bold shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatPrice(ticket.price)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <a
                          href={ticket.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          Открыть
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {!loading && searchStarted && tickets.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600">Билеты не найдены</p>
        </div>
      )}
    </div>
  );
}
