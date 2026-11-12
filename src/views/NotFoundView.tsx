import Link from "next/link";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { homePath } from "@/lib/routes";
import PageShell from "@/components/PageShell";

export default function NotFoundView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <PageShell title={t.errors.notFoundTitle} lead={t.errors.notFoundText}>
      <p className="text-center">
        <Link
          href={homePath(locale)}
          className="inline-flex rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {t.errors.backHome}
        </Link>
      </p>
    </PageShell>
  );
}
