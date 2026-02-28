# Фронтенд «Лучший друг»

React-приложение на Vite + TypeScript + Tailwind CSS.

## Переменные окружения

Скопируйте `.env.example` в `.env` и задайте URL бэкенда:

```bash
cp .env.example .env
```

В `.env` укажите:

- `VITE_API_BASE_URL` — базовый URL бэкенда без завершающего слэша (например, `http://localhost:8000`).

Без этой переменной запросы к API будут уходить на пустой URL.

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется на http://localhost:3000.

## Сборка

```bash
npm run build
```

Результат в папке `dist/`.
