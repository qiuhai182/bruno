@echo off
setlocal
set ROOT=%~dp0
set EXT_DIR=%ROOT%packages\bruno-vscode
set ELECTRON_DIR=%ROOT%packages\bruno-electron
set OUT_DIR=%ROOT%output

REM Fresh output dir per run: Trae IDE locks app.asar in the default `out`
REM directory and breaks electron-builder cleanup (see out-build* leftovers).
set BUILD_OUT_NAME=out-build-bat-%RANDOM%
set BRUNO_BUILDER_OUT=%BUILD_OUT_NAME%

REM GitHub direct download EOFs; use npmmirror for electron zips.
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

REM Clean stale build outputs from previous runs (silently skip locked ones).
for /d %%D in ("%ELECTRON_DIR%\out-build*") do rd /s /q "%%D" >nul 2>&1

echo [1/6] Checking bruno-vscode dependencies...
if not exist "%EXT_DIR%\node_modules" (
    echo Installing bruno-vscode dependencies...
    call npm --prefix "%EXT_DIR%" install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install failed.
        exit /b 1
    )
)

echo [2/6] Packaging VSCode extension ^(build + vsce^)...
pushd "%EXT_DIR%"
call npm run package
if errorlevel 1 (
    popd
    echo ERROR: extension package failed.
    exit /b 1
)
popd

echo [3/6] Building web app ^(npm run build:web^)...
pushd "%ROOT%"
call npm run build:web
if errorlevel 1 (
    popd
    echo ERROR: web build failed.
    exit /b 1
)

echo [4/6] Building Electron app for Windows ^(nsis + portable^)...
call npm run build:electron
REM build-electron.js swallows errors and exits 0, so verify artifacts instead.
if not exist "%ELECTRON_DIR%\%BUILD_OUT_NAME%\*.exe" (
    popd
    echo ERROR: no exe produced in %ELECTRON_DIR%\%BUILD_OUT_NAME%.
    exit /b 1
)

echo [5/6] Copying artifacts to %OUT_DIR% ...
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
copy /Y "%EXT_DIR%\*.vsix" "%OUT_DIR%\" >nul
if errorlevel 1 (
    popd
    echo ERROR: failed to copy .vsix to output directory.
    exit /b 1
)
copy /Y "%ELECTRON_DIR%\%BUILD_OUT_NAME%\*.exe" "%OUT_DIR%\" >nul
if errorlevel 1 (
    popd
    echo ERROR: failed to copy exe to output directory.
    exit /b 1
)
popd

echo [6/6] Done. Artifacts:
dir /B "%OUT_DIR%\*.vsix"
dir /B "%OUT_DIR%\*.exe"

echo Cleaning build output %BUILD_OUT_NAME% ...
rd /s /q "%ELECTRON_DIR%\%BUILD_OUT_NAME%" >nul 2>&1
endlocal
