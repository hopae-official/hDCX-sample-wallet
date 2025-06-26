# hDCX Sample Wallet

A React Native digital credential wallet app built with Expo and [`@hDCX/wallet-core`](https://github.com/hopae-official/hDCX-js).

## Prerequisites

- Node.js 18 or later
- pnpm 8 or later
- Expo CLI (`pnpm install -g expo-cli`)
- Expo EAS CLI (`pnpm install -g eas-cli`)
- Expo account (for EAS builds)
- Physical iOS/Android device for testing BLE and NFC features

## Installation

1. Clone the repository

```bash
git clone https://github.com/hopae-official/hDCX-sample-wallet.git
cd hDCX-sample-wallet
```

2. Install pnpm (if not installed)

```bash
npm install -g pnpm
```

3. Install dependencies

```bash
pnpm install
```

## Development

1. Start the development server

```bash
pnpm start
```

2. Run on devices

- iOS Simulator/Device

```bash
pnpm ios:device
```

- iOS Simulator

```bash
pnpm ios
```

- Android Device

```bash
pnpm android:device
```

- Android Emulator

```bash
pnpm android
```

## Building with EAS

1. Configure EAS

```bash
# Login to your Expo account
eas login

# Configure the project
eas build:configure
```

2. Build for development

```bash
# iOS development client
eas build --profile development --platform ios

# Android development client
eas build --profile development --platform android
```

3. Build for production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

4. Submit to stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Key Features

- Credential issuance and verification
- Secure credential storage and management
- VC Verification via Proximity(NFC/BLE) connection

## Troubleshooting

1. Reset Metro bundler cache

```bash
pnpm reset-project
```

2. Development client issues

```bash
# Rebuild development client
eas build --profile development --platform ios
eas build --profile development --platform android
```

3. Clean build files

```bash
# iOS
cd ios
pod deintegrate
pod install
cd ..

# Android
cd android
./gradlew clean
cd ..
```

## Technical Stack

- Expo SDK 53
- React Native 0.79.2
- BLE Communication (react-native-ble-plx)
- NFC Communication (react-native-nfc-manager)
- Secure Storage (expo-secure-store)
- Credential Management (@hDCX/wallet-core)

## Project Structure

```
├── app/                 # Expo Router app directory
├── components/          # Reusable components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── sdk/                # Wallet SDK implementation
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Environment Setup

The app requires specific environment variables for different environments. Create the following files:

- `.env.development` - Development environment variables
- `.env.staging` - Staging environment variables
- `.env.production` - Production environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
