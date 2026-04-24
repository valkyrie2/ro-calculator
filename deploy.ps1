npm run predeploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
