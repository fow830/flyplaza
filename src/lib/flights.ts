export interface FlightTicket {
  date: string;
  price: number;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  link: string;
  isDirect?: boolean; // Прямой рейс (без пересадок)
  transfers?: number; // Количество пересадок
  destination?: string; // Код аэропорта назначения
}

export interface FlightSearchParams {
  origin: string; // IATA код города отправления
  destination: string; // IATA код города назначения
  date: string; // YYYY-MM-DD
  passengers: number;
}

// IATA коды для городов
export const CITY_CODES: Record<string, string> = {
  'санкт-петербург': 'LED',
  'петербург': 'LED',
  'спб': 'LED',
  'стамбул': 'IST',
  'istanbul': 'IST',
};

/**
 * Генерирует URL для поиска на aviasales.ru
 * @param params Параметры поиска
 * @param directOnly Только прямые рейсы (без пересадок)
 */
export function generateAviasalesUrl(params: FlightSearchParams, directOnly: boolean = true): string {
  const { origin, destination, date, passengers } = params;
  
  // Формат URL: https://www.aviasales.ru/search/{origin}{date}{destination}1{passengers}
  // Пример: https://www.aviasales.ru/search/LED011225IST11
  
  // Преобразуем дату в формат DDMMYY
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  const dateFormatted = `${day}${month}${year}`;
  
  // 1 - в одну сторону, passengers - количество пассажиров
  let url = `https://www.aviasales.ru/search/${origin}${dateFormatted}${destination}1${passengers}`;
  
  // Добавляем параметр для прямых рейсов
  if (directOnly) {
    url += '?direct=true';
  }
  
  return url;
}

/**
 * Добавляет дни к дате
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Форматирует дату в YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Генерирует массив дат на указанное количество дней вперед
 */
export function generateDateRange(startDate: Date, days: number = 30): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    dates.push(formatDate(date));
  }
  return dates;
}

/**
 * Генерирует массив дат между двумя датами (включительно)
 */
export function generateDateRangeBetween(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

