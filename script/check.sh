#!/bin/sh
CHECK_PORT=3000

echo "[CHECK INFO] $(date '+%Y-%m-%d %H:%M:%S') check http service"

http_code=`curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:$CHECK_PORT`

if [ $http_code == 200 ] || [ $http_code == 302 ]
then
    echo "[CHECK INFO] check success $http_code"
    exit 0
else
    echo "[CHECK ERROR] check error $http_code"
    exit 2
fi
