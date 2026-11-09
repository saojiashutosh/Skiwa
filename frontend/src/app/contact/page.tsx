"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Instagram, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, apiErrorMessage } from "@/lib/api";
import { INSTAGRAM_URL, SUPPORT_EMAIL } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Your name is required."),
  email: z.string().email("Enter a valid email."),
  subject: z.string().min(3, "A subject is required."),
  message: z.string().min(10, "Tell us a little more (min 10 characters)."),
});

type ContactValues = z.infer<typeof schema>;

const FAQ = [
  {
    q: "When will my order ship?",
    a: "Orders are dispatched within 24–48 hours. Standard delivery takes 5–7 business days across India, express takes 2–3.",
  },
  {
    q: "How do returns work?",
    a: "Raise a return from your account within 7 days of delivery. Pieces must be unworn, unwashed, with tags on. Refunds land in 5–7 business days after pickup.",
  },
  {
    q: "Do sold-out drops restock?",
    a: "Rarely. Drops are limited by design — join the newsletter for restock alerts before they go public.",
  },
  {
    q: "What sizes do you carry?",
    a: "S through XXL in oversized fits. Check each product's size note — our silhouettes run intentionally big.",
  },
];

export default function ContactPage() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    try {
      const { data } = await api.post("/contact/", values);
      toast.success(data.detail ?? "Message received.");
      form.reset();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send your message."));
    }
  };

  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">Talk to Us</p>
      <h1 className="heading text-section-title text-foreground">Contact</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-2">
        {/* Form */}
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-2" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-accent">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-2" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-accent">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" className="mt-2" {...form.register("subject")} />
            {form.formState.errors.subject && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.subject.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" className="mt-2 min-h-[160px]" {...form.register("message")} />
            {form.formState.errors.message && (
              <p className="mt-1 text-xs text-accent">{form.formState.errors.message.message}</p>
            )}
          </div>
          <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
            Send Message
          </Button>
        </form>

        {/* Channels + FAQ */}
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="group border border-border p-6 transition-colors hover:border-foreground/40"
            >
              <Mail className="h-5 w-5 text-accent" aria-hidden />
              <p className="mt-4 font-button text-xs uppercase tracking-[0.2em] text-foreground">
                Email
              </p>
              <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground">
                {SUPPORT_EMAIL}
              </p>
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-border p-6 transition-colors hover:border-foreground/40"
            >
              <Instagram className="h-5 w-5 text-accent" aria-hidden />
              <p className="mt-4 font-button text-xs uppercase tracking-[0.2em] text-foreground">
                Instagram
              </p>
              <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground">
                @skiwaa.in
              </p>
            </a>
          </div>

          <h2 className="heading mt-14 text-2xl text-foreground">FAQ</h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQ.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
