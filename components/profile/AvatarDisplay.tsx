import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import {
  AVATAR_DISPLAY_HOME_MINI,
  AVATAR_DISPLAY_PROFILE,
  AVATAR_DISPLAY_RANKING,
} from "@/lib/avatars/display-classes";

export type AvatarDisplaySize = "profile" | "ranking" | "mini";

const SIZE_CLASS: Record<AvatarDisplaySize, string> = {
  profile: AVATAR_DISPLAY_PROFILE,
  ranking: AVATAR_DISPLAY_RANKING,
  mini: AVATAR_DISPLAY_HOME_MINI,
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
  return (
    <ProfileAvatar
      avatarUrl={avatarUrl}
      label={label}
      variant="profile"
      className={SIZE_CLASS[size]}
    />
  );
}
