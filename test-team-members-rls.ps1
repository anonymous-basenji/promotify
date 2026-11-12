# Tests whether any signed-in user can make themselves owner of any team
# (team_members INSERT policy: "auth.uid() = user_id OR is_team_admin(...)").
#
# Run against the LOCAL Promotify Supabase stack only. It creates test users and rows.
# Usage:  powershell -ExecutionPolicy Bypass -File .\test-team-members-rls.ps1 -Key "<anon key>"
# The anon key comes from `npx supabase status` (the anon / publishable key).

param(
  [string]$Key = "<PASTE LOCAL ANON KEY HERE>",
  [string]$Url = "http://127.0.0.1:54321"
)

$ErrorActionPreference = "Stop"

if ($Key -like "<*") { Write-Host "Set -Key to the local anon key first." -ForegroundColor Red; exit 1 }
if ($Url -notmatch "127\.0\.0\.1|localhost") { Write-Host "Refusing to run against a non-local URL: $Url" -ForegroundColor Red; exit 1 }

# Sends a request and returns status + parsed body, without throwing on 4xx/5xx
function Call($method, $path, $token, $body = $null, $prefer = "return=minimal") {
  $headers = @{ apikey = $Key; Prefer = $prefer }
  if ($token) { $headers.Authorization = "Bearer $token" }
  $params = @{ Uri = "$Url$path"; Method = $method; Headers = $headers; ContentType = "application/json"; UseBasicParsing = $true }
  if ($body) { $params.Body = ($body | ConvertTo-Json) }
  try {
    $r = Invoke-WebRequest @params
    $status = [int]$r.StatusCode; $text = $r.Content
  } catch [System.Net.WebException] {
    if (-not $_.Exception.Response) { throw }
    $status = [int]$_.Exception.Response.StatusCode
    $text = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
  }
  $parsed = $null
  if ($text) { try { $parsed = $text | ConvertFrom-Json } catch { $parsed = $text } }
  [pscustomobject]@{ Status = $status; Body = $parsed; Raw = $text }
}

function Step($label) { Write-Host "`n== $label" -ForegroundColor Cyan }
function Fail($label, $res) { Write-Host "FAILED: $label (HTTP $($res.Status)) $($res.Raw)" -ForegroundColor Red; exit 1 }

# Unique emails so the script can be rerun without a db reset
$stamp = Get-Date -Format "yyyyMMddHHmmss"

Step "1. Create victim and attacker users"
$users = @{}
foreach ($name in "victim", "attacker") {
  $res = Call "POST" "/auth/v1/signup" $null @{ email = "$name-$stamp@test.local"; password = "password123" }
  if ($res.Status -ne 200 -or -not $res.Body.access_token) { Fail "signup $name" $res }
  $users[$name] = @{ Token = $res.Body.access_token; Id = $res.Body.user.id }
  Write-Host "$name = $($users[$name].Id)"
}
$V = $users["victim"]; $A = $users["attacker"]

Step "2. Victim creates a team and joins it as owner"
$res = Call "POST" "/rest/v1/teams" $V.Token @{ name = "Victim Team $stamp"; user_id = $V.Id } "return=representation"
if ($res.Status -ne 201) { Fail "create team" $res }
$teamId = @($res.Body)[0].team_id
Write-Host "team = $teamId"

$res = Call "POST" "/rest/v1/team_members" $V.Token @{ team_id = $teamId; user_id = $V.Id; role = "owner" }
if ($res.Status -ne 201) { Fail "victim joins own team" $res }
Write-Host "victim is owner"

Step "3. Baseline: attacker cannot see the team"
$res = Call "GET" "/rest/v1/teams?team_id=eq.$teamId" $A.Token
$visible = @($res.Body).Count
if ($visible -ne 0) { Write-Host "Attacker can already see the team before the attack ($visible rows) - read policy problem" -ForegroundColor Yellow }
else { Write-Host "OK: attacker sees nothing" }

Step "4. Attack: attacker inserts themselves as owner"
$res = Call "POST" "/rest/v1/team_members" $A.Token @{ team_id = $teamId; user_id = $A.Id; role = "owner" }
Write-Host "HTTP $($res.Status) $($res.Raw)"
$vulnerable = $res.Status -eq 201

if ($vulnerable) {
  Step "5. Impact"
  $res = Call "GET" "/rest/v1/teams?team_id=eq.$teamId" $A.Token
  Write-Host "Attacker can now read the team: $(@($res.Body).Count -gt 0)"

  $res = Call "GET" "/rest/v1/team_members?team_id=eq.$teamId&select=user_id,role" $A.Token
  @($res.Body) | Format-Table | Out-String | Write-Host

  $res = Call "DELETE" "/rest/v1/teams?team_id=eq.$teamId" $A.Token $null "return=representation"
  $deleted = $res.Status -eq 200 -and @($res.Body).Count -gt 0
  Write-Host "Attacker can delete the team: $deleted (HTTP $($res.Status))"
}

Step "6. Live team_members policies in the local database"
docker exec supabase_db_promotify psql -U postgres -c "select policyname, cmd, with_check from pg_policies where tablename = 'team_members';"

Write-Host ""
if ($vulnerable) {
  Write-Host "RESULT: VULNERABLE - any signed-in user can make themselves owner of a team they know the ID of." -ForegroundColor Red
  exit 2
} else {
  Write-Host "RESULT: SAFE - self-insert into someone else's team was blocked." -ForegroundColor Green
  exit 0
}
