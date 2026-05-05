/**
 * seed_dba50.js
 * 50 DBA knowledge runbook entries covering:
 *   Oracle (10), EDB/EnterpriseDB (8), PostgreSQL (10),
 *   SQL Server (10), IBM DB2 (6), MongoDB (6)
 *
 * Usage: node src/database/seed_dba50.js
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const { RunbookAI } = require('../models/index');
const logger = require('../utils/logger');

const DOCS = [
  // ═══════════════════════════════════════════════════════════
  // ORACLE — 10 entries (RHEL + Windows)
  // ═══════════════════════════════════════════════════════════
  {
    db_type: 'oracle',
    title: 'Oracle 19c Installation on RHEL 8',
    summary: 'Step-by-step Oracle Database 19c installation on Red Hat Enterprise Linux 8 including pre-requisites and post-install tasks.',
    tutorial: `# Oracle 19c Installation on RHEL 8

## Pre-requisites

\`\`\`bash
# Install required packages
sudo dnf install -y oracle-database-preinstall-19c

# Or manually install dependencies
sudo dnf install -y bc binutils compat-openssl10 elfutils-libelf \\
  glibc glibc-devel ksh libaio libaio-devel libXrender libX11 \\
  libXau libXi libXtst libgcc librdmacm libstdc++ libstdc++-devel \\
  libxcb make net-tools nfs-utils python python-configshell \\
  python-rtslib python-six smartmontools sysstat targetcli unzip

# Set kernel parameters in /etc/sysctl.conf
sudo tee -a /etc/sysctl.conf <<EOF
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = 2097152
kernel.shmmax = 4294967295
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
EOF
sudo sysctl -p
\`\`\`

## Create Oracle User and Groups

\`\`\`bash
sudo groupadd -g 54321 oinstall
sudo groupadd -g 54322 dba
sudo groupadd -g 54323 oper
sudo useradd -u 54321 -g oinstall -G dba,oper oracle
echo "oracle:Oracle123" | sudo chpasswd

# Create directories
sudo mkdir -p /u01/app/oracle/product/19.0.0/dbhome_1
sudo chown -R oracle:oinstall /u01
sudo chmod -R 775 /u01
\`\`\`

## Install Oracle Software

\`\`\`bash
# As oracle user
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19.0.0/dbhome_1
export ORACLE_SID=ORCL

# Unzip installer to ORACLE_HOME
unzip -q LINUX.X64_193000_db_home.zip -d $ORACLE_HOME

# Run installer silently
$ORACLE_HOME/runInstaller -silent \\
  -responseFile $ORACLE_HOME/install/response/db_install.rsp \\
  ORACLE_BASE=$ORACLE_BASE \\
  ORACLE_HOME=$ORACLE_HOME

# Run root scripts
sudo /u01/app/oraInventory/orainstRoot.sh
sudo $ORACLE_HOME/root.sh
\`\`\`

## Create Database

\`\`\`bash
dbca -silent -createDatabase \\
  -templateName General_Purpose.dbc \\
  -gdbname ORCL -sid ORCL \\
  -responseFile NO_VALUE \\
  -characterSet AL32UTF8 \\
  -sysPassword SysPass123 \\
  -systemPassword SysPass123 \\
  -createAsContainerDatabase false \\
  -databaseType MULTIPURPOSE \\
  -memoryMgmtType auto_sga \\
  -totalMemory 2048 \\
  -storageType FS \\
  -datafileDestination /u01/app/oracle/oradata
\`\`\``,
    rank: 21,
    tags: ['oracle', 'rhel', 'installation', 'oracle19c', 'linux']
  },
  {
    db_type: 'oracle',
    title: 'Oracle RMAN Backup and Recovery on RHEL',
    summary: 'Configure and run Oracle RMAN full, incremental, and archived log backups on RHEL.',
    tutorial: `# Oracle RMAN Backup and Recovery on RHEL

## Configure RMAN

\`\`\`sql
-- Connect to RMAN
rman target /

-- Configure retention policy
CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;

-- Configure backup location
CONFIGURE CHANNEL DEVICE TYPE DISK FORMAT '/backup/oracle/%U';

-- Configure parallelism
CONFIGURE DEVICE TYPE DISK PARALLELISM 4;

-- Enable controlfile autobackup
CONFIGURE CONTROLFILE AUTOBACKUP ON;
CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO '/backup/oracle/cf_%F';
\`\`\`

## Full Database Backup

\`\`\`bash
rman target / <<EOF
RUN {
  ALLOCATE CHANNEL c1 DEVICE TYPE DISK;
  ALLOCATE CHANNEL c2 DEVICE TYPE DISK;
  BACKUP AS COMPRESSED BACKUPSET DATABASE
    FORMAT '/backup/oracle/full_%U'
    TAG 'FULL_BACKUP';
  BACKUP ARCHIVELOG ALL
    FORMAT '/backup/oracle/arch_%U'
    DELETE INPUT;
  RELEASE CHANNEL c1;
  RELEASE CHANNEL c2;
}
EOF
\`\`\`

## Incremental Backup

\`\`\`bash
# Level 0 (Sunday)
rman target / <<EOF
BACKUP INCREMENTAL LEVEL 0 DATABASE FORMAT '/backup/oracle/inc0_%U';
EOF

# Level 1 (Mon-Sat)
rman target / <<EOF
BACKUP INCREMENTAL LEVEL 1 DATABASE FORMAT '/backup/oracle/inc1_%U';
EOF
\`\`\`

## Restore and Recovery

\`\`\`sql
-- Restore to specific SCN
RMAN> RESTORE DATABASE UNTIL SCN 1234567;
RMAN> RECOVER DATABASE UNTIL SCN 1234567;
RMAN> ALTER DATABASE OPEN RESETLOGS;
\`\`\``,
    rank: 22,
    tags: ['oracle', 'rhel', 'rman', 'backup', 'recovery', 'dba']
  },
  {
    db_type: 'oracle',
    title: 'Oracle ASM Configuration on RHEL',
    summary: 'Set up Oracle Automatic Storage Management (ASM) for disk group management on RHEL.',
    tutorial: `# Oracle ASM Configuration on RHEL

## Install Grid Infrastructure

\`\`\`bash
# Create ASM groups and user
sudo groupadd -g 54324 asmdba
sudo groupadd -g 54325 asmoper
sudo groupadd -g 54326 asmadmin
sudo usermod -a -G asmdba,asmoper,asmadmin oracle

# Prepare disks
sudo fdisk /dev/sdb  # create partition
sudo oracleasm configure -i
sudo oracleasm init
sudo oracleasm createdisk DATA1 /dev/sdb1
sudo oracleasm createdisk DATA2 /dev/sdc1
sudo oracleasm listdisks
\`\`\`

## Create ASM Disk Groups

\`\`\`sql
-- Connect as SYSASM
sqlplus / as sysasm

-- Create DATA disk group
CREATE DISKGROUP DATA NORMAL REDUNDANCY
  DISK '/dev/oracleasm/disks/DATA1',
       '/dev/oracleasm/disks/DATA2'
  ATTRIBUTE 'compatible.asm' = '19.0',
            'compatible.rdbms' = '19.0',
            'au_size' = '4M';

-- Create FRA disk group
CREATE DISKGROUP FRA NORMAL REDUNDANCY
  DISK '/dev/oracleasm/disks/FRA1'
  ATTRIBUTE 'compatible.asm' = '19.0';
\`\`\`

## Monitor ASM

\`\`\`sql
SELECT name, state, total_mb, free_mb,
  ROUND((free_mb/total_mb)*100,2) AS pct_free
FROM v$asm_diskgroup;

SELECT path, mode_status, state, total_mb, free_mb
FROM v$asm_disk;
\`\`\``,
    rank: 23,
    tags: ['oracle', 'rhel', 'asm', 'storage', 'grid-infrastructure']
  },
  {
    db_type: 'oracle',
    title: 'Oracle Data Guard Setup on RHEL',
    summary: 'Configure Oracle Data Guard physical standby for disaster recovery on RHEL.',
    tutorial: `# Oracle Data Guard Setup on RHEL

## Primary Database Configuration

\`\`\`sql
-- Enable archivelog mode
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Enable force logging
ALTER DATABASE FORCE LOGGING;

-- Configure redo log transport
ALTER SYSTEM SET LOG_ARCHIVE_DEST_1='LOCATION=/arch/primary VALID_FOR=(ALL_LOGFILES,ALL_ROLES) DB_UNIQUE_NAME=PRIMARY';
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2='SERVICE=STANDBY ASYNC VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE) DB_UNIQUE_NAME=STANDBY';
ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_2=ENABLE;
ALTER SYSTEM SET LOG_ARCHIVE_FORMAT='%t_%s_%r.arc' SCOPE=SPFILE;
ALTER SYSTEM SET LOG_ARCHIVE_MAX_PROCESSES=4;
ALTER SYSTEM SET REMOTE_LOGIN_PASSWORDFILE=EXCLUSIVE SCOPE=SPFILE;
ALTER SYSTEM SET FAL_SERVER=STANDBY;
ALTER SYSTEM SET FAL_CLIENT=PRIMARY;
ALTER SYSTEM SET DB_FILE_NAME_CONVERT='/oradata/standby','/oradata/primary' SCOPE=SPFILE;
ALTER SYSTEM SET LOG_FILE_NAME_CONVERT='/oradata/standby','/oradata/primary' SCOPE=SPFILE;
ALTER SYSTEM SET STANDBY_FILE_MANAGEMENT=AUTO;
\`\`\`

## Create Standby via RMAN

\`\`\`bash
rman target sys/SysPass123@PRIMARY auxiliary sys/SysPass123@STANDBY <<EOF
DUPLICATE TARGET DATABASE FOR STANDBY
  FROM ACTIVE DATABASE
  DORECOVER
  SPFILE
    SET DB_UNIQUE_NAME='STANDBY'
    SET LOG_ARCHIVE_DEST_2='SERVICE=PRIMARY ASYNC VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE) DB_UNIQUE_NAME=PRIMARY'
  NOFILENAMECHECK;
EOF
\`\`\`

## Start Redo Apply

\`\`\`sql
-- On standby
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;

-- Monitor lag
SELECT NAME, VALUE, DATUM_TIME FROM V$DATAGUARD_STATS WHERE NAME LIKE '%lag%';
\`\`\``,
    rank: 24,
    tags: ['oracle', 'rhel', 'data-guard', 'disaster-recovery', 'standby', 'ha']
  },
  {
    db_type: 'oracle',
    title: 'Oracle Performance Tuning with AWR on RHEL',
    summary: 'Use Oracle AWR and ADDM reports to identify and resolve performance bottlenecks on RHEL.',
    tutorial: `# Oracle Performance Tuning with AWR on RHEL

## Generate AWR Report

\`\`\`sql
-- Check AWR retention
SELECT SNAP_INTERVAL, RETENTION FROM DBA_HIST_WR_CONTROL;

-- Modify retention (30 days, 1-hour snapshots)
EXEC DBMS_WORKLOAD_REPOSITORY.MODIFY_SNAPSHOT_SETTINGS(
  retention => 43200,  -- minutes (30 days)
  interval  => 60      -- minutes
);

-- Take manual snapshot
EXEC DBMS_WORKLOAD_REPOSITORY.CREATE_SNAPSHOT();

-- List snapshots
SELECT SNAP_ID, BEGIN_INTERVAL_TIME, END_INTERVAL_TIME
FROM DBA_HIST_SNAPSHOT
ORDER BY SNAP_ID DESC
FETCH FIRST 10 ROWS ONLY;

-- Generate HTML report
@$ORACLE_HOME/rdbms/admin/awrrpt.sql
\`\`\`

## Top SQL by Elapsed Time

\`\`\`sql
SELECT sql_id, elapsed_time_total/1000000 AS elapsed_sec,
  executions_total, buffer_gets_total,
  SUBSTR(sql_text,1,80) AS sql_text
FROM DBA_HIST_SQLSTAT s
JOIN DBA_HIST_SQLTEXT t USING (sql_id)
WHERE snap_id BETWEEN 100 AND 110
ORDER BY elapsed_time_total DESC
FETCH FIRST 10 ROWS ONLY;
\`\`\`

## Wait Events Analysis

\`\`\`sql
SELECT event, total_waits, time_waited_micro/1000000 AS wait_sec,
  ROUND(time_waited_micro*100/SUM(time_waited_micro) OVER(),2) AS pct
FROM DBA_HIST_SYSTEM_EVENT
WHERE snap_id = (SELECT MAX(snap_id) FROM DBA_HIST_SNAPSHOT)
  AND wait_class != 'Idle'
ORDER BY time_waited_micro DESC
FETCH FIRST 15 ROWS ONLY;
\`\`\``,
    rank: 25,
    tags: ['oracle', 'rhel', 'awr', 'performance', 'tuning', 'addm']
  },
  {
    db_type: 'oracle',
    title: 'Oracle User and Privilege Management',
    summary: 'Create Oracle users, assign roles, manage system and object privileges, and implement profiles.',
    tutorial: `# Oracle User and Privilege Management

## Create User

\`\`\`sql
-- Create user with tablespace quota
CREATE USER appuser IDENTIFIED BY "AppPass123#"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 500M ON users
  QUOTA UNLIMITED ON data_ts;

-- Grant connect and resource
GRANT CONNECT, RESOURCE TO appuser;

-- Grant specific privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON hr.employees TO appuser;
GRANT EXECUTE ON dbms_crypto TO appuser;

-- Create and grant custom role
CREATE ROLE app_read_role;
GRANT SELECT ON hr.employees TO app_read_role;
GRANT SELECT ON hr.departments TO app_read_role;
GRANT app_read_role TO appuser;
\`\`\`

## Password Profile

\`\`\`sql
CREATE PROFILE app_profile LIMIT
  FAILED_LOGIN_ATTEMPTS 5
  PASSWORD_LOCK_TIME 1/24
  PASSWORD_LIFE_TIME 90
  PASSWORD_REUSE_TIME 365
  PASSWORD_REUSE_MAX 10
  PASSWORD_VERIFY_FUNCTION ora12c_strong_verify_function;

ALTER USER appuser PROFILE app_profile;
\`\`\`

## Audit User Activity

\`\`\`sql
-- Unified auditing
AUDIT SELECT TABLE, INSERT TABLE, UPDATE TABLE, DELETE TABLE
  BY appuser BY ACCESS;

-- View audit trail
SELECT db_user, action_name, object_name, event_timestamp
FROM unified_audit_trail
WHERE db_user = 'APPUSER'
ORDER BY event_timestamp DESC
FETCH FIRST 20 ROWS ONLY;
\`\`\``,
    rank: 26,
    tags: ['oracle', 'user-management', 'security', 'privileges', 'audit']
  },
  {
    db_type: 'oracle',
    title: 'Oracle Tablespace Management',
    summary: 'Create, extend, monitor, and manage Oracle tablespaces including bigfile and temporary tablespaces.',
    tutorial: `# Oracle Tablespace Management

## Create Tablespace

\`\`\`sql
-- Standard tablespace
CREATE TABLESPACE app_data
  DATAFILE '/u01/app/oracle/oradata/ORCL/app_data01.dbf' SIZE 1G
  AUTOEXTEND ON NEXT 256M MAXSIZE 10G
  EXTENT MANAGEMENT LOCAL AUTOALLOCATE
  SEGMENT SPACE MANAGEMENT AUTO;

-- Bigfile tablespace
CREATE BIGFILE TABLESPACE app_big
  DATAFILE '/u01/app/oracle/oradata/ORCL/app_big01.dbf' SIZE 10G
  AUTOEXTEND ON NEXT 1G MAXSIZE UNLIMITED;

-- Add datafile to existing tablespace
ALTER TABLESPACE app_data
  ADD DATAFILE '/u01/app/oracle/oradata/ORCL/app_data02.dbf' SIZE 1G
  AUTOEXTEND ON NEXT 256M MAXSIZE 10G;
\`\`\`

## Monitor Tablespace Usage

\`\`\`sql
SELECT df.tablespace_name,
  ROUND(df.bytes/1073741824,2) AS total_gb,
  ROUND((df.bytes - fs.bytes)/1073741824,2) AS used_gb,
  ROUND(fs.bytes/1073741824,2) AS free_gb,
  ROUND((df.bytes - fs.bytes)*100/df.bytes,1) AS pct_used
FROM (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
  ON df.tablespace_name = fs.tablespace_name
ORDER BY pct_used DESC;
\`\`\`

## Shrink Tablespace

\`\`\`sql
-- Resize datafile
ALTER DATABASE DATAFILE '/u01/app/oracle/oradata/ORCL/app_data01.dbf' RESIZE 500M;

-- Drop tablespace
DROP TABLESPACE app_old INCLUDING CONTENTS AND DATAFILES;
\`\`\``,
    rank: 27,
    tags: ['oracle', 'tablespace', 'storage', 'dba', 'capacity']
  },
  {
    db_type: 'oracle',
    title: 'Oracle 19c Installation on Windows Server',
    summary: 'Install Oracle Database 19c on Windows Server 2019 with silent install and service configuration.',
    tutorial: `# Oracle 19c Installation on Windows Server

## Pre-requisites

\`\`\`powershell
# Check Windows version
winver

# Disable Windows Firewall temporarily during install
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Set environment variables
[Environment]::SetEnvironmentVariable("ORACLE_BASE", "C:\\oracle\\base", "Machine")
[Environment]::SetEnvironmentVariable("ORACLE_HOME", "C:\\oracle\\product\\19.0.0\\dbhome_1", "Machine")
[Environment]::SetEnvironmentVariable("ORACLE_SID", "ORCL", "Machine")
\`\`\`

## Silent Installation

\`\`\`powershell
# Unzip installer
Expand-Archive -Path WINDOWS.X64_193000_db_home.zip -DestinationPath "C:\\oracle\\product\\19.0.0\\dbhome_1"

# Run silent install
cd "C:\\oracle\\product\\19.0.0\\dbhome_1"
.\\setup.exe -silent -responseFile .\\install\\response\\db_install.rsp ^
  oracle.install.option=INSTALL_DB_SWONLY ^
  ORACLE_HOSTNAME=%COMPUTERNAME% ^
  UNIX_GROUP_NAME=dba ^
  INVENTORY_LOCATION="C:\\oracle\\oraInventory" ^
  ORACLE_HOME="C:\\oracle\\product\\19.0.0\\dbhome_1" ^
  ORACLE_BASE="C:\\oracle\\base" ^
  oracle.install.db.InstallEdition=EE
\`\`\`

## Create Database with DBCA

\`\`\`powershell
dbca -silent -createDatabase ^
  -templateName "General_Purpose.dbc" ^
  -gdbname ORCL -sid ORCL ^
  -characterSet AL32UTF8 ^
  -sysPassword SysPass123 ^
  -systemPassword SysPass123 ^
  -totalMemory 2048 ^
  -storageType FS ^
  -datafileDestination "C:\\oracle\\oradata"

# Register as Windows service
oradim -new -sid ORCL -startmode auto -srvcstart system
\`\`\``,
    rank: 28,
    tags: ['oracle', 'windows', 'installation', 'oracle19c', 'windows-server']
  },
  {
    db_type: 'oracle',
    title: 'Oracle RMAN Backup on Windows',
    summary: 'Automate Oracle RMAN backups on Windows Server using batch scripts and Task Scheduler.',
    tutorial: `# Oracle RMAN Backup on Windows

## RMAN Backup Script

\`\`\`batch
@echo off
REM C:\\Scripts\\oracle_backup.bat
set ORACLE_SID=ORCL
set ORACLE_HOME=C:\\oracle\\product\\19.0.0\\dbhome_1
set BACKUP_DIR=D:\\Backups\\Oracle
set DATE=%date:~10,4%%date:~4,2%%date:~7,2%

%ORACLE_HOME%\\bin\\rman target / <<EOF
RUN {
  ALLOCATE CHANNEL c1 DEVICE TYPE DISK FORMAT '%BACKUP_DIR%\\full_%U';
  BACKUP AS COMPRESSED BACKUPSET DATABASE TAG 'FULL_%DATE%';
  BACKUP ARCHIVELOG ALL FORMAT '%BACKUP_DIR%\\arch_%U' DELETE INPUT;
  BACKUP CURRENT CONTROLFILE FORMAT '%BACKUP_DIR%\\cf_%DATE%.bkp';
  RELEASE CHANNEL c1;
}
DELETE NOPROMPT OBSOLETE;
EXIT;
EOF
\`\`\`

## Schedule with Task Scheduler

\`\`\`powershell
$Action = New-ScheduledTaskAction -Execute "C:\\Scripts\\oracle_backup.bat"
$Trigger = New-ScheduledTaskTrigger -Daily -At "01:00AM"
$Settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName "OracleRMANBackup" `
  -Action $Action -Trigger $Trigger -Settings $Settings `
  -RunLevel Highest -User "SYSTEM"
\`\`\`

## Verify Backup

\`\`\`sql
RMAN> LIST BACKUP SUMMARY;
RMAN> CROSSCHECK BACKUP;
RMAN> REPORT OBSOLETE;
\`\`\``,
    rank: 29,
    tags: ['oracle', 'windows', 'rman', 'backup', 'automation', 'task-scheduler']
  },
  {
    db_type: 'oracle',
    title: 'Oracle RAC Health Check and Monitoring',
    summary: 'Monitor Oracle Real Application Clusters (RAC) health, interconnect, and resource status.',
    tutorial: `# Oracle RAC Health Check and Monitoring

## Cluster Status

\`\`\`bash
# Check cluster health
crsctl check cluster -all

# Check all resources
crsctl status resource -t

# Check CRS status
crsctl check crs

# Check OCR and voting disk
ocrcheck
crsctl query css votedisk
\`\`\`

## Database Instance Status

\`\`\`sql
-- Check all instances
SELECT inst_id, instance_name, host_name, status, database_status
FROM gv$instance
ORDER BY inst_id;

-- Check interconnect
SELECT inst_id, name, ip_address
FROM gv$cluster_interconnects;

-- Global cache statistics
SELECT inst_id,
  gc_cr_blocks_received, gc_current_blocks_received,
  gc_cr_blocks_served, gc_current_blocks_served
FROM gv$sysstat
WHERE name IN ('gc cr blocks received','gc current blocks received')
ORDER BY inst_id;
\`\`\`

## RAC Wait Events

\`\`\`sql
SELECT inst_id, event, total_waits,
  time_waited_micro/1000000 AS wait_sec
FROM gv$system_event
WHERE event LIKE 'gc%'
ORDER BY time_waited_micro DESC
FETCH FIRST 10 ROWS ONLY;
\`\`\``,
    rank: 30,
    tags: ['oracle', 'rac', 'monitoring', 'cluster', 'high-availability']
  },

  // ═══════════════════════════════════════════════════════════
  // POSTGRESQL — 10 entries (RHEL + Windows)
  // ═══════════════════════════════════════════════════════════
  {
    db_type: 'postgresql',
    title: 'PostgreSQL 15 Installation on RHEL 9',
    summary: 'Install PostgreSQL 15 on Red Hat Enterprise Linux 9 using official PostgreSQL repository.',
    tutorial: `# PostgreSQL 15 Installation on RHEL 9

## Add PostgreSQL Repository

\`\`\`bash
# Install repository RPM
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable built-in PostgreSQL module
sudo dnf -qy module disable postgresql

# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib
\`\`\`

## Initialize and Start

\`\`\`bash
# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable service
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

# Check status
sudo systemctl status postgresql-15
\`\`\`

## Configure Authentication

\`\`\`bash
# Edit pg_hba.conf
sudo vi /var/lib/pgsql/15/data/pg_hba.conf

# Allow password authentication
# Change: local all all peer
# To:     local all all md5

# Restart service
sudo systemctl restart postgresql-15
\`\`\`

## Create User and Database

\`\`\`bash
sudo -u postgres psql <<EOF
CREATE USER appuser WITH PASSWORD 'AppPass123';
CREATE DATABASE appdb OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE appdb TO appuser;
\\q
EOF
\`\`\``,
    rank: 31,
    tags: ['postgresql', 'rhel', 'installation', 'postgres15', 'linux']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Backup with pg_dump and pg_basebackup',
    summary: 'Implement PostgreSQL logical and physical backups using pg_dump and pg_basebackup on RHEL.',
    tutorial: `# PostgreSQL Backup with pg_dump and pg_basebackup

## Logical Backup with pg_dump

\`\`\`bash
#!/bin/bash
# /usr/local/bin/pg_backup.sh

BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
PGUSER="postgres"

mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U $PGUSER -Fc appdb > $BACKUP_DIR/appdb_$DATE.dump

# All databases
pg_dumpall -U $PGUSER | gzip > $BACKUP_DIR/all_dbs_$DATE.sql.gz

# Schema only
pg_dump -U $PGUSER -s appdb > $BACKUP_DIR/appdb_schema_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
\`\`\`

## Physical Backup with pg_basebackup

\`\`\`bash
# Configure replication user
sudo -u postgres psql <<EOF
CREATE USER replicator WITH REPLICATION PASSWORD 'ReplPass123';
EOF

# Edit pg_hba.conf
echo "host replication replicator 0.0.0.0/0 md5" | sudo tee -a /var/lib/pgsql/15/data/pg_hba.conf

# Take base backup
pg_basebackup -U replicator -h localhost -D /backup/postgresql/base_$DATE -Fp -Xs -P
\`\`\`

## Restore Database

\`\`\`bash
# Restore from custom format
pg_restore -U postgres -d appdb -c /backup/postgresql/appdb_20240101.dump

# Restore from SQL
psql -U postgres appdb < /backup/postgresql/appdb_20240101.sql
\`\`\``,
    rank: 32,
    tags: ['postgresql', 'rhel', 'backup', 'pg_dump', 'pg_basebackup', 'recovery']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Streaming Replication on RHEL',
    summary: 'Set up PostgreSQL streaming replication for high availability on RHEL systems.',
    tutorial: `# PostgreSQL Streaming Replication on RHEL

## Primary Server Configuration

\`\`\`bash
# Edit postgresql.conf
sudo vi /var/lib/pgsql/15/data/postgresql.conf

# Add/modify:
listen_addresses = '*'
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
hot_standby = on
archive_mode = on
archive_command = 'cp %p /var/lib/pgsql/15/archive/%f'

# Create replication user
sudo -u postgres psql <<EOF
CREATE USER replicator WITH REPLICATION PASSWORD 'ReplPass123';
EOF

# Edit pg_hba.conf
echo "host replication replicator 192.168.1.0/24 md5" | sudo tee -a /var/lib/pgsql/15/data/pg_hba.conf

# Restart primary
sudo systemctl restart postgresql-15
\`\`\`

## Standby Server Setup

\`\`\`bash
# Stop PostgreSQL on standby
sudo systemctl stop postgresql-15

# Remove data directory
sudo rm -rf /var/lib/pgsql/15/data/*

# Clone from primary
pg_basebackup -h 192.168.1.10 -U replicator -D /var/lib/pgsql/15/data -Fp -Xs -P -R

# Start standby
sudo systemctl start postgresql-15
\`\`\`

## Monitor Replication

\`\`\`sql
-- On primary
SELECT client_addr, state, sync_state, replay_lag
FROM pg_stat_replication;

-- On standby
SELECT pg_is_in_recovery();
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();
\`\`\``,
    rank: 33,
    tags: ['postgresql', 'rhel', 'replication', 'streaming', 'high-availability', 'standby']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Performance Tuning on RHEL',
    summary: 'Optimize PostgreSQL configuration for memory, connections, and query performance on RHEL.',
    tutorial: `# PostgreSQL Performance Tuning on RHEL

## Memory Configuration

\`\`\`ini
# /var/lib/pgsql/15/data/postgresql.conf

# Shared buffers (25% of RAM)
shared_buffers = 4GB

# Effective cache size (50-75% of RAM)
effective_cache_size = 12GB

# Work memory (RAM / max_connections / 2)
work_mem = 64MB

# Maintenance work memory
maintenance_work_mem = 512MB

# WAL buffers
wal_buffers = 16MB
\`\`\`

## Connection and Query Settings

\`\`\`ini
# Connections
max_connections = 200
superuser_reserved_connections = 3

# Query planner
random_page_cost = 1.1  # for SSD
effective_io_concurrency = 200

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB
\`\`\`

## Monitoring Queries

\`\`\`sql
-- Enable pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- Top slow queries
SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Cache hit ratio
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
\`\`\``,
    rank: 34,
    tags: ['postgresql', 'rhel', 'performance', 'tuning', 'optimization']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL User and Role Management',
    summary: 'Create PostgreSQL users, roles, and manage database privileges and permissions.',
    tutorial: `# PostgreSQL User and Role Management

## Create Users and Roles

\`\`\`sql
-- Create role
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE appdb TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

-- Create user with role
CREATE USER appuser WITH PASSWORD 'AppPass123';
GRANT readonly TO appuser;

-- Create superuser
CREATE USER admin WITH SUPERUSER PASSWORD 'AdminPass123';

-- Create user with specific privileges
CREATE USER datawriter WITH PASSWORD 'WritePass123';
GRANT CONNECT ON DATABASE appdb TO datawriter;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO datawriter;
\`\`\`

## Manage Privileges

\`\`\`sql
-- Grant schema privileges
GRANT USAGE, CREATE ON SCHEMA myschema TO appuser;

-- Grant table privileges
GRANT SELECT, INSERT, UPDATE ON mytable TO appuser;

-- Grant sequence privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO appuser;

-- Revoke privileges
REVOKE DELETE ON mytable FROM appuser;
\`\`\`

## View Permissions

\`\`\`sql
-- List users and roles
\\du

-- Check table privileges
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name='mytable';

-- Check database privileges
\\l+
\`\`\``,
    rank: 35,
    tags: ['postgresql', 'user-management', 'roles', 'privileges', 'security']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Vacuum and Maintenance',
    summary: 'Configure autovacuum, run manual vacuum, and perform database maintenance tasks.',
    tutorial: `# PostgreSQL Vacuum and Maintenance

## Configure Autovacuum

\`\`\`ini
# postgresql.conf
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.05
\`\`\`

## Manual Vacuum

\`\`\`sql
-- Vacuum single table
VACUUM VERBOSE ANALYZE mytable;

-- Vacuum full (locks table)
VACUUM FULL mytable;

-- Vacuum entire database
VACUUM VERBOSE ANALYZE;

-- Vacuum freeze
VACUUM FREEZE;
\`\`\`

## Monitor Bloat

\`\`\`sql
-- Check table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup, n_live_tup,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Check index bloat
SELECT schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
\`\`\`

## Reindex

\`\`\`sql
REINDEX TABLE mytable;
REINDEX INDEX myindex;
REINDEX DATABASE appdb;
\`\`\``,
    rank: 36,
    tags: ['postgresql', 'vacuum', 'maintenance', 'autovacuum', 'bloat']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL 15 Installation on Windows Server',
    summary: 'Install PostgreSQL 15 on Windows Server using the EnterpriseDB installer.',
    tutorial: `# PostgreSQL 15 Installation on Windows Server

## Download Installer

1. Visit https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Download postgresql-15.x-windows-x64.exe

## Silent Installation

\`\`\`powershell
# Run installer silently
.\\postgresql-15.x-windows-x64.exe --mode unattended \`
  --prefix "C:\\Program Files\\PostgreSQL\\15" \`
  --datadir "C:\\Program Files\\PostgreSQL\\15\\data" \`
  --superpassword "PostgresPass123" \`
  --serverport 5432 \`
  --servicename "postgresql-15" \`
  --serviceaccount "NT AUTHORITY\\NetworkService"

# Add to PATH
$env:PATH += ";C:\\Program Files\\PostgreSQL\\15\\bin"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, "Machine")
\`\`\`

## Configure Windows Firewall

\`\`\`powershell
New-NetFirewallRule -DisplayName "PostgreSQL" \`
  -Direction Inbound \`
  -Protocol TCP \`
  -LocalPort 5432 \`
  -Action Allow \`
  -Profile Domain,Private
\`\`\`

## Verify Installation

\`\`\`powershell
# Check service
Get-Service postgresql-15

# Connect to database
psql -U postgres -d postgres
\`\`\``,
    rank: 37,
    tags: ['postgresql', 'windows', 'installation', 'postgres15', 'windows-server']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Backup with PowerShell on Windows',
    summary: 'Automate PostgreSQL backups on Windows using PowerShell and Task Scheduler.',
    tutorial: `# PostgreSQL Backup with PowerShell on Windows

## Backup Script

\`\`\`powershell
# C:\\Scripts\\pg_backup.ps1

$BackupDir = "D:\\Backups\\PostgreSQL"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$PgBin = "C:\\Program Files\\PostgreSQL\\15\\bin"
$env:PGPASSWORD = "PostgresPass123"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir

# Backup all databases
& "$PgBin\\pg_dumpall.exe" -U postgres | Out-File "$BackupDir\\all_dbs_$Date.sql" -Encoding UTF8

# Backup specific database (custom format)
& "$PgBin\\pg_dump.exe" -U postgres -Fc appdb -f "$BackupDir\\appdb_$Date.dump"

# Compress SQL backup
Compress-Archive -Path "$BackupDir\\all_dbs_$Date.sql" \`
  -DestinationPath "$BackupDir\\all_dbs_$Date.zip"
Remove-Item "$BackupDir\\all_dbs_$Date.sql"

# Remove backups older than 7 days
Get-ChildItem $BackupDir -Filter "*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item

Get-ChildItem $BackupDir -Filter "*.zip" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item
\`\`\`

## Schedule Backup

\`\`\`powershell
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" \`
  -Argument "-File C:\\Scripts\\pg_backup.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
Register-ScheduledTask -TaskName "PostgreSQLBackup" \`
  -Action $Action -Trigger $Trigger -RunLevel Highest
\`\`\``,
    rank: 38,
    tags: ['postgresql', 'windows', 'backup', 'powershell', 'automation']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Connection Pooling with PgBouncer',
    summary: 'Install and configure PgBouncer for PostgreSQL connection pooling on RHEL.',
    tutorial: `# PostgreSQL Connection Pooling with PgBouncer

## Install PgBouncer

\`\`\`bash
sudo dnf install -y pgbouncer
\`\`\`

## Configure PgBouncer

\`\`\`ini
# /etc/pgbouncer/pgbouncer.ini

[databases]
appdb = host=localhost port=5432 dbname=appdb

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
log_connections = 1
log_disconnections = 1
\`\`\`

## Create User List

\`\`\`bash
# Generate MD5 password
echo -n "AppPass123appuser" | md5sum

# Add to userlist.txt
echo '"appuser" "md5<hash_from_above>"' | sudo tee /etc/pgbouncer/userlist.txt
\`\`\`

## Start PgBouncer

\`\`\`bash
sudo systemctl start pgbouncer
sudo systemctl enable pgbouncer

# Connect via PgBouncer
psql -h localhost -p 6432 -U appuser appdb
\`\`\`

## Monitor PgBouncer

\`\`\`sql
-- Connect to pgbouncer admin
psql -h localhost -p 6432 -U pgbouncer pgbouncer

-- Show pools
SHOW POOLS;

-- Show stats
SHOW STATS;

-- Show clients
SHOW CLIENTS;
\`\`\``,
    rank: 39,
    tags: ['postgresql', 'pgbouncer', 'connection-pooling', 'performance', 'rhel']
  },
  {
    db_type: 'postgresql',
    title: 'PostgreSQL Monitoring with pg_stat_activity',
    summary: 'Monitor PostgreSQL active connections, long-running queries, and blocking locks.',
    tutorial: `# PostgreSQL Monitoring with pg_stat_activity

## Active Connections

\`\`\`sql
-- Current connections by database
SELECT datname, count(*) as connections
FROM pg_stat_activity
GROUP BY datname
ORDER BY connections DESC;

-- Active queries
SELECT pid, usename, application_name, client_addr,
  state, query_start, state_change,
  SUBSTRING(query, 1, 100) AS query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
\`\`\`

## Long-Running Queries

\`\`\`sql
SELECT pid, usename, datname,
  now() - query_start AS duration,
  state, wait_event_type, wait_event,
  SUBSTRING(query, 1, 200) AS query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_terminate_backend(12345);  -- replace with actual PID
\`\`\`

## Blocking Locks

\`\`\`sql
SELECT blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
\`\`\``,
    rank: 40,
    tags: ['postgresql', 'monitoring', 'pg_stat_activity', 'locks', 'performance']
  },

  // ═══════════════════════════════════════════════════════════
  // EDB (EnterpriseDB) — 8 entries
  // ═══════════════════════════════════════════════════════════
  {
    db_type: 'edb',
    title: 'EDB Postgres Advanced Server Installation on RHEL 9',
    summary: 'Install EDB Postgres Advanced Server (EPAS) 15 on RHEL 9 with Oracle compatibility mode.',
    tutorial: `# EDB Postgres Advanced Server Installation on RHEL 9

## Register EDB Repository

\`\`\`bash
# Install EDB repository (requires EDB account)
curl -1sLf 'https://downloads.enterprisedb.com/YOUR_TOKEN/enterprise/setup.rpm.sh' | sudo bash

# Install EPAS 15
sudo dnf install -y edb-as15-server

# Initialize database
sudo /usr/edb/as15/bin/edb-as-15-setup initdb

# Start service
sudo systemctl start edb-as-15
sudo systemctl enable edb-as-15
\`\`\`

## Oracle Compatibility Mode

\`\`\`sql
-- Connect as enterprisedb superuser
psql -U enterprisedb -d edb

-- Enable Oracle-compatible packages
-- DBMS_OUTPUT
BEGIN
  DBMS_OUTPUT.PUT_LINE('Hello from EDB!');
END;
/

-- DBMS_JOB (Oracle-compatible scheduler)
DECLARE
  v_job NUMBER;
BEGIN
  DBMS_JOB.SUBMIT(v_job, 'BEGIN NULL; END;', SYSDATE, 'SYSDATE + 1/24');
  COMMIT;
END;
/
\`\`\`

## Configure postgresql.conf

\`\`\`ini
# /var/lib/edb/as15/data/postgresql.conf
listen_addresses = '*'
port = 5444
max_connections = 300
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 32MB
maintenance_work_mem = 256MB

# EDB-specific
edb_audit = 'all'
edb_audit_directory = '/var/log/edb/as15/audit'
edb_audit_filename = 'audit-%Y-%m-%d_%H%M%S'
\`\`\``,
    rank: 41,
    tags: ['edb', 'rhel', 'installation', 'epas', 'oracle-compatibility']
  },
  {
    db_type: 'edb',
    title: 'EDB Postgres Backup and Recovery with BART',
    summary: 'Use EDB Backup and Recovery Tool (BART) for automated PostgreSQL and EPAS backups.',
    tutorial: `# EDB Backup and Recovery with BART

## Install BART

\`\`\`bash
sudo dnf install -y edb-bart
\`\`\`

## Configure BART

\`\`\`ini
# /etc/bart.cfg
[BART]
bart_host = bart_user@192.168.1.50
backup_path = /backup/bart
pg_basebackup_path = /usr/edb/as15/bin/pg_basebackup
logfile = /var/log/bart/bart.log
scanner_logfile = /var/log/bart/bart_scanner.log

[EPAS15]
host = 192.168.1.10
port = 5444
user = bart
cluster_owner = enterprisedb
backup_name = epas15_%year-%month-%dayT%hour:%minute:%second
retention_policy = 7 DAYS
description = "EPAS 15 Production"
\`\`\`

## Create BART User

\`\`\`sql
CREATE USER bart SUPERUSER PASSWORD 'BartPass123';
\`\`\`

## Run Backups

\`\`\`bash
# Initialize BART
bart INIT -s EPAS15

# Take full backup
bart BACKUP -s EPAS15 -z

# List backups
bart SHOW-BACKUPS -s EPAS15

# Verify backup
bart VERIFY-CHKSUM -s EPAS15 -i latest
\`\`\`

## Restore

\`\`\`bash
# Restore to specific time
bart RESTORE -s EPAS15 -i latest \\
  -r "-R" \\
  -t "2024-06-01 03:00:00"
\`\`\``,
    rank: 42,
    tags: ['edb', 'bart', 'backup', 'recovery', 'rhel']
  },
  {
    db_type: 'edb',
    title: 'EDB Postgres Advanced Server on Windows',
    summary: 'Install and configure EDB Postgres Advanced Server on Windows Server with Oracle compatibility.',
    tutorial: `# EDB Postgres Advanced Server on Windows

## Download and Install

\`\`\`powershell
# Download from EDB portal
# Run installer
.\\edb-as15-windows-x64.exe --mode unattended \`
  --prefix "C:\\Program Files\\edb\\as15" \`
  --datadir "C:\\Program Files\\edb\\as15\\data" \`
  --superpassword "EnterprisePass123" \`
  --serverport 5444 \`
  --servicename "edb-as-15"

# Add to PATH
$env:PATH += ";C:\\Program Files\\edb\\as15\\bin"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, "Machine")
\`\`\`

## Configure Firewall

\`\`\`powershell
New-NetFirewallRule -DisplayName "EDB EPAS 15" \`
  -Direction Inbound -Protocol TCP \`
  -LocalPort 5444 -Action Allow
\`\`\`

## Oracle-Compatible Features

\`\`\`sql
-- Connect
psql -U enterprisedb -p 5444 -d edb

-- Use Oracle-style sequences
CREATE SEQUENCE emp_seq START 1 INCREMENT 1;
SELECT emp_seq.NEXTVAL FROM DUAL;

-- Oracle-style date functions
SELECT SYSDATE FROM DUAL;
SELECT ADD_MONTHS(SYSDATE, 3) FROM DUAL;
SELECT MONTHS_BETWEEN(SYSDATE, '01-JAN-2024') FROM DUAL;

-- ROWNUM support
SELECT * FROM employees WHERE ROWNUM <= 10;

-- NVL function
SELECT NVL(commission, 0) FROM employees;
\`\`\``,
    rank: 43,
    tags: ['edb', 'windows', 'installation', 'epas', 'oracle-compatibility']
  },
  {
    db_type: 'edb',
    title: 'EDB Postgres Replication with Replication Server',
    summary: 'Configure EDB Replication Server for single-master and multi-master replication.',
    tutorial: `# EDB Postgres Replication with Replication Server

## Install Replication Server

\`\`\`bash
sudo dnf install -y edb-xdb-replicationserver
\`\`\`

## Configure Publication Database

\`\`\`sql
-- Create replication user on source
CREATE USER pubuser WITH PASSWORD 'PubPass123' REPLICATION;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pubuser;

-- Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;
SELECT pg_reload_conf();
\`\`\`

## Configure via CLI

\`\`\`bash
# Create publication server
java -jar edb-repcli.jar -createpubserver \\
  -repsvrfile /etc/edb/xdb/xdbReplicationServer.conf

# Add publication database
java -jar edb-repcli.jar -addpubdb \\
  -repsvrfile /etc/edb/xdb/xdbReplicationServer.conf \\
  -dbtype enterprisedb \\
  -dbhost 192.168.1.10 -dbport 5444 \\
  -dbuser pubuser -dbpassword PubPass123 \\
  -database edb

# Create publication
java -jar edb-repcli.jar -createpub mypub \\
  -repsvrfile /etc/edb/xdb/xdbReplicationServer.conf \\
  -pubdbid 1 \\
  -tables public.employees,public.departments
\`\`\`

## Monitor Replication

\`\`\`sql
SELECT pub_name, status, last_replication_date
FROM _edb_replicator_pub.xdb_pub_replog
ORDER BY last_replication_date DESC;
\`\`\``,
    rank: 44,
    tags: ['edb', 'replication', 'xdb', 'high-availability', 'multi-master']
  },
  {
    db_type: 'edb',
    title: 'EDB Postgres Audit Logging Configuration',
    summary: 'Configure EDB audit logging for compliance and security monitoring in EPAS.',
    tutorial: `# EDB Postgres Audit Logging Configuration

## Enable EDB Audit

\`\`\`ini
# postgresql.conf
edb_audit = 'all'
edb_audit_connect = 'all'
edb_audit_disconnect = 'all'
edb_audit_statement = 'ddl,dml,error'
edb_audit_directory = '/var/log/edb/as15/audit'
edb_audit_filename = 'audit-%Y-%m-%d_%H%M%S.log'
edb_audit_rotation_day = 'every'
edb_audit_rotation_size = 100
edb_audit_tag = 'PROD'
\`\`\`

## Reload Configuration

\`\`\`bash
sudo systemctl reload edb-as-15
\`\`\`

## Audit Specific Objects

\`\`\`sql
-- Audit specific table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create audit policy
CREATE AUDIT POLICY emp_audit
  ACTIONS SELECT, INSERT, UPDATE, DELETE ON employees;

AUDIT POLICY emp_audit;
\`\`\`

## Query Audit Logs

\`\`\`bash
# View recent audit entries
tail -100 /var/log/edb/as15/audit/audit-$(date +%Y-%m-%d)*.log

# Filter by user
grep '"user":"appuser"' /var/log/edb/as15/audit/audit-*.log | tail -50
\`\`\``,
    rank: 45,
    tags: ['edb', 'audit', 'compliance', 'security', 'logging']
  },
  {
    db_type: 'edb',
    title: 'EDB Postgres Performance Tuning',
    summary: 'Tune EDB Postgres Advanced Server for OLTP and OLAP workloads with Oracle-compatible settings.',
    tutorial: `# EDB Postgres Performance Tuning

## Memory and Connection Settings

\`\`\`ini
# /var/lib/edb/as15/data/postgresql.conf

# Memory (adjust to 25% of RAM for shared_buffers)
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 128MB
maintenance_work_mem = 1GB
huge_pages = try

# Connections
max_connections = 500
superuser_reserved_connections = 5

# WAL
wal_level = replica
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 8GB
min_wal_size = 2GB

# Parallel query
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 16
\`\`\`

## Oracle-Compatible Optimizer Hints

\`\`\`sql
-- Use index hint
SELECT /*+ INDEX(e emp_idx) */ * FROM employees e WHERE dept_id = 10;

-- Full table scan hint
SELECT /*+ FULL(e) */ * FROM employees e;

-- Leading table hint
SELECT /*+ LEADING(d e) */ d.name, e.salary
FROM departments d JOIN employees e ON d.id = e.dept_id;
\`\`\`

## Analyze and Statistics

\`\`\`sql
-- Update statistics
ANALYZE employees;
ANALYZE VERBOSE employees;

-- Check planner statistics
SELECT attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'employees';
\`\`\``,
    rank: 46,
    tags: ['edb', 'performance', 'tuning', 'optimizer', 'oracle-hints']
  },
  {
    db_type: 'edb',
    title: 'EDB Migration Toolkit — Oracle to EDB',
    summary: 'Migrate Oracle database schema and data to EDB Postgres Advanced Server using Migration Toolkit.',
    tutorial: `# EDB Migration Toolkit — Oracle to EDB

## Install Migration Toolkit

\`\`\`bash
sudo dnf install -y edb-migrationtoolkit
\`\`\`

## Configure toolkit.properties

\`\`\`properties
# /usr/edb/migrationtoolkit/etc/toolkit.properties
SRC_DB_URL=jdbc:oracle:thin:@//192.168.1.20:1521/ORCL
SRC_DB_USER=system
SRC_DB_PASSWORD=OraclePass123

TARGET_DB_URL=jdbc:edb://localhost:5444/edb
TARGET_DB_USER=enterprisedb
TARGET_DB_PASSWORD=EnterprisePass123
\`\`\`

## Run Migration

\`\`\`bash
# Migrate schema only
runMTK.sh -sourcedbtype oracle -targetdbtype edb \\
  -schemaOnly HR

# Migrate data only
runMTK.sh -sourcedbtype oracle -targetdbtype edb \\
  -dataOnly HR

# Full migration
runMTK.sh -sourcedbtype oracle -targetdbtype edb \\
  -allTables HR

# Migrate specific tables
runMTK.sh -sourcedbtype oracle -targetdbtype edb \\
  -tables EMPLOYEES,DEPARTMENTS HR
\`\`\`

## Post-Migration Validation

\`\`\`sql
-- Compare row counts
SELECT 'employees' AS tbl, COUNT(*) FROM employees
UNION ALL
SELECT 'departments', COUNT(*) FROM departments;

-- Check constraints
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE connamespace = 'hr'::regnamespace;
\`\`\``,
    rank: 47,
    tags: ['edb', 'migration', 'oracle', 'migration-toolkit', 'dba']
  },
  {
    db_type: 'edb',
    title: 'EDB Failover Manager (EFM) Setup',
    summary: 'Configure EDB Failover Manager for automatic failover and high availability in EPAS clusters.',
    tutorial: `# EDB Failover Manager (EFM) Setup

## Install EFM

\`\`\`bash
sudo dnf install -y edb-efm4
\`\`\`

## Configure efm.properties (Primary)

\`\`\`properties
# /etc/edb/efm-4.0/efm.properties
db.user=efm
db.password.encrypted=<encrypted_password>
db.port=5444
db.database=edb
db.service.owner=enterprisedb
db.service.name=edb-as-15
db.bin=/usr/edb/as15/bin
db.data.dir=/var/lib/edb/as15/data

efm.port=7800
efm.node.timeout=10
efm.notification.email=dba@company.com
efm.notification.script=/usr/edb/efm-4.0/bin/efm_notify.sh

bind.address=192.168.1.10:7800
is.witness=false
auto.allow.hosts=true
\`\`\`

## Create EFM User

\`\`\`sql
CREATE USER efm WITH PASSWORD 'EfmPass123' SUPERUSER;
\`\`\`

## Start EFM Cluster

\`\`\`bash
# On each node
sudo systemctl start edb-efm-4.0
sudo systemctl enable edb-efm-4.0

# Check cluster status
efm cluster-status efm

# Allow standby node
efm allow-node efm 192.168.1.11
\`\`\`

## Monitor Failover

\`\`\`bash
# View cluster status
efm cluster-status efm

# Promote standby manually
efm promote efm -switchover

# View EFM log
tail -f /var/log/efm-4.0/startup.log
\`\`\``,
    rank: 48,
    tags: ['edb', 'efm', 'failover', 'high-availability', 'cluster']
  },
