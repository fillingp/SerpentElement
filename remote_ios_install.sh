#!/bin/bash

# Remote iOS App Installation Script
# This script helps install Serpent Element AI on iOS devices remotely

set -e

echo "📱 Serpent Element AI - Remote iOS Installation"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Check if IPA file exists
IPA_FILE="SerpentElementAI.ipa"
if [ ! -f "$IPA_FILE" ]; then
    print_error "IPA file not found: $IPA_FILE"
    print_status "Please ensure the IPA file is in the current directory"
    exit 1
fi

print_success "Found IPA file: $IPA_FILE"

# App information
APP_NAME="Serpent Element AI"
BUNDLE_ID="com.serpent.elementai"
VERSION="1.0.0"

echo ""
echo "📋 App Information:"
echo "   Name: $APP_NAME"
echo "   Bundle ID: $BUNDLE_ID"
echo "   Version: $VERSION"
echo "   Size: $(du -h $IPA_FILE | cut -f1)"
echo ""

# Installation methods
echo "🚀 Available Installation Methods:"
echo ""

print_step "Method 1: TestFlight (Recommended for Beta Testing)"
echo "   1. Upload IPA to App Store Connect"
echo "   2. Configure TestFlight"
echo "   3. Send invitation to your Apple ID"
echo "   4. Install via TestFlight app on iPhone"
echo ""

print_step "Method 2: AltStore (Sideloading)"
echo "   1. Install AltStore on your computer"
echo "   2. Install AltStore app on iPhone"
echo "   3. Sideload the IPA using your Apple ID"
echo "   Requirements: Apple ID, AltStore setup"
echo ""

print_step "Method 3: Xcode Direct Install"
echo "   1. Connect iPhone to Mac with Xcode"
echo "   2. Use Xcode Device Manager"
echo "   3. Drag and drop IPA file"
echo "   Requirements: Mac with Xcode, USB cable"
echo ""

print_step "Method 4: 3uTools (Windows/Mac)"
echo "   1. Install 3uTools on computer"
echo "   2. Connect iPhone via USB"
echo "   3. Use 'Install .ipa' feature"
echo "   Requirements: 3uTools software"
echo ""

print_step "Method 5: Cydia Impactor (Advanced)"
echo "   1. Download Cydia Impactor"
echo "   2. Connect iPhone via USB"
echo "   3. Sign with Apple ID and install"
echo "   Requirements: Apple ID, developer signing"
echo ""

# Create installation package
print_status "Creating installation package..."

INSTALL_DIR="SerpentElementAI_Installation_Kit"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy necessary files
cp "$IPA_FILE" "$INSTALL_DIR/"
cp "INSTALLATION_INSTRUCTIONS.md" "$INSTALL_DIR/" 2>/dev/null || true
cp "iOS_APP_INFO.md" "$INSTALL_DIR/" 2>/dev/null || true

# Create detailed installation guide
cat > "$INSTALL_DIR/REMOTE_INSTALLATION_GUIDE.md" << 'EOF'
# 📱 Serpent Element AI - Remote Installation Guide

## Quick Start (Easiest Method)

### Option A: TestFlight (Recommended)
1. **Developer uploads IPA to App Store Connect**
2. **Configure TestFlight beta testing**
3. **Send TestFlight invitation to your email**
4. **Install TestFlight app from App Store**
5. **Open invitation email on iPhone**
6. **Tap "Install" in TestFlight**

### Option B: AltStore (Self-Service)
1. **Download AltStore** from https://altstore.io/
2. **Install AltStore on your computer**
3. **Install AltStore app on iPhone** (follow their guide)
4. **Open AltStore app on iPhone**
5. **Tap "+" and select the IPA file**
6. **Sign in with your Apple ID**
7. **App will install automatically**

## Detailed Methods

### Method 1: TestFlight Beta Testing
**Best for: Official beta testing**

```bash
Requirements:
- Apple Developer Account (developer side)
- Valid Apple ID (user side)
- iPhone with iOS 12.0+
```

**Steps:**
1. Developer uploads IPA to App Store Connect
2. Create TestFlight beta build
3. Add your email as beta tester
4. You receive invitation email
5. Install TestFlight app from App Store
6. Open invitation and install

### Method 2: AltStore Sideloading
**Best for: Personal installation without developer account**

```bash
Requirements:
- AltStore software
- Apple ID (free account works)
- iPhone with iOS 12.4+
- Windows/Mac computer
```

**Steps:**
1. Download AltStore from https://altstore.io/
2. Install AltStore on computer
3. Install AltStore app on iPhone via iTunes/Finder
4. Connect iPhone to same WiFi as computer
5. Open AltStore app on iPhone
6. Add IPA file via "+" button
7. Sign with Apple ID when prompted

### Method 3: Xcode Installation
**Best for: Developers with Mac**

```bash
Requirements:
- Mac with Xcode installed
- USB cable
- Apple ID signed into Xcode
```

**Steps:**
1. Connect iPhone to Mac via USB
2. Open Xcode
3. Go to Window → Devices and Simulators
4. Select your iPhone
5. Drag SerpentElementAI.ipa to Installed Apps
6. App installs automatically

### Method 4: 3uTools Installation
**Best for: Windows users or Mac users without Xcode**

```bash
Requirements:
- 3uTools software
- USB cable
- Apple ID
```

**Steps:**
1. Download 3uTools from official website
2. Install 3uTools on computer
3. Connect iPhone via USB
4. Click "Apps" → "Install Local Apps"
5. Select SerpentElementAI.ipa
6. Follow signing prompts

### Method 5: Apple Configurator 2 (Mac)
**Best for: Enterprise deployment**

```bash
Requirements:
- Mac with Apple Configurator 2
- USB cable
- Enterprise certificate (for unsigned IPAs)
```

**Steps:**
1. Install Apple Configurator 2 from Mac App Store
2. Connect iPhone via USB
3. Select device in Configurator
4. Click "Add" → "Apps"
5. Select IPA file
6. Install to device

## Troubleshooting

### "Untrusted Developer" Error
1. Go to Settings → General → VPN & Device Management
2. Find developer profile
3. Tap "Trust [Developer Name]"

### Installation Failed
- Ensure iOS version compatibility (12.0+)
- Check available storage space
- Verify Apple ID is signed in
- Try restarting iPhone
- Re-download IPA file if corrupted

### App Won't Launch
- Grant all requested permissions
- Check internet connection for AI features
- Restart the app
- Restart iPhone if needed

### Signing Issues
- Ensure Apple ID has app signing privileges
- Check if Apple ID needs two-factor authentication
- Verify developer certificate validity

## App Permissions

When you first launch the app, grant these permissions:

- 📷 **Camera Access** - For image analysis features
- 🎤 **Microphone Access** - For voice interaction
- 📸 **Photo Library** - For selecting images
- 🔔 **Notifications** - For AI response alerts

## Support

If you encounter issues:

1. **Check iOS Compatibility** - iOS 12.0 or later required
2. **Verify Internet Connection** - Required for AI features
3. **Update iOS** - Latest iOS version recommended
4. **Contact Developer** - For technical support

## Security Notes

- Only install from trusted sources
- Verify IPA file integrity
- Use official installation methods when possible
- Keep iOS updated for security

---

**🎉 Enjoy your AI-powered iOS experience!**
EOF

# Create AltStore specific instructions
cat > "$INSTALL_DIR/ALTSTORE_SETUP.md" << 'EOF'
# 🔧 AltStore Setup Guide for Serpent Element AI

AltStore is the easiest way to install custom iOS apps without a Mac or developer account.

## Prerequisites
- iPhone/iPad with iOS 12.4 or later
- Windows PC or Mac
- Free Apple ID
- Same WiFi network for both devices

## Step 1: Install AltStore on Computer

### For Windows:
1. Download AltStore from https://altstore.io/
2. Download iTunes from Microsoft Store (not Apple website)
3. Download iCloud for Windows
4. Install AltStore.exe
5. Run AltStore (you'll see it in system tray)

### For Mac:
1. Download AltStore from https://altstore.io/
2. Install AltStore.dmg
3. Run AltStore (you'll see it in menu bar)

## Step 2: Install AltStore on iPhone

1. **Connect iPhone to computer** via USB
2. **Open iTunes/Finder** and trust the device
3. **Right-click AltStore icon** on computer
4. **Select "Install AltStore"**
5. **Choose your iPhone** from the list
6. **Enter Apple ID credentials** when prompted
7. **Wait for installation** to complete

## Step 3: Trust the App

1. **Go to Settings** on iPhone
2. **Navigate to General → VPN & Device Management**
3. **Find your Apple ID** under Developer App
4. **Tap "Trust [Your Apple ID]"**
5. **Confirm trust** in popup

## Step 4: Install Serpent Element AI

1. **Open AltStore app** on iPhone
2. **Tap "+" button** (top left)
3. **Select "Files" app** or file location
4. **Choose SerpentElementAI.ipa** file
5. **Wait for installation** (may take a few minutes)
6. **App appears on home screen** when done

## Step 5: Refresh Apps (Important!)

AltStore requires apps to be refreshed every 7 days:

1. **Keep AltStore running** on computer
2. **Open AltStore app** on iPhone weekly
3. **Tap "Refresh All"** or individual app
4. **Ensure same WiFi** for both devices

## Tips for Success

- **Keep devices on same WiFi** during installation
- **Don't close AltStore** on computer during process
- **Use strong internet connection** for faster downloads
- **Disable VPN** if installation fails
- **Free up storage space** if needed (app needs ~50MB)

## Troubleshooting

### Installation Fails
- Restart both iPhone and computer
- Ensure iTunes recognizes iPhone
- Try different USB cable
- Update AltStore to latest version

### App Won't Refresh
- Check WiFi connection
- Restart AltStore on computer
- Sign out and back into Apple ID
- Try refreshing from computer AltStore

### "Unable to Find AltServer" Error
- Ensure AltStore is running on computer
- Check firewall settings
- Verify both devices on same network
- Restart AltStore service

## Security & Privacy

- **Apple ID is secure** - only used for app signing
- **No data is sent** to AltStore servers
- **Apps are signed locally** on your computer
- **Same security** as App Store apps

---

**🎯 Ready to install! Follow these steps and enjoy Serpent Element AI on your iPhone!**
EOF

# Create TestFlight instructions
cat > "$INSTALL_DIR/TESTFLIGHT_SETUP.md" << 'EOF'
# ✈️ TestFlight Installation for Serpent Element AI

TestFlight is Apple's official beta testing platform - the safest and easiest way to install beta apps.

## What is TestFlight?

TestFlight allows developers to share beta versions of their apps with testers before App Store release.

**Advantages:**
- ✅ Official Apple platform
- ✅ No computer required
- ✅ Automatic updates
- ✅ Feedback system
- ✅ No signing issues

## Prerequisites

- iPhone/iPad with iOS 13.0 or later
- Valid Apple ID
- Email address for invitation
- TestFlight app (free from App Store)

## Step 1: Install TestFlight

1. **Open App Store** on your iPhone
2. **Search for "TestFlight"**
3. **Install the TestFlight app** (by Apple)
4. **Open TestFlight** and sign in with Apple ID

## Step 2: Request Beta Access

**Option A: Direct Invitation**
- Provide your email to the developer
- Developer sends TestFlight invitation
- Check email for invitation link

**Option B: Public Link**
- Developer provides public TestFlight link
- Open link on iPhone
- Automatically opens TestFlight

## Step 3: Accept Invitation

1. **Open invitation email** on iPhone
2. **Tap "View in TestFlight"** button
3. **TestFlight app opens** automatically
4. **Tap "Accept"** to join beta
5. **Read beta information** and terms

## Step 4: Install the App

1. **Tap "Install"** in TestFlight
2. **Wait for download** (usually 1-2 minutes)
3. **App appears on home screen** when ready
4. **Launch from home screen** or TestFlight

## Step 5: Grant Permissions

When you first open Serpent Element AI:

1. **Allow Camera Access** - For image analysis
2. **Allow Microphone Access** - For voice chat
3. **Allow Photo Library** - For image selection
4. **Allow Notifications** - For AI responses

## TestFlight Features

### Automatic Updates
- **New versions** install automatically
- **Notification** when updates available
- **Update history** in TestFlight app

### Feedback System
- **Send feedback** directly to developer
- **Report bugs** with screenshots
- **Rate beta versions**

### Beta Information
- **View app details** in TestFlight
- **See version notes** and changes
- **Check expiration date** (90 days max)

## Important Notes

### Beta Limitations
- **90-day limit** - beta expires after 90 days
- **Limited builds** - developer controls versions
- **Testing purpose** - not final release version

### Data & Privacy
- **Same privacy** as App Store apps
- **Beta feedback** may be shared with developer
- **Crash reports** sent automatically

## Troubleshooting

### Invitation Not Received
- Check spam/junk folder
- Verify email address is correct
- Ask developer to resend invitation
- Ensure Apple ID matches email

### Can't Install App
- Check iOS version (13.0+ required)
- Ensure sufficient storage space
- Restart iPhone if needed
- Sign out/in to Apple ID

### App Crashes or Issues
- **Force close** and reopen app
- **Update to latest beta** in TestFlight
- **Send feedback** via TestFlight
- **Restart iPhone** if persistent

### TestFlight Won't Open
- Update TestFlight app
- Restart iPhone
- Check Apple ID sign-in
- Clear TestFlight cache

## Feedback & Support

### Sending Feedback
1. **Open TestFlight**
2. **Select Serpent Element AI**
3. **Tap "Send Beta Feedback"**
4. **Describe issue or suggestion**
5. **Include screenshots** if helpful

### Getting Help
- **Check app documentation** included with beta
- **Contact developer** through TestFlight
- **Report critical bugs** immediately
- **Join beta community** if available

---

**🚀 TestFlight makes beta testing simple and secure! Enjoy testing Serpent Element AI!**
EOF

# Create manifest file for enterprise distribution
cat > "$INSTALL_DIR/manifest.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>https://your-server.com/SerpentElementAI.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.serpent.elementai</string>
                <key>bundle-version</key>
                <string>1.0.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>Serpent Element AI</string>
                <key>subtitle</key>
                <string>AI-Powered Mobile Assistant</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
EOF

# Create web-based installer HTML
cat > "$INSTALL_DIR/web_installer.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serpent Element AI - Install</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .install-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: transform 0.2s;
        }
        .install-btn:hover {
            transform: scale(1.05);
        }
        .install-btn:active {
            transform: scale(0.95);
        }
        .method {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            text-align: left;
        }
        .method h3 {
            color: #333;
            margin-top: 0;
        }
        .device-info {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🤖</div>
        <h1>Serpent Element AI</h1>
        <p class="subtitle">AI-Powered Mobile Assistant</p>
        
        <div class="device-info" id="deviceInfo">
            Detecting your device...
        </div>
        
        <div class="method">
            <h3>🍎 TestFlight (Recommended)</h3>
            <p>Official Apple beta testing platform</p>
            <a href="https://testflight.apple.com/join/YOUR_CODE" class="install-btn">
                Install via TestFlight
            </a>
        </div>
        
        <div class="method">
            <h3>📱 Direct Install</h3>
            <p>Enterprise distribution (requires trust)</p>
            <a href="itms-services://?action=download-manifest&url=https://your-server.com/manifest.plist" class="install-btn">
                Install Directly
            </a>
        </div>
        
        <div class="method">
            <h3>💾 Download IPA</h3>
            <p>Manual installation via computer</p>
            <a href="SerpentElementAI.ipa" class="install-btn" download>
                Download IPA
            </a>
        </div>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Requires iOS 12.0 or later<br>
            Built with ❤️ using Linux tools
        </p>
    </div>
    
    <script>
        // Detect device and show appropriate info
        const deviceInfo = document.getElementById('deviceInfo');
        const userAgent = navigator.userAgent;
        
        if (/iPhone|iPad|iPod/.test(userAgent)) {
            const ios = userAgent.match(/OS (\d+)_(\d+)/);
            if (ios) {
                const version = `${ios[1]}.${ios[2]}`;
                deviceInfo.innerHTML = `📱 iOS ${version} detected - Ready to install!`;
                deviceInfo.style.background = '#e8f5e8';
            } else {
                deviceInfo.innerHTML = '📱 iOS device detected - Ready to install!';
                deviceInfo.style.background = '#e8f5e8';
            }
        } else if (/Android/.test(userAgent)) {
            deviceInfo.innerHTML = '🤖 Android detected - iOS app requires iPhone/iPad';
            deviceInfo.style.background = '#fff3cd';
        } else {
            deviceInfo.innerHTML = '💻 Computer detected - Use iTunes/Xcode to install on iOS device';
            deviceInfo.style.background = '#e3f2fd';
        }
    </script>
</body>
</html>
EOF

# Create package archive
tar -czf "${INSTALL_DIR}.tar.gz" "$INSTALL_DIR"

print_success "Installation package created: ${INSTALL_DIR}.tar.gz"

echo ""
echo "📦 Installation Package Contents:"
echo "   • SerpentElementAI.ipa - Main app file"
echo "   • REMOTE_INSTALLATION_GUIDE.md - Complete setup guide"
echo "   • ALTSTORE_SETUP.md - AltStore specific instructions"
echo "   • TESTFLIGHT_SETUP.md - TestFlight setup guide"
echo "   • manifest.plist - Enterprise distribution manifest"
echo "   • web_installer.html - Web-based installer page"
echo ""

print_step "Next Steps for Remote Installation:"
echo ""
echo "1. 📧 Share installation package with iPhone user"
echo "2. 🎯 Choose installation method based on user preference:"
echo "   • TestFlight (easiest, requires developer account)"
echo "   • AltStore (self-service, no developer account needed)"
echo "   • Xcode (requires Mac)"
echo "   • 3uTools (Windows/Mac friendly)"
echo ""
echo "3. 📝 User follows appropriate guide from installation package"
echo "4. 📱 App installs on iPhone"
echo "5. ✅ User grants permissions and enjoys AI features"
echo ""

print_warning "For TestFlight installation:"
echo "   • Upload IPA to App Store Connect"
echo "   • Create TestFlight build"
echo "   • Add user email as beta tester"
echo "   • Send TestFlight invitation"
echo ""

print_warning "For AltStore installation:"
echo "   • User needs to set up AltStore first"
echo "   • Requires Apple ID for signing"
echo "   • Apps need refresh every 7 days"
echo ""

print_success "🎉 Remote installation package ready!"
print_success "📧 Send ${INSTALL_DIR}.tar.gz to the iPhone user"
print_success "📋 They can follow the included guides for installation"

echo ""
print_status "When you provide Apple ID credentials, I can help set up TestFlight or other automated installation methods."