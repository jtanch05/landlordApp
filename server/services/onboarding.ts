import type { SupabaseClient, User } from "@supabase/supabase-js";

type OnboardingResult = {
  portfolioId: string;
  profileId: string;
};

function getDisplayName(user: User) {
  const fullName = user.user_metadata.full_name;
  const name = user.user_metadata.name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return null;
}

function getAvatarUrl(user: User) {
  const avatarUrl = user.user_metadata.avatar_url;

  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }

  return null;
}

export async function ensureUserProfileAndDefaultPortfolio(
  supabase: SupabaseClient,
): Promise<OnboardingResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Failed to load signed-in user: ${userError.message}`);
  }

  if (!userData.user?.email) {
    throw new Error("Signed-in user does not have an email address.");
  }

  const user = userData.user;
  const userEmail = user.email;

  if (!userEmail) {
    throw new Error("Signed-in user does not have an email address.");
  }

  const email = userEmail.toLowerCase();

  const { error: profileError } = await supabase.from("profiles").upsert({
    avatar_url: getAvatarUrl(user),
    display_name: getDisplayName(user),
    email,
    id: user.id,
  });

  if (profileError) {
    throw new Error(`Failed to prepare user profile: ${profileError.message}`);
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from("portfolio_members")
    .select("portfolio_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to check portfolio membership: ${membershipError.message}`);
  }

  await activatePendingInvitations(supabase, user.id, email);

  if (existingMembership?.portfolio_id) {
    return {
      portfolioId: existingMembership.portfolio_id as string,
      profileId: user.id,
    };
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .insert({
      created_by: user.id,
      name: "My Portfolio",
    })
    .select("id")
    .single();

  if (portfolioError) {
    throw new Error(`Failed to create default portfolio: ${portfolioError.message}`);
  }

  const portfolioId = portfolio.id as string;

  const { error: hostMembershipError } = await supabase
    .from("portfolio_members")
    .insert({
      portfolio_id: portfolioId,
      role: "host",
      user_id: user.id,
    });

  if (hostMembershipError) {
    throw new Error(`Failed to create Host membership: ${hostMembershipError.message}`);
  }

  return {
    portfolioId,
    profileId: user.id,
  };
}

async function activatePendingInvitations(
  supabase: SupabaseClient,
  userId: string,
  email: string,
) {
  const { data: invitations, error } = await supabase
    .from("invitations")
    .select("id,property_id,can_edit,can_view_tenant_contact,invited_by")
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(`Failed to load pending invitations: ${error.message}`);
  }

  if (!invitations?.length) {
    return;
  }

  for (const invitation of invitations) {
    const { error: accessError } = await supabase.from("property_access").insert({
      can_edit: invitation.can_edit,
      can_view_tenant_contact: invitation.can_view_tenant_contact,
      granted_by: invitation.invited_by,
      property_id: invitation.property_id,
      user_id: userId,
    });

    if (accessError && accessError.code !== "23505") {
      throw new Error(`Failed to activate invitation: ${accessError.message}`);
    }

    const { error: invitationError } = await supabase
      .from("invitations")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
        status: "accepted",
      })
      .eq("id", invitation.id);

    if (invitationError) {
      throw new Error(`Failed to mark invitation accepted: ${invitationError.message}`);
    }
  }
}
