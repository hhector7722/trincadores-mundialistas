export type NotificationRow = {
  id: string;
  profile_id: string;
  pool_id: string | null;
  kind: string | null;
  match_id: string | null;
  quiz_id: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};
