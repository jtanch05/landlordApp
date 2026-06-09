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

  const { error: profileError } = await supabase.from("profiles").upsert({
    avatar_url: getAvatarUrl(user),
    display_name: getDisplayName(user),
    email: user.email,
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
