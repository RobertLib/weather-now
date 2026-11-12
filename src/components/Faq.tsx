import { HelpCircle } from "lucide-react";
import { faqSchema } from "@/lib/schema";
import JsonLd from "./JsonLd";

/** Visible questions and answers with FAQPage markup generated from the same data. */
export default function Faq({ title, items }: { title: string; items: Array<[string, string]> }) {
  if (!items.length) return null;
  return (
    <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
      <JsonLd data={faqSchema(items)} />
      <h2 className="font-display mb-3 flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
        <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        {title}
      </h2>
      <dl className="divide-y divide-slate-900/8 dark:divide-white/10">
        {items.map(([q, a]) => (
          <div key={q} className="py-2.5">
            <dt className="text-sm font-semibold">{q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
