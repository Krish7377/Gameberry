@ECHO OFF
TITLE Gameberry - Java Spring Boot Backend
CD /D "%~dp0\server-java"

IF "%JAVA_HOME%" == "" (
  IF EXIST "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot" (
    SET "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
  )
)

ECHO ==============================================================
ECHO   Launching Gameberry Java Spring Boot Backend (Port 3001)
ECHO   Java: %JAVA_HOME%
ECHO ==============================================================

mvn spring-boot:run
PAUSE
