# Script para criar repo e deploy no GitHub
$token = [System.Environment]::GetEnvironmentVariable('GITHUBPERSONALACCESSTOKEN', 'User')
$username = 'allandevbrazil'
$repoName = 'allandevbrazil_portfolio'
$token

# 1. Criar o repositório via API
$headers = @{
    Authorization = "Bearer $token"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$body = @{
    name = $repoName
    description = 'Portfólio interativo 3D - Allandevbrazil Portfolio'
    private = $false
    auto_init = $false
} | ConvertTo-Json

Write-Host "Criando repositório $repoName..."
try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    Write-Host "Repositório criado com sucesso!" -ForegroundColor Green
    Write-Host "URL: " $response.html_url
} catch {
    Write-Host "Erro ao criar repo (talvez já exista):" $_.Exception.Message -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$repoName" -Headers $headers
    Write-Host "Repo existe:" $response.html_url
}
