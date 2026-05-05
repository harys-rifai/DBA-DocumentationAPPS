ALTER USER 'root'@'localhost' IDENTIFIED BY 'Password09';

CREATE USER 'dba_user'@'%' IDENTIFIED BY 'Password09';
GRANT ALL PRIVILEGES ON *.* TO 'dba_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

mysqldump -u root -p --all-databases > backup.sql
mysql -u root -p < backup.sql


/usr/local/etc/my.cnf
/etc/my.cnf
/usr/local/mysql/etc/my.cnf


#parameter penting

[mysqld]
# Port & Bind
port=3306
bind-address=127.0.0.1
# User & Data Directory
user=mysql
datadir=/usr/local/var/mysql
# Logging
log_error=/usr/local/var/mysql/error.log
slow_query_log=1
slow_query_log_file=/usr/local/var/mysql/slow.log
# Performance
innodb_buffer_pool_size=512M
max_connections=200
query_cache_size=64M
# Security
skip-symbolic-links



ALTER USER 'root'@'localhost' IDENTIFIED BY 'Password09';
brew services start mysql
brew services stop mysql
brew services restart mysql



mysql> SHOW VARIABLES LIKE 'datadir';
+---------------+--------------------------+
| Variable_name | Value                    |
+---------------+--------------------------+
| datadir       | /opt/homebrew/var/mysql/ |
+---------------+--------------------------+
1 row in set (0.004 sec)

mysql> SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
+-------------------------+-----------+
| Variable_name           | Value     |
+-------------------------+-----------+
| innodb_buffer_pool_size | 536870912 |
+-------------------------+-----------+
1 row in set (0.003 sec)

mysql> SHOW VARIABLES LIKE 'max_connections';
+-----------------+-------+
| Variable_name   | Value |
+-----------------+-------+
| max_connections | 200   |
+-----------------+-------+
1 row in set (0.002 sec)

mysql> SHOW VARIABLES LIKE 'slow_query_log';
+----------------+-------+
| Variable_name  | Value |
+----------------+-------+
| slow_query_log | ON    |
+----------------+-------+
1 row in set (0.001 sec)

mysql> 

