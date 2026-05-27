$ids = @(
  102126, 401265, 401266, 401267, 401268, 401269, 401270, 401271, 401272,
  401273, 401274, 401275, 401276, 401277, 401278, 401279, 401280, 401281,
  401282, 401390, 410657, 460166, 470442, 490966, 491049, 491050, 491051,
  500139, 500140, 500141, 510160, 530083, 540128, 540129, 540130, 540131,
  540132, 550201, 550202, 550203, 550204, 550205, 550206, 550207, 560091,
  560092, 570094, 570095, 580094, 580095, 590119, 590120, 600079, 610094,
  610095, 620066, 630067, 640070, 650063, 650064, 700133, 700134, 700135,
  800050, 830048
)

$outDir = "src\assets\demo\images\items"
$base = "https://www.divine-pride.net/img/items/item/thROG"
$batch = 0

foreach ($id in $ids) {
  $out = "$outDir\$id.png"
  if (Test-Path $out) {
    Write-Host "SKIP $id (exists)"
    continue
  }
  try {
    Invoke-WebRequest -Uri "$base/$id" -OutFile $out -UseBasicParsing
    $size = (Get-Item $out).Length
    Write-Host "OK $id ($size bytes)"
  } catch {
    Write-Host "FAIL $id"
  }
  $batch++
  if ($batch % 2 -eq 0) {
    Write-Host "Sleeping 7s..."
    Start-Sleep -Seconds 7
  }
}
Write-Host "Done."
