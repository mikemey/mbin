#!/bin/bash

BACKUP_DIR="$PUBLIC/data/tantalusbak/"
TMP_DIR="tmp"
BAK_FILE="tantalus_db_$(date +"%Y%m%d_%H%M").gz"

echo "dumping remote db..."
ssh $MSMSSH /bin/bash << EOF
  cd "$TMP_DIR"
  mongodump --quiet --db=tantalus --excludeCollection=accounts --excludeCollection=sessions --gzip --archive="$BAK_FILE"
EOF

echo "transferring dump file..."
rsync -q -P -r $MSMSSH:"~/$TMP_DIR/$BAK_FILE" "$BACKUP_DIR"

echo "cleanup..."
ssh $MSMSSH /bin/bash << EOF
  cd "$TMP_DIR"
  rm "$BAK_FILE"
EOF

echo "done"