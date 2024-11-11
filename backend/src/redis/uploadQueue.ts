import { Queue } from "bullmq";
import { redisConfig } from "../configs/redisConfig";
import worker from "./uploadWorker"; //import to run when file is loaded
export const uploadQueue = new Queue('uploadQueue', {
    connection: redisConfig
});