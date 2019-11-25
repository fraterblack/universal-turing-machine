import { ReservedChar, UtmIteration } from './common';
import { Handler } from './handler';

export class Interpreter {
    private handler: Handler;

    constructor() {
        this.handler = new Handler();
    }
    
    public execute(settings: string, initialSetting: string, initialSymbol: string, stopSymbol: string) {
        // Tape
        const tape = initialSetting.split('');
        let tapePosition = tape.findIndex(x => x === initialSymbol);
        
        // Setting
        const settingLines = this.handler.getSettingLines(settings);
        let currentState = this.handler.getSettingItems(settingLines[0])[0];
        let currentSymbol = '';


        const states: string[] = [];

        settingLines.forEach((x) => {
            const settingItems = this.handler.getSettingItems(x);
            states.push(settingItems[0]);
        });
        const totalUniqueStates = states.filter((value, index, self) => self.indexOf(value) === index).length;

        let iteration = new UtmIteration();
        let iCounter = 0;
        return {
            hasNext: function () {
                // Check for stop symbol
                return iteration.direction !== stopSymbol;
            },
            next: function() {
                // Function that write tape
                const writeTape = (tape: string[], position: number, symbol: string, stopSymbol: string): void => {
                    if (symbol !== stopSymbol) {
                        tape[position] = (symbol === ReservedChar.WHITE_SPACE) ? ' ' : symbol;
                    }
                };

                // Increment iteration controller
                iCounter++;

                // Instanciate Handler
                this.handler = new Handler();

                // Update current symbol controller
                currentSymbol = tape[tapePosition];

                // Try to find a state that satisfies condition
                const activeState = settingLines.find(x => {
                    const items = this.handler.getSettingItems(x);

                    if (items[0] === currentState) {
                        if (items[1] === currentSymbol 
                            || (items[1] === ReservedChar.WHITE_SPACE && (currentSymbol === ' ' || currentSymbol === undefined))
                        ) {
                            return true;
                        }
                    }

                    return false;
                });

                if (!activeState) {
                    throw `Não foi existe uma configuração para o símbolo "${currentSymbol}" quando no estado "${currentState}"`;
                }

                const activeStateItems = this.handler.getSettingItems(activeState);
                
                // Write symbol in the tape
                writeTape(tape, tapePosition, activeStateItems[2], stopSymbol);

                // Updae object that is return on each iteration
                iteration.totalIterations = iCounter;
                iteration.totalStates = totalUniqueStates;
                iteration.currentState = activeStateItems[0];
                iteration.read = activeStateItems[1];
                iteration.write = activeStateItems[2];
                iteration.direction = activeStateItems[3];
                iteration.nextState = activeStateItems[4];
                iteration.tape = tape;
                iteration.tapePosition = tapePosition;

                // Update controllers
                tapePosition = activeStateItems[3] === ReservedChar.RIGHT_DIRECTION 
                    ? tapePosition + 1 
                    : (activeStateItems[3] === ReservedChar.LEFT_DIRECTION ? tapePosition - 1 : tapePosition);

                if (tapePosition < 0) {
                    for (let i = tape.length; i > 0; i--) {
                        tape[i] = tape[i - 1];
                    }

                    tape[0] = ' ';
                    tapePosition = 0;
                }

                currentState = activeStateItems[4];

                return iteration;
            }
        };
    }
}