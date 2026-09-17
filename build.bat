@echo off
setlocal
set ROOT=%~dp0
set EXT_DIR=%ROOT%packages\bruno-vscode
set OUT_DIR=%ROOT%output

echo [1/4] Checking bruno-vscode dependencies...
if not exist "%EXT_DIR%\node_modules" (
    echo Installing bruno-vscode dependencies...
    call npm --prefix "%EXT_DIR%" install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install failed.
        exit /b 1
    )
)

echo [2/4] Packaging VSCode extension ^(build + vsce^)...
pushd "%EXT_DIR%"
call npm run package
if errorlevel 1 (
    popd
    echo ERROR: extension package failed.
    exit /b 1
)
popd

echo [3/4] Copying artifacts to %OUT_DIR% ...
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
copy /Y "%EXT_DIR%\*.vsix" "%OUT_DIR%\" >nul
if errorlevel 1 (
    echo ERROR: failed to copy .vsix to output directory.
    exit /b 1
)

echo [4/4] Done. Artifacts:
dir /B "%OUT_DIR%\*.vsix"
endlocal
