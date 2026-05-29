import { supabase } from "@/integrations/supabase/client";

type ServerFnOptions = {
  data?: unknown;
  headers?: Record<string, string>;
};

type ServerFn<TResult> = (options?: ServerFnOptions) => Promise<TResult>;

export async function callAdminServerFn<TResult>(
  fn: ServerFn<TResult>,
  options: Omit<ServerFnOptions, "headers"> = {},
): Promise<TResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fn({
    ...options,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
