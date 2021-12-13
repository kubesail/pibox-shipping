gs label.pdf -sDEVICE=bmpmono -r200 -f -o label.png
gm convert label.png -crop 800x1198+450+80 label.png
node raster-to-tspl-js/print.js label.png