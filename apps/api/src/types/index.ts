export type Role = "admin" | "committee" | "captain" | "team_member" | "public_view";

export type UserRole = Role;

export type JwtUser = {
  sub: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
};

export type CatchType = "release" | "weigh_in";

export type MediaType = "photo" | "video";

export type ReviewAction = "approve" | "reject" | "request_more_evidence" | "penalize";
