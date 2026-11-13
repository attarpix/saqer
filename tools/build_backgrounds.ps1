# Builds the parallax layers from art/ into assets/bg/.
$sp = Split-Path $MyInvocation.MyCommand.Path
Add-Type -Path "$sp\Img.cs" -ReferencedAssemblies System.Drawing
$A = Join-Path (Split-Path -Parent $sp) 'art'
$O = Join-Path (Split-Path -Parent $sp) 'assets\bg'
New-Item -ItemType Directory -Force $O | Out-Null

# city layer: crop off the water, cut the sky out (keeps only what touches the bottom), shrink for depth
[Img]::Load("$A\Amman Skyline at Pixel Sunset.png")
$W = [Img]::W; $buf = New-Object int[] ($W * 600); [Array]::Copy([Img]::Px, $buf, $W * 600); [Img]::Px = $buf; [Img]::H = 600
[Img]::FloodSky(18, 6)
$d = [Img]::Resize(0, 0, $W, 600, 1303, 360, 1); [Img]::Binarize($d); [Img]::Save($d, 1303, 360, "$O\skyline.png")

# far skies: top half = midday, bottom half = sunset
[Img]::Load("$A\Pixel Sky_ Day and Sunset Panels.png")
$d = [Img]::Resize(0, 0, 2172, 355, 2546, 416, 1);   [Img]::Save($d, 2546, 416, "$O\sky_day.png")
$d = [Img]::Resize(0, 368, 2172, 356, 2546, 416, 1); [Img]::Save($d, 2546, 416, "$O\sky_sunset.png")

# title backdrop
[Img]::Load("$A\Amman Sunset_ Roman Theater and Abdali Skyline.png")
$d = [Img]::Resize(0, 0, 1672, 941, 768, 432, 1); [Img]::Save($d, 768, 432, "$O\title_theater.png")
"backgrounds written to $O"
