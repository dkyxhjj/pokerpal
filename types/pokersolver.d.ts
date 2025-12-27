declare module 'pokersolver' {
  export class Hand {
    constructor(cards: string[], name?: string, game?: string, canDiscard?: boolean);
    
    static solve(cards: string[], game?: string): Hand;
    static winners(hands: Hand[]): Hand[];
    
    name: string;
    descr: string;
    cards: any[];
    rank: number;
  }

  export class Game {
    constructor(name: string);
    
    name: string;
    descr: string;
  }
}
