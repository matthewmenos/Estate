@echo off
REM Self-cleaning batch file - deletes all temp files including itself
start "" cmd /c "timeout /t 1 && del /f /q c:\Users\DELL\Desktop\Estate\final_cleanup.bat && del /f /q c:\Users\DELL\Desktop\Estate\delete_temp.bat && del /f /q c:\Users\DELL\Desktop\Estate\dc.bat && del /f /q c:\Users\DELL\Desktop\delete_temp.bat && del /f /q c:\Users\DELL\Desktop\Estate\purge.bat"
