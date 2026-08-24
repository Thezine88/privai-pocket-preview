export function greetingForHour(hour, locale = 'it') {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError('Ora non valida');
  const english = locale === 'en';
  if (hour >= 5 && hour < 10) return english ? '👋 Good morning' : '👋 Buongiorno';
  if (hour >= 10 && hour < 12) return '👋 Hey!';
  if (hour >= 12 && hour < 15) return english ? '👋 Let’s get to work' : '👋 Diamoci dentro';
  if (hour >= 15 && hour < 18) return english ? '💪 I’m ready' : '💪 Sono pronto';
  if (hour >= 18 && hour < 21) return english ? '🚀 Put me to the test' : '🚀 Mettimi alla prova';
  return english ? '🌕 Good evening' : '🌕 Buonasera';
}
