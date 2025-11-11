import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const AViasalesAPI_BASE = 'https://api.travelpayouts.com/data';

/**
 * Валидирует код аэропорта через Aviasales API
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'Code parameter is required' },
      { status: 400 }
    );
  }

  // Проверяем формат IATA кода
  const iataCodeRegex = /^[A-Z]{3}$/;
  if (!iataCodeRegex.test(code.toUpperCase())) {
    return NextResponse.json({
      success: false,
      valid: false,
      error: 'Invalid IATA code format',
    });
  }

  try {
    const upperCode = code.toUpperCase();
    
    // Пытаемся получить список аэропортов из Aviasales API
    // Используем endpoint для получения данных об аэропортах
    let airport = null;
    
    try {
      // Пытаемся получить русскую версию, если не получится - английскую
      let response;
      try {
        response = await axios.get(`${AViasalesAPI_BASE}/ru/airports.json`, {
          headers: {
            'Accept': 'application/json',
          },
          timeout: 5000,
        });
      } catch (error) {
        // Если русская версия недоступна, используем английскую
        response = await axios.get(`${AViasalesAPI_BASE}/en/airports.json`, {
          headers: {
            'Accept': 'application/json',
          },
          timeout: 5000,
        });
      }

      const airports = Array.isArray(response.data) ? response.data : [];
      
      // Ищем аэропорт по коду
      airport = airports.find((a: any) => 
        (a.code && a.code.toUpperCase() === upperCode) || 
        (a.iata && a.iata.toUpperCase() === upperCode) ||
        (a.code && a.code === upperCode) ||
        (a.iata && a.iata === upperCode)
      );
    } catch (error) {
      // Если не удалось получить список, попробуем другой способ
      console.log('Could not fetch airports list, trying alternative method');
    }

    if (airport) {
      // Получаем русские названия, если доступны
      const airportName = airport.name_translations?.ru || 
                          airport.name_translations?.en || 
                          airport.name || 
                          '';
      
      // Пытаемся получить название города
      // Сначала проверяем прямые поля
      let cityName = airport.city_name || 
                     airport.city || 
                     '';
      
      // Если city_name не найден, но есть city_code, ищем город по коду в базе городов
      if (!cityName && airport.city_code) {
        try {
          // Пытаемся получить список городов (сначала русскую версию, потом английскую)
          let citiesResponse;
          try {
            citiesResponse = await axios.get(`${AViasalesAPI_BASE}/ru/cities.json`, {
              headers: { 'Accept': 'application/json' },
              timeout: 3000,
            });
          } catch (e) {
            citiesResponse = await axios.get(`${AViasalesAPI_BASE}/en/cities.json`, {
              headers: { 'Accept': 'application/json' },
              timeout: 3000,
            });
          }
          
          if (citiesResponse?.data) {
            const cities = Array.isArray(citiesResponse.data) ? citiesResponse.data : [];
            const city = cities.find((c: any) => 
              (c.code && c.code.toUpperCase() === airport.city_code?.toUpperCase()) ||
              (c.iata && c.iata.toUpperCase() === airport.city_code?.toUpperCase())
            );
            
            if (city) {
              // В русской версии API поле name уже содержит русское название
              cityName = city.name || 
                        city.name_translations?.ru || 
                        city.name_translations?.en || 
                        '';
            }
          }
        } catch (e) {
          // Игнорируем ошибки
          console.log('Error fetching city data:', e);
        }
      }
      
      const countryName = airport.country_name || 
                         airport.country || 
                         '';
      
      // Формируем объект только с непустыми значениями
      const airportInfo: any = {
        code: airport.code || airport.iata || upperCode,
      };
      
      if (airportName) {
        airportInfo.name = airportName;
      }
      
      if (cityName) {
        airportInfo.city = cityName;
      }
      
      if (countryName) {
        airportInfo.country = countryName;
      }
      
      return NextResponse.json({
        success: true,
        valid: true,
        airport: airportInfo,
      });
    } else {
      // Если не нашли в базе, но формат правильный, проверяем через поиск билетов
      // Попробуем сделать тестовый запрос для проверки существования аэропорта
      const token = process.env.AVIASALES_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN;
      
      if (token) {
        try {
          // Пытаемся найти билеты с этим аэропортом (тестовый запрос)
          const testResponse = await axios.get('https://api.travelpayouts.com/aviasales/v3/prices_for_dates', {
            params: {
              origin: upperCode,
              destination: 'LED', // Используем известный аэропорт для теста
              departure_at: new Date().toISOString().split('T')[0],
              adults: 1,
              currency: 'rub',
              token,
            },
            headers: {
              'Accept': 'application/json',
            },
            timeout: 5000, // Короткий таймаут для быстрой проверки
          });

          // Если запрос прошел без ошибок, аэропорт существует
          return NextResponse.json({
            success: true,
            valid: true,
            airport: {
              code: upperCode,
              name: 'Airport',
              city: 'Unknown',
              cityName: 'Unknown',
              country: 'Unknown',
              countryName: 'Unknown',
            },
          });
        } catch (error: any) {
          // Если ошибка связана с неверным аэропортом, возвращаем invalid
          if (error.response?.status === 400 || error.response?.data?.error) {
            return NextResponse.json({
              success: true,
              valid: false,
              error: 'Airport not found',
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Airport not found in database',
      });
    }
  } catch (error: any) {
    console.error('Error validating airport:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error validating airport',
      },
      { status: 500 }
    );
  }
}

