export default function Navbar({ 
  user, 
  setUser, 
  activeTab = 'catalog', 
  setActiveTab, 
  onOpenLogin 
}) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Helper to prevent showing duplicate names like "Dani Dani" -> "Dani"
  const getCleanName = (name) => {
    if (!name) return 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts[0];
    }
    return name;
  };

  return (
    <header className="w-full text-white sticky top-0 z-40">
      {/* Top Bar: TicketHub Branding & Main Auth Action */}
      <div className="bg-[#060913] border-b border-slate-800/60 px-8 py-2.5 flex justify-between items-center text-sm">
        <span className="font-bold tracking-wide text-slate-200">TicketHub</span>
        
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">👋 Hi, <strong className="text-blue-400">{getCleanName(user.name)}</strong></span>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-xs text-red-400 px-3 py-1 rounded transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-1.5 rounded-md transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Sub-Header: CineWave Logo & Navigation Tabs */}
      <div className="bg-[#0b0f19] border-b border-slate-800/80 px-8 py-3 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActiveTab && setActiveTab('catalog')}
        >
          <span className="text-xl">🎬</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            CineWave
          </h1>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <button
            onClick={() => setActiveTab && setActiveTab('catalog')}
            className={`transition ${
              activeTab === 'catalog'
                ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('mytickets')}
            className={`transition ${
              activeTab === 'mytickets'
                ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Tickets
          </button>
        </div>
      </div>
    </header>
  );
}