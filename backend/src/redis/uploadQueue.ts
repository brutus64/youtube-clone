import { Queue } from "bullmq";
import { redisConfig } from "../configs/redisConfig";

export const uploadQueue = new Queue('uploadQueue', {
    connection: redisConfig
});