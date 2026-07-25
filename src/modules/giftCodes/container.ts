import { PrismaGiftCodeRepository } from "@/modules/giftCodes/infrastructure/PrismaGiftCodeRepository";
import { GenerateGiftCodesUseCase } from "@/modules/giftCodes/application/GenerateGiftCodesUseCase";
import { ListGiftCodesUseCase } from "@/modules/giftCodes/application/ListGiftCodesUseCase";
import { RedeemGiftCodeUseCase } from "@/modules/giftCodes/application/RedeemGiftCodeUseCase";
import { subscriptionRepository } from "@/modules/subscriptions/container";

export const giftCodeRepositoryInstance = new PrismaGiftCodeRepository();

export const giftCodesContainer = {
  giftCodeRepository: giftCodeRepositoryInstance,
  generateGiftCodesUseCase: new GenerateGiftCodesUseCase(giftCodeRepositoryInstance),
  listGiftCodesUseCase: new ListGiftCodesUseCase(giftCodeRepositoryInstance),
  redeemGiftCodeUseCase: new RedeemGiftCodeUseCase(giftCodeRepositoryInstance, subscriptionRepository),
};
