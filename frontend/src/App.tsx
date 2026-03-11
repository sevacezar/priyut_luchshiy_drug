import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Header } from "@/components/Header";
import { RequireAdminAuth } from "@/admin/AdminAuth";
import { AdminLoginPage } from "@/admin/AdminLoginPage";
import { AdminLayout } from "@/admin/ui";
import {
  AdminPetFormPage,
  AdminPetsListPage,
  AdminPetShowPage,
} from "@/admin/PetsPages";
import {
  AdminUserFormPage,
  AdminUsersListPage,
  AdminUserShowPage,
} from "@/admin/UsersPages";
import { AboutPage } from "@/pages/AboutPage";
import { PetsPage } from "@/pages/PetsPage";
import { PetDetailPage } from "@/pages/PetDetailPage";

function PublicLayout() {
  return (
    <div className="text-gray-800 min-h-screen grid grid-rows-[auto_1fr]">
      <Header />
      <main className="min-h-0 flex flex-col bg-[#fafafa]">
        <div className="flex-1 flex flex-col min-h-0 w-full"><Outlet /></div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<RequireAdminAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/pets" replace />} />
          <Route path="pets" element={<AdminPetsListPage />} />
          <Route path="pets/create" element={<AdminPetFormPage />} />
          <Route path="pets/:id" element={<AdminPetShowPage />} />
          <Route path="pets/:id/edit" element={<AdminPetFormPage />} />
          <Route path="users" element={<AdminUsersListPage />} />
          <Route path="users/create" element={<AdminUserFormPage />} />
          <Route path="users/:id" element={<AdminUserShowPage />} />
          <Route path="users/:id/edit" element={<AdminUserFormPage />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/" element={<PetsPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/:petId" element={<PetDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
