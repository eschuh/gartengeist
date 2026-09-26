export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section>
      <h1 className="text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm">{description}</p>
    </section>
  )
}
