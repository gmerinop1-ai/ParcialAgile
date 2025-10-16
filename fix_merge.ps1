cd "c:\Users\maryo\OneDrive\Escritorio\TRABAJOS UPAO\6to ciclo\Agile D\sistema-de-prestamos\ParcialAgile"

# Terminar cualquier proceso git en ejecución
Get-Process -Name "git" -ErrorAction SilentlyContinue | Stop-Process -Force

# Establecer editor simple
$env:GIT_EDITOR = "true"

# Completar el merge
git commit --no-edit

# Verificar el resultado
git status