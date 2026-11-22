export function JsonLd({ data }: { data: object }) {
  // Escape "<" so no string in the data can close the script element.
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
