# Movie Quiz App 🎬🎮

Интерактивное приложение для проведения киновикторин в реальном времени.

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/YOUR_USERNAME/movie-quiz-app.git
cd movie-quiz-app
```

2. **Настройте Backend**
```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env файл с вашими данными
npx prisma migrate dev
npm run dev
```

3. **Настройте Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Отредактируйте .env файл
npm run dev
```

4. **Откройте приложение**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 📦 Технологии

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- Socket.io Client
- React Router
- Framer Motion

### Backend
- Node.js
- Express
- Socket.io
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer

## 🌐 Деплой

Подробная инструкция по деплою находится в файле [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Рекомендуемые платформы:**
- Frontend: Vercel
- Backend + DB: Railway

## 📝 Лицензия

MIT

## 👨‍💻 Автор

Ваше имя
