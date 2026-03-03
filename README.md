# 🐊 Gator CLI - RSS Feed Aggregator

Gator is a command-line RSS feed aggregator built with:

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM

It allows users to:
- Register and login
- Add RSS feeds
- Follow and unfollow feeds
- Aggregate posts from feeds
- Browse latest posts directly in the terminal

---

## 📦 Requirements

To run this project locally you need:

- Node.js (v18+ recommended)
- PostgreSQL
- npm
- Git

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/sammahkh/gator.git
cd YOUR_REPO
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file in the root:

```
DATABASE_URL=postgresql://username:password@localhost:5432/gator
```

If using Supabase or hosted DB, paste your connection string here.

---

### 4️⃣ Run migrations

```bash
npm run generate
npm run migrate
```

---

### 5️⃣ Run the CLI

```bash
npm run start register samah
npm run start login samah
```

---

## 🚀 Available Commands

### Register a user
```
npm run start register <username>
```

### Login
```
npm run start login <username>
```

### Add a feed
```
npm run start addfeed <feed_name> <feed_url>
```

### Follow a feed
```
npm run start follow <feed_url>
```

### Unfollow a feed
```
npm run start unfollow <feed_url>
```

### Show followed feeds
```
npm run start following
```

### Aggregate feeds (long-running loop)
```
npm run start agg 1m
```

### Browse posts
```
npm run start browse
npm run start browse 5
```

---

## 🧠 How It Works

- Feeds are stored in the database.
- Users can follow feeds.
- The `agg` command continuously fetches RSS feeds.
- Posts are saved to the database.
- The `browse` command displays posts from followed feeds.

---

## 🛑 Stopping the Aggregator

Press:

```
Ctrl + C
```

to gracefully shut down the aggregator.

---

## 🏗 Architecture

- `schema.ts` → Database schema
- `queries/` → Database query functions
- `rss.ts` → RSS parsing logic
- `scrapeFeeds.ts` → Feed aggregator
- `commands/` → CLI handlers
- `middleware/` → Logged-in middleware

---

## 👩🏻‍💻 Author

Built by Samah Bani Odeh.