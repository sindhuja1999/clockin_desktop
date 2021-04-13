!macro customInstall
  netsh advfirewall firewall add rule name="ClockIn" dir=in action=allow program="C:\program files\clockin\clockin.exe" 
!macroend