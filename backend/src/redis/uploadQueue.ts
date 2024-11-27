import { Queue } from "bullmq";
import { redisConfig } from "../configs/redisConfig.js";

export const uploadQueue = new Queue('uploadQueue', {
    connection: redisConfig
});