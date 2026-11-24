# Renders the dark promo from samrah_promo_dark.aep and encodes promo_dark.mp4 (H.264 + AAC) next to it.
# Needs After Effects 2022 (aerender) and an ffmpeg binary (the one that ships with the imageio-ffmpeg Python package is used).
# Usage (PowerShell, from the project root):  .\assets\aftereffects\render_dark.ps1
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$aerender = "C:\Program Files\Adobe\Adobe After Effects 2022\Support Files\aerender.exe"
$ffmpeg = (python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())").Trim()
$master = Join-Path $env:TEMP "promo_dark_master.mov"

# 1) After Effects renders a high quality master (ProRes) with the music baked in
& $aerender -project (Join-Path $here "samrah_promo_dark.aep") -comp "Samrah Promo Dark" -OMtemplate "High Quality" -output $master

# 2) encode it for the web
& $ffmpeg -y -i $master -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart (Join-Path $here "promo_dark.mp4")
Remove-Item $master -ErrorAction SilentlyContinue
Write-Host "Done: $(Join-Path $here 'promo_dark.mp4')"
