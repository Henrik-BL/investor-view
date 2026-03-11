# Start development servers for both frontend and backend

# Function to start backend
function Start-Backend {
    try {
        Push-Location backend
        & ".\venv\Scripts\Activate.ps1"
        $env:FLASK_APP = "app.py"
        $env:FLASK_ENV = "development"
        flask run
    } finally {
        Pop-Location
    }
}

# Function to start frontend
function Start-Frontend {
    try {
        Push-Location frontend
        npm start
    } finally {
        Pop-Location
    }
}

# Start both as background jobs
$backendJob = Start-Job -ScriptBlock ${function:Start-Backend}
$frontendJob = Start-Job -ScriptBlock ${function:Start-Frontend}

Write-Host "Development servers started. Press Ctrl+C to stop."

# Wait for jobs (indefinitely, until interrupted)
try {
    Wait-Job -Job $backendJob, $frontendJob
} catch {
    Write-Host "Stopping servers..."
} finally {
    # Clean up jobs
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "Servers stopped."
}