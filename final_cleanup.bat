@echo off
cd /d c:\Users\DELL\Desktop\Estate

REM Commit the removal of the accidentally-committed batch file
git commit -m "Remove accidentally committed temp batch file (commit_changes.bat)"

REM Delete this cleanup script itself
del /f /q "c:\Users\DELL\Desktop\Estate\cleanup.bat"

echo === FINAL GIT STATUS ===
git status --short
echo === FINAL GIT LOG ===
git log --oneline -3
echo === TRACKED FILES ===
git ls-files
echo === DONE ===