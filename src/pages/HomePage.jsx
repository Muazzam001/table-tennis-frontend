import Card from '../components/atoms/Card';

const HomePage = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Table Tennis Tournament
        </h1>
        <p className="text-xl text-gray-600">
          Manage your in-house tournament with ease
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Players</h3>
          <p className="text-gray-600 text-sm">Manage 24 players with different expertise levels</p>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Teams</h3>
          <p className="text-gray-600 text-sm">Generate 12 teams from 24 players</p>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-3">⚔️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Matches</h3>
          <p className="text-gray-600 text-sm">Schedule and track match results</p>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h3>
          <p className="text-gray-600 text-sm">View player and team performance</p>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;

