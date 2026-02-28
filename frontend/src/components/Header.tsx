import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="sm:px-6 lg:px-8 flex h-20 max-w-7xl mr-auto ml-auto pr-4 pl-4 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-primary p-2 rounded-xl group-hover:bg-accent transition-colors duration-300 flex items-center justify-center">
            <Icon icon="solar:heart-angle-linear" className="text-cream text-2xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-primary">Лучший друг</span>
            <span className="text-sm text-gray-500 font-medium">Приют для животных</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/pets" className="text-base font-medium text-gray-600 hover:text-primary transition-colors">
            Питомцы
          </Link>
          <a href="#" className="text-base font-medium text-gray-600 hover:text-primary transition-colors">
            О нас
          </a>
          <a href="#" className="text-base font-medium text-gray-600 hover:text-primary transition-colors">
            Волонтёрам
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="tel:+79199509109"
            className="hidden sm:flex items-center gap-2 text-base font-medium text-primary hover:text-accent transition-colors"
          >
            <Icon icon="solar:phone-linear" className="text-xl" />
            +7 (919) 950-91-09
          </a>
          <button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Меню"
          >
            <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
          </button>
        </div>
      </div>
    </header>
  );
}
