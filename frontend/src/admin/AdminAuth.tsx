import { Icon } from "@iconify/react";
import { useIsAuthenticated } from "@refinedev/core";
import { Navigate, Outlet } from "react-router-dom";

export function RequireAdminAuth() {
  const { data, isLoading } = useIsAuthenticated();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f6f8f7_0%,#fcfaf5_100%)]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E4] bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
          <Icon icon="solar:refresh-linear" className="animate-spin text-lg text-primary" />
          Проверяем доступ администратора...
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
