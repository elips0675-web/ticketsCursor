#!/bin/sh
# Ждём, пока primary будет готов
sleep 15

# Настраиваем репликацию
mysql -h mysql -u root -p"${MYSQL_ROOT_PASSWORD}" \
  -e "CREATE USER IF NOT EXISTS 'replicator'@'%' IDENTIFIED BY 'replicator_pass';" \
  -e "GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';" \
  -e "FLUSH PRIVILEGES;"

# Получаем координаты бинарного лога primary
LOG_FILE=$(mysql -h mysql -u root -p"${MYSQL_ROOT_PASSWORD}" \
  -e "SHOW MASTER STATUS\G" | grep File | awk '{print $2}')
LOG_POS=$(mysql -h mysql -u root -p"${MYSQL_ROOT_PASSWORD}" \
  -e "SHOW MASTER STATUS\G" | grep Position | awk '{print $2}')

# Настраиваем реплику
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" \
  -e "CHANGE REPLICATION SOURCE TO
    SOURCE_HOST='mysql',
    SOURCE_USER='replicator',
    SOURCE_PASSWORD='replicator_pass',
    SOURCE_LOG_FILE='${LOG_FILE}',
    SOURCE_LOG_POS=${LOG_POS};" \
  -e "START REPLICA;"

echo "Replication started from ${LOG_FILE} at position ${LOG_POS}"
