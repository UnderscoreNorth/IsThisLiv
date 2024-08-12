export type MainRes = {
    teams: string[];
    cupID: number;
    cupName: string;
    dates: string;
    matches: Record<
        "groups" | "kos",
        {
            name: string;
            matches: [
            {
                date: string;
                time: string;
                stadium: string;
                attendance: number;
                home: string;
                away: string;
                winner: string;
                homeg: number;
                awayg: number;
                id: number;
                official: number;
                roundOrder: number;
            }
            ];
            table: any;
        }[]
    >;
    goals: number;
    numMatches: number;
    gpm: number;
    scorers: any[];
    assisters: any[];
    owngoalers: any[];
    goalies: any[];
    cards: any[];
    date:Date;
    cupType:number;
}