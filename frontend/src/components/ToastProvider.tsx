import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Icon } from "@iconify/react";

type ToastTone = "error" | "info" | "success";

type ToastItem = {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClassMap: Record<ToastTone, string> = {
  error: "border-[#F2B3A7] bg-[#FFF1ED] text-[#A33924]",
  info: "border-[#B7D7D4] bg-[#F1F8F7] text-[#0C5A56]",
  success: "border-[#B8DEC6] bg-[#F1FAF4] text-[#1F7A3D]",
};

const toneIconMap: Record<ToastTone, string> = {
  error: "solar:danger-triangle-bold",
  info: "solar:info-circle-bold",
  success: "solar:check-circle-bold",
};

const toneTitleMap: Record<ToastTone, string> = {
  error: "Ошибка",
  info: "Информация",
  success: "Успешно",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const showToast = useCallback((message: string, tone: ToastTone = "info", title?: string) => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, title: title ?? toneTitleMap[tone], message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`toast-slide-in pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_22px_46px_-30px_rgba(0,0,0,0.42)] backdrop-blur-sm ${toneClassMap[item.tone]}`}
          >
            <div className="flex items-start gap-3">
              <Icon icon={toneIconMap[item.tone]} className="mt-0.5 shrink-0 text-lg" />
              <div>
                <div className="text-sm font-semibold leading-none">{item.title}</div>
                <div className="mt-1 text-sm leading-relaxed opacity-90">{item.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
