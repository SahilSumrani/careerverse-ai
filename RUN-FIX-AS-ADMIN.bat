@echo off
:: Double-click this file to run the cleanup as Administrator
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0fix-laptop-bloat.ps1\"'"
