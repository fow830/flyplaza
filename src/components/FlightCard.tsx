import { FlightTicket } from '@/lib/flights';

interface FlightCardProps {
  ticket: FlightTicket;
  index: number;
}

export default function FlightCard({ ticket, index }: FlightCardProps) {
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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'short',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            #{index + 1}
          </div>
          <div>
            <p className="text-sm text-gray-500">{formatDate(ticket.date)}</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">
                {ticket.airline}
              </p>
              {ticket.isDirect ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Прямой рейс
                </span>
              ) : ticket.transfers !== undefined && ticket.transfers > 0 ? (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {ticket.transfers} {ticket.transfers === 1 ? 'пересадка' : ticket.transfers === 2 || ticket.transfers === 3 || ticket.transfers === 4 ? 'пересадки' : 'пересадок'}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {formatPrice(ticket.price)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Вылет</p>
          <p className="text-sm font-medium">{ticket.departureTime || 'Не указано'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Прилет</p>
          <p className="text-sm font-medium">{ticket.arrivalTime || 'Не указано'}</p>
        </div>
        {ticket.duration && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1">Длительность</p>
            <p className="text-sm font-medium">{ticket.duration}</p>
          </div>
        )}
      </div>

      <a
        href={ticket.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Посмотреть на Aviasales
      </a>
    </div>
  );
}

