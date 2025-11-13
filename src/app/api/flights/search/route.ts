import { NextRequest, NextResponse } from 'next/server';
import { 
  FlightTicket, 
  generateDateRange,
  generateDateRangeBetween,
} from '@/lib/flights';
import { searchFlights, AviasalesSearchParams } from '@/lib/aviasales-api';

/**
 * Преобразует билет из формата Aviasales API в наш формат
 */
function convertAviasalesTicketToFlightTicket(
  ticket: any,
  date: string,
  origin: string,
  destination: string
): FlightTicket {
  // Определяем цену
  const price = ticket.price || ticket.value || 0;
  
  // Определяем авиакомпанию
  const airline = ticket.airline || ticket.gate || 'Не указано';
  
  // Определяем дату вылета
  const departDateStr = ticket.departure_at || ticket.depart_date;
  const departDate = departDateStr ? new Date(departDateStr) : new Date(date);
  
  // Вычисляем дату прилета
  const durationMinutes = ticket.duration || ticket.duration_to || 0;
  const arrivalDate = new Date(departDate.getTime() + durationMinutes * 60000);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Не указано';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  // Определяем количество пересадок
  const transfers = ticket.number_of_changes ?? ticket.transfers ?? 0;
  const isDirect = transfers === 0;

  // Формируем ссылку
  let link = ticket.link || '';
  if (link && !link.startsWith('http')) {
    link = `https://www.aviasales.ru${link}`;
  } else if (!link) {
    // Формируем ссылку вручную
    const dateFormatted = date.replace(/-/g, '');
    link = `https://www.aviasales.ru/search/${ticket.origin}${dateFormatted}${ticket.destination}1`;
  }

  return {
    date,
    price,
    airline,
    departureTime: formatTime(departDate),
    arrivalTime: formatTime(arrivalDate),
    duration: formatDuration(durationMinutes),
    link,
    isDirect,
    transfers,
    origin: ticket.origin_airport || ticket.origin || origin,
    destination: ticket.destination_airport || ticket.destination || destination,
  };
}

/**
 * Ищет билеты на все даты в диапазоне с callback для прогресса
 */
async function searchFlightsForDateRange(
  origin: string,
  destination: string,
  dates: string[],
  passengers: number = 1,
  token: string,
  maxTransfers: number = 0,
  onProgress?: (current: number, total: number, date: string) => void
): Promise<FlightTicket[]> {
  const fs = require('fs');
  const logPath = '/tmp/flyplaza-api.log';
  const writeLog = (message: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
      console.error(message);
    } catch (e) {}
  };

  writeLog(`Searching flights from ${origin} to ${destination} for ${dates.length} dates`);
  if (dates.length <= 10) {
    writeLog(`Dates to search: ${dates.join(', ')}`);
  } else {
    writeLog(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  }

  const allTickets: FlightTicket[] = [];

  // Обрабатываем даты последовательно
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    writeLog(`\n--- Processing date ${i + 1}/${dates.length}: ${date} ---`);
    
    // Вызываем callback для прогресса
    if (onProgress) {
      onProgress(i + 1, dates.length, date);
    }

    try {
      const params: AviasalesSearchParams = {
        origin,
        destination,
        depart_date: date,
        adults: passengers,
        currency: 'rub',
        direct: maxTransfers === 0, // Только прямые рейсы, если maxTransfers = 0
      };

      writeLog(`Calling Aviasales API for ${date}...`);
      const tickets = await searchFlights(params, token, 60000); // 60 секунд таймаут

      writeLog(`Found ${tickets.length} tickets for date ${date}`);

      // Фильтруем рейсы по количеству пересадок
      // Проверяем разные поля для определения количества пересадок
      const filteredTickets = tickets.filter(t => {
        // Проверяем количество пересадок
        // return_transfers - это пересадки на обратном пути, нам нужны пересадки на прямом пути
        // number_of_changes или transfers - пересадки на прямом пути
        const transfers = t.number_of_changes ?? t.transfers ?? 0;
        
        // Если maxTransfers = -1, разрешаем любое количество пересадок
        if (maxTransfers === -1) {
          // Принимаем все рейсы
        } else {
          // Проверяем, что количество пересадок не превышает максимальное
          if (transfers > maxTransfers) {
            return false;
          }
        }
        
        // Проверяем, что билет соответствует выбранному направлению
        // destination может быть кодом города (например, MOW для Москвы), а destination_airport - конкретным аэропортом
        const matchesDestination = 
          t.destination === destination || 
          t.destination_airport === destination ||
          // Специальные случаи для городов с несколькими аэропортами
          (destination === 'IST' && (t.destination === 'IST' || t.destination_airport === 'SAW')) ||
          (destination === 'SAW' && (t.destination === 'IST' || t.destination_airport === 'SAW')) ||
          (destination === 'MOW' && (t.destination === 'MOW' || t.destination_airport === 'SVO' || t.destination_airport === 'DME' || t.destination_airport === 'VKO')) ||
          (destination === 'SVO' && (t.destination === 'MOW' || t.destination_airport === 'SVO')) ||
          (destination === 'DME' && (t.destination === 'MOW' || t.destination_airport === 'DME')) ||
          (destination === 'VKO' && (t.destination === 'MOW' || t.destination_airport === 'VKO'));
        
        writeLog(`Ticket: origin=${t.origin}->${t.origin_airport}, dest=${t.destination}->${t.destination_airport}, transfers=${transfers}, maxTransfers=${maxTransfers}, matchesDestination=${matchesDestination}`);
        
        return matchesDestination;
      });
      writeLog(`Filtered tickets (after filtering by transfers): ${filteredTickets.length}`);

      // Преобразуем в наш формат
      const convertedTickets = filteredTickets.map(t => 
        convertAviasalesTicketToFlightTicket(t, date, origin, destination)
      );

      allTickets.push(...convertedTickets);
      writeLog(`Added ${convertedTickets.length} tickets to results`);

    } catch (error: any) {
      writeLog(`Error processing date ${date}: ${error.message}`);
      if (error.stack) {
        writeLog(`Stack: ${error.stack}`);
      }
    }

    // Небольшая задержка между запросами
    if (i < dates.length - 1) {
      writeLog('Waiting 2 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  writeLog(`\n=== Total tickets found: ${allTickets.length} ===`);
  return allTickets;
}

export async function GET(request: NextRequest) {
  const fs = require('fs');
  const logPath = '/tmp/flyplaza-api.log';
  const writeLog = (message: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
      console.error(message);
    } catch (e) {}
  };

  const log = (...args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    writeLog(message);
    console.error(...args);
    console.log(...args);
  };

  writeLog('=== API CALLED ===');
  log(`\n=== API GET /api/flights/search ===`);
  log(`Time: ${new Date().toISOString()}`);

  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin') || 'LED'; // Санкт-Петербург
    const destination = searchParams.get('destination') || 'IST'; // Стамбул
    const passengers = parseInt(searchParams.get('passengers') || '1', 10);
    const maxTransfers = parseInt(searchParams.get('maxTransfers') || '0', 10); // Максимальное количество пересадок
    
    // Получаем даты периода или используем дефолтные значения
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days'); // Для обратной совместимости

    // Получаем токен из переменных окружения
    const token = process.env.AVIASALES_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN;
    
    if (!token) {
      log('ERROR: AVIASALES_API_TOKEN or TRAVELPAYOUTS_TOKEN not set');
      return NextResponse.json(
        {
          success: false,
          error: 'API token not configured. Please set AVIASALES_API_TOKEN or TRAVELPAYOUTS_TOKEN environment variable.',
          tickets: [],
        },
        { status: 500 }
      );
    }

    // Определяем период поиска
    let startDate: Date;
    let endDate: Date;
    let dates: string[];

    if (startDateParam && endDateParam) {
      // Используем указанный период
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      dates = generateDateRangeBetween(startDate, endDate);
      log(`Searching flights from ${origin} to ${destination} from ${startDateParam} to ${endDateParam}`);
    } else if (daysParam) {
      // Обратная совместимость: используем days
      startDate = new Date();
      const days = parseInt(daysParam, 10);
      dates = generateDateRange(startDate, days);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      log(`Searching flights from ${origin} to ${destination} for ${days} days from ${startDate.toISOString()}`);
    } else {
      // Дефолт: 30 дней с сегодня
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
      dates = generateDateRange(startDate, 30);
      log(`Searching flights from ${origin} to ${destination} for 30 days (default)`);
    }

    log(`Total dates to search: ${dates.length}`);
    log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);

    // Создаем streaming response для передачи прогресса
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Функция для отправки сообщения о прогрессе
        const sendProgress = (current: number, total: number, date: string, ticketsFound: number = 0) => {
          const message = JSON.stringify({
            type: 'progress',
            current,
            total,
            date,
            ticketsFound,
            percentage: Math.round((current / total) * 100),
          }) + '\n';
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        };

        try {
          // Отправляем начальный прогресс
          sendProgress(0, dates.length, '', 0);

          // Ищем билеты на все даты с callback для прогресса
          log(`Starting searchFlightsForDateRange...`);
          let allTickets: FlightTicket[] = [];
          
          await searchFlightsForDateRange(
            origin,
            destination,
            dates,
            passengers,
            token,
            maxTransfers,
            (current, total, date) => {
              sendProgress(current, total, date, allTickets.length);
            }
          ).then(tickets => {
            allTickets = tickets;
          });

          log(`Total tickets found: ${allTickets.length}`);

          // Сортируем по цене по умолчанию (от самой низкой)
          const sortedTickets = allTickets
            .filter(ticket => ticket.price > 0) // Фильтруем только по цене, пересадки уже отфильтрованы
            .sort((a, b) => a.price - b.price);

          // Отправляем финальный результат
          const finalMessage = JSON.stringify({
            type: 'complete',
            success: sortedTickets.length > 0,
            tickets: sortedTickets,
            totalFound: allTickets.length,
          }) + '\n';
          controller.enqueue(encoder.encode(`data: ${finalMessage}\n\n`));
          controller.close();
        } catch (error: any) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: error.message || 'Ошибка при поиске билетов',
          }) + '\n';
          controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    log(`\n=== ERROR in flights search API ===`);
    log(`Error message: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Ошибка при поиске билетов',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        tickets: [],
      },
      { status: 500 }
    );
  }
}
