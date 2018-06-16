mount -t ext2 /dev/mtdblock5 /tmp/config
vi /tmp/config/autorun.sh
chmod +x /tmp/config/autorun.sh
echo .
echo "unmounting /tmp/config..."
umount /tmp/config
