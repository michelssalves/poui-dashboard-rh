# Detecta o caminho base do projeto onde o script está sendo executado
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$appName = "poui-invoice-report"
$projeto = $scriptPath
$distPath = "$projeto\dist\$appName"
$browserPath = "$distPath\browser"
$resourcePath = "$projeto\Protheus\Resource"
$folderToZip = "$resourcePath\$appName"
$zipPath = "$resourcePath\$appName.zip"
$appPath = "$resourcePath\$appName.app"

# Vai para a raiz do projeto
cd $projeto

Write-Host "⿡  Executando build..." -ForegroundColor Cyan
ng build

# Verifica se o build ocorreu
if (!(Test-Path $browserPath)) {
    Write-Host "❌ Build falhou ou pasta 'browser' não foi encontrada." -ForegroundColor Red
    exit
}

# Remove pasta de destino se já existir
if (Test-Path $folderToZip) {
    Remove-Item $folderToZip -Recurse -Force
}

# Cria pasta destino
New-Item -ItemType Directory -Path $folderToZip | Out-Null

Write-Host "⿢  Copiando arquivos do browser para $folderToZip..." -ForegroundColor Cyan
Copy-Item "$browserPath\*" -Destination $folderToZip -Recurse -Force

Write-Host "⿣  Removendo pasta browser..." -ForegroundColor Cyan
Remove-Item $browserPath -Recurse -Force

# Remove arquivos compactados antigos
if (Test-Path $zipPath) { Remove-Item $zipPath }
if (Test-Path $appPath) { Remove-Item $appPath }

Write-Host "⿤  Compactando para ZIP..." -ForegroundColor Cyan
Compress-Archive -Path "$folderToZip" -DestinationPath $zipPath

# Renomeia para .app
Rename-Item -Path $zipPath -NewName "$appName.app"

Write-Host "`n✅ Processo finalizado com sucesso!"
Write-Host "📦 App gerado em: $appPath" -ForegroundColor Green
