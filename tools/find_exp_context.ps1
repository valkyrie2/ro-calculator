$content = Get-Content -Encoding UTF8 "d:\MyProject\ro-calculator\src\assets\demo\data\item.json"
$lines = @(18370, 20812, 24365, 25260, 27587, 27619, 27651, 142516, 151491, 152755, 154525, 167210, 172404, 175212, 181086, 181113, 187536, 190348, 245657, 246456, 249566, 249595, 251704, 252022, 252246, 252289)
foreach ($i in $lines) {
  $id = '?'; $name = '?'
  for ($j = $i; $j -ge [Math]::Max($i - 60, 0); $j--) {
    if ($content[$j] -match '"id"\s*:\s*"?(\d+)"?') { $id = $matches[1]; break }
  }
  for ($j = $i; $j -ge [Math]::Max($i - 60, 0); $j--) {
    if ($content[$j] -match '"name"\s*:\s*"([^"]+)"') { $name = $matches[1]; break }
  }
  Write-Host "=== ID:$id Name:$name ==="
  # Find the fragment near ประสบการณ์
  $desc = $content[$i]
  $idx = $desc.IndexOf([char]0x0e1b + [char]0x0e23 + [char]0x0e30 + [char]0x0e2a)
  if ($idx -ge 0) {
    $start = [Math]::Max($idx - 5, 0)
    $len = [Math]::Min(60, $desc.Length - $start)
    Write-Host "  CONTEXT: $($desc.Substring($start, $len))"
  }
  Write-Host ""
}
