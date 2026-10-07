// Actual component handlers with injected JS React state; not a native renderer.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as operationsClient from "../src/api/operationsClient.js";
const require = createRequire(import.meta.url);
function component(api) {
  const values = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = initial;
      return [
        values[i],
        (v) => {
          values[i] = typeof v === "function" ? v(values[i]) : v;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = { current: initial };
      return values[i];
    },
    useEffect() {},
    createElement(type, props, ...children) {
      return { type, props: props || {}, children };
    },
  };
  const native = new Proxy(
    { StyleSheet: { create: (x) => x }, Platform: { OS: "android" } },
    { get: (o, k) => o[k] || k },
  );
  const code = require("@babel/core").transformSync(
    fs.readFileSync(
      new URL("../src/components/OperationsPanel.jsx", import.meta.url),
      "utf8",
    ),
    {
      configFile: false,
      babelrc: false,
      plugins: [
        "@babel/plugin-transform-react-jsx",
        "@babel/plugin-transform-modules-commonjs",
      ],
    },
  ).code;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require: (p) =>
      p === "react"
        ? react
        : p === "react-native"
          ? native
          : p.includes("operationsClient")
            ? operationsClient
            : p.includes("config/api")
              ? { api }
              : p.includes("ThemeContext")
                ? { useTheme: () => ({ theme: {} }) }
                : p.includes("exchanges")
                  ? { formatTzs: (x) => "TZS " + x }
                  : {
                      fonts: {},
                      spacing: { md: 16, sm: 8 },
                      radius: { md: 8 },
                    },
  });
  return () => {
    cursor = 0;
    return module.exports.default({ visible: true, onClose() {} });
  };
}
function nodes(t) {
  if (!t || typeof t !== "object") return [];
  if (Array.isArray(t)) return t.flatMap(nodes);
  return [t, ...t.children.flatMap(nodes)];
}
function text(t) {
  if (typeof t === "string" || typeof t === "number") return String(t);
  if (!t) return "";
  if (Array.isArray(t)) return t.map(text).join("");
  return t.children.map(text).join("");
}
const button = (tree, label) =>
  nodes(tree).find(
    (n) => n.type === "TouchableOpacity" && text(n).includes(label),
  );
test("operations panel retains input after stale assignment, requires reload, and reports missing grants", async () => {
  let assignments = 0,
    conflict = false;
  const caps = ["cases.read", "cases.manage", "cases.own"];
  const row = {
    requestId: "request",
    supportReference: "request",
    amountTzs: "100",
    version: 0,
  };
  const render = component({
    currentOwner: () => "operator",
    envelope: async () => ({
      data: [{ ...row, version: conflict ? 1 : 0 }],
      page: { nextCursor: null },
    }),
    call: async (path, options) => {
      if (path === "/operations/scopes")
        return [{ mainAgentId: "scope", capabilities: caps }];
      if (path.endsWith("/diagnostics"))
        return {
          unresolvedCount: 1,
          unassignedCount: 1,
          escalationDueCount: 0,
          expiredPreparationClaims: 0,
          reservedCapacityTzs: "100",
        };
      if (path.endsWith("/controls"))
        return {
          version: 0,
          requestsPaused: false,
          acceptancePaused: false,
          preparationPaused: false,
        };
      if (path.endsWith("/owners"))
        return [
          { id: "owner", name: "Owner" },
          { id: "backup", name: "Backup" },
        ];
      if (path.endsWith("/evidence"))
        return {
          legs: [{ id: "leg", type: "origin_in", status: "unknown" }],
          observations: [],
          accounts: null,
        };
      if (path.endsWith("/assign")) {
        assignments++;
        conflict = true;
        assert.equal(options.body.expectedVersion, 0);
        throw Object.assign(Error("Refresh required"), { status: 409 });
      }
    },
  });
  assert.match(text(render()), /No operational scope/);
  await button(render(), "Reload granted scopes").props.onPress();
  await button(render(), "Open scope scope").props.onPress();
  await button(render(), "Inspect request").props.onPress();
  const radios = nodes(render()).filter(
    (n) => n.props.accessibilityRole === "radio",
  );
  radios[0].props.onPress();
  radios[3].props.onPress();
  nodes(render())
    .find(
      (n) => n.props.accessibilityLabel === "Reason for responsibility change",
    )
    .props.onChangeText("Retained operational reason");
  await button(render(), "Assign owner and backup").props.onPress();
  assert.equal(assignments, 1);
  assert.equal(
    button(render(), "Assign owner and backup").props.disabled,
    true,
  );
  assert.equal(
    nodes(render()).find(
      (n) => n.props.accessibilityLabel === "Reason for responsibility change",
    ).props.value,
    "Retained operational reason",
  );
  await button(render(), "Reload operational records").props.onPress();
  await button(render(), "Inspect request").props.onPress();
  assert.equal(
    nodes(render()).find(
      (n) => n.props.accessibilityLabel === "Reason for responsibility change",
    ).props.value,
    "Retained operational reason",
  );
  assert.equal(assignments, 1);
});
