@echo off
setlocal

rem ==========================================================
rem MealMate API smoke test (Windows)
rem Exercises 4+ endpoints: >=3 GET + >=1 write.
rem
rem Env vars:
rem   BASE_URL          - API base URL (default http://localhost:3001)
rem   MEALMATE_API_KEY  - optional Bearer token sent on every request
rem
rem Exits 0 if all checks pass, 1 on any failure (CI/grading-safe).
rem ==========================================================

if "%BASE_URL%"=="" set "BASE_URL=http://localhost:3001"

set "AUTH="
if not "%MEALMATE_API_KEY%"=="" set "AUTH=-H "Authorization: Bearer %MEALMATE_API_KEY%""

set /a FAILED=0
set "TMPDIR=%TEMP%\mealmate-smoke"
if not exist "%TMPDIR%" mkdir "%TMPDIR%"

echo Testing MealMate API at %BASE_URL%
echo -------------------------------------------------

rem ---- GET checks ------------------------------------------------

call :expect "GET /api/health"         GET         200 "%BASE_URL%/api/health"
call :expect "GET /api/recipes"        GET        200 "%BASE_URL%/api/recipes"
call :expect "GET /api/recipes/search"    GET 200 "%BASE_URL%/api/recipes/search?ingredients=eggs,milk"
call :expect "GET /api/deals"          GET          200 "%BASE_URL%/api/deals"

rem ---- Resolve a profileId for the write tests -------------------

curl -s %AUTH% "%BASE_URL%/api/profile" > "%TMPDIR%\profile.json"
set "PROFILE_ID="
for /f "tokens=3 delims=:," %%a in ('findstr /C:"profile_id" "%TMPDIR%\profile.json"') do set "PROFILE_ID=%%~a"

if "%PROFILE_ID%"=="" (
  echo FAIL GET /api/profile - could not parse profile_id
  set /a FAILED+=1
  goto :summary
)
echo PASS GET /api/profile - profile_id=%PROFILE_ID%

rem ---- Write check: POST /api/pantry -----------------------------

echo {"profileId":"%PROFILE_ID%","ingredientName":"smoke-test-item","quantityStatus":"1 test"} > "%TMPDIR%\post-body.json"

set "CODE="
for /f %%c in ('curl -s -o "%TMPDIR%\post-resp.json" -w "%%{http_code}" -X POST %AUTH% -H "Content-Type: application/json" -d @"%TMPDIR%\post-body.json" "%BASE_URL%/api/pantry"') do set "CODE=%%c"

findstr /C:"pantry_item_id" "%TMPDIR%\post-resp.json" >nul
if errorlevel 1 goto :postfail
set "WRITE_OK="
if "%CODE%"=="200" set "WRITE_OK=merged"
if "%CODE%"=="201" set "WRITE_OK=created"
if not defined WRITE_OK goto :postfail

echo PASS POST /api/pantry - HTTP %CODE% (%WRITE_OK%)
goto :postdone

:postfail
echo FAIL POST /api/pantry - HTTP %CODE%, no pantry_item_id in response
set /a FAILED+=1

:postdone

rem ---- Cleanup: delete the item we just wrote --------------------

set "ITEM_ID="
for /f "tokens=3 delims=:," %%a in ('findstr /C:"pantry_item_id" "%TMPDIR%\post-resp.json"') do set "ITEM_ID=%%~a"

if not "%ITEM_ID%"=="" call :expect "DELETE /api/pantry/id cleanup" DELETE 200 "%BASE_URL%/api/pantry/%ITEM_ID%"

:summary
echo -------------------------------------------------
if %FAILED% GTR 0 (
  echo %FAILED% checks FAILED
  exit /b 1
)
echo All checks passed.
exit /b 0

rem ---- helper: expected-HTTP-code check --------------------------
:expect
set "CODE="
for /f %%c in ('curl -s -o nul -w "%%{http_code}" -X %~2 %AUTH% "%~4"') do set "CODE=%%c"
if "%CODE%"=="%~3" (
  echo PASS %~1 - HTTP %CODE%
) else (
  echo FAIL %~1 - expected %~3, got %CODE%
  set /a FAILED+=1
)
goto :eof
