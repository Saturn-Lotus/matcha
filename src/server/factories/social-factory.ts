import { PostgresDB } from "../db/postgres";
import { SocialRepository } from "../repositories";
import { SocialService } from "../services/social";


export const getSocialRepo = (): SocialRepository => {
  return new SocialRepository(new PostgresDB());
}

export const getSocialService = (): SocialService => {
  return new SocialService(getSocialRepo());
};