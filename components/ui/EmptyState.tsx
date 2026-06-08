type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="rounded-md bg-[rgba(22,51,0,0.08)] p-6">
      <h2 className="text-base font-semibold text-[#0e0f0c]">{title}</h2>
      <p className="mt-2 text-sm text-[#454745]">{description}</p>
    </section>
  );
}
