import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

const DONATE_URL = "https://vk.com/app6013442_-23396463?form_id=1#form_id=1";
const VK_GROUP_URL = "https://vk.com/club23396463";

const texturedGreenStyle = {
  backgroundColor: "#0C5A56",
  backgroundImage:
    "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.06) 0, rgba(255,255,255,0) 38%), linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)",
};

export function AboutPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="flex-1">
      <section style={texturedGreenStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div data-reveal className="reveal max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-cream mb-4">Приют «Лучший Друг»</h1>
            <p className="text-cream/90 text-lg leading-relaxed mb-6">
              Приют существует только за счет пожертвований людей и деятельности волонтеров.
              Даже 100, 200 и 300 рублей посильной поддержки помогают нам обеспечивать питомцев
              всем необходимым.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition-colors"
              >
                <Icon icon="solar:heart-linear" className="text-lg" />
                Пожертвовать
              </a>
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-cream font-medium rounded-xl hover:bg-white/20 transition-colors"
              >
                Полная информация в ВК
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div data-reveal className="reveal grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Куда уходят средства</h2>
              <p className="text-gray-700 leading-relaxed">
                Постоянно нужны средства на ветеринарные и коммунальные услуги, лекарства,
                продукты, охрану приюта и ежедневный уход за животными. Мы честно рассказываем
                о нуждах и благодарны любой помощи.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Важно к переводу</h2>
              <p className="text-gray-700 leading-relaxed">
                При перечислении средств укажите назначение платежа:
                <span className="block mt-2 font-medium text-primary">
                  «благотворительное пожертвование на уставные цели».
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={texturedGreenStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div data-reveal className="reveal bg-white/10 border border-white/20 rounded-2xl p-6 md:p-8">
            <h2 className="text-3xl font-semibold tracking-tight text-cream mb-6">Реквизиты приюта</h2>
            <div className="grid md:grid-cols-2 gap-5 text-cream/95">
              <div className="space-y-1">
                <div>ООО «Банк Точка»</div>
                <div className="text-sm text-cream/80">Получатель: ТООО «Общество защиты животных»</div>
                <div>Расчётный счёт: 40703810720000001374</div>
                <div>БИК: 044525104</div>
                <div>Корр. счёт: 30101810745374525104</div>
              </div>
              <div className="space-y-1">
                <div>ИНН: 7202173305</div>
                <div>КПП: 720301001</div>
                <div>Карта Банка Точка: 2204 4502 4571 9825</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition-colors"
              >
                Кнопка «Пожертвовать»
              </a>
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-cream font-medium rounded-xl hover:bg-white/20 transition-colors"
              >
                Все реквизиты и отчеты
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div data-reveal className="reveal">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-8">Чем можно помочь приюту</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              <article className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Для собак</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Говяжья обрезь, печень, почки, куриные желудочки и сердечки, тушки, рис, гречка,
                  кефир, творог, ряженка, мясные и собачьи консервы.
                </p>
              </article>
              <article className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Для кошек</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Сухой и влажный корм Royal Canin Sterilised, древесный наполнитель и регулярная
                  поддержка расходниками.
                </p>
              </article>
              <article className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ветаптека</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Мультикан-8, средства от блох и клещей, антигельминтные препараты,
                  Фортифлора, Селафорт, Инспектор Квадро К, Мелаксивет.
                </p>
              </article>
              <article className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Быт и ремонт</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Пакеты 120/160 л, «Лайна», гели для посуды, ОСБ, бруски, пеноплекс, доски,
                  а также помощь руками и техникой.
                </p>
              </article>
            </div>
            <div className="mt-8">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Полный список актуальных нужд
                <Icon icon="solar:arrow-right-linear" className="text-lg" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section style={texturedGreenStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div data-reveal className="reveal max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-cream mb-4">Спасибо за помощь</h2>
            <p className="text-cream/90 text-lg leading-relaxed">
              Не существует слишком маленькой суммы или незначительного участия.
              Вклад каждого в общее дело бесконечно важен для животных, которые ждут дом.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
