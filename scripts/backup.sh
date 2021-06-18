#!/bin/sh

mysqldump -h {host} -P 3306 -u {user} -p{pwd} {database} > db_backup_`date +%Y%m%d_%H%M`.sql
