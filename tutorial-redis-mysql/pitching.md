🔹 Pitch Interview (2 Minute Version)
Nama saya Haris Rifai, seorang Senior DBA & Infrastructure Specialist dengan pengalaman lebih dari 15 tahun mengelola database mission-critical di sektor perbankan, asuransi, dan retail. Saya terbiasa menangani PostgreSQL, SQL Server, Oracle, DB2, MySQL, Greenplum, EDB, dan MongoDB Atlas, dengan fokus pada high availability, automation, compliance, dan cost optimization.

Di Prudential Indonesia, saya melakukan migrasi PostgreSQL, DB2, dan SQL Server workloads ke GCP dan Azure yang berhasil mencapai 99.9% uptime sekaligus menurunkan biaya operasional hingga 30%. Saya juga mengelola PostgreSQL & SQL Server clusters untuk lebih dari 200 aplikasi, memastikan zero downtime dalam setiap quarterly release.  

Sebelumnya di Bank Indonesia, saya bertanggung jawab atas Oracle & SQL Server databases untuk infrastruktur finansial berskala nasional, dengan pencapaian 99.99% uptime sebagai bagian dari core banking system.

Di Sumber Alfaria Trijaya, saya melakukan migrasi database legacy ke SQL Server & Oracle Core DB, yang meningkatkan kecepatan pengambilan data hingga 35% dan mendukung ekspansi ritel dengan sistem yang lebih stabil.

Fokus saya selalu pada uptime, efisiensi biaya, dan keamanan data, serta memastikan sistem database mendukung kebutuhan bisnis secara berkelanjutan.”
---

---
🔹 DBA Maintenance Checklist (MySQL & PostgreSQL)
1. Backup
• MySQL → mysqldump, mysqlpump, atau Percona XtraBackup untuk physical backup.
• PostgreSQL → pg_dump, pg_dumpall, atau pg_basebackup + WAL logs untuk PITR.
• Routine: Harian (incremental), Mingguan (full), Bulanan (archival).
---
2. Reindex
• PostgreSQL → REINDEX TABLE table_name; untuk mengatasi index bloat.
• MySQL → OPTIMIZE TABLE table_name; untuk defragmentasi index.
• Routine: Bulanan atau saat index size > table size.
---
3. Vacuum
• PostgreSQL → VACUUM untuk bersihkan dead tuples.
• VACUUM FULL → rebuild tabel (lebih berat).
• MySQL → implicit lewat OPTIMIZE TABLE.
• Routine: Mingguan, atau otomatis dengan autovacuum.
---
4. Reorg (Reorganization)
• PostgreSQL → pg_repack untuk reorganisasi tabel/index tanpa downtime.
• DB2/SQL Server → REORG TABLE atau ALTER INDEX REORGANIZE.
• Routine: Saat tabel/index fragmented.
---
5. Analyze
• PostgreSQL → ANALYZE table_name; untuk update statistik query planner.
• MySQL → ANALYZE TABLE table_name;.
• Routine: Harian/mingguan, terutama setelah bulk insert/update/delete.
---
6. Query Planner
• Gunakan EXPLAIN / EXPLAIN ANALYZE untuk cek apakah index dipakai.
• Identifikasi slow queries via slow query log (MySQL) atau pg_stat_statements (Postgres).
• Routine: Harian untuk query kritis, mingguan untuk audit performa.
---
7. Resource Planner
• Monitor CPU, Memory, I/O, Connection Pool.
• PostgreSQL → pg_stat_activity, pg_stat_database.
• MySQL → SHOW PROCESSLIST, Performance Schema.
• Routine: Real-time monitoring + dashboard (Zabbix, Prometheus, Grafana).


---
🔹 Pertimbangan Teknis
• Scalability → Cloud bisa auto-scale (compute, storage) sesuai kebutuhan, sementara on-prem perlu beli hardware baru.
• High Availability & DR → Cloud menyediakan multi-region replication lebih mudah, sedangkan on-prem butuh setup DRC manual.
• Maintenance → Cloud provider urus patching OS/hardware, DBA fokus ke database layer. On-prem DBA harus urus full stack.
• Performance → Cloud punya fleksibilitas instance type, tapi latency bisa lebih tinggi dibanding on-prem lokal.
---
🔹 Pertimbangan Bisnis
• Cost Model → Cloud = OPEX (bayar sesuai pemakaian), On-prem = CAPEX (investasi hardware besar di awal).
• Time to Market → Cloud lebih cepat deploy (minutes vs weeks).
• Flexibility → Cloud mudah integrasi dengan layanan lain (AI, analytics, monitoring).
• Vendor Lock-in → Risiko terikat ke provider (AWS, GCP, Azure). On-prem lebih bebas custom.
---
🔹 Pertimbangan Compliance & Security
• Data Residency → Beberapa regulasi (banking, insurance) mewajibkan data tetap di Indonesia/on-prem.
• Audit & Control → On-prem memberi kontrol penuh, cloud harus percaya pada shared responsibility model.
• Security Tools → Cloud punya native tools (IAM, KMS, audit logs), tapi integrasi dengan PAM (CyberArk) dan SIEM (Splunk, Dynatrace, BigPanda) tetap perlu.
---
🔹 Rule of Thumb
• Cloud lebih cocok → untuk workload yang butuh fleksibilitas, cepat scale, dan integrasi modern (SaaS, analytics).
• On-prem lebih cocok → untuk workload yang sangat sensitif (core banking, regulasi ketat, latency rendah).
• Hybrid → sering jadi solusi: core DB tetap on-prem, reporting/analytics di cloud.

--- 
