@ECHO OFF
TITLE Rivalry Arena - Full Stack (Java Spring Boot + React Vite)
CD /D "%~dp0"

IF "%JAVA_HOME%" == "" (
  IF EXIST "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot" (
    SET "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
  )
)

ECHO =========================================================================
ECHO   ⚔️  STARTING RIVALRY ARENA (JAVA SPRING BOOT 3 + REACT VITE)  ⚔️
ECHO =========================================================================
ECHO   Java Backend  : http://localhost:3001
ECHO   React Client  : http://localhost:5173
ECHO   JDK Detected  : %JAVA_HOME%
ECHO =========================================================================

npm run dev
PAUSE
