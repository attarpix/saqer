$sp = Split-Path $MyInvocation.MyCommand.Path
Add-Type -Path "$sp\Img.cs" -ReferencedAssemblies System.Drawing
Add-Type -AssemblyName System.Drawing
$Out = Join-Path (Split-Path $sp) 'assets\sprites'
[Img]::Load((Join-Path (Split-Path $sp) 'art\Retro Jordanian Hero Sprite Sheet.png'))
[Img]::FloodGrad(14, 20)
# x0,y0,x1,y1 (tight boxes from component scan)
$grow   = @(@(821,686,894,785),@(920,671,1001,785),@(1027,652,1113,785),@(1137,633,1230,785),@(1251,610,1357,784),@(1380,582,1506,784))
$shrink = @(@(820,849,919,996),@(943,857,1036,997),@(1062,865,1150,998),@(1177,872,1262,998),@(1296,887,1368,998),@(1410,899,1470,998))
function Make($boxes, $h0, $h1) {
  $res = @(); $n = $boxes.Count
  for ($k = 0; $k -lt $n; $k++) {
    $b = $boxes[$k]; $t = [Img]::Tight([int]$b[0], [int]$b[1], [int]$b[2], [int]$b[3])
    $sw = $t[2]-$t[0]+1; $sh = $t[3]-$t[1]+1
    $target = $h0 + ($h1 - $h0) * $k / ($n - 1)
    $cell = [double]$sh / $target
    $ow = 0; $oh = 0
    $d = [Img]::Down([int]$t[0], [int]$t[1], [int]$sw, [int]$sh, [double]$cell, [ref]$ow, [ref]$oh)
    $res += ,@($d, $ow, $oh)
  }
  return ,$res
}
$g = Make $grow 35 53
$s = Make $shrink 53 35
$all = $g + $s
$W = 0; $H = 0; foreach ($i in $all) { $W += $i[1] + 2; if ($i[2] -gt $H) { $H = $i[2] } }
$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$x = 0; $fr = @()
for ($k = 0; $k -lt $all.Count; $k++) {
  $i = $all[$k]; $tmp = "$sp\tmpg_$k.png"; [Img]::Save($i[0], $i[1], $i[2], $tmp)
  $fb = [System.Drawing.Bitmap]::FromFile($tmp); $gr = [System.Drawing.Graphics]::FromImage($bmp)
  $gr.DrawImageUnscaled($fb, $x, ($H - $i[2])); $gr.Dispose(); $fb.Dispose()
  $fr += ,@($x, ($H - $i[2]), $i[1], $i[2]); $x += $i[1] + 2
}
$bmp.Save("$Out\saqer_grow.png", [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
$json = Get-Content "$Out\saqer.json" -Raw | ConvertFrom-Json
$growObj = [ordered]@{ image = 'saqer_grow.png'; frames = [ordered]@{ grow = $fr[0..5]; shrink = $fr[6..11] } }
$json | Add-Member -NotePropertyName transform -NotePropertyValue $growObj -Force
($json | ConvertTo-Json -Depth 8 -Compress) | Set-Content -Encoding utf8 "$Out\saqer.json"
"ok $W x $H"
