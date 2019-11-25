import './styles/app.scss';
import 'bootstrap';

import { ReservedChar } from './common';
import { Handler } from './handler';
import { Interpreter } from './interpreter';
import { Validator } from './validator';

export class Utm {
    id: number;
    name: string;

    private interpreter: Interpreter;
    private handler: Handler;
    private validator: Validator;
    
    private settingsEditor = document.getElementById('settingsEditor');
    private initialSymbolEditor = document.getElementById('initialSymbol');
    private stopSymbolEditor = document.getElementById('stopSymbol');
    private initialStateEditor = document.getElementById('initialState');
    private delayEditor = document.getElementById('delay');
    private btnImport = document.getElementById('btnImport');
    private btnStart = document.getElementById('btnStart');
    private btnPause = document.getElementById('btnPause');
    private tape = document.getElementById('tape');

    private initialSymbol = '>';
    private stopSymbol = '!';
    private settings: string;
    private initialState: string;
    private delay = 200;

    constructor() {
        this.handler = new Handler();
        this.validator = new Validator();
        this.interpreter = new Interpreter();
        
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
        this.btnStart.addEventListener('click', this.onBtnStartClick.bind(this));
        this.btnPause.addEventListener('click', this.onBtnPauseClick.bind(this));

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
            this.validator.validateSettings(event.currentTarget['value'], this.initialSymbol, this.stopSymbol);

            this.settings = this.settingsEditor['value'] = this.handler.sanitizeSettings(event.currentTarget['value']);
        } catch(err) {
            this.settings = event.currentTarget['value'];

            this.bubbleError(err);
        }
    }

    private onInitialSymbolChange(event: Event): void {
        try {
            // Validate if initial symbol is valid
            this.validator.validateInitialSymbol(event.currentTarget['value'], this.settings, this.initialSymbol);

            const newSettings = this.handler.changeSymbol(this.settings, this.initialSymbol, event.currentTarget['value']);

            this.settingsEditor['value'] = this.settings = newSettings;
            
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
            this.validator.validateStopSymbol(event.currentTarget['value'], this.settings, this.stopSymbol);

            const newSettings = this.handler.changeSymbol(this.settings, this.stopSymbol, event.currentTarget['value']);

            this.settingsEditor['value'] = this.settings = newSettings;
            
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
            this.validator.validateSettings(content, this.initialSymbol, this.stopSymbol);

            this.settings = this.settingsEditor['value'] = this.handler.sanitizeSettings(content);
        } catch(err) {
            this.settings = this.settingsEditor['value'] = content;

            this.bubbleError(err);
        }
    }

    private onBtnStartClick(event: Event): void {
        try {
            // Validate if state is valid
            this.validator.validateSettings(this.settings, this.initialSymbol, this.stopSymbol);
        } catch(err) {
            this.bubbleError(err);
        }
    }

    private onBtnPauseClick(event: Event): void {
        
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