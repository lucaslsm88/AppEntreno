@echo off
title Servidor Local Privado - Planificador de Entrenamientos
echo =======================================================
echo   Iniciando Planificador de Entrenamientos (Modo Seguro)
echo =======================================================
echo.
echo   Servidor restringido exclusivamente a este equipo:
echo   http://127.0.0.1:8080
echo.
echo   (Nadie en tu red Wi-Fi puede conectarse a este puerto)
echo   (Cierra esta ventana cuando termines)
echo =======================================================
echo.

start http://127.0.0.1:8080
python -m http.server 8080 --bind 127.0.0.1

pause
