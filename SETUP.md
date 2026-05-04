# Silverstone — React Native Setup Guide

Tanzania's First Float Management System

---

## 1. Prerequisites

```bash
node -v      # needs Node 18+
npm -v
npx expo --version
```

Install Expo CLI globally if needed:
```bash
npm install -g expo-cli
```

---

## 2. Install dependencies

```bash
cd silverstone
npm install
```

---

## 3. Firebase setup

### Create Firebase project
1. Go to https://console.firebase.google.com
2. Create a new project → name it `silverstone`
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore** → Start in **test mode** (deploy rules later)

### Get your config
Firebase Console → Project Settings → Your Apps → Add app → Web (⚙️)

Copy the config object and paste into `src/config/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "silverstone-xxx.firebaseapp.com",
  projectId:         "silverstone-xxx",
  storageBucket:     "silverstone-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc...",
};
```

### Deploy Firestore rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 4. Create the first Main Agent

Because all new registrations default to `sub-agent` + `pending`, you need
to manually promote the first account to `main-agent` via Firebase Console:

1. Register normally via the app (CreateAccount screen)
2. Open Firestore Console → `agents` collection → find your document
3. Edit `role` → `main-agent`
4. Edit `status` → `approved`
5. Sign back in → you'll see the Main Agent dashboard

---

## 5. Run the app

```bash
# Expo Go (fastest — scan QR with your phone)
npx expo start

# Android emulator
npx expo start --android

# iOS simulator (Mac only)
npx expo start --ios
```

---

## 6. Project structure

```
silverstone/
├── App.js                        # Root: providers + navigator
├── src/
│   ├── config/
│   │   └── firebase.js           # ← FILL IN YOUR KEYS HERE
│   ├── constants/
│   │   ├── theme.js              # LIGHT/DARK theme tokens
│   │   ├── networks.js           # Vodacom, Yas, Airtel, Halotel
│   │   └── translations.js       # EN + SW strings
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase Auth + Firestore profile
│   │   └── ThemeContext.jsx      # Dark mode + language (persisted)
│   ├── navigation/
│   │   ├── AppNavigator.jsx      # Root: decides which nav to show
│   │   ├── AuthNavigator.jsx     # Create → Pending → PIN Setup → PIN Login
│   │   ├── SubAgentNavigator.jsx # Bottom tabs: Home/Request/History/Profile
│   │   └── MainAgentNavigator.jsx# Bottom tabs: Overview/Queue/Transfers/Agents/Approvals
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── CreateAccountScreen.jsx  # 3-step KYC registration
│   │   │   ├── PendingScreen.jsx        # Waiting for admin approval
│   │   │   ├── PinSetupScreen.jsx       # Set 6-digit PIN (first login)
│   │   │   └── PinLoginScreen.jsx       # PIN or email/password login
│   │   ├── sub-agent/
│   │   │   ├── HomeScreen.jsx           # Hero card, quick actions, chart
│   │   │   ├── NewRequestScreen.jsx     # Float request form
│   │   │   ├── MyRequestsScreen.jsx     # Request history
│   │   │   └── ProfileScreen.jsx        # Profile + settings
│   │   └── main-agent/
│   │       ├── OverviewScreen.jsx       # Stats + charts
│   │       ├── QueueScreen.jsx          # Request queue + action modal
│   │       ├── TransfersScreen.jsx      # Transaction history
│   │       ├── AgentsScreen.jsx         # Agent roster
│   │       └── ApprovalsScreen.jsx      # Approve/reject agent applications
│   ├── components/
│   │   ├── StatusBadge.jsx       # Pending / Approved / Completed / Rejected
│   │   ├── NetworkBadge.jsx      # Vodacom · Yas · Airtel · Halotel chips
│   │   ├── PinPad.jsx            # 6-digit PIN keypad
│   │   └── RequestCard.jsx       # Reusable request list item
│   └── utils/
│       └── firestore.js          # All Firestore read/write helpers
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Composite indexes
└── app.json                      # Expo config
```

---

## 7. Firestore data model

### `agents/{uid}`
```
name, phone, email, role (sub-agent | main-agent),
status (pending | approved | rejected),
networks[], agentPhoneNumbers{},
businessName, businessLocation, regNo, tin, nida,
createdAt, pinSet (bool)
```

### `requests/{requestId}`
```
agentId, agentName,
sourceNetwork, destNetwork, sourcePhone, destPhone,
amount, urgent (bool), status (pending | approved | completed | rejected),
queuePosition, createdAt, processedAt, processedBy
```

### `transactions/{txId}`
```
requestId, agentId, agentName,
sourceNetwork, destNetwork, amount,
processedBy, createdAt
```

---

## 8. Next steps

- [ ] Push notifications (Expo Notifications) when request status changes
- [ ] Agent phone number management (link networks to specific numbers)
- [ ] PDF receipt generation for completed transfers
- [ ] Wire to the Node.js backend on Render (`svc-backend-6f2a.onrender.com`)
