#!/bin/bash
gs -sDEVICE=bmpmono -r200 -f -o label.png label.pdf
gm convert label.png -crop 800x1198+450+80 label.png

convert label.png -fill white -stroke white -draw "rectangle 620,32 775,84" label.png
convert label.png +antialias -font DejaVu-Sans-Bold -pointsize 14 -annotate +620+32 "PiBox" label.png

# node raster-to-tspl-js/print.js label.png
