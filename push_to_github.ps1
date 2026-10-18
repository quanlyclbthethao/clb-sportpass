# PowerShell Script: Tự động commit và đẩy mã nguồn lên GitHub (quanlyclbthethao/clb-sportpass)
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:GITHUB_PAT
)

if (-not $Token) {
    $Token = $env:GH_TOKEN
}

$repoUrl = "https://github.com/quanlyclbthethao/clb-sportpass.git"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SPORTPASS - TỰ ĐỘNG ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiem tra git status
Write-Host "`n[1/4] Kiem tra trang thai tep git..." -ForegroundColor Green
git status -s

# 2. Stage va commit cac file chinh
Write-Host "`n[2/4] Dang stage va commit cac thay doi..." -ForegroundColor Green
git add index.html GoogleAppsScript_MultiSheet.js GoogleAppsScript_Backend.js test_all_features.py verify_edge_cases.py push_to_github.ps1 sync_github.bat

$commitMsg = "feat: minh bạch hóa đăng nhập, ghi nhớ mật khẩu, trung tâm phân quyền admin và đồng bộ dữ liệu"
git commit -m $commitMsg

# 3. Kiem tra Remote
Write-Host "`n[3/4] Kiem tra remote origin..." -ForegroundColor Green
git remote -v

# 4. Day ma nguon len GitHub
Write-Host "`n[4/4] Dang day ma nguon len GitHub main branch..." -ForegroundColor Green
if ($Token) {
    Write-Host "-> Su dung Personal Access Token (PAT) de xac thuc an toan..." -ForegroundColor Cyan
    $authUrl = "https://$Token@github.com/quanlyclbthethao/clb-sportpass.git"
    git push $authUrl main
} else {
    Write-Host "-> Thu day bang Git Credential Manager mac dinh..." -ForegroundColor Cyan
    git push origin main
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n>>> DONG BO GITHUB THANH CONG! CAC MAY CAI LINK SE NHAN CAP NHAT NGAY LAP TUC! <<<" -ForegroundColor Green
} else {
    Write-Host "`n[CHU Y] Khong the day tu dong do chua co Personal Access Token (PAT)." -ForegroundColor Yellow
    Write-Host "Cach khac phuc nhanh:" -ForegroundColor White
    Write-Host "1. Chay lenh: .\push_to_github.ps1 -Token 'ghp_yourPersonalAccessTokenHere'" -ForegroundColor Gray
    Write-Host "2. Hoac dat bien moi truong: `$env:GITHUB_PAT='ghp_xxx' roi chay lai script." -ForegroundColor Gray
}
