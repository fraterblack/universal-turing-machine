export enum ReservedChar {
    WHITE_SPACE = '_',
    RIGHT_DIRECTION = 'D',
    LEFT_DIRECTION = 'E'
}

export class UtmIteration {
    totalStates: number;
    totalIterations: number;

    currentState: string;
    read: string;
    write: string;
    direction: string;
    nextState: string;
    tape: string[];
    tapePosition: number;
}
