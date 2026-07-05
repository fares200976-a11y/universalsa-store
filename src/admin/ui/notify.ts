import { toast } from "sonner";

export const notify = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast(message);
  },
  /** Wrap an async action with success / error toasts. Returns the result or null. */
  async run<T>(
    action: () => Promise<T>,
    opts: { success?: string; error?: string } = {},
  ): Promise<T | null> {
    try {
      const result = await action();
      if (opts.success) toast.success(opts.success);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : opts.error ?? "Une erreur est survenue";
      toast.error(opts.error ? `${opts.error} : ${msg}` : msg);
      return null;
    }
  },
};
