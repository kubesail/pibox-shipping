gs -sDEVICE=bmpmono -r200 -f -sOutputfile=label.png label.pdf
gm convert label.png -crop 800x1198+450+80 label.png
node raster-to-tspl-js/print.js label.png
