import FlightSearch from '@/components/FlightSearch';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="py-12 px-4">
        <div className="w-full">
          <FlightSearch />
        </div>
      </main>
    </div>
  );
}


