#!/bin/sh
set -e
cd "`dirname $0`"
echo "sudo password, then postgres password ..."
sudo -u postgres psql < recreate-ihasamoney-database.sql 
echo "postgres password again ..."
sudo -u postgres psql -d ihasamoney < schema.sql 
echo "and again ..."
sudo -u postgres psql -d ihasamoney < data.sql 
