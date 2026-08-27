export function createOutboundShare({ isNative = () => false, nativePlugin, webShare } = {}) {
  const plugin = () => typeof nativePlugin === 'function' ? nativePlugin() : nativePlugin;

  async function shareAnywhere(text, title) {
    if (isNative() && plugin()?.share) return plugin().share({ text, title });
    if (webShare) return webShare({ text, title });
    return { unavailable: true };
  }

  async function shareWithInstalledAI(text, title) {
    if (isNative() && plugin()?.shareWithAI) return plugin().shareWithAI({ text, title });
    return shareAnywhere(text, title);
  }

  return { shareAnywhere, shareWithInstalledAI };
}
