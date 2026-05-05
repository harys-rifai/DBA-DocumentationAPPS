mysqldump -u root -p \
  --all-databases \
  --triggers \
  --routines \
  --events \
  --single-transaction \
  --set-gtid-purged=OFF \
  > backup.sql