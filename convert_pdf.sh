/c/Program\ Files/gs/gs9.55.0/bin/gswin64c.exe \
  -o cropped.png \
  -sDEVICE=bmpmono \
  -r200 \
  -f test.pdf

gm convert cropped.png -crop 800x1198+450+80 cropped.png
