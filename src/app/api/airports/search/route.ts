import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const AViasalesAPI_BASE = 'https://api.travelpayouts.com/data';

/**
 * Поиск городов и аэропортов по названию (русский и английский)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Query parameter is required (min 2 characters)' },
      { status: 400 }
    );
  }

  try {
    const searchQuery = query.trim();
    const results: any[] = [];

    // Получаем список городов
    let citiesResponse;
    try {
      citiesResponse = await axios.get(`${AViasalesAPI_BASE}/ru/cities.json`, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });
    } catch (e) {
      citiesResponse = await axios.get(`${AViasalesAPI_BASE}/en/cities.json`, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });
    }

    if (citiesResponse?.data) {
      const cities = Array.isArray(citiesResponse.data) ? citiesResponse.data : [];
      const searchLower = searchQuery.toLowerCase();

      // Ищем города по названию (русский и английский)
      const matchingCities = cities.filter((city: any) => {
        const cityNameRu = city.name?.toLowerCase() || '';
        const cityNameEn = city.name_translations?.en?.toLowerCase() || '';
        const cityCode = city.code?.toLowerCase() || '';
        
        return cityNameRu.includes(searchLower) || 
               cityNameEn.includes(searchLower) ||
               cityCode === searchLower;
      }).slice(0, 10); // Ограничиваем до 10 результатов

      // Для каждого найденного города ищем аэропорты
      let airportsResponse;
      try {
        airportsResponse = await axios.get(`${AViasalesAPI_BASE}/ru/airports.json`, {
          headers: { 'Accept': 'application/json' },
          timeout: 5000,
        });
      } catch (e) {
        airportsResponse = await axios.get(`${AViasalesAPI_BASE}/en/airports.json`, {
          headers: { 'Accept': 'application/json' },
          timeout: 5000,
        });
      }

      if (airportsResponse?.data) {
        const airports = Array.isArray(airportsResponse.data) ? airportsResponse.data : [];

        for (const city of matchingCities) {
          // Ищем аэропорты в этом городе (только настоящие аэропорты, не жд вокзалы и т.д.)
          const cityAirports = airports.filter((airport: any) => 
            airport.city_code?.toUpperCase() === city.code?.toUpperCase() &&
            airport.flightable === true &&
            airport.iata_type === 'airport' // Только аэропорты, исключаем жд вокзалы, автовокзалы и т.д.
          );

          // Если есть аэропорты, добавляем каждый аэропорт отдельно
          if (cityAirports.length > 0) {
            // Добавляем все аэропорты города
            for (const airport of cityAirports) {
              results.push({
                type: 'airport',
                city: {
                  code: city.code,
                  name: city.name,
                  nameEn: city.name_translations?.en || city.name,
                  country: city.country_code,
                },
                airport: {
                  code: airport.code || airport.iata,
                  name: airport.name_translations?.ru || 
                        airport.name_translations?.en || 
                        airport.name,
                  city: city.name,
                },
                airportsCount: cityAirports.length,
              });
            }
          }
        }
      }
    }

    // Также ищем аэропорты напрямую по названию
    let airportsResponse;
    try {
      airportsResponse = await axios.get(`${AViasalesAPI_BASE}/ru/airports.json`, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });
    } catch (e) {
      airportsResponse = await axios.get(`${AViasalesAPI_BASE}/en/airports.json`, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });
    }

    if (airportsResponse?.data) {
      const airports = Array.isArray(airportsResponse.data) ? airportsResponse.data : [];
      const searchLower = searchQuery.toLowerCase();

      // Ищем аэропорты по названию или коду (только настоящие аэропорты)
      const matchingAirports = airports.filter((airport: any) => {
        const airportNameRu = airport.name?.toLowerCase() || '';
        const airportNameEn = airport.name_translations?.en?.toLowerCase() || '';
        const airportCode = airport.code?.toLowerCase() || '';
        
        return (airportNameRu.includes(searchLower) || 
                airportNameEn.includes(searchLower) ||
                airportCode === searchLower) &&
               airport.flightable === true &&
               airport.iata_type === 'airport'; // Только аэропорты, исключаем жд вокзалы, автовокзалы и т.д.
      }).slice(0, 5); // Ограничиваем до 5 результатов

      for (const airport of matchingAirports) {
        // Проверяем, не добавили ли мы уже этот аэропорт
        const airportCode = airport.code || airport.iata;
        const cityCode = airport.city_code;
        const alreadyAdded = results.some(r => r.airport?.code === airportCode);
        
        if (!alreadyAdded) {
          // Получаем название города
          let cityName = airport.city_name || airport.city || '';
          
          if (!cityName && cityCode) {
            // Ищем город по коду
            try {
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
                  c.code?.toUpperCase() === cityCode?.toUpperCase()
                );
                
                if (city) {
                  cityName = city.name || city.name_translations?.en || '';
                }
              }
            } catch (e) {
              // Игнорируем ошибки
            }
          }

          results.push({
            type: 'airport',
            city: {
              code: cityCode,
              name: cityName,
              nameEn: cityName,
              country: airport.country_code,
            },
            airport: {
              code: airport.code || airport.iata,
              name: airport.name_translations?.ru || 
                    airport.name_translations?.en || 
                    airport.name,
              city: cityName,
            },
            airportsCount: 1,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: results.slice(0, 10), // Ограничиваем общее количество результатов
    });
  } catch (error: any) {
    console.error('Error searching cities/airports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error searching cities/airports',
      },
      { status: 500 }
    );
  }
}

