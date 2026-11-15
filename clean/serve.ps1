# Tiny static file server for local testing (no install needed).
#   powershell -ExecutionPolicy Bypass -File serve.ps1            → http://localhost:8080/
#   powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 9000
param([int]$Port = 8080)
$root = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'
  '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.avif' = 'image/avif'
  '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'; '.wav' = 'audio/wav'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Saqer running at http://localhost:$Port/  (Ctrl+C to stop)"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($rel -eq '') { $rel = 'index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $full.StartsWith($root) -or -not (Test-Path $full -PathType Leaf)) {
      $res.StatusCode = 404; $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
    } else {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $res.Headers['Cache-Control'] = 'no-cache'
    }
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch { $res.StatusCode = 500 } finally { $res.Close() }
}
