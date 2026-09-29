// Browser-side stand-in for mockup mode: the only browser usage is the realtime channel in LiveRefresh.
export function createMockBrowserClient() {
  const channel = {
    on: () => channel,
    subscribe: (cb?: (status: string) => void) => { setTimeout(() => cb?.("SUBSCRIBED"), 200); return channel; },
  };
  return { channel: () => channel, removeChannel: () => undefined };
}
