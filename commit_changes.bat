@echo off
cd /d c:\Users\DELL\Desktop\Estate
del /f /q "c:\Users\DELL\Desktop\Estate\check_git.bat"
del /f /q "c:\Users\DELL\Desktop\Estate\remove_temp.bat"
echo Temp files removed.
echo ---
git add -A
echo ---
git status --short
echo ---
git commit -m "Fix .gitignore, add updated_at trigger, update README

- .gitignore: replaced placeholder content with proper ignore rules
  (node_modules/, .next/, .env.local, next-env.d.ts, logs, IDE files)
- supabase/migrations: added updated_at trigger on properties table
- README.md: updated 'Suggested next build steps' to reflect completed
  MVP features (login, dashboard, new/edit listing, property detail,
  inquiries inbox, InquiryForm component); listed remaining work
- Plus all source files from the Accra Rentals MVP build"
echo ---
echo Done.