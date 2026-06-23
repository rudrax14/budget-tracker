export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <div className="bg-muted/40 text-muted-foreground mt-6 rounded-xl border border-dashed p-10 text-center text-sm">
        Coming in the next milestone.
      </div>
    </div>
  );
}
