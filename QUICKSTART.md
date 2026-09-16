# ⚡ QUICK START - Запуск за 5 минут

## 1️⃣ Требования

- Docker Desktop установлен (Windows, macOS, Linux)
- Свободные порты: 3000, 5432, 1025, 8025

## 2️⃣ Клонируй репозиторий

```bash
git clone <your-repo> nella-fullstack
cd nella-fullstack
```

## 3️⃣ Создай `.env` файл

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

Или просто отредактируй существующий `.env` — там уже все есть!

## 4️⃣ Запусти Docker Compose

```bash
docker compose up -d
```

⏳ **Первый запуск займёт 2-3 минуты** (качает образы, устанавливает зависимости, мигрирует БД).

## 5️⃣ Открой в браузере

- 🛍️ **Магазин:** http://localhost:3000
- 👨‍💼 **Админка:** http://localhost:3000/admin
- 📧 **Письма:** http://localhost:8025

## 🔐 Логин в админку

```
Email:    admin@nella.local
Пароль:   admin123
```

---

## ✅ Всё готово!

**Что дальше:**
- Перейди в админку и создай товары
- Проверь магазин на главной странице
- Попробуй добавить товар в корзину
- Оформи пробный заказ
- Посмотри письмо в MailHog (http://localhost:8025)

---

## 🛑 Если что-то сломалось

### Контейнер падает

```bash
docker compose logs nella-app
```

### Очистить и пересоздать

```bash
docker compose down -v
docker compose up -d
```

### Войти в контейнер

```bash
docker exec -it nella-app sh
```

---

## 📚 Полная документация

- **INSTALL.md** — детальная инструкция
- **README.md** — структура проекта
- **.env.example** — все переменные с описанием

---

## 🎉 Готово!

Наслаждайся разработкой! 🚀

