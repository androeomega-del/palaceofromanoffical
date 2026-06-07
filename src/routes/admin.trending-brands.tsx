import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import {
  listTrendingBrands,
  upsertTrendingBrand,
  deleteTrendingBrand,
} from "@/lib/admin-management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trending-brands")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminTrendingBrands,
  head: () => ({
    meta: [
      { title: "Trending Brands — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Form = {
  id?: string;
  brand_name: string;
  category: string;
  trend_status: string;
  key_aesthetic: string;
};

const empty: Form = { brand_name: "", category: "", trend_status: "", key_aesthetic: "" };

function AdminTrendingBrands() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "trending-brands"],
    queryFn: () => listTrendingBrands(),
  });
  const [form, setForm] = useState<Form | null>(null);

  const saveMut = useMutation({
    mutationFn: (f: Form) => upsertTrendingBrand({ data: f }),
    onSuccess: () => {
      toast.success("Saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "trending-brands"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteTrendingBrand({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "trending-brands"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/admin"
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl mt-3">Trending Brands</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-8">
              Seed signals that feed Claude's landing-page generator and trend search.
            </p>
          </div>
          <Button onClick={() => setForm({ ...empty })}>
            <Plus className="h-4 w-4 mr-2" /> New brand
          </Button>
        </div>

        {form ? (
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">{form.id ? "Edit brand" : "New brand"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setForm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-xs space-y-1">
                <span className="uppercase tracking-wider text-muted-foreground">Brand</span>
                <Input
                  value={form.brand_name}
                  onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="uppercase tracking-wider text-muted-foreground">Category</span>
                <Input
                  value={form.category}
                  placeholder="Eyewear, Footwear, Ready-to-wear…"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="uppercase tracking-wider text-muted-foreground">Trend status</span>
                <Input
                  value={form.trend_status}
                  placeholder="Rising, Peak, Cooling, Sleeper…"
                  onChange={(e) => setForm({ ...form, trend_status: e.target.value })}
                />
              </label>
              <label className="text-xs space-y-1 sm:col-span-2">
                <span className="uppercase tracking-wider text-muted-foreground">
                  Key aesthetic
                </span>
                <Input
                  value={form.key_aesthetic}
                  placeholder="Office-siren, quiet-luxury, mob-wife…"
                  onChange={(e) => setForm({ ...form, key_aesthetic: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </Card>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.length ? (
          <Card className="p-6">
            <p className="text-sm">No trending brands yet.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Brand</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Category</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Aesthetic</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-serif text-sm">{b.brand_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.category}</td>
                    <td className="px-4 py-3">{b.trend_status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.key_aesthetic}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: b.id,
                            brand_name: b.brand_name,
                            category: b.category,
                            trend_status: b.trend_status,
                            key_aesthetic: b.key_aesthetic,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this brand?")) delMut.mutate(b.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </main>
  );
}
