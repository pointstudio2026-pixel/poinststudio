export interface Team {
  id: string;
  ownerId: string;
  code: string;
  createdAt: Date;
}

export interface TeamMembership {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}
