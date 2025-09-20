# build.ps1

# --- WARNING ---
# This script uses a Java Development Kit (JDK) and Android SDK that are
# bundled with Unity. This is not the recommended setup for native Android
# development and may cause build failures if the versions are incompatible
# with your project's requirements.
#
# The recommended approach is to use Android Studio to manage your Android SDK
# and to use the JDK that is bundled with Android Studio.
#
# For more information, see the Android developer documentation:
# https://developer.android.com/studio/command-line/variables
#
# --- END WARNING ---

# Set the JAVA_HOME environment variable to the user's Java 21 installation.
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.8.9-hotspot"

# Set the ANDROID_HOME environment variable to the Android SDK bundled with Unity.
$env:ANDROID_HOME = "C:\Program Files\Unity\Hub\Editor\6000.0.46f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK"

# Add the JDK's bin directory to the Path environment variable for this session.
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Add the Android SDK's platform-tools and tools to the Path environment variable for this session.
$env:Path = "$env:ANDROID_HOME\platform-tools;" + $env:Path
$env:Path = "$env:ANDROID_HOME\tools;" + $env:Path


# Print the JAVA_HOME and ANDROID_HOME variables to confirm they are set.
Write-Output "ANDROID_HOME: $env:ANDROID_HOME"

# Run the web build.
Write-Output "Building the web app..."
npm run build

# Sync the web build with Capacitor.
Write-Output "Syncing with Capacitor..."
npx cap sync

# Run the app on Android.
Write-Output "Running on Android..."
npx cap run android
