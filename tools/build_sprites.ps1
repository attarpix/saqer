param([double]$Cell = 4.6, [double]$BigCell = 3.07, [string]$Out = '')
$sp = Split-Path $MyInvocation.MyCommand.Path
if (-not $Out) { $Out = Join-Path (Split-Path $sp) 'assets\sprites' }
Add-Type -Path "$sp\Img.cs" -ReferencedAssemblies System.Drawing
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Out | Out-Null
[Img]::Load((Join-Path (Split-Path $sp) 'art\Retro Jordanian Character Sprite Sheet.png'))
[Img]::FloodGrad(14, 30)

# name, y0, y1, list of x ranges (approximate boxes; tightened automatically)
$anims = @(
  @('idle', 60, 232, @(20,135,150,265,275,390,400,510)),
  @('walk', 60, 232, @(540,650,652,760,762,865,867,972)),
  @('run',  60, 232, @(1010,1138,1138,1262,1262,1386,1386,1512)),
  @('jump', 308, 492, @(15,135,150,268)),
  @('jumpUp', 288, 492, @(275,405)),
  @('jumpTop', 308, 492, @(405,515)),
  @('fall', 308, 492, @(555,665,665,775,772,882,882,992)),
  @('land', 308, 492, @(1015,1150,1150,1268,1268,1388,1388,1512)),
  @('hurt', 568, 732, @(15,135,150,240)),
  @('die',  568, 732, @(320,425,435,562,565,692)),
  @('die',  612, 732, @(695,842,845,1005)),
  @('win',  805, 975, @(900,1000))
)

function Build($cell, $tag) {
  $frames = @(); $imgs = @()
  foreach ($a in $anims) {
    $name = $a[0]; $y0 = $a[1]; $y1 = $a[2]
    $rr = $a[3]; for ($q = 0; $q -lt $rr.Count; $q += 2) {
      $t = [Img]::Tight([int]$rr[$q], [int]$y0, [int]$rr[$q+1], [int]$y1)
      $ow = 0; $oh = 0
      $d = [Img]::Down([int]$t[0], [int]$t[1], [int]($t[2]-$t[0]+1), [int]($t[3]-$t[1]+1), [double]$cell, [ref]$ow, [ref]$oh)
      $imgs += ,@($d, $ow, $oh)
      $frames += ,@($name, $ow, $oh)
    }
  }
  # pack in one row with 2px gutter
  $W = 0; $H = 0; foreach ($i in $imgs) { $W += $i[1] + 2; if ($i[2] -gt $H) { $H = $i[2] } }
  $bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $x = 0; $json = @{}
  for ($k = 0; $k -lt $imgs.Count; $k++) {
    $i = $imgs[$k]; $tmp = "$sp\tmp_$k.png"; [Img]::Save($i[0], $i[1], $i[2], $tmp)
    $fb = [System.Drawing.Bitmap]::FromFile($tmp)
    $g = [System.Drawing.Graphics]::FromImage($bmp); $g.DrawImageUnscaled($fb, $x, $H - $i[2]); $g.Dispose(); $fb.Dispose()
    $n = $frames[$k][0]; if (-not $json.ContainsKey($n)) { $json[$n] = @() }
    $json[$n] += ,@($x, ($H - $i[2]), $i[1], $i[2])
    $x += $i[1] + 2
  }
  $bmp.Save("$Out\saqer_$tag.png", [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  return $json
}
$small = Build $Cell 'small'
$big   = Build $BigCell 'big'
$obj = [ordered]@{ small = [ordered]@{ image = 'saqer_small.png'; frames = $small }; big = [ordered]@{ image = 'saqer_big.png'; frames = $big } }
($obj | ConvertTo-Json -Depth 6 -Compress) | Set-Content -Encoding utf8 "$Out\saqer.json"
"done"




