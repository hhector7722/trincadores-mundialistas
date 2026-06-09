import { ProfileAvatar, type ProfileAvatarVariant } from "@/components/profile/ProfileAvatar";
import {
  AVATAR_DISPLAY_HOME_MINI,
  AVATAR_DISPLAY_PROFILE,
  AVATAR_DISPLAY_RANKING,
} from "@/lib/avatars/display-classes";

export type AvatarDisplaySize = "profile" | "ranking" | "mini";

const DISPLAY_CONFIG: Record<
  AvatarDisplaySize,
  { variant: ProfileAvatarVariant; className: string }
> = {
  profile: { variant: "profile", className: AVATAR_DISPLAY_PROFILE },
  ranking: { variant: "badge", className: AVATAR_DISPLAY_RANKING },
  mini: { variant: "badge", className: AVATAR_DISPLAY_HOME_MINI },
};

export function AvatarDisplay({
  avatarUrl,
  label,
  size,
}: {
  avatarUrl: string | null;
  label: string;
  size: AvatarDisplaySize;
}) {
  const { variant, className } = DISPLAY_CONFIG[size];

  return (
    <ProfileAvatar avatarUrl={avatarUrl} label={label} variant={variant} className={className} />
  );
}
