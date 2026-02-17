import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

export function Layout() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (q) navigate(`/search?text=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-black/20">
        <Link to="/" className="font-semibold mr-2">
          Sparkling Journey
        </Link>
        <nav className="flex gap-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "text-[#8888ff] font-semibold" : undefined
            }
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "text-[#8888ff] font-semibold" : undefined
            }
          >
            Settings
          </NavLink>
        </nav>
        <form
          onSubmit={handleSearch}
          className="ml-auto flex flex-wrap gap-3 items-center"
        >
          <input
            type="search"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="min-w-[180px]"
          />
          <button type="submit">Search</button>
        </form>
      </header>
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full box-border">
        <Outlet />
      </main>
    </div>
  );
}
