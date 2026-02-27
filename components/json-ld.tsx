/**
 * Reusable JSON-LD structured data renderer.
 * Renders a <script type="application/ld+json"> tag with the
 * provided schema.org data, automatically adding @context.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          ...data,
        }),
      }}
    />
  )
}
