@ECHO OFF
setlocal enableextensions

IF "%JAVA_HOME%" == "" (
  IF EXIST "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot" (
    SET "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
  )
)

SET "CACHED_MVN=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin\3311e1d4\apache-maven-3.9.6\bin\mvn.cmd"
IF EXIST "%CACHED_MVN%" (
  CALL "%CACHED_MVN%" %*
  EXIT /B %ERRORLEVEL%
)

SET "DIRNAME=%~dp0"
IF "%DIRNAME%" == "" SET "DIRNAME=."
SET "WRAPPER_JAR=%DIRNAME%\.mvn\wrapper\maven-wrapper.jar"
SET "WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain"

IF NOT "%JAVA_HOME%" == "" (
  SET "JAVACMD=%JAVA_HOME%\bin\java.exe"
) ELSE (
  SET "JAVACMD=java.exe"
)

"%JAVACMD%" -Dmaven.multiModuleProjectDirectory="%DIRNAME%" -cp "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*
exit /B %ERRORLEVEL%
