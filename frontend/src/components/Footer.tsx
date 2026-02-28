import { Icon } from "@iconify/react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:heart-angle-linear" className="text-primary text-xl" />
          <span className="text-sm font-medium text-gray-900">Лучший друг © 2024</span>
        </div>
        <div className="text-sm text-gray-500">Помогаем питомцам обрести дом.</div>
      </div>
    </footer>
  );
}
