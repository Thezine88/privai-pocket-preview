function normalize(route) {
  if (!route || typeof route.name !== 'string' || !route.name.trim()) throw new TypeError('Schermata non valida');
  return { name: route.name, state: route.state ?? {} };
}

export function createRouter(initialRoute) {
  const stack = [normalize(initialRoute)];
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(stack.at(-1)));
  return {
    current: () => stack.at(-1),
    push(route) { stack.push(normalize(route)); notify(); },
    replace(route) { stack[stack.length - 1] = normalize(route); notify(); },
    back() {
      if (stack.length === 1) return false;
      stack.pop();
      notify();
      return true;
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
