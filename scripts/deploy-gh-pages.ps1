# Deploy do build (dist/) para a branch gh-pages do GitHub Pages.
#
# Requisitos:
#   - Node.js 22.12+ e dependências instaladas (npm install)
#   - git com credencial de push para https://github.com/allandevbrazil/allandevbrazil_portfolio
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-gh-pages.ps1        # build + deploy
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-gh-pages.ps1 -SkipBuild  # deploy so do dist/ atual
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$repo = 'https://github.com/allandevbrazil/allandevbrazil_portfolio.git'
$authorName = 'allandevbrazil'
$authorEmail = 'allandev2021@gmail.com'

# 1. Build de producao (gera dist/), a menos que -SkipBuild seja informado
if (-not $SkipBuild) {
    Write-Host 'Gerando build de producao (npm run build)...' -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build falhou.' }
}

$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { throw "Pasta dist/ nao encontrada. Rode 'npm run build' primeiro." }

# 2. .nojekyll: publica os arquivos estaticos como estao, sem o pipeline Jekyll
$nojekyll = Join-Path $dist '.nojekyll'
if (-not (Test-Path $nojekyll)) {
    New-Item -ItemType File -Path $nojekyll -Force | Out-Null
    Write-Host '.nojekyll criado em dist/' -ForegroundColor DarkGray
}

# 3. Repo git temporario dentro de dist/ (dist/ e ignorado pelo master)
$gitDir = Join-Path $dist '.git'
if (Test-Path $gitDir) {
    Remove-Item -LiteralPath $gitDir -Recurse -Force
}

$env:GIT_TERMINAL_PROMPT = '0'
Push-Location $dist
try {
    Write-Host 'Publicando dist/ na branch gh-pages...' -ForegroundColor Cyan
    git init -b main
    git add -A
    git -c user.name=$authorName -c user.email=$authorEmail commit -m 'GitHub Pages deploy'
    git push --force $repo HEAD:gh-pages
    if ($LASTEXITCODE -ne 0) { throw 'Push para gh-pages falhou.' }
    Write-Host 'Deploy concluido com sucesso!' -ForegroundColor Green
    Write-Host 'Site: https://allandevbrazil.github.io/allandevbrazil_portfolio/' -ForegroundColor Green
} finally {
    Pop-Location
    if (Test-Path $gitDir) {
        Remove-Item -LiteralPath $gitDir -Recurse -Force
    }
}
