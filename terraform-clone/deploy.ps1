$env:AWS_PROFILE="personal"
$secrets = Get-Content -Path "..\secrets.env"
foreach ($line in $secrets) {
    if ($line.Trim() -ne "" -and !$line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim().ToLower()
        $value = $parts[1].Trim()
        Set-Item -Path "env:TF_VAR_$key" -Value $value
    }
}
.\terraform init
.\terraform apply -auto-approve
