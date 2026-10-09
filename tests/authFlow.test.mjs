import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("retained account restores behind PIN and new accounts set PIN twice", async () => {
  const [context, navigator, setup] = await Promise.all([
    source("src/context/AuthContext.jsx"),
    source("src/navigation/AppNavigator.jsx"),
    source("src/screens/auth/PinSetupScreen.jsx"),
  ]);

  assert.match(context, /silverstone_api_pin_\$\{id\}/);
  assert.match(context, /api\.restore\(\)/);
  assert.match(context, /apply\(agent, true/);
  assert.match(context, /SecureStore\.setItemAsync\(pinKey\(user\.id\), pin\)/);

  assert.match(navigator, /initialRoute="Login"/);
  assert.match(navigator, /<PinSetupScreen/);
  assert.match(navigator, /<PinEntryScreen/);
  assert.match(navigator, /sessionLocked/);

  assert.match(setup, /setStage\('confirm'\)/);
  assert.match(setup, /next === firstPin/);
  assert.match(setup, /await savePin\(next\)/);
});

test("ordinary sign out locks while Not-name performs true logout", async () => {
  const [pinEntry, profile, drawer, context] = await Promise.all([
    source("src/screens/auth/PinEntryScreen.jsx"),
    source("src/screens/sub-agent/ProfileScreen.jsx"),
    source("src/components/DrawerContent.jsx"),
    source("src/context/AuthContext.jsx"),
  ]);

  assert.match(pinEntry, /Not \{firstName\}\?/);
  assert.match(pinEntry, /onPress: logout/);
  assert.match(profile, /onPress: lockSession/);
  assert.match(drawer, /onPress=\{lockSession\}/);
  assert.match(context, /await api\.logout\(\)/);
  assert.match(context, /function lockSession\(\)/);
});

test("restricted accounts stay outside operational navigators", async () => {
  const [navigator, pending] = await Promise.all([
    source("src/navigation/AppNavigator.jsx"),
    source("src/screens/auth/PendingScreen.jsx"),
  ]);

  assert.match(navigator, /if \(!canOperate\(profile\)\)/);
  assert.match(navigator, /initialRoute="pending"/);
  assert.match(pending, /Account suspended\./);
  assert.match(pending, /Application rejected\./);
  assert.match(pending, /Corrections requested\./);
});
