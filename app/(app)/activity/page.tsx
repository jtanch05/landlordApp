import { redirect } from "next/navigation";
import { Activity, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto max-w-[1120px] space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Portfolio-wide accountability across property changes.
        </p>
      </header>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 rounded-lg bg-card pl-10 text-[13px]" placeholder="Filter activity..." />
      </label>

      <Card>
        <CardHeader className="p-4 lg:p-5">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-5 pt-0">
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <article className="border-l-2 border-primary pl-4" key={event.id}>
                  <p className="text-[13px] font-semibold">{event.summary}</p>
                  <p className="mt-1 text-xs uppercase text-muted-foreground">
                    {event.action} - {event.entity_type} -{" "}
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  {event.actor_email ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.actor_email}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="flex min-h-40 items-center justify-center text-center text-[13px] text-muted-foreground">
                <div>
                  <Activity className="mx-auto mb-2 size-8 text-border" />
                  Activity appears after records are created or updated.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
