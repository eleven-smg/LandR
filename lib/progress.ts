/**
 * A one-number store of "how many things are running right now". Server actions
 * report in and out of it, so a single bar at the top of the site can show that
 * something is happening even when the work is not a page navigation.
 */

let running = 0
const listeners = new Set<(count: number) => void>()

function emit() {
  listeners.forEach((listener) => listener(running))
}

export function beginTask() {
  running = running + 1
  emit()
}

export function endTask() {
  running = running > 0 ? running - 1 : 0
  emit()
}

export function subscribeToTasks(listener: (count: number) => void) {
  listeners.add(listener)
  listener(running)
  return () => {
    listeners.delete(listener)
  }
}
