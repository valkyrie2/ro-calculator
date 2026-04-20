$content = Get-Content -Encoding UTF8 "d:\MyProject\ro-calculator\src\assets\demo\data\item.json"
$expLines = @()
for ($i = 0; $i -lt $content.Count; $i++) {
  if ($content[$i] -match '\u0e1b\u0e23\u0e30\u0e2a\u0e1a\u0e01\u0e32\u0e23\u0e13\u0e4c') {
    $id = '?'; $name = '?'
    for ($j = $i; $j -ge [Math]::Max($i - 60, 0); $j--) {
      if ($content[$j] -match '"id"\s*:\s*"?(\d+)"?') { $id = $matches[1]; break }
    }
    for ($j = $i; $j -ge [Math]::Max($i - 60, 0); $j--) {
      if ($content[$j] -match '"name"\s*:\s*"([^"]+)"') { $name = $matches[1]; break }
    }
    $expV = ([regex]::Matches($content[$i], '(\d+)%') | ForEach-Object { $_.Groups[1].Value }) -join ','
    $expLines += [PSCustomObject]@{ ID = $id; Name = $name; EXP = $expV; Line = $i }
  }
}
$expLines | Format-Table -AutoSize
