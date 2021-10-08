!macro customInit
  ExecWait 'taskkill /F /im ClockIn.exe /T'
!macroend
!macro customInstall
  ExecWait 'netsh advfirewall firewall add rule name="ClockIn" dir=in action=allow program="C:\program files\clockin\clockin.exe"' 
!macroend