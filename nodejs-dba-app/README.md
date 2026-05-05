# Node.js DBA Management App

REST API berbasis **Express.js** dengan **MySQL** sebagai database utama dan **Redis** sebagai caching layer. Dilengkapi dokumentasi DBA lengkap.

---

## Struktur Project

```
nodejs-dba-app/
├── config/
│   ├── my.cnf              # MySQL configuration template
│   └── redis.conf          # Redis configuration template
├── scripts/
│   ├── mysql_service.sh    # MySQL service management
│   ├── redis_service.sh    # Redis service management
│   └── setup_db.sh         # Initial DB setup
├── src/
│   ├── app.js              # Entry point
│   ├── config/
│   │   ├── database.js     # Sequelize / MySQL connection
│   │   └── redis.js        # ioredis connection + cache helpers
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── dokumentasiController.js
│   │   └── logController.js
│   ├── database/
│   │   ├── migrate.js      # Run migrations
│   │   └── seed.js         # Seed initial data
│   ├── middleware/
│   │   ├── auth.js         # JWT authenticate + authorize
│   │   ├── activityLogger.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── index.js        # Associations
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── LogActivity.js
│   │   └── DocumentasiDB.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── dokumentasi.js
│   │   └── logs.js
│   └── utils/
│       ├── logger.js       # Winston logger
│       └── response.js     # Standard API response
├── .env                    # Environment variables (jangan di-commit!)
├── .env.example
├── .gitignore
└── package.json
```

---

## 1. Instalasi & Konfigurasi

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0 (via Homebrew)
- Redis >= 7.0 (via Homebrew)

### Install Dependencies

```bash
cd nodejs-dba-app
npm install
```

### MySQL via Homebrew

```bash
brew install mysql
brew services start mysql

# Secure installation
mysql_secure_installation

# Set root password
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Password09';"

# Copy config
cp config/my.cnf /opt/homebrew/etc/my.cnf
brew services restart mysql
```

**Lokasi penting:**
| Item | Path |
|------|------|
| Config | `/opt/homebrew/etc/my.cnf` |
| Data dir | `/opt/homebrew/var/mysql/` |
| Error log | `/opt/homebrew/var/mysql/error.log` |
| Slow query log | `/opt/homebrew/var/mysql/slow.log` |

### Redis via Homebrew

```bash
brew install redis
brew services start redis

# Copy config
cp config/redis.conf /opt/homebrew/etc/redis.conf
brew services restart redis
```

**Lokasi penting:**
| Item | Path |
|------|------|
| Config | `/opt/homebrew/etc/redis.conf` |
| Data dir | `/opt/homebrew/var/db/redis/` |
| Log | `/opt/homebrew/var/log/redis.log` |
| AOF file | `/opt/homebrew/var/db/redis/appendonly.aof` |

---

## 2. User & Security

### MySQL User Setup

```bash
# Jalankan script otomatis
./scripts/setup_db.sh

# Atau manual:
mysql -u root -p
```

```sql
-- Buat database
CREATE DATABASE IF NOT EXISTS `homebrew` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user aplikasi (akses terbatas ke 1 database)
CREATE USER 'dba_user'@'%' IDENTIFIED BY 'Password09';
GRANT ALL PRIVILEGES ON `homebrew`.* TO 'dba_user'@'%';
FLUSH PRIVILEGES;
```

### Redis User Setup (Redis 6+ ACL)

```bash
redis-cli -a Password09

# Buat user redis dengan password
ACL SETUSER redis on >Password09 ~* &* +@all
ACL SAVE
```

> **Best Practice:** Jangan hardcode credential di kode. Selalu gunakan `.env` file.

---

## 3. Setup Aplikasi

```bash
# Copy environment file
cp .env.example .env
# Edit .env sesuai konfigurasi lokal

# Setup database & tabel
npm run migrate

# Seed data awal (roles, admin user, sample dokumentasi)
npm run seed

# Jalankan aplikasi
npm run dev    # development (nodemon)
npm start      # production
```

---

## 4. API Endpoints

Base URL: `http://localhost:3000`

### Health Check
```
GET /health
```

### Auth
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | - | Login, dapat JWT token |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/auth/me` | ✓ | Info user saat ini |

### Users
| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/users` | admin, dba | List semua user (paginated) |
| GET | `/api/users/:id` | any | Detail user |
| POST | `/api/users` | admin | Buat user baru |
| PUT | `/api/users/:id` | admin | Update user |
| DELETE | `/api/users/:id` | admin | Soft delete user |

### Dokumentasi DB
| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/dokumentasi` | public | List dokumentasi (paginated) |
| GET | `/api/dokumentasi/:id` | public | Detail dokumentasi |
| POST | `/api/dokumentasi` | admin, dba | Buat dokumentasi |
| PUT | `/api/dokumentasi/:id` | admin, dba | Update dokumentasi |
| DELETE | `/api/dokumentasi/:id` | admin | Soft delete |

Query params: `?page=1&limit=10&db_type=mysql`

### Log Activity
| Method | Endpoint | Role | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/logs` | admin, dba | List activity logs |

Query params: `?page=1&limit=20&action=LOGIN&module=auth`

### Contoh Request

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Password09"}'
```

**Get Dokumentasi (dengan token):**
```bash
curl http://localhost:3000/api/dokumentasi \
  -H "Authorization: Bearer <token>"
```

---

## 5. Caching Strategy (Redis)

Implementasi **Cache-Aside Pattern**:

```
Request → Check Redis
           ├── HIT  → Return cached data
           └── MISS → Query MySQL → Store in Redis → Return data
```

| Resource | Cache Key | TTL |
|----------|-----------|-----|
| User list | `users:list:{page}:{limit}` | 5 menit |
| User detail | `users:{id}` | 5 menit |
| Dokumentasi list | `dokumentasi:list:{page}:{limit}:{type}` | 10 menit |
| Dokumentasi detail | `dokumentasi:{id}` | 10 menit |
| Log list | `logs:list:...` | 1 menit |

Cache di-invalidate otomatis saat data berubah (create/update/delete).

---

## 6. Monitoring & Logging

### MySQL Monitoring

```bash
# Via script
./scripts/mysql_service.sh monitor

# Manual
mysql -u dba_user -p homebrew -e "
  SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
  SHOW VARIABLES LIKE 'max_connections';
  SHOW STATUS LIKE 'Threads_connected';
  SHOW STATUS LIKE 'Slow_queries';
"
```

### Redis Monitoring

```bash
# Via script
./scripts/redis_service.sh monitor

# Manual
redis-cli -a Password09 INFO memory
redis-cli -a Password09 INFO stats
redis-cli -a Password09 MONITOR  # real-time commands
```

### Application Logs

Log disimpan di `logs/` (development) atau `LOG_DIR` dari `.env`:
- `combined.log` — semua log
- `error.log` — error saja

---

## 7. Backup & Recovery

### MySQL Backup

```bash
# Backup manual
./scripts/mysql_service.sh backup

# Backup otomatis harian (crontab)
# crontab -e
0 2 * * * /path/to/nodejs-dba-app/scripts/mysql_service.sh backup >> /var/log/mysql_backup.log 2>&1
```

### MySQL Restore

```bash
./scripts/mysql_service.sh restore /path/to/backup_20240101_020000.sql.gz
```

### Redis Durability

Redis dikonfigurasi dengan **AOF (Append Only File)** untuk durability:
- `appendonly yes` — aktifkan AOF
- `appendfsync everysec` — sync setiap detik (balance antara performance & safety)

**Restore Redis:**
```bash
brew services stop redis
cp /backup/appendonly.aof /opt/homebrew/var/db/redis/appendonly.aof
brew services start redis
```

---

## 8. Database Schema

### Tabel `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| username | VARCHAR(100) UNIQUE | Login username |
| password | VARCHAR(255) | Bcrypt hashed |
| email | VARCHAR(150) | Email address |
| full_name | VARCHAR(200) | Nama lengkap |
| active | TINYINT(1) | 1=aktif, 0=nonaktif |
| ip_comp | VARCHAR(45) | Last login IP |
| last_login | DATETIME | Waktu login terakhir |
| role_id | INT UNSIGNED FK | Referensi ke roles |
| flag | TINYINT(1) | 1=valid, 0=deleted |

### Tabel `roles`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| name | VARCHAR(100) UNIQUE | Nama role |
| description | TEXT | Deskripsi |
| permissions | JSON | Array permission |
| flag | TINYINT(1) | 1=aktif |

### Tabel `log_activities`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT UNSIGNED PK | Auto increment |
| user_id | INT UNSIGNED FK | Referensi users |
| username | VARCHAR(100) | Snapshot username |
| action | VARCHAR(100) | LOGIN, CREATE, dll |
| module | VARCHAR(100) | Modul yang diakses |
| description | TEXT | Detail aktivitas |
| ip_address | VARCHAR(45) | IP address |
| user_agent | VARCHAR(500) | Browser/client info |
| status | ENUM | success/failed/warning |

### Tabel `dokumentasi_db`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| db_type | ENUM | mysql/redis/dll |
| title | VARCHAR(255) | Judul dokumentasi |
| tutorial | LONGTEXT | Konten (Markdown) |
| summary | TEXT | Ringkasan |
| rank | INT | Urutan tampil |
| tags | JSON | Array tags |
| author_id | INT UNSIGNED FK | Referensi users |
| flag | TINYINT(1) | 1=published |

---

## 9. CI/CD & Deployment

### Environment Variables Production

```bash
APP_ENV=production
APP_PORT=3000
JWT_SECRET=<strong-random-secret-min-32-chars>
DB_HOST=<production-mysql-host>
DB_PASS=<strong-password>
REDIS_PASS=<strong-password>
LOG_DIR=/var/log/nodejs-dba-app
```

### Deploy ke Server

```bash
# 1. Clone & install
git clone <repo>
cd nodejs-dba-app
npm install --production

# 2. Setup environment
cp .env.example .env
nano .env  # isi semua nilai production

# 3. Setup database
./scripts/setup_db.sh
npm run migrate
npm run seed

# 4. Jalankan dengan PM2
npm install -g pm2
pm2 start src/app.js --name "dba-app" --env production
pm2 save
pm2 startup
```

### PM2 Ecosystem File

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dba-app',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      APP_ENV: 'production'
    }
  }]
};
```

---

## Default Credentials (Development Only)

| Service | User | Password |
|---------|------|----------|
| MySQL root | root | Password09 |
| MySQL app | dba_user | Password09 |
| Redis | redis | Password09 |
| App admin | admin | Password09 |

> ⚠️ **Ganti semua password di production!**
