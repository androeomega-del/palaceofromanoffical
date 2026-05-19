import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/lib/contact.functions";
import { img } from "@/lib/editorial-library";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Concierge — Palace of Roman" },
      { name: "description", content: "Write to our concierge for private appointments, sourcing requests, authentication or after-care." },
      { property: "og:title", content: "Concierge — Palace of Roman" },
      { property: "og:image", content: img(8) },
    ],
  }),
  component: ContactPage,
});

const FormSchema = z.object({
  name: z.string().trim().min(1, "Please share your name").max(120),
  email: z.string().trim().email("A valid email, please").max(255),
  subject: z.string().trim().min(1, "What is this regarding?").max(160),
  message: z.string().trim().min(10, "A few words more, please").max(4000),
});

type FormValues = z.infer<typeof FormSchema>;

function ContactPage() {
  const submit = useServerFn(submitContactMessage);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await submit({ data: values });
      if (res.ok) {
        setSent(true);
        form.reset();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    } catch {
      setError("We could not reach the atelier. Please try again in a moment.");
    }
  };

  return (
    <main className="bg-canvas text-ink">
      <section className="grid md:grid-cols-2 min-h-[80vh]">
        {/* Image side */}
        <div className="relative bg-canvas-raised order-1 md:order-2">
          <img src={img(8)} alt="The atelier" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">Concierge</p>
            <p className="font-serif italic text-xl md:text-2xl max-w-md">
              "A single voice — for sourcing, appointments and after-care."
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="order-2 md:order-1 px-6 md:px-16 py-16 md:py-24 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Write to us</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-6 text-balance">
            How may we help?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-md">
            Private appointments, sourcing for a piece you have in mind, authentication of an existing wardrobe — we
            reply the same business day.
          </p>

          {sent ? (
            <div className="border border-ink/15 bg-canvas-raised p-8 max-w-lg">
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">Received</p>
              <h2 className="font-serif text-2xl mb-3">Thank you.</h2>
              <p className="text-sm text-ink/75 leading-relaxed mb-5">
                Your note is on its way to the concierge. We typically reply within one business day.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                Write another →
              </button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none border-0 border-b border-ink/20 focus-visible:ring-0 focus-visible:border-ink px-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="rounded-none border-0 border-b border-ink/20 focus-visible:ring-0 focus-visible:border-ink px-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="A private appointment, a sourcing request…" className="rounded-none border-0 border-b border-ink/20 focus-visible:ring-0 focus-visible:border-ink px-0 placeholder:text-ink/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Your note</FormLabel>
                      <FormControl>
                        <Textarea rows={6} {...field} className="rounded-none border-0 border-b border-ink/20 focus-visible:ring-0 focus-visible:border-ink px-0 resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <p className="text-sm text-red-700">{error}</p>}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="rounded-none h-12 px-10 text-[11px] uppercase tracking-[0.25em]"
                >
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to concierge"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-16 pt-10 border-t border-ink/10 grid sm:grid-cols-3 gap-8 max-w-lg text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">Email</p>
              <p className="text-ink/80">concierge@<br/>palaceofroman.com</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">By appointment</p>
              <p className="text-ink/80">New York atelier<br/>Mon–Sat</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">Hours</p>
              <p className="text-ink/80">10am – 7pm ET<br/>Same-day reply</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
