gs -sDEVICE=bmpmono -r200 -f -o label.png label.pdf
gm convert label.png -crop 800x1198+450+80 label.png
node raster-to-tspl-js/print.js label.png