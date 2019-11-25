import './styles/app.scss';
import 'bootstrap';

export enum ReservedChar {
    WHITE_SPACE = '_',
    RIGHT_DIRECTION = 'D',
    LEFT_DIRECTION = 'E'
}

export class Utm {
    id: number;
    name: string;
    
    private settingsEditor = document.getElementById('settingsEditor');
    private initialSymbolEditor = document.getElementById('initialSymbol');
    private stopSymbolEditor = document.getElementById('stopSymbol');
    private initialStateEditor = document.getElementById('initialState');
    private delayEditor = document.getElementById('delay');
    private btnImport = document.getElementById('btnImport');
    private tape = document.getElementById('tape');

    private initialSymbol = '>';
    private stopSymbol = '!';
    private settings: string;
    private initialState: string;
    private delay = 200;

    constructor() {
        // Set default values
        this.settingsEditor.textContent = this.settings = `q0, ${this.initialSymbol}`;
        this.initialSymbolEditor.setAttribute('value', this.initialSymbol);
        this.stopSymbolEditor.setAttribute('value', this.stopSymbol);
        this.initialState = this.initialSymbol;
        this.initialStateEditor.setAttribute('value', this.initialSymbol);
        this.delayEditor.setAttribute('placeholder', `${this.delay} ms`);

        // Set event listeners
        this.settingsEditor.addEventListener('change', this.onSettingsChange.bind(this));
        this.initialSymbolEditor.addEventListener('change', this.onInitialSymbolChange.bind(this));
        this.stopSymbolEditor.addEventListener('change', this.onStopSymbolChange.bind(this));
        this.initialStateEditor.addEventListener('change', this.onInitialStateChange.bind(this));
        this.delayEditor.addEventListener('change', this.onDelayChange.bind(this));
        this.btnImport.addEventListener('click', this.onBtnImportClick.bind(this));

        // Help Text
        document.getElementById('settingsEditorHelpText').innerHTML = `Caracteres reservados:<br>
        Espaço em Branco: ${ReservedChar.WHITE_SPACE}<br>               
        Mover Direita: ${ReservedChar.LEFT_DIRECTION}<br>          
        Mover Esquerda: ${ReservedChar.RIGHT_DIRECTION}`;
        
        this.populateTape(this.initialState);
    }

    private onSettingsChange(event: Event): void {
        try {
            // Validate if state is valid
            this.validateSettings(event.currentTarget['value']);

            this.settings = this.settingsEditor['value'] = this.sanitizeSettings(event.currentTarget['value']);
        } catch(err) {
            this.settings = event.currentTarget['value'];

            this.bubbleError(err);
        }
    }

    private onInitialSymbolChange(event: Event): void {
        try {
            // Validate if initial symbol is valid
            this.validateInitialSymbol(event.currentTarget['value']);

            this.changeSymbol(this.initialSymbol, event.currentTarget['value']);
            
            this.initialSymbol = event.currentTarget['value'];
        } catch(err) {
            // Rollback value
            this.initialSymbolEditor['value'] = this.initialSymbol;

            this.bubbleError(err);
        }
    }

    private onStopSymbolChange(event: Event): void {
        try {
            // Validate if stop symbol is valid
            this.validateStopSymbol(event.currentTarget['value']);

            this.changeSymbol(this.stopSymbol, event.currentTarget['value']);

            this.stopSymbol = event.currentTarget['value'];
        } catch(err) {
            // Rollback value
            this.stopSymbolEditor['value'] = this.stopSymbol;

            this.bubbleError(err);
        }
    }

    private onInitialStateChange(event: Event): void {
        this.populateTape(event.currentTarget['value'] || '');
    }

    private onDelayChange(event: Event): void {
        this.delay = event.currentTarget['value'] || 200;
    }

    private onBtnImportClick(event: Event): void {
        this.openFile(this.setFileContent.bind(this));
    }

    private setFileContent(content: any) {
        try {
            // Validate if state is valid
            this.validateSettings(content);

            this.settings = this.settingsEditor['value'] = this.sanitizeSettings(content);
        } catch(err) {
            this.settings = this.settingsEditor['value'] = content;

            this.bubbleError(err);
        }
    }

    private populateTape(initialState: string) {
        const symbols = initialState.split('');

        this.tape.innerHTML = '';

        symbols.forEach(x => {
            const li = document.createElement("li");
            li.appendChild(document.createTextNode(x));
            this.tape.appendChild(li);
        });
    }

    private sanitizeSettings(settings: string): string {
        const settingLines = this.getSettingLines(settings);

        return settingLines
            .filter(x => {
                const settingItems = this.getSettingItems(x);

                // Remove empty lines
                if (settingItems.length === 0 || settingItems[0] === '') {
                    return false;
                }

                return true;
            })
            .map((x, i) => {
                return this.getSettingItems(x).map(y => {
                    if (y === '' || y === undefined) {
                        y = ReservedChar.WHITE_SPACE;
                    }

                    return y;
                }).join(', ');
            })
            .join('\n')
    }

    private validateSettings(settings: string): boolean {
        const settingLines = this.getSettingLines(settings);

        settingLines.forEach((x, i) => {
            const settingItems = this.getSettingItems(x);
            let expectedSymbolElements = 5;

            // Not consider empty lines
            if (settingItems.length === 0 || settingItems[0] === '') {
                return;
            }
            
            // Line that recognize stop symbol
            if (i !== 0 && settingItems[1] === this.stopSymbol) {
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
            if (settingItems[1] !== this.stopSymbol && settingItems[3] !== ReservedChar.LEFT_DIRECTION && settingItems[3] !== ReservedChar.RIGHT_DIRECTION) {
                throw `A linha ${i+1} não possui um símbolo de mudança de direção válido. É esperado E ou D` 
            }

            // Validate initial symbol
            if (i === 0 && settingItems[1] !== this.initialSymbol) {
                throw `Você precisa obrigatoriamente reconher o símbolo inicial na primeira linha. É esperado: ${settingItems[0]}, ${this.initialSymbol}, ${settingItems[2]}, ${settingItems[3]}, ${settingItems[4]}`
            }
        });

        return true;
    }

    private validateStopSymbol(symbol: string): boolean {
        if (symbol === '' || symbol === null || symbol === undefined) {
            throw 'Símbolo inicial não pode ser vazio'
        }
        
        if (this.isReservedChar(symbol)) {
            throw `"${symbol}" é um caracter reservado`
        }
        
        if (this.stopSymbol === symbol) {
            return true;
        }

        const settingLines = this.getSettingLines(this.settings);

        const isUnused = !settingLines.some(x => {
            const settingItems = this.getSettingItems(x);
    
            return settingItems.some(y => y === symbol);
        });

        if (!isUnused) {
            throw 'Símbolo final já está sendo usado em outro lugar na tabela de estados'
        }

        return true;
    }

    private validateInitialSymbol(symbol: string): boolean {
        if (symbol === '' || symbol === null || symbol === undefined) {
            throw 'Símbolo inicial não pode ser vazio'
        }

        if (this.isReservedChar(symbol)) {
            throw `"${symbol}" é um caracter reservado`
        }

        if (this.initialSymbol === symbol) {
            return true;
        }

        const settingLines = this.getSettingLines(this.settings);

        const isUnused = !settingLines.some(x => {
            const settingItems = this.getSettingItems(x);
    
            return settingItems.some(y => y === symbol);
        });

        if (!isUnused) {
            throw 'Símbolo inicial já está sendo usado em outro lugar na tabela de estados'
        }

        return true;
    }

    private changeSymbol(targetSymbol: string, symbol: string): void {
        const lines = this.getSettingLines(this.settings);

        const mappedLines = lines.map(x => {
            const settingItems = this.getSettingItems(x);

           return settingItems.map((y, i) => {
                // Skip position 0, equivalent to state identifier
                if (i !== 0) {
                    y = y.replace(targetSymbol, symbol);
                }
                
                return y;
            }).join(', ');
        });

        this.settingsEditor['value'] = this.settings = mappedLines.join('\n');
    }

    private getSettingLines(settings: string): string[] {
        return settings.split('\n');
    }

    private getSettingItems(lineSettings: string): string[] {
        const items = [];

        const re = /\s*,\s*/;
        lineSettings.split(re).forEach(y => items.push(y ? y.trim() : ''));

        return items;
    }

    private isReservedChar(char: string): boolean {
        switch(char) {
            case ReservedChar.WHITE_SPACE:
            case ReservedChar.LEFT_DIRECTION:
            case ReservedChar.RIGHT_DIRECTION:
                return true;

            default:
                return false;
        }
    }

    private bubbleError(message: string) {
        setTimeout(() => {
            alert(message);
        }, 150);
    }

    private openFile(func: any) {
        const readFile = (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                fileInput['func'](contents)
                document.body.removeChild(fileInput)
            }
            reader.readAsText(file)
        };

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.onchange = readFile;
        fileInput['func'] = func;
        fileInput.accept = '.txt';
        document.body.appendChild(fileInput);

        this.clickElem(fileInput);
    }

    private clickElem(elem: any) {
        const eventMouse = document.createEvent('MouseEvents');
        eventMouse.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        elem.dispatchEvent(eventMouse);
    }
}

let utm = new Utm();