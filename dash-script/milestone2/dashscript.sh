#!/bin/bash
# This function takes in a name of mp4 and returns a new mp4 file + thumbnail + dash files where:
#####
# - Video is padded with black bars til 16:9
# - Video name: v[###].mp4
#####
# - Thumbnail is 320x180
# - Thumbnail name: v[###].jpg
#####
# - Dash Manifest name:  v[###].mpd
# - Dash Chunk name:     v[###]_init_[RepresentationID].m4s
# - Dash Init name:      v[###]_chunk_[RepresentationID]_[Number].m4s
#####

IN_DIR="/var/html/media"
ROOT_DIR="/var/html/media"
fileName=$1
id=$2

inFile="$IN_DIR/$fileName"
outvid="$ROOT_DIR/$id.mp4"
outjpg="$ROOT_DIR/$id.jpg"
outmpd="$ROOT_DIR/$id.mpd"

# 16:9 video
ffmpeg -i $inFile -vcodec libx264 -crf 23 -vf "scale=w=trunc(ih*dar/2)*2:h=trunc(ih/2)*2, setsar=1/1, scale=w=1920:h=1080:force_original_aspect_ratio=1, pad=w=1920:h=1080:x=(ow-iw)/2:y=(oh-ih)/2:color=#000000" $outvid
# 320x180 thumbnail
ffmpeg -i $outvid -vf "select=eq(n\,0),scale=320:180" -frames:v 1 -q:v 3 $outjpg
# dash
fps=$(ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate $inFile)
fps=$(awk "BEGIN {print int(($fps) + 0.5)}") # fps=24000/1001 ==> 30

ffmpeg -re -i "$outvid" \
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
    -bf 1 -keyint_min $fps -g $fps -sc_threshold 0 -b_strategy 0 \
    -adaptation_sets "id=0,streams=v id=1,streams=a" \
    -init_seg_name "v${id}_init_\$RepresentationID\$.\$ext\$" \
    -media_seg_name "v${id}_chunk_\$RepresentationID\$_\$Number\$.\$ext\$" \
    -use_template 1 -use_timeline 1 -seg_duration 10 \
    -f dash "$outmpd"
