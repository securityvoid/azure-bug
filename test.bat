@echo off
SET SCM_COMMIT_ID=67f71b85f92ec5a99ec7437b558a6f63521c2ad6
REM SET PREVIOUS_MANIFEST_PATH=D:\home\site\deployments\3c91b920e745abc6c995b2f574d80cbfb0317986\manifest
SET PREVIOUS_MANIFEST_PATH=D:\home\site\deployments\151b5c9af47fd00a09b861970f3e4473d27a02cb\manifest

FOR /F "tokens=5 delims=.\" %%a IN ("%PREVIOUS_MANIFEST_PATH%") DO SET PREVIOUS_SCM_COMMIT_ID=%%a

FOR /f "tokens=1,2" %%I IN ('git.exe diff --name-status %PREVIOUS_SCM_COMMIT_ID% %SCM_COMMIT_ID%') DO (
  IF "%%~I" == "D" ( 
    ECHO "DELETE:" %%~J 
  ) ELSE (
    ECHO "COPY:" %%~J
  )
)
