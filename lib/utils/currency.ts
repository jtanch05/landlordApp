export function formatMyr(amountCents: number) {
  return new Intl.NumberFormat("ms-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountCents / 100);
}
