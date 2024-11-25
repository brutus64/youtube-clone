#!/bin/bash
# This function takes in a directory of mp4 and returns new mp4 files + thumbnails + dash files where:
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
# RELYS ON EXISTING "videos" DIRECTORY
IN_DIR="videos"
OUT_DIR=${1:-'video'}
DSH_DIR=${2:-'media'}

# SET UP output directories
if [ -d "$OUT_DIR" ]; then rm -Rf $OUT_DIR; fi
mkdir "$OUT_DIR"
if [ -d "$DSH_DIR" ]; then rm -Rf $DSH_DIR; fi
mkdir "$DSH_DIR"

counter=1
vidFiles=`ls ./$IN_DIR/*.mp4`
for eachFile in $vidFiles # ./videos/854243-hd_1280_720_30fps.mp4
do
    relativeName=${eachFile/"./$IN_DIR/"/""} # 854243-hd_1280_720_30fps.mp4
    sed -i -e "s/$relativeName/v$counter/" ./$IN_DIR/m2.json

    outvid="./$OUT_DIR/v$counter.mp4"
    outjpg="./$DSH_DIR/v$counter.jpg"
    outmpd="./$DSH_DIR/v$counter.mpd"

    # 16:9 video
    ffmpeg -i $eachFile -vcodec libx264 -crf 23 -vf "scale=w=trunc(ih*dar/2)*2:h=trunc(ih/2)*2, setsar=1/1, scale=w=1920:h=1080:force_original_aspect_ratio=1, pad=w=1920:h=1080:x=(ow-iw)/2:y=(oh-ih)/2:color=#000000" $outvid
    # 320x180 thumbnail
    ffmpeg -i $outvid -vf "select=eq(n\,0),scale=320:180" -frames:v 1 -q:v 3 $outjpg
    # dash
    fps=$(ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate $eachFile)
    fps=$(awk "BEGIN {print int(($fps) + 0.5)}") # fps=24000/1001 ==> 30

    ffmpeg -re -i "$outvid" \
        -map 0:v -map 0:v -map 0:v \
        -map 0:a? \
        -c:a aac -ar:a 48000 -b:a 253k -ac 2 \
        -c:v libx264 \
        -b:v:0 512k -profile:v:0 main -s:v:0 640x360 \
        -b:v:1 768k -profile:v:1 main -s:v:1 960x540 \
        -b:v:2 1024k -profile:v:2 main -s:v:2 1280x720 \
        -bf 1 -keyint_min $fps -g $fps -sc_threshold 0 -b_strategy 0 \
        -adaptation_sets "id=0,streams=v id=1,streams=a" \
        -init_seg_name "v${counter}_init_\$RepresentationID\$.\$ext\$" \
        -media_seg_name "v${counter}_chunk_\$RepresentationID\$_\$Number\$.\$ext\$" \
        -use_template 1 -use_timeline 1 -seg_duration 10 \
        -f dash "$outmpd"

    ((counter++))
done

# Delete video directory
if [ -d "$OUT_DIR" ]; then rm -Rf $OUT_DIR; fi
# if [ -d "$IN_DIR" ]; then rm -Rf $OUT_DIR; fi