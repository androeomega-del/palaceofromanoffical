import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

const Input = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
});

export const getVacationDestination = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => Input.parse(data))
  .handler(async ({ data }) => {
    const { fetchDestinationBySlug } = await import(
      "./vacation-destinations.server"
    );
    const dest = await fetchDestinationBySlug(data.slug);
    if (!dest) throw notFound();
    return dest;
  });
