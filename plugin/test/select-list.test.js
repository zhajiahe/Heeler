import { test, suite } from "node:test";
import assert from "node:assert/strict";

import {
  createSelection,
  moveCursor,
  toggleCurrent,
  toggleAll,
  selectedAddresses,
  addCustomAddress,
} from "../src/select-list.js";

const candidates = [
  { address: "192.168.1.42", family: "IPv4", interfaceName: "en0", preChecked: true },
  { address: "100.101.102.103", family: "IPv4", interfaceName: "utun3", preChecked: true },
  { address: "203.0.113.9", family: "IPv4", interfaceName: "en1", preChecked: false },
];

suite("selection list", () => {
  test("starts with pre-checked candidates selected and cursor on the first row", () => {
    const state = createSelection(candidates);
    assert.equal(state.cursor, 0);
    assert.deepEqual(selectedAddresses(state), ["192.168.1.42", "100.101.102.103"]);
  });

  test("cursor movement clamps at both ends", () => {
    let state = createSelection(candidates);
    state = moveCursor(state, -1);
    assert.equal(state.cursor, 0);
    state = moveCursor(moveCursor(moveCursor(state, 1), 1), 1);
    assert.equal(state.cursor, 2);
  });

  test("toggling flips only the row under the cursor", () => {
    let state = createSelection(candidates);
    state = toggleCurrent(moveCursor(state, 1));
    assert.deepEqual(selectedAddresses(state), ["192.168.1.42"]);
    state = toggleCurrent(state);
    assert.deepEqual(selectedAddresses(state), ["192.168.1.42", "100.101.102.103"]);
  });

  test("toggle all checks everything, then unchecks everything", () => {
    let state = createSelection(candidates);
    state = toggleAll(state);
    assert.deepEqual(
      selectedAddresses(state),
      ["192.168.1.42", "100.101.102.103", "203.0.113.9"],
    );
    state = toggleAll(state);
    assert.deepEqual(selectedAddresses(state), []);
  });

  test("selected addresses keep candidate order regardless of toggle order", () => {
    let state = createSelection(candidates);
    state = moveCursor(state, 1);
    state = moveCursor(state, 1);
    state = toggleCurrent(state); // check 203.0.113.9 last
    assert.deepEqual(
      selectedAddresses(state),
      ["192.168.1.42", "100.101.102.103", "203.0.113.9"],
    );
  });

  test("addCustomAddress appends a checked custom row", () => {
    const state = addCustomAddress(createSelection(candidates), "203.0.113.10");
    assert.equal(state.cursor, 3);
    assert.deepEqual(state.items[3], {
      address: "203.0.113.10",
      family: "custom",
      interfaceName: "custom",
      checked: true,
    });
    assert.deepEqual(selectedAddresses(state), [
      "192.168.1.42",
      "100.101.102.103",
      "203.0.113.10",
    ]);
  });

  test("addCustomAddress selects a duplicate instead of adding a second row", () => {
    const state = addCustomAddress(createSelection(candidates), "203.0.113.9");
    assert.equal(state.cursor, 2);
    assert.equal(state.items.length, 3);
    assert.equal(state.items[2].checked, true);
    assert.deepEqual(selectedAddresses(state), [
      "192.168.1.42",
      "100.101.102.103",
      "203.0.113.9",
    ]);
  });
});
