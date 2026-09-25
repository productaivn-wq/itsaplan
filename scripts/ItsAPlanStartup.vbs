' ItsAPlanStartup.vbs -- Autonomous Headless Startup Runner for ItsAPlan & Bridge Stack
' Enforces Gate GW-HEADLESS-01 (0 = SW_HIDE, False = Asynchronous non-blocking)
' Target: shell:startup (Windows Startup)

WScript.Sleep 15000 ' 15s network & PostgreSQL service initialization stabilization delay

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

pythonwPath = "C:\Users\thanb\AppData\Local\Programs\Python\Python312\pythonw.exe"
launcherScript = "d:\WORK\01_PROJECTS\58_ITSAPLAN\scripts\launch_itsaplan_headless.py"

If objFSO.FileExists(pythonwPath) And objFSO.FileExists(launcherScript) Then
    objShell.Run """" & pythonwPath & """ """ & launcherScript & """", 0, False
End If
