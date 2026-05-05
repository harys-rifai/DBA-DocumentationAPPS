/**
 * seed_runbook100.js
 * Inserts 100 database runbook/documentation entries into dokumentasi_db.
 * Entries are split by db_type and cover both RHEL (Linux) and Windows versions.
 *
 * Usage: node src/database/seed_runbook100.js
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const { RunbookAI } = require('../models/index');
const logger = require('../utils/logger');

const DOCS = [
  // ═══════════════════════════════════════════════════════════
  // MySQL - RHEL/Linux (10 docs)
  // ═══════════════════════════════════════════════════════════
  {
    db_type: 'mysql',
    title: 'MySQL 8.0 Installation on RHEL 9',
    summary: 'Complete guide to install MySQL 8.0 on Red Hat Enterprise Linux 9 using yum repository.',
    tutorial: `# MySQL 8.0 Installation on RHEL 9

## Prerequisites
- RHEL 9 system with root access
- Internet connection

## Installation Steps

\`\`\`bash
# Add MySQL Yum Repository
sudo dnf install -y https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm

# Install MySQL Server
sudo dnf install -y mysql-community-server

# Start MySQL Service
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary root password
sudo grep 'temporary password' /var/log/mysqld.log

# Secure installation
sudo mysql_secure_installation
\`\`\`

## Post-Installation
- Change root password
- Remove anonymous users
- Disable remote root login
- Remove test database`,
    rank: 1,
    tags: ['mysql', 'rhel', 'linux', 'installation', 'mysql8']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Performance Tuning on RHEL',
    summary: 'Optimize MySQL performance on RHEL systems with InnoDB buffer pool, query cache, and connection tuning.',
    tutorial: `# MySQL Performance Tuning on RHEL

## Key Configuration Parameters

Edit \`/etc/my.cnf\`:

\`\`\`ini
[mysqld]
# InnoDB Settings
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection Settings
max_connections = 500
max_connect_errors = 100000

# Query Cache (MySQL 5.7)
query_cache_type = 1
query_cache_size = 256M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
\`\`\`

## Apply Changes
\`\`\`bash
sudo systemctl restart mysqld
\`\`\``,
    rank: 2,
    tags: ['mysql', 'rhel', 'performance', 'tuning', 'innodb']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Backup Strategy on RHEL',
    summary: 'Implement automated MySQL backups using mysqldump and binary logs on RHEL systems.',
    tutorial: `# MySQL Backup Strategy on RHEL

## Full Backup with mysqldump

\`\`\`bash
#!/bin/bash
# /usr/local/bin/mysql_backup.sh

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="backup_user"
MYSQL_PASS="SecurePass123"

mkdir -p $BACKUP_DIR

mysqldump -u$MYSQL_USER -p$MYSQL_PASS \\
  --all-databases \\
  --single-transaction \\
  --routines \\
  --triggers \\
  --events \\
  | gzip > $BACKUP_DIR/full_backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
\`\`\`

## Enable Binary Logging

Edit \`/etc/my.cnf\`:
\`\`\`ini
[mysqld]
log-bin=/var/log/mysql/mysql-bin
expire_logs_days=7
max_binlog_size=100M
\`\`\`

## Automate with Cron
\`\`\`bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/mysql_backup.sh
\`\`\``,
    rank: 3,
    tags: ['mysql', 'rhel', 'backup', 'mysqldump', 'automation']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Replication Setup on RHEL',
    summary: 'Configure MySQL master-slave replication for high availability on RHEL systems.',
    tutorial: `# MySQL Replication Setup on RHEL

## Master Configuration

Edit \`/etc/my.cnf\` on master:
\`\`\`ini
[mysqld]
server-id=1
log-bin=mysql-bin
binlog-do-db=production_db
\`\`\`

Create replication user:
\`\`\`sql
CREATE USER 'repl'@'%' IDENTIFIED BY 'ReplPass123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
SHOW MASTER STATUS;
\`\`\`

## Slave Configuration

Edit \`/etc/my.cnf\` on slave:
\`\`\`ini
[mysqld]
server-id=2
relay-log=mysql-relay-bin
read_only=1
\`\`\`

Configure replication:
\`\`\`sql
CHANGE MASTER TO
  MASTER_HOST='192.168.1.100',
  MASTER_USER='repl',
  MASTER_PASSWORD='ReplPass123',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;
SHOW SLAVE STATUS\\G
\`\`\``,
    rank: 4,
    tags: ['mysql', 'rhel', 'replication', 'high-availability', 'master-slave']
  },
  {
    db_type: 'mysql',
    title: 'MySQL User Management on RHEL',
    summary: 'Create and manage MySQL users with proper privileges on RHEL systems.',
    tutorial: `# MySQL User Management on RHEL

## Create Database User

\`\`\`sql
-- Create user
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'AppPass123';

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'appuser'@'localhost';

-- Grant all privileges
GRANT ALL PRIVILEGES ON myapp.* TO 'admin'@'%';

-- Reload privileges
FLUSH PRIVILEGES;
\`\`\`

## View User Privileges

\`\`\`sql
SHOW GRANTS FOR 'appuser'@'localhost';
SELECT user, host FROM mysql.user;
\`\`\`

## Revoke Privileges

\`\`\`sql
REVOKE DELETE ON myapp.* FROM 'appuser'@'localhost';
\`\`\`

## Delete User

\`\`\`sql
DROP USER 'appuser'@'localhost';
\`\`\`

## Password Policy

\`\`\`sql
SET GLOBAL validate_password.policy=MEDIUM;
SET GLOBAL validate_password.length=12;
\`\`\``,
    rank: 5,
    tags: ['mysql', 'rhel', 'user-management', 'security', 'privileges']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Monitoring with Performance Schema on RHEL',
    summary: 'Use MySQL Performance Schema to monitor queries, locks, and resource usage on RHEL.',
    tutorial: `# MySQL Monitoring with Performance Schema on RHEL

## Enable Performance Schema

\`\`\`ini
[mysqld]
performance_schema=ON
\`\`\`

## Top Slow Queries

\`\`\`sql
SELECT DIGEST_TEXT, COUNT_STAR, AVG_TIMER_WAIT/1000000000 AS avg_ms
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;
\`\`\`

## Active Connections

\`\`\`sql
SELECT * FROM performance_schema.processlist
WHERE COMMAND != 'Sleep'
ORDER BY TIME DESC;
\`\`\`

## Table I/O Statistics

\`\`\`sql
SELECT OBJECT_SCHEMA, OBJECT_NAME,
  COUNT_READ, COUNT_WRITE,
  SUM_TIMER_READ/1000000000 AS read_ms,
  SUM_TIMER_WRITE/1000000000 AS write_ms
FROM performance_schema.table_io_waits_summary_by_table
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
\`\`\``,
    rank: 6,
    tags: ['mysql', 'rhel', 'monitoring', 'performance-schema', 'dba']
  },
  {
    db_type: 'mysql',
    title: 'MySQL SSL/TLS Configuration on RHEL',
    summary: 'Enable and configure SSL/TLS encryption for MySQL connections on RHEL.',
    tutorial: `# MySQL SSL/TLS Configuration on RHEL

## Generate SSL Certificates

\`\`\`bash
# Create CA key and certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 -key ca-key.pem -out ca.pem

# Create server key and certificate
openssl req -newkey rsa:2048 -days 3600 -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Copy to MySQL directory
sudo cp ca.pem server-cert.pem server-key.pem /var/lib/mysql/
sudo chown mysql:mysql /var/lib/mysql/*.pem
\`\`\`

## Configure MySQL

\`\`\`ini
[mysqld]
ssl-ca=/var/lib/mysql/ca.pem
ssl-cert=/var/lib/mysql/server-cert.pem
ssl-key=/var/lib/mysql/server-key.pem
require_secure_transport=ON
\`\`\`

## Verify SSL

\`\`\`sql
SHOW VARIABLES LIKE '%ssl%';
SHOW STATUS LIKE 'Ssl_cipher';
\`\`\``,
    rank: 7,
    tags: ['mysql', 'rhel', 'ssl', 'tls', 'security', 'encryption']
  },
  {
    db_type: 'mysql',
    title: 'MySQL InnoDB Cluster Setup on RHEL',
    summary: 'Deploy MySQL InnoDB Cluster for high availability with Group Replication on RHEL.',
    tutorial: `# MySQL InnoDB Cluster Setup on RHEL

## Prerequisites

\`\`\`bash
# Install MySQL Shell
sudo dnf install -y mysql-shell

# Install MySQL Router
sudo dnf install -y mysql-router
\`\`\`

## Configure Each Node

\`\`\`ini
[mysqld]
server-id=1
gtid_mode=ON
enforce_gtid_consistency=ON
binlog_checksum=NONE
\`\`\`

## Create Cluster via MySQL Shell

\`\`\`javascript
// Connect to primary
\\connect root@node1:3306

// Create cluster
var cluster = dba.createCluster('MyCluster');

// Add instances
cluster.addInstance('root@node2:3306');
cluster.addInstance('root@node3:3306');

// Check status
cluster.status();
\`\`\`

## Configure MySQL Router

\`\`\`bash
mysqlrouter --bootstrap root@node1:3306 --directory /etc/mysqlrouter
sudo systemctl start mysqlrouter
\`\`\``,
    rank: 8,
    tags: ['mysql', 'rhel', 'innodb-cluster', 'high-availability', 'group-replication']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Audit Log Plugin on RHEL',
    summary: 'Enable and configure MySQL Enterprise Audit or community audit plugin on RHEL for compliance.',
    tutorial: `# MySQL Audit Log Plugin on RHEL

## Install Audit Plugin

\`\`\`sql
INSTALL PLUGIN audit_log SONAME 'audit_log.so';
\`\`\`

## Configure Audit Log

\`\`\`ini
[mysqld]
plugin-load-add=audit_log.so
audit_log_file=/var/log/mysql/audit.log
audit_log_format=JSON
audit_log_policy=ALL
audit_log_rotate_on_size=100M
\`\`\`

## Filter Audit Events

\`\`\`sql
-- Audit only specific users
SET GLOBAL audit_log_include_accounts = 'root@localhost,admin@%';

-- Exclude specific events
SET GLOBAL audit_log_exclude_accounts = 'monitor@localhost';
\`\`\`

## View Audit Log

\`\`\`bash
sudo tail -f /var/log/mysql/audit.log | python3 -m json.tool
\`\`\``,
    rank: 9,
    tags: ['mysql', 'rhel', 'audit', 'compliance', 'security', 'logging']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Partitioning Strategy on RHEL',
    summary: 'Implement table partitioning in MySQL for large datasets on RHEL to improve query performance.',
    tutorial: `# MySQL Partitioning Strategy on RHEL

## Range Partitioning

\`\`\`sql
CREATE TABLE orders (
  id INT NOT NULL,
  order_date DATE NOT NULL,
  amount DECIMAL(10,2),
  PRIMARY KEY (id, order_date)
)
PARTITION BY RANGE (YEAR(order_date)) (
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION pmax  VALUES LESS THAN MAXVALUE
);
\`\`\`

## Hash Partitioning

\`\`\`sql
CREATE TABLE users (
  id INT NOT NULL,
  username VARCHAR(100),
  PRIMARY KEY (id)
)
PARTITION BY HASH(id)
PARTITIONS 8;
\`\`\`

## Manage Partitions

\`\`\`sql
-- Add partition
ALTER TABLE orders ADD PARTITION (PARTITION p2025 VALUES LESS THAN (2026));

-- Drop old partition
ALTER TABLE orders DROP PARTITION p2021;

-- Check partition info
SELECT PARTITION_NAME, TABLE_ROWS
FROM information_schema.PARTITIONS
WHERE TABLE_NAME = 'orders';
\`\`\``,
    rank: 10,
    tags: ['mysql', 'rhel', 'partitioning', 'performance', 'large-data']
  },

  // ═══════════════════════════════════════════════════════════
  // MySQL - Windows (10 docs)
  // ═══════════════════════════════════════════════════════════
  {
    db_type: 'mysql',
    title: 'MySQL 8.0 Installation on Windows Server',
    summary: 'Step-by-step guide to install MySQL 8.0 on Windows Server 2019/2022 using the MySQL Installer.',
    tutorial: `# MySQL 8.0 Installation on Windows Server

## Download MySQL Installer

1. Go to https://dev.mysql.com/downloads/installer/
2. Download mysql-installer-community-8.0.x.msi

## Installation Steps

\`\`\`powershell
# Run installer silently
msiexec /i mysql-installer-community-8.0.x.msi /quiet

# Or use MySQL Installer GUI
# Choose: Developer Default or Server Only
\`\`\`

## Configure MySQL as Windows Service

\`\`\`powershell
# Initialize MySQL
"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld" --initialize --console

# Install as service
"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld" --install MySQL80

# Start service
net start MySQL80
\`\`\`

## Add to PATH

\`\`\`powershell
$env:PATH += ";C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, "Machine")
\`\`\`

## Verify Installation

\`\`\`powershell
mysql -u root -p
\`\`\``,
    rank: 11,
    tags: ['mysql', 'windows', 'installation', 'windows-server', 'mysql8']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Performance Tuning on Windows',
    summary: 'Optimize MySQL configuration for Windows Server environments with memory and I/O tuning.',
    tutorial: `# MySQL Performance Tuning on Windows

## Configuration File Location

\`C:\\ProgramData\\MySQL\\MySQL Server 8.0\\my.ini\`

## Key Settings

\`\`\`ini
[mysqld]
# Memory
innodb_buffer_pool_size=4G
innodb_log_file_size=512M

# Windows-specific I/O
innodb_flush_method=normal
innodb_use_native_aio=1

# Connections
max_connections=300
thread_cache_size=50

# Temp tables
tmp_table_size=256M
max_heap_table_size=256M

# Logging
slow_query_log=1
slow_query_log_file="C:\\\\ProgramData\\\\MySQL\\\\MySQL Server 8.0\\\\slow.log"
long_query_time=2
\`\`\`

## Apply Changes

\`\`\`powershell
Restart-Service MySQL80
\`\`\`

## Check Buffer Pool Usage

\`\`\`sql
SHOW STATUS LIKE 'Innodb_buffer_pool%';
\`\`\``,
    rank: 12,
    tags: ['mysql', 'windows', 'performance', 'tuning', 'innodb']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Backup with PowerShell on Windows',
    summary: 'Automate MySQL backups using PowerShell scripts and Windows Task Scheduler.',
    tutorial: `# MySQL Backup with PowerShell on Windows

## Backup Script

\`\`\`powershell
# C:\\Scripts\\mysql_backup.ps1

$BackupDir = "D:\\Backups\\MySQL"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$MySQLBin = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin"
$User = "backup_user"
$Pass = "BackupPass123"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir

# Run mysqldump
& "$MySQLBin\\mysqldump.exe" -u$User -p$Pass \`
  --all-databases \`
  --single-transaction \`
  --routines \`
  --triggers \`
  | Out-File "$BackupDir\\full_backup_$Date.sql" -Encoding UTF8

# Compress backup
Compress-Archive -Path "$BackupDir\\full_backup_$Date.sql" \`
  -DestinationPath "$BackupDir\\full_backup_$Date.zip"

Remove-Item "$BackupDir\\full_backup_$Date.sql"

# Remove backups older than 7 days
Get-ChildItem $BackupDir -Filter "*.zip" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item
\`\`\`

## Schedule with Task Scheduler

\`\`\`powershell
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" \`
  -Argument "-File C:\\Scripts\\mysql_backup.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "MySQLBackup" -Action $Action -Trigger $Trigger -RunLevel Highest
\`\`\``,
    rank: 13,
    tags: ['mysql', 'windows', 'backup', 'powershell', 'automation', 'task-scheduler']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Firewall Configuration on Windows',
    summary: 'Configure Windows Firewall to allow MySQL connections securely on Windows Server.',
    tutorial: `# MySQL Firewall Configuration on Windows

## Allow MySQL Port via PowerShell

\`\`\`powershell
# Allow MySQL port 3306
New-NetFirewallRule -DisplayName "MySQL Server" \`
  -Direction Inbound \`
  -Protocol TCP \`
  -LocalPort 3306 \`
  -Action Allow \`
  -Profile Domain,Private

# Allow from specific IP range only
New-NetFirewallRule -DisplayName "MySQL App Server" \`
  -Direction Inbound \`
  -Protocol TCP \`
  -LocalPort 3306 \`
  -RemoteAddress "192.168.1.0/24" \`
  -Action Allow
\`\`\`

## Verify Firewall Rules

\`\`\`powershell
Get-NetFirewallRule -DisplayName "MySQL*" | Format-Table
\`\`\`

## Block External Access (Recommended)

\`\`\`ini
# In my.ini - bind to localhost only
[mysqld]
bind-address=127.0.0.1
\`\`\`

## Test Connection

\`\`\`powershell
Test-NetConnection -ComputerName localhost -Port 3306
\`\`\``,
    rank: 14,
    tags: ['mysql', 'windows', 'firewall', 'security', 'network']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Replication on Windows Server',
    summary: 'Set up MySQL master-slave replication between Windows Server instances.',
    tutorial: `# MySQL Replication on Windows Server

## Master Configuration (my.ini)

\`\`\`ini
[mysqld]
server-id=1
log-bin=mysql-bin
binlog-format=ROW
expire_logs_days=7
\`\`\`

## Create Replication User

\`\`\`sql
CREATE USER 'repl'@'192.168.1.%' IDENTIFIED BY 'ReplPass123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.168.1.%';
FLUSH PRIVILEGES;
SHOW MASTER STATUS;
\`\`\`

## Slave Configuration (my.ini)

\`\`\`ini
[mysqld]
server-id=2
relay-log=mysql-relay-bin
read_only=ON
log_slave_updates=ON
\`\`\`

## Start Replication

\`\`\`sql
CHANGE MASTER TO
  MASTER_HOST='192.168.1.10',
  MASTER_USER='repl',
  MASTER_PASSWORD='ReplPass123',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;
SHOW SLAVE STATUS\\G
\`\`\`

## Restart Service

\`\`\`powershell
Restart-Service MySQL80
\`\`\``,
    rank: 15,
    tags: ['mysql', 'windows', 'replication', 'high-availability', 'windows-server']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Event Scheduler on Windows',
    summary: 'Use MySQL Event Scheduler to automate database maintenance tasks on Windows.',
    tutorial: `# MySQL Event Scheduler on Windows

## Enable Event Scheduler

\`\`\`sql
SET GLOBAL event_scheduler = ON;
\`\`\`

Add to my.ini:
\`\`\`ini
[mysqld]
event_scheduler=ON
\`\`\`

## Create Maintenance Event

\`\`\`sql
-- Purge old logs daily
CREATE EVENT purge_old_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM activity_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Optimize tables weekly
CREATE EVENT weekly_optimize
ON SCHEDULE EVERY 1 WEEK
STARTS '2024-01-01 03:00:00'
DO BEGIN
  OPTIMIZE TABLE orders;
  OPTIMIZE TABLE users;
  ANALYZE TABLE orders;
END;
\`\`\`

## Manage Events

\`\`\`sql
SHOW EVENTS;
ALTER EVENT purge_old_logs DISABLE;
DROP EVENT IF EXISTS purge_old_logs;
\`\`\``,
    rank: 16,
    tags: ['mysql', 'windows', 'event-scheduler', 'automation', 'maintenance']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Upgrade from 5.7 to 8.0 on Windows',
    summary: 'Safe upgrade procedure from MySQL 5.7 to 8.0 on Windows Server with rollback plan.',
    tutorial: `# MySQL Upgrade from 5.7 to 8.0 on Windows

## Pre-Upgrade Checklist

\`\`\`powershell
# 1. Full backup
& "C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe" \`
  -uroot -p --all-databases > C:\\Backup\\pre_upgrade.sql

# 2. Check upgrade compatibility
& "C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqlcheck.exe" \`
  -uroot -p --all-databases --check-upgrade
\`\`\`

## Upgrade Steps

\`\`\`powershell
# 1. Stop MySQL 5.7
net stop MySQL57

# 2. Install MySQL 8.0 (keep 5.7 data directory)
# Run MySQL 8.0 installer

# 3. Update my.ini - remove deprecated options:
# Remove: query_cache_type, query_cache_size
# Remove: innodb_file_format

# 4. Start MySQL 8.0
net start MySQL80

# 5. Run upgrade
& "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql_upgrade.exe" -uroot -p
\`\`\`

## Verify Upgrade

\`\`\`sql
SELECT VERSION();
SHOW DATABASES;
\`\`\``,
    rank: 17,
    tags: ['mysql', 'windows', 'upgrade', 'migration', 'mysql8']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Connection Pooling with Windows',
    summary: 'Configure MySQL connection pooling using MySQL Connector and ProxySQL on Windows.',
    tutorial: `# MySQL Connection Pooling on Windows

## Using MySQL Connector/NET

\`\`\`csharp
// Connection string with pooling
string connStr = "server=localhost;user=appuser;database=myapp;" +
  "password=Pass123;Pooling=true;Min Pool Size=5;Max Pool Size=100;" +
  "Connection Lifetime=300;Connection Reset=true;";
\`\`\`

## Install ProxySQL on Windows (via WSL)

\`\`\`bash
# In WSL2
sudo apt-get install -y proxysql

# Configure /etc/proxysql.cnf
mysql_servers =
(
  { address="127.0.0.1", port=3306, hostgroup=0, max_connections=100 }
)

mysql_users =
(
  { username="appuser", password="Pass123", default_hostgroup=0 }
)
\`\`\`

## MySQL Thread Pool (Enterprise)

\`\`\`ini
[mysqld]
plugin-load-add=thread_pool.dll
thread_pool_size=16
thread_pool_max_threads=1000
\`\`\``,
    rank: 18,
    tags: ['mysql', 'windows', 'connection-pooling', 'proxysql', 'performance']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Log Management on Windows',
    summary: 'Configure and manage MySQL error, general, slow query, and binary logs on Windows.',
    tutorial: `# MySQL Log Management on Windows

## Configure Logs in my.ini

\`\`\`ini
[mysqld]
# Error Log
log-error="C:\\\\ProgramData\\\\MySQL\\\\MySQL Server 8.0\\\\mysql_error.log"

# General Query Log (disable in production)
general_log=0
general_log_file="C:\\\\ProgramData\\\\MySQL\\\\MySQL Server 8.0\\\\general.log"

# Slow Query Log
slow_query_log=1
slow_query_log_file="C:\\\\ProgramData\\\\MySQL\\\\MySQL Server 8.0\\\\slow.log"
long_query_time=2
log_queries_not_using_indexes=1

# Binary Log
log-bin="C:\\\\MySQL\\\\binlogs\\\\mysql-bin"
expire_logs_days=7
\`\`\`

## Rotate Logs via PowerShell

\`\`\`powershell
# Flush logs
& mysql -uroot -p -e "FLUSH LOGS;"

# Archive old logs
$LogDir = "C:\\ProgramData\\MySQL\\MySQL Server 8.0"
Get-ChildItem $LogDir -Filter "*.log" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Move-Item -Destination "D:\\Archive\\MySQL"
\`\`\``,
    rank: 19,
    tags: ['mysql', 'windows', 'logging', 'slow-query', 'binary-log']
  },
  {
    db_type: 'mysql',
    title: 'MySQL Monitoring with Nagios on Windows',
    summary: 'Monitor MySQL health metrics using Nagios plugins on Windows Server.',
    tutorial: `# MySQL Monitoring with Nagios on Windows

## Install check_mysql Plugin

\`\`\`powershell
# Download NSClient++
# Install and configure nsclient.ini

[/modules]
CheckExternalScripts = 1

[/settings/external scripts/scripts]
check_mysql = cmd /c "C:\\Scripts\\check_mysql.bat"
\`\`\`

## check_mysql.bat

\`\`\`batch
@echo off
set MYSQL="C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"
%MYSQL% -umonitor -pMonitorPass -e "SELECT 1" > nul 2>&1
if %errorlevel% == 0 (
  echo OK - MySQL is running
  exit 0
) else (
  echo CRITICAL - MySQL is not responding
  exit 2
)
\`\`\`

## Key Metrics to Monitor

\`\`\`sql
-- Connection usage
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Query performance
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Questions';

-- InnoDB buffer pool
SHOW STATUS LIKE 'Innodb_buffer_pool_read_requests';
SHOW STATUS LIKE 'Innodb_buffer_pool_reads';
\`\`\``,
    rank: 20,
    tags: ['mysql', 'windows', 'monitoring', 'nagios', 'health-check']
  },
];

// ─── Runner ───────────────────────────────────────────────
const seed = async () => {
  try {
    await connectDB();
    logger.info(`Starting seed_runbook100 — ${DOCS.length} entries...`);
    let inserted = 0, updated = 0;

    for (const entry of DOCS) {
      const [doc, created] = await RunbookAI.findOrCreate({
        where: { title: entry.title },
        defaults: { ...entry, flag: 1 },
      });
      if (!created) {
        await doc.update({ ...entry, flag: 1 });
        updated++;
      } else {
        inserted++;
      }
      logger.info(`  ${created ? 'INSERT' : 'UPDATE'} [${entry.db_type}] ${entry.title}`);
    }

    logger.info(`Done. Inserted: ${inserted}, Updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    logger.error('seed_runbook100 failed:', err.message);
    logger.error(err.stack);
    process.exit(1);
  }
};

seed();
