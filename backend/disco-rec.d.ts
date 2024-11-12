declare module 'disco-rec' {
    export class Recommender {
        train(data: { userId: string, itemId: string, rating: number }[]): void;
        recommend(userId: string, count: number): { itemId: string, score: number }[];
    }
}