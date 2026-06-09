import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ActivityEvent = {
  action: string;
  actor_email: string | null;
  created_at: string;
  entity_type: string;
  id: string;
  summary: string;
};

async function getActivity() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("audit_events")
    .select("id,actor_email,action,entity_type,summary,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load activity: ${error.message}`);
  }

  return data as ActivityEvent[];
}

export default async function ActivityPage() {
  const events = await getActivity();

  return (
    <div className="space-y-8">
      <header className="border-b border-[#d8decf] pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
          Activity
        </h1>
      </header>

      <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <article className="border-l-2 border-[#9fe870] pl-4" key={event.id}>
                <p className="text-sm font-semibold text-[#2f4a34]">
                  {event.summary}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                  {event.action} · {event.entity_type} ·{" "}
                  {new Date(event.created_at).toLocaleString()}
                </p>
                {event.actor_email ? (
                  <p className="mt-1 text-xs text-[#4d6650]">{event.actor_email}</p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#4d6650]">
              Activity appears after records are created or updated.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
