import { supabase } from "@/integrations/supabase/client";

type AnyServerFn = (options: any) => Promise<any>;

export async function callAdminServerFn<TFn extends AnyServerFn>(
  fn: TFn,
  options: Omit<NonNullable<Parameters<TFn>[0]>, "headers"> = {} as Omit<
    NonNullable<Parameters<TFn>[0]>,
    "headers"
  >,
): Promise<Awaited<ReturnType<TFn>>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fn({
    ...options,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as Parameters<TFn>[0]);
}
