# Prompt: Dokumentasi Manajemen DBA untuk Node.js + MySQL + Redis

Buatkan struktur project Node.js dengan:

- Express.js sebagai web framework

- MySQL sebagai database utama

- Redis sebagai caching layer

Sertakan dokumentasi DBA yang mencakup:

1. **Instalasi & Konfigurasi**

   - MySQL via Homebrew (lokasi `my.cnf`, `datadir`, log file).

   - Redis via Homebrew (lokasi `redis.conf`, user/password).

   - Service management dengan `brew services`.

2. **User & Security**

   - Buat user MySQL dengan hak akses terbatas untuk aplikasi.

   - Buat user Redis dengan password (`redis:Password09`).

   - Catat best practice: jangan hardcode credential, gunakan `.env`.

3. **Monitoring & Logging**

   - MySQL: aktifkan `slow_query_log`, cek `innodb_buffer_pool_size`, `max_connections`.

   - Redis: monitor memory usage, eviction policy.

   - Simpan log di folder `/opt/homebrew/var/{mysql,redis}`.

4. **Backup & Recovery**

   - MySQL: gunakan `mysqldump` untuk backup harian.

   - Redis: aktifkan `appendonly.aof` untuk durability.

   - Dokumentasikan langkah restore.

5. **Integrasi Node.js**

   - Buat koneksi MySQL dengan `mysql2` atau `sequelize`.

   - Buat koneksi Redis dengan `ioredis`.

   - Implementasi caching query: cek Redis dulu, kalau miss ambil dari MySQL lalu simpan ke Redis.

6. **CI/CD & Deployment**

   - Script otomatis untuk start/stop service (`mysql_service.sh`, `redis_service.sh`).

   - `.env` file untuk semua credential dan konfigurasi.

   - Dokumentasi cara deploy di server production.

Output yang dihasilkan:

- Struktur folder Node.js project.

- Contoh file `.env`.

- Contoh `my.cnf` dan `redis.conf`.

- Script shell untuk service management.

- README dokumentasi DBA (instalasi, konfigurasi, backup, monitoring).
7. **~Database**
beserta database dengan config : 

mysql : 

host: localhost
db: homebrew
user : dba_user
passw: Password09
port: 3306

redis:

127.0.0.1
user redis
pass: Password09
port: 6379

8. **Table**

table : user (id,username,password, active, ipcomp, log, etc), role, log_actifity, DocumentasiDB (id,db_type, title, tutot, rank, flag etc), etc

9. **Aurora Cybersec Visual Style**

• Theme: Dark background (#0A0F1C)
• Accent: Neon cyan (#00FFFF), purple (#9D4EDD)
• Typography: Monospace for code, sleek sans-serif for docs
• Layout: Modular sections, futuristic icons