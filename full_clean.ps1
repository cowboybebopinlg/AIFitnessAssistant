# full_clean.ps1

Write-Output "Starting full clean process..."

# Clear npm cache
Write-Output "Clearing npm cache..."
npm cache clean --force

# Delete node_modules directory
Write-Output "Deleting node_modules directory..."
Remove-Item -Recurse -Force node_modules

# Delete package-lock.json file
Write-Output "Deleting package-lock.json file..."
Remove-Item -Force package-lock.json

# Install dependencies
Write-Output "Installing dependencies..."
npm install

# Start the development server
Write-Output "Starting development server..."
npm run dev

Write-Output "Full clean process completed. Please hard refresh your browser."
