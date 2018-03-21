del -fo -rec BrowserStrace;
manifoldjs -l debug -p edgeextension -f edgeextension -m ..\src\manifest.json
move BrowserStrace\edgeextension\manifest\appxmanifest.xml BrowserStrace\edgeextension\manifest\appxmanifest.xml.template
gc BrowserStrace\edgeextension\manifest\appxmanifest.xml.template | %{
    $step = $_;
    $step = $step -replace "INSERT-YOUR-PACKAGE-IDENTITY-NAME-HERE","58823DavidRisney.BrowserStrace"
    $step = $step -replace "CN=INSERT-YOUR-PACKAGE-IDENTITY-PUBLISHER-HERE","CN=6A6BD061-7104-4902-A375-9DE2439CC857"
    $step = $step -replace "INSERT-YOUR-PACKAGE-PROPERTIES-PUBLISHERDISPLAYNAME-HERE","David Risney"
    $step;
} | Out-File -FilePath BrowserStrace\edgeextension\manifest\appxmanifest.xml -Encoding UTF8
del BrowserStrace\edgeextension\manifest\appxmanifest.xml.template
