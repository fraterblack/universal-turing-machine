import { ReservedChar } from './common';
import { Handler } from './handler';

export class Validator {
    private handler: Handler;
    
    constructor() {
        this.handler = new Handler();
    }

    public validateSettings(settings: string, initialSymbol: string, stopSymbol: string): boolean {
        const settingLines = this.handler.getSettingLines(settings);

        settingLines.forEach((x, i) => {
            const settingItems = this.handler.getSettingItems(x);
            let expectedSymbolElements = 5;

            // Not consider empty lines
            if (settingItems.length === 0 || settingItems[0] === '') {
                return;
            }
            
            // Line that recognize stop symbol
            if (i !== 0 && settingItems[1] === stopSymbol) {
                expectedSymbolElements = 2;
            }

            // Validate total of symbols
            if (settingItems.length < expectedSymbolElements) {
                throw `A linha ${i+1} possui menos símbolos que o esperado (${expectedSymbolElements})`
            }

            if (settingItems.length > expectedSymbolElements) {
                throw `A linha ${i+1} possui mais símbolos que o esperado (${expectedSymbolElements})`
            }

            // Validate if the direction symbol is valid
            if (settingItems[1] !== stopSymbol && settingItems[3] !== ReservedChar.LEFT_DIRECTION && settingItems[3] !== ReservedChar.RIGHT_DIRECTION) {
                throw `A linha ${i+1} não possui um símbolo de mudança de direção válido. É esperado E ou D` 
            }

            // Validate initial symbol
            if (i === 0 && settingItems[1] !== initialSymbol) {
                throw `Você precisa obrigatoriamente reconher o símbolo inicial na primeira linha. É esperado: ${settingItems[0]}, ${initialSymbol}, ${settingItems[2]}, ${settingItems[3]}, ${settingItems[4]}`
            }
        });

        return true;
    }

    public validateInitialSymbol(symbol: string, settings: string, initialSymbol: string): boolean {
        if (symbol === '' || symbol === null || symbol === undefined) {
            throw 'Símbolo inicial não pode ser vazio'
        }

        if (this.isReservedChar(symbol)) {
            throw `"${symbol}" é um caracter reservado`
        }

        if (initialSymbol === symbol) {
            return true;
        }

        const settingLines = this.handler.getSettingLines(settings);

        const isUnused = !settingLines.some(x => {
            const settingItems = this.handler.getSettingItems(x);
    
            return settingItems.some(y => y === symbol);
        });

        if (!isUnused) {
            throw 'Símbolo inicial já está sendo usado em outro lugar na tabela de estados'
        }

        return true;
    }

    public validateStopSymbol(symbol: string, settings: string, stopSymbol: string): boolean {
        if (symbol === '' || symbol === null || symbol === undefined) {
            throw 'Símbolo inicial não pode ser vazio'
        }
        
        if (this.isReservedChar(symbol)) {
            throw `"${symbol}" é um caracter reservado`
        }
        
        if (stopSymbol === symbol) {
            return true;
        }

        const settingLines = this.handler.getSettingLines(settings);

        const isUnused = !settingLines.some(x => {
            const settingItems = this.handler.getSettingItems(x);
    
            return settingItems.some(y => y === symbol);
        });

        if (!isUnused) {
            throw 'Símbolo final já está sendo usado em outro lugar na tabela de estados'
        }

        return true;
    }

    public isReservedChar(char: string): boolean {
        switch(char) {
            case ReservedChar.WHITE_SPACE:
            case ReservedChar.LEFT_DIRECTION:
            case ReservedChar.RIGHT_DIRECTION:
                return true;

            default:
                return false;
        }
    }
}