<#
.SYNOPSIS
    Fetches latest source code, builds Docker images, and deploys frontend/backend using Docker.
#>

[CmdletBinding()]
param(
    [string]$Branch = "main",
    [string]$LocalHcnbStockDataPath = "",
    [int]$FrontendPort = 3000,
    [int]$BackendPort = 5000
)

$ErrorActionPreference = 'Stop'

function Write-Status {
    param([string]$Message)
    Write-Host "[deploy-local] $Message"
}

function Ensure-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not available in PATH."
    }
}

Push-Location $PSScriptRoot
try {
    Ensure-Command git
    Ensure-Command docker

    Write-Status "Fetching latest source from Git ($Branch)..."
    git fetch --all --prune
    git pull --ff-only origin $Branch

    $localHcnbTemp = Join-Path $PSScriptRoot "backend/_local_hcnb_stock_data"
    if ($LocalHcnbStockDataPath) {
        if (-not (Test-Path $LocalHcnbStockDataPath)) {
            throw "Local hcnb_stock_data path '$LocalHcnbStockDataPath' does not exist."
        }

        Write-Status "Copying local hcnb_stock_data package from $LocalHcnbStockDataPath"
        Remove-Item -Path $localHcnbTemp -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Path $localHcnbTemp | Out-Null
        Copy-Item -Path (Join-Path $LocalHcnbStockDataPath '*') -Destination $localHcnbTemp -Recurse -Force

        # Ensure models is a package
        $modelsDir = Join-Path $localHcnbTemp 'src\hcnb_stock_data\models'
        if (Test-Path $modelsDir) {
            $modelsInit = Join-Path $modelsDir '__init__.py'
            if (-not (Test-Path $modelsInit)) {
                New-Item -ItemType File -Path $modelsInit -Value '' -Force
            }
        }
    }

    Write-Status "Building backend image..."
    docker build --no-cache -t investor-view-backend:local -f backend/Dockerfile .

    Write-Status "Building frontend image..."
    docker build --no-cache -t investor-view-frontend:local -f frontend/Dockerfile frontend

    Write-Status "Checking for running containers..."
    $runningContainers = docker ps --filter "name=investor-view-backend" --filter "name=investor-view-frontend" --format "{{.Names}}" 2>$null
    if ($runningContainers) {
        Write-Status "Stopping and removing existing containers..."
        docker stop investor-view-backend investor-view-frontend 2>$null
        docker rm investor-view-backend investor-view-frontend 2>$null
    } else {
        Write-Status "No running containers found to stop."
    }

    Write-Status "Checking Docker network..."
    $existingNetwork = docker network ls --filter "name=investor-view-network" --format "{{.Name}}" 2>$null
    if (-not $existingNetwork) {
        Write-Status "Creating Docker network..."
        docker network create investor-view-network
    } else {
        Write-Status "Docker network already exists."
    }

    Write-Status "Starting backend container on port 5000..."
    docker run -d `
        --restart always `
        --name investor-view-backend `
        --network investor-view-network `
        --network-alias backend-service `
        -p "5000:5000" `
        investor-view-backend:local

    Write-Status "Starting frontend container on port 3000..."
    docker run -d `
        --restart always `
        --name investor-view-frontend `
        --network investor-view-network `
        -p "3000:80" `
        investor-view-frontend:local

    Write-Status "Deployment complete!"
    Write-Status "Frontend is available at http://localhost:${FrontendPort}"
    Write-Status "Backend is available at http://localhost:${BackendPort}"
    
    Write-Status "Running containers:"
    docker ps --filter "name=investor-view"
}
finally {
    Pop-Location
}
