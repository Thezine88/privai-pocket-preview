const CHANNELS = new Set(['owner', 'beta', 'production']);

export function readBuildConfig({ channel = 'production' } = {}) {
  if (!CHANNELS.has(channel)) throw new Error(`Canale build non valido: ${channel}`);
  return {
    channel,
    entitlement: channel === 'owner' ? 'owner' : 'free',
    billingEnabled: false,
  };
}
