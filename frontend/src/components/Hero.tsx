import { Icon } from "@iconify/react";

interface HeroProps {
  totalCount?: number;
}

export function Hero({ totalCount }: HeroProps) {
  return (
    <section className="bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 40L40 0H20L0 20M40 40V20L20 40"
                fill="none"
                stroke="#F1E3C3"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern)" />
        </svg>
      </div>
      <div className="sm:px-6 lg:px-8 z-10 max-w-7xl mr-auto ml-auto pt-16 pr-4 pb-16 pl-4 relative">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-cream mb-6">
            Найдите нового лучшего друга
          </h1>
          <p className="text-lg text-cream/80 mb-8 leading-relaxed max-w-xl">
            В нашем приюте ждут домов собаки и кошки. Выберите питомца по душе — мы поможем с знакомством и
            оформлением.
          </p>
          {totalCount != null && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2 text-base font-medium text-gold bg-gold/20 border-gold/30 border rounded-full pt-2 pr-4 pb-2 pl-4 backdrop-blur-sm items-center">
                <Icon icon="solar:heart-linear" className="text-xl" />
                {totalCount} питомцев ищут дом
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
