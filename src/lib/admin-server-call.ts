import { supabase } from "@/integrations/supabase/client";

type AdminHeaders = { headers?: Record<string, string> };

export async function callAdminServerFn<TResult>(
  fn: (options?: AdminHeaders) => Promise<TResult>,
): Promise<TResult>;
export async function callAdminServerFn<TData, TResult>(
  fn: (options: { data: TData } & AdminHeaders) => Promise<TResult>,
  options: { data: TData },
): Promise<TResult>;
export async function callAdminServerFn<TResult>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (options: any) => Promise<TResult>,
  options: { data?: unknown } = {},
): Promise<TResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fn({
    ...options,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
