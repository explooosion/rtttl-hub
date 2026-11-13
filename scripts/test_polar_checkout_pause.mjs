import assert from "node:assert/strict";
import test from "node:test";

const checkoutUrl =
  "http://127.0.0.1:5001/demo-rtttl-hub/us-central1/polarCreateCheckout";

test("paused checkout callable rejects requests without creating a checkout", async () => {
  const response = await fetch(checkoutUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        amount: 3,
      },
    }),
  });
  const result = await response.json();

  assert.equal(result.error?.status, "UNAVAILABLE");
});
