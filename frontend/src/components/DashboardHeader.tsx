export default function DashboardHeader() {
  return (
    <header className="bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md z-10">
      <div className="flex items-center gap-2">
        <div className="bg-white text-indigo-900 rounded-lg p-1 font-bold text-xl px-3">S</div>
        <h1 className="text-xl font-bold tracking-tight">Saarthi AI</h1>
        <span className="text-indigo-300 text-xs ml-2 border border-indigo-700 rounded px-1">MVP</span>
      </div>
      
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-4 text-sm font-medium">
          <a href="#" className="text-indigo-200 hover:text-white transition">Explore Services</a>
          <a href="#" className="text-indigo-200 hover:text-white transition">My Documents</a>
          <a href="#" className="text-indigo-200 hover:text-white transition">Schemes</a>
        </nav>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-sm font-bold border border-indigo-500">
            A
          </div>
          <span className="text-sm font-medium hidden sm:inline">Anil Kumar</span>
        </div>
      </div>
    </header>
  );
}
