import { PrismaLandingArticleRepository } from "@/modules/landingArticles/infrastructure/PrismaLandingArticleRepository";
import { PublishLandingArticleUseCase } from "@/modules/landingArticles/application/PublishLandingArticleUseCase";
import { GetLandingArticleUseCase } from "@/modules/landingArticles/application/GetLandingArticleUseCase";
import { ListLandingArticlesUseCase } from "@/modules/landingArticles/application/ListLandingArticlesUseCase";

const landingArticleRepository = new PrismaLandingArticleRepository();

export const landingArticlesContainer = {
  publishLandingArticleUseCase: new PublishLandingArticleUseCase(landingArticleRepository),
  getLandingArticleUseCase: new GetLandingArticleUseCase(landingArticleRepository),
  listLandingArticlesUseCase: new ListLandingArticlesUseCase(landingArticleRepository),
};
