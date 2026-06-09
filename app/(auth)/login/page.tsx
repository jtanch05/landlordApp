import { signInWithGoogle, signInWithMagicLink } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    sent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const magicLinkSent = params.sent === "1";

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-10 text-[#163300]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
              PropTrack
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-[#163300] md:text-7xl">
              Property records, rent, expenses, and co-owner access in one place.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#4d6650]">
              Built for Malaysian landlords who need a focused portfolio workspace
              without spreadsheet drift.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 text-sm text-[#2f4a34] sm:grid-cols-3">
            <div className="border-t border-[#d8decf] pt-4">
              Rent schedule tracking
            </div>
            <div className="border-t border-[#d8decf] pt-4">
              Maintenance and vendors
            </div>
            <div className="border-t border-[#d8decf] pt-4">
              Host controlled sharing
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-[#d8decf] bg-white p-6 shadow-sm">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-[#163300]">
              Sign in
            </h2>
            <p className="text-sm leading-6 text-[#4d6650]">
              Use Google or receive a secure magic link by email.
            </p>
          </div>

          {params.error ? (
            <div className="mb-4 rounded-[6px] border border-[#ffd6d6] bg-[#fff4f4] px-4 py-3 text-sm text-[#9c1c1c]">
              {params.error}
            </div>
          ) : null}

          {magicLinkSent ? (
            <div className="mb-4 rounded-[6px] border border-[#c6efcd] bg-[#f1fff3] px-4 py-3 text-sm text-[#1b5f2a]">
              Magic link sent to {params.email}. Check your inbox to continue.
            </div>
          ) : null}

          <form action={signInWithGoogle}>
            <button
              className="w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
              type="submit"
            >
              Continue with Google
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#7a8577]">
            <div className="h-px flex-1 bg-[#d8decf]" />
            or
            <div className="h-px flex-1 bg-[#d8decf]" />
          </div>

          <form action={signInWithMagicLink} className="space-y-3">
            <label className="block text-sm font-medium text-[#2f4a34]" htmlFor="email">
              Email address
            </label>
            <input
              className="w-full rounded-[6px] border border-[#cbd5c1] bg-white px-4 py-3 text-sm text-[#163300] outline-none transition placeholder:text-[#8b9789] focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
              required
            />
            <button
              className="w-full rounded-[6px] border border-[#163300] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#f2f5ee]"
              type="submit"
            >
              Send magic link
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
