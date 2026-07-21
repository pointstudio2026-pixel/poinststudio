import { PrismaTeamRepository } from "@/modules/teams/infrastructure/PrismaTeamRepository";
import { RegisterTeamUseCase } from "@/modules/teams/application/RegisterTeamUseCase";
import { JoinTeamUseCase } from "@/modules/teams/application/JoinTeamUseCase";
import { GetMyTeamsUseCase } from "@/modules/teams/application/GetMyTeamsUseCase";
import { subscriptionRepository } from "@/modules/subscriptions/container";

const teamRepository = new PrismaTeamRepository();

export const teamsContainer = {
  registerTeamUseCase: new RegisterTeamUseCase(teamRepository, subscriptionRepository),
  joinTeamUseCase: new JoinTeamUseCase(teamRepository),
  getMyTeamsUseCase: new GetMyTeamsUseCase(teamRepository),
};
