/**
 * Circuit Breaker
 * Prevents cascading failures by opening circuit after repeated failures
 */

interface CircuitState {
  failures: number;
  open: boolean;
  openedAt: number;
  lastCheck: number;
}

const circuits = new Map<string, CircuitState>();

const DEFAULT_THRESHOLD = 5;
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Checks if a circuit allows requests
 */
export function allow(name: string = 'default'): boolean {
  const circuit = circuits.get(name);
  
  if (!circuit || !circuit.open) {
    return true;
  }

  // Check if timeout has elapsed
  if (Date.now() - circuit.openedAt > DEFAULT_TIMEOUT_MS) {
    // Half-open state: allow one request through
    circuit.open = false;
    circuit.failures = 0;
    circuits.set(name, circuit);
    return true;
  }

  return false;
}

/**
 * Records the result of an operation
 */
export function record(
  name: string = 'default',
  success: boolean,
  threshold: number = DEFAULT_THRESHOLD
): void {
  let circuit = circuits.get(name);

  if (!circuit) {
    circuit = {
      failures: 0,
      open: false,
      openedAt: 0,
      lastCheck: Date.now(),
    };
  }

  if (success) {
    // Reset on success
    circuit.failures = 0;
    circuit.open = false;
  } else {
    // Increment failures
    circuit.failures++;

    // Open circuit if threshold exceeded
    if (circuit.failures >= threshold) {
      circuit.open = true;
      circuit.openedAt = Date.now();
      console.warn(`Circuit breaker "${name}" opened after ${circuit.failures} failures`);
    }
  }

  circuit.lastCheck = Date.now();
  circuits.set(name, circuit);
}

/**
 * Gets the current state of a circuit
 */
export function getState(name: string = 'default'): CircuitState | null {
  return circuits.get(name) || null;
}

/**
 * Resets a circuit breaker
 */
export function reset(name: string = 'default'): void {
  circuits.delete(name);
}

/**
 * Executes a function with circuit breaker protection
 */
export async function withCircuit<T>(
  fn: () => Promise<T>,
  name: string = 'default'
): Promise<T> {
  if (!allow(name)) {
    throw new Error(`Circuit breaker "${name}" is open`);
  }

  try {
    const result = await fn();
    record(name, true);
    return result;
  } catch (error) {
    record(name, false);
    throw error;
  }
}
