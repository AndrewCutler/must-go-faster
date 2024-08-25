# todo: output to bin
$userProfile = $env:USERPROFILE
if (-not (Test-Path -Path $userProfile\go\bin -PathType Container)) {
    Write-Host "go bin does not exist somehow, creating..."
    New-Item -ItemType Directory -Path $userProfile\go\bin -Force
}
go build -o $userProfile\go\bin\pgn-parser.exe .\backend\parser\parser.go