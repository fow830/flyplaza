import axios from 'axios';

const AViasalesAPI_BASE = 'https://api.travelpayouts.com/aviasales/v3';

export interface AviasalesSearchParams {
  origin: string; // IATA код
  destination: string; // IATA код
  depart_date: string; // YYYY-MM-DD
  return_date?: string; // YYYY-MM-DD (для обратных билетов)
  adults: number;
  children?: number;
  infants?: number;
  currency?: string; // RUB по умолчанию
  direct?: boolean; // Только прямые рейсы
}

export interface AviasalesSearchResponse {
  search_id: string;
  status: string;
}

export interface AviasalesTicket {
  price?: number; // Цена (может быть price или value)
  value?: number; // Цена (альтернативное поле)
  trip_class?: number;
  show_to_affiliates?: boolean;
  return_date?: string;
  origin: string;
  destination: string;
  gate?: string; // Авиакомпания
  airline?: string; // Авиакомпания (альтернативное поле)
  depart_date?: string;
  departure_at?: string; // Дата вылета (альтернативное поле)
  return_date?: string;
  number_of_changes?: number; // Количество пересадок
  return_transfers?: number; // Количество пересадок (альтернативное поле)
  transfers?: number; // Количество пересадок (альтернативное поле)
  found_at?: string;
  duration?: number; // Длительность в минутах
  duration_to?: number; // Длительность до пересадки
  distance?: number;
  actual?: boolean;
  link?: string; // Ссылка на билет
  origin_airport?: string; // Аэропорт отправления
  destination_airport?: string; // Аэропорт назначения
  flight_number?: string; // Номер рейса
}

export interface AviasalesResultsResponse {
  status: string;
  data: AviasalesTicket[];
}

/**
 * Создает поиск билетов через Aviasales API
 * Использует endpoint для поиска в реальном времени
 */
export async function createSearch(
  params: AviasalesSearchParams,
  token: string
): Promise<AviasalesSearchResponse> {
  const fs = require('fs');
  const logPath = '/tmp/flyplaza-api.log';
  const writeLog = (message: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch (e) {}
  };

  // API endpoint для поиска в реальном времени
  // Используем правильные имена параметров согласно документации
  const apiParams: any = {
    origin: params.origin,
    destination: params.destination,
    departure_at: params.depart_date, // Правильное имя параметра
    adults: params.adults,
    currency: params.currency || 'rub',
    one_way: true, // В одну сторону
    direct: params.direct || false, // Только прямые рейсы
    limit: 30,
    page: 1,
    token,
  };

  if (params.return_date) {
    apiParams.return_at = params.return_date;
  }

  if (params.children) {
    apiParams.children = params.children;
  }

  if (params.infants) {
    apiParams.infants = params.infants;
  }

  writeLog(`API Request URL: ${AViasalesAPI_BASE}/prices_for_dates`);
  writeLog(`API Request params: ${JSON.stringify(apiParams)}`);

  try {
    const response = await axios.get(`${AViasalesAPI_BASE}/prices_for_dates`, {
      params: apiParams,
      headers: {
        'Accept': 'application/json',
        'X-Access-Token': token,
      },
    });

    writeLog(`API Response status: ${response.status}`);
    writeLog(`API Response data: ${JSON.stringify(response.data).substring(0, 500)}`);

    return response.data;
  } catch (error: any) {
    writeLog(`API Error: ${error.message}`);
    if (error.response) {
      writeLog(`API Error response status: ${error.response.status}`);
      writeLog(`API Error response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Получает результаты поиска
 */
export async function getSearchResults(
  searchId: string,
  token: string
): Promise<AviasalesResultsResponse> {
  const response = await axios.get(`${AViasalesAPI_BASE}/get_results`, {
    params: {
      search_id: searchId,
      token,
    },
    headers: {
      'Accept': 'application/json',
      'X-Access-Token': token, // Также передаем в заголовке для совместимости
    },
  });

  return response.data;
}

/**
 * Ищет билеты с ожиданием результатов
 */
export async function searchFlights(
  params: AviasalesSearchParams,
  token: string,
  maxWaitTime: number = 60000 // 60 секунд по умолчанию
): Promise<AviasalesTicket[]> {
  const fs = require('fs');
  const logPath = '/tmp/flyplaza-api.log';
  const writeLog = (message: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch (e) {}
  };

  // Создаем поиск
  writeLog('Creating search request...');
  const searchResponse = await createSearch(params, token);
  
  writeLog(`Search response type: ${typeof searchResponse}`);
  writeLog(`Search response keys: ${Object.keys(searchResponse || {})}`);

  // Проверяем, что получили search_id или данные напрямую
  if (searchResponse.search_id) {
    // Асинхронный поиск - нужно ждать результатов
    const searchId = searchResponse.search_id;
    writeLog(`Got search_id: ${searchId}, waiting for results...`);
    const startTime = Date.now();

    // Ждем результаты с проверкой каждые 2 секунды
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 секунды

      const results = await getSearchResults(searchId, token);
      writeLog(`Results status: ${results.status}`);

      if (results.status === 'completed' && results.data) {
        writeLog(`Got ${results.data.length} tickets`);
        return results.data;
      }

      if (results.status === 'error') {
        throw new Error('Search failed with error status');
      }

      // Если статус "pending" или "processing", продолжаем ждать
    }

    throw new Error('Search timeout: results not ready within maxWaitTime');
  } else if (Array.isArray(searchResponse)) {
    // Если API вернул массив билетов напрямую (синхронный ответ)
    writeLog(`Got direct response with ${searchResponse.length} tickets`);
    return searchResponse as any;
  } else if (searchResponse.data && Array.isArray(searchResponse.data)) {
    // Если данные в поле data
    writeLog(`Got data field with ${searchResponse.data.length} tickets`);
    return searchResponse.data;
  } else {
    // Неизвестный формат ответа
    writeLog(`Unknown response format: ${JSON.stringify(searchResponse).substring(0, 500)}`);
    throw new Error(`Failed to create search. Unexpected response format. Check logs for details.`);
  }
}

