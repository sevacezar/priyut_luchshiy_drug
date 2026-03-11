import { useState, type FormEvent } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { authProvider } from "@/admin/core";
import { useToast } from "@/components/ToastProvider";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await authProvider.login?.({ email, password });
      if (!result?.success) {
        showToast(result?.error?.message ?? "Не удалось выполнить вход", "error", "Ошибка входа");
        return;
      }
      navigate("/admin/pets", { replace: true });
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Не удалось выполнить вход", "error", "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(247,197,32,0.18),transparent_28%),linear-gradient(160deg,#f2f7f6_0%,#f8f3e8_50%,#fffdf9_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-[#0F6C67] bg-[linear-gradient(155deg,#0C5A56_0%,#13736D_100%)] p-8 text-cream shadow-[0_40px_80px_-46px_rgba(12,90,86,0.9)]">
          <div className="inline-flex rounded-2xl bg-white/10 p-3">
            <Icon icon="solar:shield-user-linear" className="text-3xl" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Вход в административную панель</h1>
          <p className="mt-2 text-sm text-cream/80">Введите почту и пароль администратора.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-cream/90">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cream/45 focus:border-white/30 focus:ring-4 focus:ring-white/10"
                placeholder="admin@example.com"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-cream/90">Пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-cream/45 focus:border-white/30 focus:ring-4 focus:ring-white/10"
                placeholder="Введите пароль"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E24F36] bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(244,86,60,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#E24F36] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Icon icon="solar:refresh-linear" className="animate-spin text-lg" />
              ) : (
                <Icon icon="solar:login-2-linear" className="text-lg" />
              )}
              Войти
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
