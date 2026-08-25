const VALID_TOOLS = new Set(['convert', 'protect', 'prepare', 'restore']);

export function createWorkflowState(tool) {
  if (!VALID_TOOLS.has(tool)) {
    throw new TypeError(`Unsupported workflow: ${tool}`);
  }

  return { tool, phase: 'input' };
}

export function transitionWorkflow(state, event) {
  if (event === 'RESET' || event === 'EDIT') {
    return { ...state, phase: 'input' };
  }

  if (event === 'REVIEW' && state.tool === 'protect') {
    return { ...state, phase: 'review' };
  }

  if (event === 'COMPLETE') {
    return { ...state, phase: 'result' };
  }

  return state;
}

export function getVisiblePhase(state) {
  return state.phase;
}

export function containsKnownPlaceholder(text, mapping) {
  const source = String(text ?? '');
  if (!source) return false;
  return Object.keys(mapping ?? {}).some((placeholder) => source.includes(placeholder));
}
