#!/bin/bash

DIR=$(dirname "$0")
# Arg list:
# $1 == input ID
# $2 == fps

# input name from $1
inputName="$DIR/video/$1.mp4"
# output .mpd name from $1
outputName="$DIR/dash3/output_$1.mpd"
# keyint_min and -g Params from $2
keyNumber=$(($2 * 10))

ffmpeg -re -i "$inputName" \
  -map 0:v -map 0:v -map 0:v -map 0:v -map 0:v -map 0:v -map 0:v -map 0:v \
  -map 0:a? \
  -c:a aac -ar:a 48000 -b:a 253k -ac 2 \
  -c:v libx264 \
  -b:v:0 254k -profile:v:0 main -s:v:0 320x180 \
  -b:v:1 507k -profile:v:1 main -s:v:1 320x180 \
  -b:v:2 759k -profile:v:2 main -s:v:2 480x270 \
  -b:v:3 1013k -profile:v:3 main -s:v:3 640x360 \
  -b:v:4 1254k -profile:v:4 main -s:v:4 640x360 \
  -b:v:5 1883k -profile:v:5 main -s:v:5 768x432 \
  -b:v:6 3134k -profile:v:6 main -s:v:6 1024x576 \
  -b:v:7 4952k -profile:v:7 main -s:v:7 1280x720 \
  -bf 1 -keyint_min $keyNumber -g $keyNumber -sc_threshold 0 -b_strategy 0 \
  -adaptation_sets "id=0,streams=v id=1,streams=a" \
  -init_seg_name "init_${1}_\$RepresentationID\$.\$ext\$" \
  -media_seg_name "chunk_${1}_\$RepresentationID\$_\$Number\$.\$ext\$" \
  -use_template 1 -use_timeline 1 -seg_duration 10 \
  -f dash "$outputName"