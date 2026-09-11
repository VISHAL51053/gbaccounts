@echo off
netsh advfirewall firewall add rule name="GURUBARAN ERP Port 5000" dir=in action=allow protocol=TCP localport=5000
echo Firewall rule added successfully!
pause
