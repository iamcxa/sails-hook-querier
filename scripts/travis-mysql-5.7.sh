#!/usr/bin/env bash
set -x
set -e

# MySQL config
mysql -h 127.0.0.1 -u root -e "
set character_set_client      = utf8mb4;
set character_set_connection  = utf8mb4;
set character_set_database    = utf8mb4;
set character_set_results     = utf8mb4;
set character_set_server      = utf8mb4;
SHOW VARIABLES WHERE Variable_name LIKE 'character%' OR Variable_name LIKE 'collation%';
CREATE DATABASE \`database-ci\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
SHOW DATABASES;
SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
grant all privileges on database-ci.* to 'root'@'%' identified by 'root';
flush privileges;
"
exit
