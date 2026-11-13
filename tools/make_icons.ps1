# Builds the PWA icons from Saqer's small idle frame (nearest-neighbour, integer scale).
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root 'icons'; New-Item -ItemType Directory -Force $out | Out-Null
$json = Get-Content (Join-Path $root 'assets\sprites\saqer.json') -Raw | ConvertFrom-Json
$f = $json.small.frames.idle[0]
$sheet = [System.Drawing.Bitmap]::FromFile((Join-Path $root 'assets\sprites\saqer_small.png'))
$sprite = $sheet.Clone((New-Object System.Drawing.Rectangle $f[0], $f[1], $f[2], $f[3]), $sheet.PixelFormat)

function Icon($size, $scale, $name, $full) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
  # banded sunset sky (pixel steps, no smooth gradient)
  $bands = @('#3b1f6e', '#5a2a86', '#8a3a8c', '#c8486e', '#ef7a3c', '#f6a93b')
  $bh = [math]::Ceiling($size * 0.72 / $bands.Count)
  for ($i = 0; $i -lt $bands.Count; $i++) { $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($bands[$i]))), 0, $i * $bh, $size, $bh) }
  $groundY = [int]($size * 0.72)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#d9c08f'))), 0, $groundY, $size, $size - $groundY)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#f6ead0'))), 0, $groundY, $size, [math]::Max(2, [int]($size / 48)))
  $w = $sprite.Width * $scale; $h = $sprite.Height * $scale
  $x = [int](($size - $w) / 2); $y = $groundY - $h + [int]($scale * 1)
  $g.DrawImage($sprite, $x, $y, $w, $h)
  $g.Dispose(); $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}
Icon 192 4 'icon-192.png'
Icon 512 11 'icon-512.png'
Icon 512 8 'icon-maskable-512.png'   # smaller so it survives the circular/squircle mask
Icon 180 4 'apple-touch-icon.png'
$sheet.Dispose()
"icons written to $out"
