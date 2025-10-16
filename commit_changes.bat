@echo off
cd "c:\Users\maryo\OneDrive\Escritorio\TRABAJOS UPAO\6to ciclo\Agile D\sistema-de-prestamos\ParcialAgile"
set GIT_EDITOR=echo
git add .
git commit -m "feat: Remove filter button from loans page and quick actions from dashboard

- Remove filter button from loans management page header
- Remove unused Filter icon import
- Remove 'Acciones Rapidas' section from dashboard for cleaner interface
- Maintain all existing PDF enhancements and PEP validation features"
git push origin feat/formatoPDF
pause