# Turns the pictures in art/new into game-ready files.
#   powershell -ExecutionPolicy Bypass -File tools/build_new_art.ps1
# Backdrops are cropped and resized to the size the game draws them at (saved as JPG).
# Sprite sheets are copied as they are: the game cuts the frames out when it starts (js/sheets.js).
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'art\new'
$bg   = Join-Path $root 'assets\bg'
$raw  = Join-Path $root 'assets\src'
New-Item -ItemType Directory -Force $bg, $raw | Out-Null

$jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$q = New-Object System.Drawing.Imaging.EncoderParameters 1
$q.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]90)

# present-day Amman by day (2026-11-15): art/new/try this new day gigger size.png → assets/bg/amman_day.png, made with ffmpeg:
#   crop=6336:2144:0:0,scale=1241:420:flags=area,eq=saturation=1.3:contrast=1.05:brightness=0.02   (1 art px = 2 canvas px in the game)
function Fit($name, $out, $cropH, $w, $h) {
  $im = [System.Drawing.Image]::FromFile((Join-Path $src $name))
  if ($cropH -le 0) { $cropH = $im.Height }
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($im, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle 0, 0, $im.Width, $cropH), 'Pixel')
  $bmp.Save((Join-Path $bg $out), $jpg, $q)
  $g.Dispose(); $bmp.Dispose(); $im.Dispose()
  "{0}  {1}x{2}" -f $out, $w, $h
}

# present-day Amman at sunset (the purple band at the bottom is cut off)
Fit 'Replace Rotana and w with the 2  659942 wgm.png'     'amman_sunset.jpg'  600 2172 600     # no brand names
# Philadelphia: the Roman city Saqer travels back to
Fit 'Make me a Roman pillar from pixe 491153 923.png'    'philadelphia.jpg'  600 1408 600
# the Roman theatre: the crowd sitting, and two pictures of it cheering
Fit 'Make the whole crowd stand up 850657 EqZ.png'       'theater_calm.jpg'    0 1381 752
Fit 'Make the crowd in the photo stan 526275 n7t.png'    'theater_cheer.jpg'   0 1381 752
Fit 'Make the back of the crowd in th 494357 QED.png'    'theater_cheer2.jpg'  0 1381 752

Copy-Item (Join-Path $src 'f4b7fee9-edfb-4e20-977f-26f484f92d1a (2).png')         (Join-Path $raw 'saqer_sheet.png') -Force
Copy-Item (Join-Path $src 'Make a full sprite sheet for thi 642541 562.png')      (Join-Path $raw 'hercules_sheet.png') -Force
Copy-Item (Join-Path $src 'Make me a Roman pillar from pixe 409139 ACi.png')      (Join-Path $raw 'pillar.png') -Force
'sheets copied'

# ---- size B (1 art pixel = 2 screen pixels): pictures saved at their art-pixel size, the game doubles them ----
function FitArt($name, $out, $cropW, $h) {
  $im = [System.Drawing.Image]::FromFile((Join-Path $src $name))
  if ($cropW -le 0) { $cropW = $im.Width }
  $w = [int][Math]::Round($cropW * $h / $im.Height)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($im, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle 0, 0, $cropW, $im.Height), 'Pixel')
  $bmp.Save((Join-Path $bg $out), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $im.Dispose()
  "{0}  {1}x{2}" -f $out, $w, $h
}
# Philadelphia street, west to east: the temple front, the colonnade, the forum (cropped before the bell tower)
FitArt 'bg (1).png' 'phila_temple.png'    0    420
FitArt 'bg (3).png' 'phila_colonnade.png' 0    420
FitArt 'bg (4).png' 'phila_forum.png'     1250 420
# Saqer, new sheet (no glasses, magenta background): cut at start-up by js/sheets.js
Copy-Item (Join-Path $src 'saqer new.png') (Join-Path $raw 'saqer_sheet2.png') -Force
'size-B art done'
# the city far below the sky level (magenta sky, cut away by the game)
# the city behind the Philadelphia street (magenta sky, cut away by the game)
function CityLayer($name, $out) {          # 760 px tall, nearest-neighbour so the magenta edge stays clean
  $im = [System.Drawing.Image]::FromFile((Join-Path $src $name)); $h = 760; $w = [int]($im.Width * $h / $im.Height)
  $b = New-Object System.Drawing.Bitmap $w, $h; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
  $g.DrawImage($im, (New-Object System.Drawing.Rectangle 0, 0, $w, $h))
  $b.Save((Join-Path $bg $out), [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose(); $im.Dispose()
  "{0}  {1}x{2}" -f $out, $w, $h
}
CityLayer 'bc 2 (6).png' 'city_below.png'     # the city far below the sky level
CityLayer 'bc 2 (1).png' 'city_street.png'    # the city behind the Philadelphia street
# sheets on magenta, cut at start-up by js/sheets.js (cutMagentaSheet)
Copy-Item (Join-Path $src '5865d078-0e83-4e43-8eb8-4c3e721aa6d1.png') (Join-Path $raw 'thief_sheet.png') -Force       # the thief (replaces the kid)
Copy-Item (Join-Path $src 'a58b9724-0da8-4fd1-92b3-56d25d74d8a5.png') (Join-Path $raw 'creatures_sheet.png') -Force   # scorpion, bat, pigeon
Copy-Item (Join-Path $src 'c2bafdf7-0cf1-4157-8b02-7d2acad11851.png') (Join-Path $raw 'saqer_run.png') -Force         # Saqer running
# the theatre crowd, from the owner's videos (needs ffmpeg): 9 clapping frames, 9 cheering frames (before the camera moves), and their sound
$crowd = Join-Path $bg 'crowd'; New-Item -ItemType Directory -Force $crowd | Out-Null
ffmpeg -v error -y -ss 0.25 -t 1.0 -i (Join-Path $src 'crowd 3.mp4') -vf fps=12 -q:v 2 (Join-Path $crowd 'crowd_%02d.jpg')   # one steady video for clapping and cheering
$sfx = Join-Path $root 'assets\sfx'; New-Item -ItemType Directory -Force $sfx | Out-Null
ffmpeg -v error -y -i (Join-Path $src 'crowd.mp4') -vn -ac 1 -ar 44100 -af 'afade=t=in:d=0.15,afade=t=out:st=4.3:d=0.8' -b:a 96k (Join-Path $sfx 'crowd_roar.mp3')
ffmpeg -v error -y -i (Join-Path $src 'crowd 3.mp4') -vn -ac 1 -ar 44100 -t 4.8 -b:a 96k (Join-Path $sfx 'crowd_clap.mp3')
'crowd done'
# frames from the owner's character videos (needs ffmpeg). Loops found by comparing frames: Saqer's stride = 16 video
# frames from n=40, the thief's = 20 from n=97. Hercules' talking video was cut off at the shins: it is the still picture
# exports/for_video/hercules.png with 120 px trimmed top and bottom, so the legs are put back from that picture.
$walk = Join-Path $src 'Animate both characters walking  236565 Nui.mp4'
$talk = Join-Path $src 'Hercules stands in place and tal 383951 L7X.mp4'
function Sel($ns) { ($ns | ForEach-Object { "eq(n\,$_)" }) -join '+' }
ffmpeg -v error -y -i $walk -vf "select='$(Sel 0,40,42,44,46,48,50,52,54)',crop=560:720:0:0,scale=280:360:flags=area,tile=9x1" -frames:v 1 -update 1 (Join-Path $raw 'saqer_walk.png')
ffmpeg -v error -y -i $walk -vf "select='$(Sel 97,99,101,103,105,107,109,111,113,115)',crop=480:720:560:0,scale=240:360:flags=area,tile=10x1" -frames:v 1 -update 1 (Join-Path $raw 'thief_walk.png')
ffmpeg -v error -y -i $talk -i (Join-Path $root 'exports\for_video\hercules.png') -filter_complex "[0]select='$(Sel 0,20,28,36,44,52,60,68,76,84,92)',pad=1280:960:0:120:color=0xff00ff[v];[1]crop=1280:126:0:834[legs];[v][legs]overlay=0:834,crop=640:860:320:100,scale=320:430:flags=area,tile=11x1" -frames:v 1 -update 1 (Join-Path $raw 'hercules_talk.png')
'character videos done'
Copy-Item (Join-Path $src "Firefly_Gemini Flash_make this temple look like it's freshly build  438500.png") (Join-Path $raw 'sky_temple.png') -Force    # the Temple of Hercules, freshly built (cut at start-up)
# the title screen: the theatre and the Citadel from the same skyline (the old title picture showed a named mall)
$im = [System.Drawing.Image]::FromFile((Join-Path $src 'Replace Rotana and w with the 2  659942 wgm.png'))
$t = New-Object System.Drawing.Bitmap 768, 432; $g = [System.Drawing.Graphics]::FromImage($t)
$g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
$g.DrawImage($im, (New-Object System.Drawing.Rectangle 0, 0, 768, 432), (New-Object System.Drawing.Rectangle 900, 0, 1067, 600), 'Pixel')
$t.Save((Join-Path $bg 'title_theater.png'), [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $t.Dispose(); $im.Dispose()
'title done'
