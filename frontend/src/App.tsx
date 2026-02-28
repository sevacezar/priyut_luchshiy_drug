import { Link, Routes, Route } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PetsPage } from "@/pages/PetsPage";

function HomePage() {
  return (
    <>
      <Hero />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600 mb-8">
          Перейдите в раздел «Питомцы», чтобы посмотреть животных, ищущих дом.
        </p>
        <div className="flex justify-center">
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Смотреть питомцев
          </Link>
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="text-gray-800 min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pets" element={<PetsPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
