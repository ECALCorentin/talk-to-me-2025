import TalkMachine from "../talk-to-me-core/js/TalkMachine.js";

export default class DialogMachine extends TalkMachine {
  constructor() {
    super();
    this.initDialogMachine();
  }

  initDialogMachine() {
    this.dialogStarted = false;
    this.lastState = "";
    this.nextState = "";
    this.waitingForUserInput = true;
    this.buttonPressCounter = 0;
    this.preset_voice_1 = [0, 1, 0.8];
    this.stateDisplay = document.querySelector("#state-display");
    this.shouldContinue = false;
    this.pressedButtons = new Set();
    this.pressedArray = [...this.pressedButtons].sort();
    this.playerOneJokerLeft = 1;
    this.playerTwoJokerLeft = 1;
    this.playerOneName = "Joueur 1";
    this.playerTwoName = "Joueur 2";
    this.randomNumVerification = "";
    this.randomNumTrahison = "";

    /*this.questionsAnswersArray = [
      "est le plus beau ?",
      "est le plus proche de l'ECAL ?",
      "est s'habille le mieux ?",
      "a les plus beaux yeux ?",
      "est le meilleur en 3D ?",
      "a fait la meilleure note en Dynamic Display ?",
    ];*/

    this.questionsAnswersArray = [
      {
        index: "0",
        question: "est le plus beau ?",
        answerIsMoi: "se trouve plus beau que toi",
        answerIsAutre: "trouve que tu es plus beau que lui",
      },
      {
        index: "1",
        question: "est le plus proche de l'ECAL ?",
        answerIsMoi: "positif",
        answerIsAutre: "négatif",
      },
      {
        index: "2",
        question: "s'habille le mieux ?",
        answerIsMoi: "positif",
        answerIsAutre: "négatif",
      },
      {
        index: "3",
        question: "a les plus beaux yeux ?",
        answerIsMoi: "positif",
        answerIsAutre: "négatif",
      },
      {
        index: "4",
        question: "est le meilleur en 3D ?",
        answerIsMoi: "positif",
        answerIsAutre: "négatif",
      },
      {
        index: "5",
        question: "a fait la meilleure note en Dynamic Display ?",
        answerIsMoi: "positif",
        answerIsAutre: "négatif",
      },
    ];

    this.selectedQuestion = "";
    this.selectedIndex = "";
    this.selectedAnswerIsMoi = "";
    this.selectedAnswerIsAutre = "";

    // initialize dialog machine elements
    this.maxLeds = 10;
    this.ui.initLEDUI();
  }

  /* DIALOG CONTROL */
  startDialog() {
    this.dialogStarted = true;
    this.waitingForUserInput = true;
    this.nextState = "initialisation";
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

  /**
   * Allume les LEDs une par une avec un délai entre chaque
   * @param {Array} leds - Tableau des LEDs à allumer, sous la forme [{index, color, effect}]
   * @param {number} delay - Délai en millisecondes entre chaque LED
   */
  async lightUpLedsSequentially(leds, delay = 500) {
    for (const led of leds) {
      this.ledChangeColor(led.index, led.color, led.effect || 0); // Allume la LED
      await this.sleep(delay); // Attend le délai spécifié
    }
  }

  /**
   * Fonction utilitaire pour créer un délai
   * @param {number} ms - Temps d'attente en millisecondes
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* DIALOG FLOW */
  /**
   * Main dialog flow function
   * @param {string} eventType - Type of event ('default', 'pressed', 'released', 'longpress')
   * @param {number} button - Button number (0-9)
   * @private
   */
  dialogFlow(eventType = "default", button = -1) {
    if (!this.performPreliminaryTests()) {
      // first tests before continuing to rules
      return;
    }
    this.stateUpdate();

    /*====================================================================*/
    /*================= DIALOG FLOW ======================================*/
    /*====================================================================*/

    switch (this.nextState) {
      case "welcome":
        this.fancyLogger.logMessage("initialisation done");
        this.nextState = "initialisation";
        this.goToNextState();
        break;

      case "initialisation":
        this.ledsAllChangeColor("white", 2);
        if (button == 0 || button == 1 || button == 5 || button == 6) {
          this.nextState = "initgame";
          this.goToNextState(100);
          this.fancyLogger.logMessage("Game start");
        }
        break;

      case "initgame":
        /*Une couleur de LED par cube*/
        this.ledsAllOff();
        this.pressedButtons.clear();
        this.fancyLogger.clearConsole();
        this.nextState = "select";
        this.goToNextState();

        break;

      case "select":
        this.ledsAllChangeColor("black", 2);
        this.fancyLogger.logMessage(
          this.playerOneName + " joker restant : " + this.playerOneJokerLeft
        );

        this.fancyLogger.logMessage(
          this.playerTwoName + " joker restant : " + this.playerTwoJokerLeft
        );
        this.ledsAllOff;
        this.selectedIndex =
          this.questionsAnswersArray[
            Math.floor(Math.random() * this.questionsAnswersArray.length)
          ].index;

        this.fancyLogger.logMessage("Index: " + this.selectedIndex);

        this.selectedQuestion =
          this.questionsAnswersArray[this.selectedIndex].question;

        this.speechText("Qui de vous 2 " + this.selectedQuestion, [19, 1, 0.9]);

        this.nextState = "game";
        this.goToNextState();

        break;

      case "game":
        if (button == 6 || button == 5) {
          this.pressedButtons.add(button);
          this.fancyLogger.logMessage(
            this.playerTwoName + " a répondu : bouton " + button
          );
          this.lightUpLedsSequentially(
            [
              { index: 9, color: "pink", effect: 0 },
              { index: 8, color: "pink", effect: 0 },
              { index: 7, color: "pink", effect: 0 },
              { index: 6, color: "pink", effect: 0 },
              { index: 5, color: "pink", effect: 0 },
            ],
            130
          );
        }

        if (button == 1 || button == 0) {
          this.pressedButtons.add(button);
          this.fancyLogger.logMessage(
            this.playerOneName + " a répondu : Bouton " + button
          );
          this.lightUpLedsSequentially(
            [
              { index: 0, color: "pink", effect: 0 },
              { index: 1, color: "pink", effect: 0 },
              { index: 2, color: "pink", effect: 0 },
              { index: 3, color: "pink", effect: 0 },
              { index: 4, color: "pink", effect: 0 },
            ],
            130
          );
        }

        if (button == 2) {
          this.nextState = "jokerP1";
          this.goToNextState();
        } else if (button == 7) {
          this.nextState = "jokerP2";
          this.goToNextState();
        }

        setTimeout(() => {
          if (this.pressedButtons.size == 2) {
            this.fancyLogger.logMessage(
              "Buttons pressed: " + [...this.pressedButtons]
            );
            this.nextState = "verification";
            this.goToNextState();
          }
        }, 1000);

        break;

      case "jokerP1":
        this.ledsAllChangeColor("magenta", 3);
        this.playerOneJokerLeft = 0;
        this.fancyLogger.logMessage(
          this.playerOneName + " n'as pas eu les couilles de répondre"
        );
        this.speechText(
          this.playerOneName + " n'as pas eu les couilles de répondre"
        );
        this.nextState = "initgame";
        this.goToNextState(3000);
        break;

      case "jokerP2":
        this.ledsAllChangeColor("magenta", 3);
        this.playerOneJokerLeft = 0;
        this.fancyLogger.logMessage(
          this.playerTwoName + " n'as pas eu les couilles de répondre"
        );
        this.speechText(
          this.playerTwoName + " n'as pas eu les couilles de répondre"
        );
        this.nextState = "initgame";
        this.goToNextState(3000);
        break;

      case "verification":
        this.ledsAllChangeColor("white", 2);
        this.pressedArray = [...this.pressedButtons].sort();

        setTimeout(() => {
          if (
            this.pressedArray.toString() === "0,6" ||
            this.pressedArray.toString() === "6,0" ||
            this.pressedArray.toString() === "1,5" ||
            this.pressedArray.toString() === "5,1"
          ) {
            this.fancyLogger.logMessage("Combinaison valide");
            this.nextState = "initgame";
            this.goToNextState(3000);
          } else {
            this.fancyLogger.logMessage("Combinaison invalide");
            this.randomNumVerification = Math.floor(Math.random() * 2) + 1;

            if (this.randomNumVerification == 1) {
              this.nextState = "trahison";
              this.goToNextState();
              this.fancyLogger.logMessage("l'HEURE DE LA TRAHISON");
            } else {
              this.fancyLogger.logMessage("Vous l'avez échappé belle");
              this.nextState = "initgame";
              this.goToNextState(3000);
            }
          }
        }, 2500);

        this.fancyLogger.logMessage("Buttons cleared");

        break;

      case "trahison":
        this.ledsAllChangeColor("red", 3);
        if (
          this.pressedArray.toString() === "6,1" ||
          this.pressedArray.toString() === "1,6"
        ) {
          this.randomNumTrahison = Math.floor(Math.random() * 2) + 1;

          if (this.randomNumTrahison == 1) {
            // réponse "positive"
            this.selectedAnswerIsMoi =
              this.questionsAnswersArray[this.selectedIndex].answerIsMoi;

            this.fancyLogger.logMessage(this.selectedAnswerIsMoi);
            this.speechText(this.selectedAnswerIsMoi);
          } else {
            // réponse "positive"
            this.selectedAnswerIsMoi =
              this.questionsAnswersArray[this.selectedIndex].answerIsMoi;

            this.fancyLogger.logMessage(this.selectedAnswerIsMoi);
            this.speechText(this.selectedAnswerIsMoi);
          }
        }

        if (
          this.pressedArray.toString() === "5,0" ||
          this.pressedArray.toString() === "0,5"
        ) {
          this.randomNumTrahison = Math.floor(Math.random() * 2) + 1;

          if (this.randomNumTrahison == 1) {
            this.selectedAnswerIsAutre =
              this.questionsAnswersArray[this.selectedIndex].answerIsAutre;

            this.fancyLogger.logMessage(this.selectedAnswerIsAutre);
            this.speechText(this.selectedAnswerIsAutre);
          }
        }

        this.nextState = "initgame";
        this.goToNextState(5000);

        break;
    }
  }

  /*====================================================================*/
  /*====================================================================*/
  /*====================================================================*/

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
      this.fancyLogger.logWarning("not started yet, press Start Machine");
      return false;
    }
    if (this.waitingForUserInput === false) {
      this._handleUserInputError();
      return false;
    }
    // check if no speak is active
    if (this.speechIsSpeaking === true) {
      this.fancyLogger.logWarning(
        "im speaking, please wait until i am finished"
      );
      return false;
    }
    if (this.nextState == "") {
      this.fancyLogger.logWarning("nextState is empty");
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
      this.dialogFlow("released", button);
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
    this.fancyLogger.logSpeech("speech ended");
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
    this.fancyLogger.logWarning("user input is not allowed at this time");
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
        this.ledsAllChangeColor("yellow");
        break;
      case 2:
        this.ledsAllChangeColor("green", 1);
        break;
      case 3:
        this.ledsAllChangeColor("black", 2);
        break;
      case 4:
        this.ledChangeRGB(0, 255, 100, 100);
        this.ledChangeRGB(1, 0, 100, 170);
        this.ledChangeRGB(2, 0, 0, 170);
        this.ledChangeRGB(3, 150, 170, 70);
        this.ledChangeRGB(4, 200, 160, 0);
        break;

      default:
        this.fancyLogger.logWarning("no action defined for button " + button);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const dialogMachine = new DialogMachine();
});
