#!/bin/bash
# input="serials.txt"
while :
do
  line=$(head /dev/urandom | tr -dc A-HJ-NP-Z2-9 | head -c9)
  PART1=$(echo $line | cut -c1-3)
  PART2=$(echo $line | cut -c4-6)
  PART3=$(echo $line | cut -c7-9)
  #PART1=SER
  #PART2=IAL
  #PART3=NUM
  # qrencode -s6 https://pibox.io/help/$line -o qr.png
  # convert qr.png -gravity north -background white -extent 203x248 qr.png
  # convert qr.png +antialias -font DejaVu-Sans-Bold -pointsize 14 -annotate +32+195 "↑  NEED HELP?  ↑" -style bold qr.png
  # convert qr.png +antialias -strokewidth 3 -stroke black -draw "line 30,205, 170,205" qr.png
  # convert qr.png +antialias -font DejaVu-Sans-Mono-Bold -pointsize 14 -annotate +22+226 "Serial: $PART1-$PART2-$PART3" -rotate -90 qr.png
  node raster-to-tspl-js/small_print.js qr.png
done
# done < "$input"
