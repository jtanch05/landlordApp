export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#d8decf] pb-6">
        <div className="h-4 w-24 animate-pulse rounded bg-[#d8decf]" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded bg-[#d8decf]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            className="h-28 animate-pulse rounded-[8px] border border-[#d8decf] bg-[#f7f7f2]"
            key={item}
          />
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-[8px] border border-[#d8decf] bg-[#f7f7f2]" />
    </div>
  );
}
