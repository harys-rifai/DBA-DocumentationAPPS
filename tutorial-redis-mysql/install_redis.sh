#!/bin/bash
# setup_redis.sh
# Script untuk install Redis, konfigurasi password, ACL user, dan bind IP
REDIS_CONF="/opt/homebrew/etc/redis.conf"
echo "=== Update Homebrew ==="
brew update
echo "=== Install Redis ==="
brew install redis
echo "=== Start Redis service ==="
brew services start redis
echo "=== Konfigurasi redis.conf ==="
# Set password global
sed -i '' 's/^# *requirepass .*/requirepass Password09/' $REDIS_CONF
# Bind ke semua IP (0.0.0.0) agar bisa diakses dari luar
sed -i '' 's/^bind .*/bind 0.0.0.0/' $REDIS_CONF
# Matikan protected mode agar bisa diakses dari luar (pastikan password aktif!)
sed -i '' 's/^protected-mode .*/protected-mode no/' $REDIS_CONF
echo "=== Restart Redis service ==="
brew services restart redis
echo "=== Buat usr ACL redis ==="
redis-cli -a Password09 ACL SETUSER redis on ">Password09" allcommands allkeys
echo "=== Daftar user ACL ==="
redis-cli -a Password09 ACL LIST
echo "✅ Redis setup complete."
echo "   - Global password: Password09"
echo "   - ACL user: redis / Password09"
echo "   - Bind: 0.0.0.0 (accessible from all IPs)"