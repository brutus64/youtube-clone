From this current directory:
jpg dir is for thumbnails
dash dir is for manifests, chunks, and init
 - init -> init_ID_numberfrom0.m4s
 - chunk -> chunk_ID_Bitrate_numberfrom1.m4s
 - manifest -> output_ID.mpd

Steps:
 - wget into videos folder
 - ./padder.sh to pad videos into black bar
 - ./thumbnail1.sh into jpg folder to get thumbnails
 - ./dashinit1.sh into dash folder to get all dashfiles (init and chunks) and manifest files (runs dashscript.sh on multiple files)