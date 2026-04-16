import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <span className="font-bold text-gray-900">
            Admin Panel
          </span>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}