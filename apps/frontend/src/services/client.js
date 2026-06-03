// Simulates network latency + occasional jitter so the UI feels real.
// Swap the bodies of the service functions with real fetch/axios calls later.
export const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

export const withDelay = async (data, ms = 600) => {
  await delay(ms);
  return structuredClone(data);
};

// Toggle to simulate API failures while developing error states.
export const SIMULATE_ERRORS = false;

export const maybeFail = (chance = 0.0, message = 'Something went wrong') => {
  if (SIMULATE_ERRORS && Math.random() < chance) {
    throw new Error(message);
  }
};
