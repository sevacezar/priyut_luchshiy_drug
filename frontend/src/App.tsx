import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { AboutPage } from "@/pages/AboutPage";
import { PetsPage } from "@/pages/PetsPage";
import { PetDetailPage } from "@/pages/PetDetailPage";

export default function App() {
  return (
    <div className="text-gray-800 min-h-screen grid grid-rows-[auto_1fr]">
      <Header />
      <main className="min-h-0 flex flex-col bg-[#fafafa]">
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <Routes>
            <Route path="/" element={<PetsPage />} />
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/pets/:petId" element={<PetDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
