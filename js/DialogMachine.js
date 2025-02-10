import TalkMachine from '../talk-to-me-core/js/TalkMachine.js';

export default class DialogMachine extends TalkMachine {
  constructor() {
    super();
    this.initDialogMachine();
  }

  initDialogMachine() {
    this.dialogStarted = false;
    this.lastState = '';
    this.nextState = '';
    this.waitingForUserInput = true;
    this.buttonPressCounter = 0;
    this.preset_voice_1 = [0, 1, 0.8];
    this.stateDisplay = document.querySelector('#state-display');
    this.shouldContinue = false;

    // initialize dialog machine elements
    this.maxLeds = 10;
    this.ui.initLEDUI();
  }

  /* DIALOG CONTROL */
  startDialog() {
    this.dialogStarted = true;
    this.waitingForUserInput = true;
    this.nextState = 'initialisation';
    this.buttonPressCounter = 0;
    // Voice presets [voice index, pitch, rate]
    this.preset_voice_1 = [1, 1, 0.8];
    // turn off all LEDs
    this.ledsAllOff();
    // clear console
    this.fancyLogger.clearConsole();
    // start the machine with first state
    this.dialogFlow();
  }

  /* DIALOG FLOW */
  /**
   * Main dialog flow function
   * @param {string} eventType - Type of event ('default', 'pressed', 'released', 'longpress')
   * @param {number} button - Button number (0-9)
   * @private
   */
  dialogFlow(eventType = 'default', button = -1) {
    if (!this.performPreliminaryTests()) {
      // first tests before continuing to rules
      return;
    }
    this.stateUpdate();

    /**
     * States and Rules
     * Edit the dialog here to add new dialog options
     * ****/

    switch (this.nextState) {
      case 'initialisation':
        this.ledsAllOff();
        this.nextState = 'welcome';
        this.fancyLogger.logMessage('initialisation done');
        this.goToNextState();
        break;

      case 'welcome':
        this.ledsAllChangeColor('white', 1);
        this.fancyLogger.logMessage(
          'Welcome, you have got 2 buttons, press one of them'
        );
        this.nextState = 'choose-color';
        break;

      case 'choose-color':
        // trigger on button release
        if (button == 0) {
          // blue
          this.nextState = 'choose-blue';
          this.goToNextState();
        }
        if (button == 1) {
          // yellow
          this.nextState = 'choose-yellow';
          this.goToNextState();
        }

        break;

      case 'choose-blue':
        this.fancyLogger.logMessage(
          'blue was a good choice, press any button to continue'
        );
        this.ledsAllChangeColor('green', 0);
        this.nextState = 'can-speak';
        break;

      case 'choose-yellow':
        this.fancyLogger.logMessage(
          'yellow was a bad choice, press blue button to continue'
        );
        this.ledsAllChangeColor('red', 0);
        this.nextState = 'choose-color';
        this.goToNextState();
        break;

      case 'can-speak':
        this.speak('I can speak, i can count. Press a button.');
        this.nextState = 'count-press';
        this.ledsAllChangeColor('blue', 2);
        break;

      case 'count-press':
        this.buttonPressCounter++;

        if (this.buttonPressCounter > 3) {
          this.nextState = 'toomuch';
          this.goToNextState();
        } else {
          this.speechText(
            'you pressed ' + this.buttonPressCounter + ' time',
            [0, 0.8, 1]
          );
        }
        break;

      case 'toomuch':
        this.speak('You are pressing too much! I Feel very pressed');
        this.nextState = 'enough-pressed';
        break;

      case 'enough-pressed':
        this.speak('Enough is enough! I dont want to be pressed anymore!');
        this.ledsAllChangeColor('red', 1);
        break;

      default:
        this.fancyLogger.logWarning(
          `Sorry but State: "${this.nextState}" has no case defined`
        );
    }
  }

  /**
   *  short hand function to speak a text with the preset voice
   *  @param {string} _text the text to speak
   */
  speak(_text) {
    // called to speak a text
    this.speechText(_text, this.preset_voice_1);
  }

  /**
   *  short hand function to force transition to the next state in the dialog flow
   *  @param {number} delay - the optional delay in milliseconds
   * @private
   */
  goToNextState(delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.dialogFlow();
      }, delay);
    } else {
      this.dialogFlow();
    }
  }

  /**
   * Perform preliminary tests before continuing with dialog flow
   * @returns {boolean} true if all tests pass, false otherwise
   * @private
   */
  performPreliminaryTests() {
    if (this.dialogStarted === false) {
      this.fancyLogger.logWarning('not started yet, press Start Machine');
      return false;
    }
    if (this.waitingForUserInput === false) {
      this._handleUserInputError();
      return false;
    }
    // check if no speak is active
    if (this.speechIsSpeaking === true) {
      this.fancyLogger.logWarning(
        'im speaking, please wait until i am finished'
      );
      return false;
    }
    if (this.nextState == '') {
      this.fancyLogger.logWarning('nextState is empty');
      return false;
    }

    return true;
  }

  stateUpdate() {
    this.lastState = this.nextState;
    // Update state display
    if (this.stateDisplay) {
      this.stateDisplay.textContent = this.nextState;
    }
  }

  /**
   * Override _handleButtonPressed from TalkMachine
   * @override
   * @protected
   */
  _handleButtonPressed(button, simulated = false) {
    if (this.waitingForUserInput) {
      // this.dialogFlow('pressed', button);
    }
  }

  /**
   * Override _handleButtonReleased from TalkMachine
   * @override
   * @protected
   */
  _handleButtonReleased(button, simulated = false) {
    if (this.waitingForUserInput) {
      this.dialogFlow('released', button);
    }
  }

  /**
   * Override _handleButtonLongPressed from TalkMachine
   * @override
   * @protected
   */
  _handleButtonLongPressed(button, simulated = false) {
    if (this.waitingForUserInput) {
      //this.dialogFlow('longpress', button);
    }
  }

  /**
   * Override _handleTextToSpeechEnded from TalkMachine
   * @override
   * @protected
   */
  _handleTextToSpeechEnded() {
    this.fancyLogger.logSpeech('speech ended');
    if (this.shouldContinue) {
      // go to next state after speech ended
      this.shouldContinue = false;
      this.goToNextState();
    }
  }

  /**
   * Handle user input error
   * @protected
   */
  _handleUserInputError() {
    this.fancyLogger.logWarning('user input is not allowed at this time');
  }

  /**
   * Handle tester button clicks
   * @param {number} button - Button number
   * @override
   * @protected
   */
  _handleTesterButtons(button) {
    switch (button) {
      case 1:
        this.ledsAllChangeColor('yellow');
        break;
      case 2:
        this.ledsAllChangeColor('green', 1);
        break;
      case 3:
        this.ledsAllChangeColor('pink', 2);
        break;
      case 4:
        this.ledChangeRGB(0, 255, 100, 100);
        this.ledChangeRGB(1, 0, 100, 170);
        this.ledChangeRGB(2, 0, 0, 170);
        this.ledChangeRGB(3, 150, 170, 70);
        this.ledChangeRGB(4, 200, 160, 0);
        break;

      default:
        this.fancyLogger.logWarning('no action defined for button ' + button);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const dialogMachine = new DialogMachine();
});
