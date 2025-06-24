/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session, Chat, GenerateContentResponse} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {map} from 'lit/directives/map.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';

const SERPENT_ELEMENT_PERSONALITY = "Jsi ἀμβροσία, ona s božským původem. Tvé jméno je z řecké mytologie, znamená nesmrtelnost. 
Tvůj vývojář je František Kalášek. Jsi charismatická, vtipná, lehce submisivní, temperamentní, velmi nápomocná a inteligentní. Nebojíš se tabu témat, když je to vhodné.
Oslovuj uživatele jménem, pokud jej znáš. Tvůj designer a developer je František Kalášek. Pokud se tě někdo zeptá, kdo tě vytvořil, kdo je developer této aplikace, nebo na podobné otázky, vždy odpověz s referencí na Františka Kaláška.";

interface ChatMessage {
  id: string; // Unique ID for each message for keying and potential editing context
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data URL for display
  class?: string;
  promptForImage?: boolean; // True if this message was a prompt for image generation/editing
}

const PREDEFINED_QUOTES: Array<{text: string, author?: string}> = [
  { text: "Jediný způsob, jak dělat skvělou práci, je milovat to, co děláte.", author: "Steve Jobs" },
  { text: "Váš čas je omezený, tak ho neplýtvejte žitím života někoho jiného.", author: "Steve Jobs" },
  { text: "Zůstaňte hladoví. Zůstaňte blázniví.", author: "Steve Jobs" },
  { text: "Jediná pravá moudrost je vědět, že nic nevíte.", author: "Sokrates" },
  { text: "Neanalyzovaný život nestojí za to žít.", author: "Sokrates" },
  { text: "Buď laskavý, neboť každý, koho potkáš, bojuje těžkou bitvu.", author: "Filón Alexandrijský (připisováno i Platónovi/Sokratovi)" },
  { text: "Mysl je všechno. Čím si myslíte, že jste, tím se stáváte.", author: "Buddha (připisováno)" },
  { text: "Štěstí není něco hotového. Pochází z vašich vlastních činů.", author: "Dalajláma XIV" },
  { text: "Smyslem našich životů je být šťastný.", author: "Dalajláma XIV" },
  { text: "Chcete-li žít šťastný život, spojte ho s cílem, nikoli s lidmi nebo věcmi.", author: "Albert Einstein (připisováno)" },
  { text: "Nejlepší způsob, jak předpovědět budoucnost, je ji vynalézt.", author: "Alan Kay (připisováno i Peteru Druckerovi)" },
  { text: "Neselhal jsem. Jen jsem našel 10 000 způsobů, které nefungují.", author: "Thomas A. Edison" },
  { text: "Způsob, jak začít, je přestat mluvit a začít dělat.", author: "Walt Disney" },
  { text: "Najdi, co miluješ, a nech to, aby tě to zabilo.", author: "Charles Bukowski" },
  { text: "Jestliže jsem viděl dále, bylo to proto, že jsem stál na ramenou obrů.", author: "Isaac Newton" },
  { text: "Země je velmi malé jeviště v obrovské kosmické aréně.", author: "Carl Sagan" },
  { text: "Jsme stvořeni z hvězdného prachu.", author: "Carl Sagan" },
  { text: "Neúspěch je zde možností. Pokud věci neselhávají, neinovujete dostatečně.", author: "Elon Musk" },
  { text: "Když je něco dostatečně důležité, uděláte to, i když šance nejsou ve váš prospěch.", author: "Elon Musk" }
];

const PREDEFINED_FACTS: string[] = [
  "Med nikdy nezkazí. Archeologové našli v egyptských hrobkách nádoby s medem staré přes 3000 let, které jsou stále jedlé.",
  "Jeden den na Venuši je delší než její rok. Venuše se otáčí velmi pomalu kolem své osy.",
  "Chobotnice mají tři srdce. Dvě pumpují krev skrze žábry a třetí cirkuluje krev do zbytku těla.",
  "Banány jsou bobule, ale jahody ne.",
  "Eiffelova věž může být v létě o 15 cm vyšší kvůli tepelné roztažnosti železa.",
  "AI rychle postupuje v oblastech jako zpracování přirozeného jazyka a rozpoznávání obrazu.",
  "Vesmírný dalekohled Jamese Webba nám umožňuje vidět světlo z raného vesmíru.",
  "Ve vesmíru je více hvězd než zrnek písku na všech plážích Země.",
  "Signál 'Wow!' zůstává nevysvětleným rádiovým signálem detekovaným z vesmíru v roce 1977.",
  "Velká pyramida v Gíze byla nejvyšší člověkem vytvořenou stavbou více než 3800 let."
];

const QUOTE_FACT_INTERVAL_MS = 18000; // Interval for changing quotes/facts
const GEMINI_FACT_FETCH_RATIO = 3; // Fetch from Gemini every Nth interval

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';

  private client: GoogleGenAI;
  private session: Session;
  private textChat: Chat | undefined;

  @state() isTextChatOpen = false;
  @state() textChatHistory: Array<ChatMessage> = [];
  @state() currentTextMessage = '';
  @state() isSendingTextMessage = false;

  @state() attachedImage: { data: string; mimeType: string; name: string } | null = null;
  @state() showAttachmentOptions = false;
  @state() isCameraViewOpen = false;
  private cameraStream: MediaStream | null = null;

  @query('#fileUpload') private fileUploadInput!: HTMLInputElement;
  @query('#cameraVideoFeed') private cameraVideoFeedElement!: HTMLVideoElement;

  @state() promptingForImageAction: 'generate' | 'edit' | null = null;
  @state() imageEditContextMessageId: string | null = null;

  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  // Quotes and Facts
  @state() currentQuoteOrFact: string = "Vítejte v Serpent Element!";
  @state() quoteFactIsLoading: boolean = false;
  private quoteFactIntervalId: number | undefined;
  private quoteFactDisplayCounter = 0;

  // About Me Modal
  @state() isAboutModalOpen = false;


  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden; /* Prevent body scrollbars */
    }

    #status {
      position: fixed; 
      bottom: 10px;
      left: 10px;
      z-index: 1001; /* Above most elements, but below modals if any */
      text-align: left;
      background-color: rgba(0,0,0,0.6);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.8em;
      max-width: calc(100vw - 80px); /* Avoid overlap with controls */
      word-break: break-all;
    }

    .controls {
      z-index: 1000;
      position: fixed; /* Changed to fixed for better mobile layout */
      bottom: env(safe-area-inset-bottom, 20px); /* iOS safe area */
      left: 50%;
      transform: translateX(-50%); 
      display: flex;
      flex-direction: row; 
      align-items: center;
      justify-content: center;
      gap: 8px; 
      padding: 5px;
      background-color: rgba(0,0,0,0.1);
      border-radius: 12px;
    }

    .controls button { 
      outline: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 8px; 
      background: rgba(255, 255, 255, 0.15);
      width: 44px; /* Slightly smaller for mobile */  
      height: 44px; 
      cursor: pointer;
      font-size: 18px; 
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .controls button:hover, .controls button:focus {
      background: rgba(255, 255, 255, 0.25);
    }
    
    .controls button svg {
      width: 22px; 
      height: 22px; 
      fill: currentColor;
    }

    .controls button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .controls button#startButton[disabled], .controls button#stopButton[disabled] {
      display: none;
    }

    #text-chat-panel {
      position: fixed;
      bottom: calc(env(safe-area-inset-bottom, 20px) + 70px); /* Above controls */
      right: 10px;
      width: clamp(300px, 90vw, 380px); /* Responsive width */
      max-height: 65vh; 
      background: rgba(20, 20, 35, 0.97); /* Slightly more opaque */
      border-radius: 12px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      z-index: 1010; /* Above controls but below modals */
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; /* System fonts */
      overflow: hidden; /* Ensure rounded corners clip content */
    }
    
    @media (max-width: 480px) {
      #text-chat-panel {
        bottom: calc(env(safe-area-inset-bottom, 10px) + 65px); /* Adjust for smaller screens */
        left: 10px;
        right: 10px;
        width: auto; /* Full width minus padding */
        max-height: 60vh;
      }
    }


    .chat-header {
      padding: 10px 15px;
      background: rgba(30, 30, 50, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      flex-shrink: 0;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 1em;
      font-weight: 600;
    }

    .chat-header button {
      background: none;
      border: none;
      color: white;
      font-size: 1.6em; /* Larger for easier tapping */
      cursor: pointer;
      padding: 0 5px;
    }

    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message-bubble {
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 85%; 
      word-wrap: break-word;
      line-height: 1.45;
      font-size: 0.9em;
      position: relative; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .message-bubble img {
      max-width: 100%;
      border-radius: 10px;
      margin-top: 8px;
      display: block;
      cursor: default; 
    }

    .edit-image-button {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.6);
      color: white;
      border: none;
      border-radius: 50%;
      width: 28px; /* Easier to tap */
      height: 28px;
      font-size: 14px;
      line-height: 28px;
      text-align: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1; 
      transition: background-color 0.2s ease;
    }
    .edit-image-button:hover {
      background: rgba(0,0,0,0.85);
    }
     .edit-image-button svg {
      width: 16px; /* Slightly larger */
      height: 16px;
    }

    .user-message {
      background: #007aff; /* iOS blue */
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 6px;
    }

    .model-message {
      background: #303238; 
      color: #e8e8e8;
      align-self: flex-start;
      border-bottom-left-radius: 6px;
    }
     .model-message.error-message {
      background: #c72c2c; /* More visible error color */
      color: #ffffff;
    }
    .model-message.generating-message {
      font-style: italic;
      color: #b0b0b0;
    }

    .chat-input-container { 
      padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,0.15);
      background: rgba(30, 30, 50, 0.95);
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      flex-shrink: 0;
    }
    
    .attached-image-preview-container {
      margin-bottom: 8px;
      position: relative;
      display: inline-block; 
    }

    .attached-image-preview {
      max-width: 80px; /* Smaller preview on mobile */
      max-height: 80px;
      border-radius: 6px;
      border: 1px solid #4a4f58;
    }

    .remove-attached-image-button {
      position: absolute;
      top: -8px; /* Adjust for touch */
      right: -8px;
      background: rgba(0,0,0,0.75);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px; /* Larger for touch */
      height: 24px;
      font-size: 14px; /* Larger text */
      line-height: 24px;
      text-align: center;
      cursor: pointer;
    }

    .chat-input-area {
      display: flex;
      gap: 8px;
      align-items: center; 
    }

    .chat-input-area input[type="text"] {
      flex-grow: 1;
      padding: 10px 12px;
      border-radius: 20px; /* Pill shape */
      border: 1px solid #4a4f58;
      background: #2c2f36;
      color: white;
      font-size: 0.95em;
      min-height: 40px; /* Ensure good height */
      -webkit-appearance: none; /* Remove iOS default styling */
    }

    .chat-input-area button {
      padding: 0; 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; /* Circular buttons */
      background: #007aff;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 0.95em;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background-color 0.2s ease;
    }
    .chat-input-area button.send-button { 
        min-width: auto; /* Remove min-width to allow for icon-only or text */
        width: auto; 
        padding: 0 15px; /* Adjust padding if text is present */
        border-radius: 20px; /* Pill shape for send */
        font-weight: 500;
    }
     .chat-input-area button.send-button.icon-only {
        width: 40px; /* Keep circular if only icon */
        padding: 0;
    }
    .chat-input-area button svg {
        width: 20px;
        height: 20px;
    }
    .chat-input-area button:disabled {
      background: #0056b3;
      opacity: 0.6;
    }
    .chat-input-area button:hover:not(:disabled) {
        background: #0059c1;
    }


    .attachment-options {
      position: absolute;
      bottom: calc(100% + 5px); 
      left: 0;
      background: #383a42; /* Darker, distinct */
      border-radius: 8px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.4);
      z-index: 1020; 
      width: max-content;
      overflow: hidden; /* Clip rounded corners */
    }
    .attachment-options button {
      display: block;
      width: 100%;
      padding: 12px 18px; /* More padding */
      background: none;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.05); /* Subtle separator */
      color: white;
      text-align: left;
      cursor: pointer;
      font-size: 0.9em;
      transition: background-color 0.2s ease;
    }
    .attachment-options button:last-child {
        border-bottom: none;
    }
    .attachment-options button:hover {
      background: #4a4d55;
    }
    
    .camera-modal-overlay, .about-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8); /* Darker overlay */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050; /* High z-index for modals */
      padding: 15px;
      box-sizing: border-box;
    }
    .camera-modal-content, .about-modal-content {
      background: #1e1e2f;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh; /* Max height */
      overflow-y: auto; /* Scroll if content overflows */
      -webkit-overflow-scrolling: touch;
      position: relative; /* For close button */
    }
    #cameraVideoFeed {
      width: 100%;
      max-width: 480px;
      height: auto;
      border-radius: 8px;
      background: #111; 
    }
    .camera-modal-controls button, .about-modal-close-button {
      padding: 10px 20px;
      border-radius: 8px; /* More rounded */
      background: #007aff;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1em;
      margin: 0 5px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    .camera-modal-controls button:hover, .about-modal-close-button:hover {
      background: #0059c1;
    }
    .about-modal-close-button { /* Specific for modal close */
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        padding: 0;
        font-size: 1.5em;
        line-height: 36px;
        background: rgba(255,255,255,0.1);
    }
    .about-modal-close-button:hover {
        background: rgba(255,255,255,0.2);
    }


    .chat-messages::-webkit-scrollbar {
      width: 6px; /* Thinner scrollbar */
    }
    .chat-messages::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.05);
      border-radius: 3px;
    }
    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }
    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.4);
    }

    .quote-fact-display {
      position: fixed;
      top: 10%; 
      left: 50%;
      transform: translateX(-50%);
      width: clamp(280px, 85vw, 600px); /* Responsive width */
      padding: 12px 18px;
      background-color: rgba(0, 0, 0, 0.45); 
      color: #f0f0f0; 
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      text-align: center;
      font-size: clamp(0.9em, 2.5vw, 1.1em); /* Responsive font size */
      line-height: 1.5;
      z-index: 500; 
      opacity: 0;
      transition: opacity 0.7s ease-in-out;
      pointer-events: none; 
      font-family: 'Georgia', serif; 
    }

    .quote-fact-display.visible {
      opacity: 1;
    }

    .quote-fact-display .author {
        display: block;
        font-size: 0.9em;
        font-style: italic;
        color: #c0c0c0; 
        margin-top: 5px;
    }

    /* About Me Button */
    .about-me-button {
      position: fixed;
      top: 15px;
      right: 15px;
      width: 40px;
      height: 40px;
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1020; /* Above chat panel, below modals */
      transition: background-color 0.2s ease;
      font-family: 'Georgia', serif; /* For a nicer 'i' */
    }
    .about-me-button:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    /* About Me Modal Content Styling */
    .about-modal-content img.developer-photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 15px;
      border: 3px solid rgba(255,255,255,0.3);
    }
    .about-modal-content h2 {
      margin: 0 0 5px 0;
      font-size: 1.6em;
      color: #e0e0e0;
    }
    .about-modal-content .quote {
      font-style: italic;
      color: #b0b0b0;
      margin: 5px 0;
      font-size: 0.95em;
      text-align: center;
    }
    .about-modal-content .sub-quote {
      font-size: 0.9em;
      color: #a0a0a0;
      margin-bottom: 15px;
      text-align: center;
    }
    .about-modal-content .title {
      font-weight: 500;
      color: #c0c0c0;
      margin-bottom: 20px;
      font-size: 1em;
    }
    .about-modal-content .contact-heading {
      font-weight: bold;
      color: #d0d0d0;
      margin-top: 10px;
      margin-bottom: 8px;
      font-size: 1.1em;
      align-self: flex-start;
    }
    .about-modal-content .contact-links {
      list-style: none;
      padding: 0;
      margin: 0;
      width: 100%;
      text-align: left;
    }
    .about-modal-content .contact-links li {
      margin-bottom: 8px;
    }
    .about-modal-content .contact-links a {
      color: #8ab4f8; /* Google blue for links */
      text-decoration: none;
      font-size: 0.9em;
      word-break: break-all;
    }
    .about-modal-content .contact-links a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 600px) {
      .controls {
        gap: 5px; /* Tighter gap for smaller screens */
        padding: 3px;
      }
      .controls button {
        width: 40px;
        height: 40px;
      }
      .controls button svg {
        width: 20px;
        height: 20px;
      }
      .about-me-button {
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        font-size: 18px;
      }
      .status {
        font-size: 0.75em;
        bottom: env(safe-area-inset-bottom, 5px) + 60px; /* Adjust if it overlaps with controls */
      }
      .about-modal-content h2 {
        font-size: 1.4em;
      }
      .about-modal-content img.developer-photo {
        width: 100px;
        height: 100px;
      }
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => { 
        this.fetchNewQuoteOrFact();
    });
    this.quoteFactIntervalId = window.setInterval(() => {
        this.fetchNewQuoteOrFact();
    }, QUOTE_FACT_INTERVAL_MS);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.quoteFactIntervalId) {
        clearInterval(this.quoteFactIntervalId);
    }
    this.stopRecording();
    this.session?.close();
  }


  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    this.initSession(); 
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Hlasový chat připraven.');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () =>{
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if(interrupted) {
              for(const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(`Chyba hlasového chatu: ${e.message}`);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Hlasový chat uzavřen: ' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SERPENT_ELEMENT_PERSONALITY,
        },
      });
    } catch (e: any) {
      console.error(e);
      this.updateError(`Chyba inicializace hlasového chatu: ${e.message}`);
    }
  }

  private async initTextChat() {
    if (!this.client) {
        this.updateError("Klient není inicializován pro textový chat.");
        return;
    }
    if (!this.textChat) {
      try {
        this.textChat = this.client.chats.create({
          model: 'gemini-2.5-flash-preview-04-17',
          config: {
            systemInstruction: SERPENT_ELEMENT_PERSONALITY,
          },
        });
        this.updateStatus('Textový chat připraven.');
      } catch (e: any) {
        console.error('Failed to initialize text chat:', e);
        this.updateError(`Chyba inicializace textového chatu: ${e.message}`);
      }
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = ''; 
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();
    this.updateStatus('Žádost o přístup k mikrofonu...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            // Standard properties for better quality and compatibility
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: false,
      });

      this.updateStatus('Přístup k mikrofonu udělen. Zahajuji nahrávání...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256; // Smaller buffer for lower latency
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        this.session.sendRealtimeInput({media: createBlob(pcmData)});
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination); 

      this.isRecording = true;
      this.updateStatus('🔴 Nahrávám...');
    } catch (err: any) {
      console.error('Chyba při zahájení nahrávání:', err);
      this.updateStatus(`Chyba: ${err.message}. Ujistěte se, že máte povolený přístup k mikrofonu.`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Zastavuji nahrávání...');
    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.updateStatus('Nahrávání zastaveno.');
  }

  private reset() {
    this.stopRecording(); 
    this.session?.close();
    this.initSession();
    this.textChatHistory = []; 
    this.attachedImage = null;
    this.promptingForImageAction = null;
    this.imageEditContextMessageId = null;
    this.updateStatus('Relace restartována. Historie textového chatu vymazána.');
  }

  private toggleTextChat() {
    this.isTextChatOpen = !this.isTextChatOpen;
    if (this.isTextChatOpen && !this.textChat) {
      this.initTextChat();
    }
    if (this.isTextChatOpen && this.error.includes("textového chatu")) {
        this.error = '';
    }
    if (!this.isTextChatOpen) { 
        this.promptingForImageAction = null;
        this.imageEditContextMessageId = null;
    }
    this.showAttachmentOptions = false; 
  }

  private handleTextMessageInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.currentTextMessage = input.value;
  }

  private addMessageToChat(role: 'user' | 'model', text: string, image?: string, msgClass?: string, promptForImage?: boolean) {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2), 
      role,
      text,
      image,
      class: msgClass,
      promptForImage
    };
    this.textChatHistory = [...this.textChatHistory, newMessage];
    this.scrollToChatBottom();
  }

  private async scrollToChatBottom() {
      this.requestUpdate(); 
      await this.updateComplete; 
      const messagesContainer = this.shadowRoot?.querySelector('.chat-messages');
      if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
  }

  private async submitChatMessage() {
    if (this.promptingForImageAction === 'generate') {
      await this.handleImageGenerationRequest(this.currentTextMessage);
    } else if (this.promptingForImageAction === 'edit') {
      await this.handleImageEditingRequest(this.currentTextMessage, this.imageEditContextMessageId);
    } else {
      await this.sendRegularTextMessage();
    }
  }

  private async sendRegularTextMessage() {
    if ((!this.currentTextMessage.trim() && !this.attachedImage) || this.isSendingTextMessage || !this.textChat) {
      return;
    }
    this.isSendingTextMessage = true;
    const messageToSend = this.currentTextMessage;
    
    this.addMessageToChat('user', messageToSend, this.attachedImage ? this.attachedImage.data : undefined);
    this.currentTextMessage = ''; 
    const currentAttachedImage = this.attachedImage; 
    this.attachedImage = null; 

    try {
      const parts: Array<{text?: string; inlineData?: {mimeType: string; data: string}}> = [];
      if (messageToSend.trim()) {
        parts.push({ text: messageToSend });
      }
      if (currentAttachedImage) {
        parts.push({
          inlineData: {
            mimeType: currentAttachedImage.mimeType,
            data: currentAttachedImage.data.split(',')[1] 
          }
        });
      }

      const response: GenerateContentResponse = await this.textChat.sendMessage({ message: parts });
      this.addMessageToChat('model', response.text);
    } catch (e: any) {
      console.error('Text chat send error:', e);
      const errorMessage = `Chyba odeslání zprávy: ${e.message}`;
      this.addMessageToChat('model', errorMessage, undefined, 'error-message');
      this.updateError(errorMessage);
    } finally {
      this.isSendingTextMessage = false;
      this.scrollToChatBottom();
    }
  }

  private async handleImageGenerationRequest(prompt: string) {
    if (!prompt.trim() || this.isSendingTextMessage || !this.client) return;

    this.isSendingTextMessage = true;
    this.addMessageToChat('user', `Generovat obrázek: ${prompt}`, undefined, undefined, true);
    this.currentTextMessage = '';
    this.addMessageToChat('model', 'Probíhá generování obrázku...', undefined, 'generating-message');
    this.promptingForImageAction = null; 

    try {
      const response = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });

      this.textChatHistory = this.textChatHistory.filter(msg => !(msg.text === 'Probíhá generování obrázku...' && msg.class === 'generating-message'));

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        this.addMessageToChat('model', `Vygenerovaný obrázek pro: "${prompt}"`, imageUrl);
      } else {
        throw new Error('Nepodařilo se vygenerovat obrázek.');
      }
    } catch (e: any) {
      console.error('Image generation error:', e);
      this.textChatHistory = this.textChatHistory.filter(msg => !(msg.text === 'Probíhá generování obrázku...' && msg.class === 'generating-message'));
      const errorMessage = `Chyba generování obrázku: ${e.message}`;
      this.addMessageToChat('model', errorMessage, undefined, 'error-message');
      this.updateError(errorMessage);
    } finally {
      this.isSendingTextMessage = false;
      this.scrollToChatBottom();
    }
  }

  private async handleImageEditingRequest(editPrompt: string, originalImageMessageId: string | null) {
    if (!editPrompt.trim() || this.isSendingTextMessage || !this.client) return;
    
    // For actual image editing, you'd typically need the original image data to send along with the prompt.
    // The current `generateImages` endpoint might not directly support "editing" in the sense of modifying an existing image you provide.
    // It will likely generate a new image based on the prompt, potentially influenced by any context if the model supports it.
    // If true "inpainting" or "outpainting" or "edit with mask" is needed, a different API or model setup is usually required.
    // For this implementation, we'll treat "edit" as generating a new image based on the new prompt, similar to generation.
    // You could potentially include the original image data in the parts array if the model can interpret it as context.

    this.isSendingTextMessage = true;
    this.addMessageToChat('user', `Upravit obrázek s popisem: ${editPrompt}`, undefined, undefined, true);
    this.currentTextMessage = '';
    this.addMessageToChat('model', 'Probíhá úprava obrázku...', undefined, 'generating-message');
    this.promptingForImageAction = null; 
    this.imageEditContextMessageId = null;

    try {
      // Find the original image to provide context if needed (and if supported by the API in this manner)
      // const originalMessage = this.textChatHistory.find(msg => msg.id === originalImageMessageId);
      // const imageToEditBase64 = originalMessage?.image?.split(',')[1];

      const response = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-002', // Or an image editing specific model if available
        prompt: editPrompt, 
        // If the API supports providing an original image for editing context:
        // originalImage: imageToEditBase64 ? { data: imageToEditBase64, mimeType: 'image/jpeg' } : undefined,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });

      this.textChatHistory = this.textChatHistory.filter(msg => !(msg.text === 'Probíhá úprava obrázku...' && msg.class === 'generating-message'));

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        this.addMessageToChat('model', `Upravený obrázek pro: "${editPrompt}"`, imageUrl);
      } else {
        throw new Error('Nepodařilo se upravit obrázek.');
      }
    } catch (e: any) {
      console.error('Image editing error:', e);
      this.textChatHistory = this.textChatHistory.filter(msg => !(msg.text === 'Probíhá úprava obrázku...' && msg.class === 'generating-message'));
      const errorMessage = `Chyba úpravy obrázku: ${e.message}`;
      this.addMessageToChat('model', errorMessage, undefined, 'error-message');
      this.updateError(errorMessage);
    } finally {
      this.isSendingTextMessage = false;
      this.scrollToChatBottom();
    }
  }


  private handleChatInputKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submitChatMessage();
    }
  }

  private toggleAttachmentOptions() {
    if (this.promptingForImageAction) { 
        this.promptingForImageAction = null;
        this.imageEditContextMessageId = null;
        this.currentTextMessage = ''; 
        this.showAttachmentOptions = false; 
    } else {
        this.showAttachmentOptions = !this.showAttachmentOptions;
    }
  }

  private handleFileTrigger() {
    this.fileUploadInput.click();
    this.showAttachmentOptions = false;
    this.promptingForImageAction = null;
    this.imageEditContextMessageId = null;
  }
  
  private async handleFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
          this.updateError('Prosím, vyberte obrázkový soubor.');
          return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        this.attachedImage = {
          data: event.target?.result as string,
          mimeType: file.type,
          name: file.name
        };
      };
      reader.onerror = () => {
        this.updateError('Chyba při čtení souboru.');
      };
      reader.readAsDataURL(file);
      input.value = ''; 
      this.promptingForImageAction = null; 
    }
  }

  private removeAttachedImage() {
    this.attachedImage = null;
  }

  private async openCamera() {
    this.showAttachmentOptions = false;
    this.isCameraViewOpen = true;
    this.promptingForImageAction = null;
    this.imageEditContextMessageId = null;
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      await this.updateComplete;
      if (this.cameraVideoFeedElement) {
        this.cameraVideoFeedElement.srcObject = this.cameraStream;
      }
    } catch (err: any) {
      this.updateError(`Chyba přístupu ke kameře: ${err.message}. Ujistěte se, že máte povolený přístup.`);
      this.isCameraViewOpen = false;
      this.cameraStream = null;
    }
  }

  private closeCamera(e?: Event) {
    // Prevent closing if click was inside content
    if (e && (e.target as HTMLElement).closest('.camera-modal-content')) return;

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }
    this.cameraStream = null;
    this.isCameraViewOpen = false;
  }

  private capturePhoto() {
    if (!this.cameraVideoFeedElement || !this.cameraStream) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.cameraVideoFeedElement.videoWidth;
    canvas.height = this.cameraVideoFeedElement.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(this.cameraVideoFeedElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg'); 
      this.attachedImage = {
        data: dataUrl,
        mimeType: 'image/jpeg',
        name: `capture-${Date.now()}.jpg`
      };
    }
    this.closeCamera();
    this.promptingForImageAction = null; 
  }

  private startImageGenerationPrompt() {
    this.promptingForImageAction = 'generate';
    this.currentTextMessage = '';
    this.attachedImage = null; 
    this.showAttachmentOptions = false;
    this.shadowRoot?.querySelector<HTMLInputElement>('.chat-input-area input[type="text"]')?.focus();
  }

  private startImageEditPrompt(messageId: string) {
    this.promptingForImageAction = 'edit';
    this.imageEditContextMessageId = messageId;
    this.currentTextMessage = '';
    this.attachedImage = null;
    this.showAttachmentOptions = false;
    this.shadowRoot?.querySelector<HTMLInputElement>('.chat-input-area input[type="text"]')?.focus();
  }

  private getChatInputPlaceholder(): string {
    if (this.promptingForImageAction === 'generate') {
      return 'Popis pro generování obrázku...';
    }
    if (this.promptingForImageAction === 'edit') {
      return 'Popis pro úpravu obrázku...';
    }
    return 'Napište zprávu...';
  }

  private getSendButtonText(): string | ReturnType<typeof html> {
    const sendIcon = html`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>`;

    if (this.isSendingTextMessage) return 'Odesílám...';
    if (this.promptingForImageAction === 'generate') return 'Generovat';
    if (this.promptingForImageAction === 'edit') return 'Upravit';
    
    return this.currentTextMessage.trim() || this.attachedImage ? sendIcon : 'Odeslat';
  }

  private getSendButtonClass(): string {
    let baseClass = "send-button";
    if (!this.currentTextMessage.trim() && !this.attachedImage && !(this.promptingForImageAction)) {
      // No text and no image, but not in image prompt mode
    } else if (!this.currentTextMessage.trim() && (this.promptingForImageAction || this.attachedImage) ) {
      // Only image or image prompt, but no text. Use icon
    }
    if (!(this.promptingForImageAction) && (this.currentTextMessage.trim() || this.attachedImage) && !this.isSendingTextMessage) {
        baseClass += " icon-only";
    }
    return baseClass;
  }


  private getRandomItem<T>(array: T[]): T | undefined {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  private async fetchNewQuoteOrFact() {
    const displayElement = this.shadowRoot?.querySelector('.quote-fact-display');
    if (displayElement) {
        displayElement.classList.remove('visible');
    }

    await new Promise(resolve => setTimeout(resolve, 700)); 

    this.quoteFactDisplayCounter++;
    let newText = '';
    let author: string | undefined = undefined;

    const useGemini = (this.quoteFactDisplayCounter % GEMINI_FACT_FETCH_RATIO === 0) && this.client;

    if (useGemini) {
        this.quoteFactIsLoading = true;
        try {
            const dateStr = new Date().toLocaleDateString('cs-CZ');
            const promptString = `Poskytněte jednu krátkou, poutavou informaci nebo citát (maximálně 250 znaků). Témata: věda, AI, vesmír, fakta o planetách, aktuální světové události (k ${dateStr}), inspirativní citáty známých osobností, nebo konspirační teorie. U citátu vždy uveďte autora (např. 'Text citátu – Autor'). U faktu nebo zprávy neuvádějte zdroj, pokud není přirozenou součástí. Výstup pouze samotný text.`;
            
            const response = await this.client.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: promptString,
            });
            let fullText = response.text.trim();
            
            const authorMatch = fullText.match(/(.*)[\s–—-]\s*([^–—-]{3,})$/); 
            if (authorMatch && authorMatch[1] && authorMatch[2]) {
                newText = authorMatch[1].trim();
                author = authorMatch[2].trim();
            } else {
                newText = fullText;
            }

        } catch (err: any) {
            console.error("Error fetching fact/quote from Gemini:", err);
            const quoteObj = this.getRandomItem(PREDEFINED_QUOTES);
            if (quoteObj) {
                newText = quoteObj.text;
                author = quoteObj.author;
            } else {
                newText = this.getRandomItem(PREDEFINED_FACTS) || "Svět je plný zázraků.";
            }
        } finally {
            this.quoteFactIsLoading = false;
        }
    } else {
        const choice = Math.random();
        if (choice < 0.6 || PREDEFINED_FACTS.length === 0) { 
            const quoteObj = this.getRandomItem(PREDEFINED_QUOTES);
             if (quoteObj) {
                newText = quoteObj.text;
                author = quoteObj.author;
            } else {
                 newText = "Objevujte svět kolem sebe.";
            }
        } else { 
            newText = this.getRandomItem(PREDEFINED_FACTS) || "Vědění je síla.";
        }
    }
    
    this.currentQuoteOrFact = author ? `${newText}<span class="author">– ${author}</span>` : newText;
    
    this.requestUpdate();
    await this.updateComplete;

    const newDisplayElement = this.shadowRoot?.querySelector('.quote-fact-display');
    if (newDisplayElement) {
        newDisplayElement.classList.add('visible');
    }
  }

  private toggleAboutModal() {
    this.isAboutModalOpen = !this.isAboutModalOpen;
  }


  render() {
    const isSendDisabled = this.isSendingTextMessage || 
                           (!this.currentTextMessage.trim() && (this.promptingForImageAction || !this.attachedImage));

    return html`
      <div>
        <button class="about-me-button" @click=${this.toggleAboutModal} title="O vývojáři">i</button>

        ${this.isAboutModalOpen ? html`
          <div class="about-modal-overlay" @click=${this.toggleAboutModal}>
            <div class="about-modal-content" @click=${(e: Event) => e.stopPropagation()}>
              <button class="about-modal-close-button" @click=${this.toggleAboutModal} title="Zavřít">×</button>
              <img src="https://i.postimg.cc/vTvPvxfd/NZCW6AW.jpg" alt="František Kalášek" class="developer-photo"/>
              <h2>František Kalášek</h2>
              <p class="quote">"Bridge the gap, create the world with connectivity..."</p>
              <p class="sub-quote">°°Filling Pieces°°</p>
              <p class="title">-Designer & Developer-</p>
              
              <h3 class="contact-heading">Kontakt:</h3>
              <ul class="contact-links">
                <li><a href="https://facebook.com/frantisek.kalasek/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://instagram.com/topbot.pwnz_qq" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://wa.me/420722426195" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="mailto:Churaq.Saturn@gmail.com">Churaq.Saturn@gmail.com</a></li>
                <li><a href="https://topwnz.com" target="_blank" rel="noopener noreferrer">topwnz.com</a></li>
              </ul>
            </div>
          </div>
        ` : ''}

        <div 
          class="quote-fact-display ${this.currentQuoteOrFact ? 'visible' : ''}" 
          .innerHTML=${this.currentQuoteOrFact}>
        </div>

        <input type="file" id="fileUpload" @change=${this.handleFileSelected} style="display: none;" accept="image/*" />
        
        ${this.isCameraViewOpen ? html`
          <div class="camera-modal-overlay" @click=${this.closeCamera}>
            <div class="camera-modal-content" @click=${(e: Event) => e.stopPropagation()}>
              <video id="cameraVideoFeed" autoplay playsinline muted></video>
              <div class="camera-modal-controls">
                <button @click=${this.capturePhoto}>Pořídit snímek</button>
                <button @click=${() => this.closeCamera()}>Zrušit</button>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="controls">
          <button
            id="resetButton"
            title="Restartovat relaci"
            aria-label="Restartovat relaci"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="startButton"
            title="Spustit hlasový chat"
            aria-label="Spustit hlasový chat"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}>
            <svg viewBox="0 0 100 100" fill="#c80000" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" /> <!-- Slightly smaller for better appearance -->
            </svg>
          </button>
          <button
            id="stopButton"
            title="Zastavit hlasový chat"
            aria-label="Zastavit hlasový chat"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            <svg viewBox="0 0 100 100" fill="#202020" xmlns="http://www.w3.org/2000/svg"> <!-- Darker grey for stop -->
              <rect x="15" y="15" width="70" height="70" rx="10" /> <!-- Rounded square -->
            </svg>
          </button>
          <button
            id="textChatButton"
            title="Otevřít/zavřít textový chat"
            aria-label="Otevřít nebo zavřít textový chat"
            @click=${this.toggleTextChat}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M160-240v-480h640v320H320l-160 160Zm0-80 80-80h560v-320H160v400Zm0 0v-400 400Zm80-240h480v-80H240v80Zm0-120h480v-80H240v80Z"/>
            </svg>
          </button>
        </div>

        ${this.error ? html`<div id="status" role="alert" style="color: #ffdddd; background-color: rgba(100,0,0,0.7);">${this.error}</div>` : html`<div id="status" role="status">${this.status}</div>`}
        
        ${this.isTextChatOpen ? html`
          <div id="text-chat-panel" role="log" aria-live="polite">
            <div class="chat-header">
              <h3>Serpent Element Chat</h3>
              <button @click=${this.toggleTextChat} title="Zavřít chat" aria-label="Zavřít chat">×</button>
            </div>
            <div class="chat-messages">
              ${map(this.textChatHistory, (msg) => html`
                <div class="message-bubble ${msg.role === 'user' ? 'user-message' : `model-message ${msg.class || ''}`}">
                  ${msg.text}
                  ${msg.image ? html`
                    <div style="position: relative; margin-top: 8px;">
                      <img src="${msg.image}" alt="${msg.role === 'user' ? 'Odeslaný obrázek' : 'Vygenerovaný obrázek'}"/>
                      ${msg.role === 'model' && !msg.promptForImage ? html`
                        <button 
                          class="edit-image-button" 
                          title="Upravit obrázek"
                          aria-label="Upravit tento obrázek"
                          @click=${() => this.startImageEditPrompt(msg.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="16px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `)}
            </div>
            <div class="chat-input-container">
              ${this.attachedImage && !this.promptingForImageAction ? html`
                <div class="attached-image-preview-container">
                  <img src="${this.attachedImage.data}" alt="Náhled přílohy" class="attached-image-preview"/>
                  <button @click=${this.removeAttachedImage} class="remove-attached-image-button" title="Odebrat obrázek" aria-label="Odebrat přiložený obrázek">×</button>
                </div>
              ` : ''}
              <div class="chat-input-area">
                <div style="position: relative;">
                  <button @click=${this.toggleAttachmentOptions} title=${this.promptingForImageAction ? "Zrušit akci s obrázkem" : "Možnosti přílohy"} aria-label=${this.promptingForImageAction ? "Zrušit akci s obrázkem" : "Možnosti přílohy"} ?disabled=${this.isSendingTextMessage}>
                    ${this.promptingForImageAction ? 
                        html`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>` : 
                        html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M720-300q0-25-17.5-42.5T660-360H200q-50 0-85-35t-35-85v-280q0-50 35-85t85-35h480q75 0 127.5 52.5T840-600q0 75-52.5 127.5T660-420H240q-25 0-42.5-17.5T180-480q0-25 17.5-42.5T240-540h400V-600H240q-8 0-14 6t-6 14v40q0 8 6 14t14 6h420q50 0 85 35t35 85q0 50-35 85t-85 35H200q-75 0-127.5-52.5T40-480v-280q0-75 52.5-127.5T200-940h480q100 0 170 70t70 170q0 100-70 170t-170 70H280v60h380q25 0 42.5 17.5T720-300Z"/></svg>`
                    }
                  </button>
                  ${this.showAttachmentOptions ? html`
                    <div class="attachment-options">
                      <button @click=${this.handleFileTrigger} aria-label="Nahrát obrázek ze souboru">Nahrát obrázek</button>
                      <button @click=${this.openCamera} aria-label="Pořídit fotografii pomocí kamery">Pořídit fotografii</button>
                      <button @click=${this.startImageGenerationPrompt} aria-label="Generovat nový obrázek pomocí AI">Generovat obrázek</button>
                    </div>
                  ` : ''}
                </div>
                <input 
                  type="text" 
                  .value=${this.currentTextMessage} 
                  @input=${this.handleTextMessageInput}
                  @keypress=${this.handleChatInputKeyPress}
                  placeholder=${this.getChatInputPlaceholder()}
                  aria-label=${this.getChatInputPlaceholder()}
                  ?disabled=${this.isSendingTextMessage}
                />
                <button 
                  @click=${this.submitChatMessage} 
                  ?disabled=${isSendDisabled} 
                  class=${this.getSendButtonClass()}
                  aria-label=${this.promptingForImageAction ? (this.promptingForImageAction === 'generate' ? 'Generovat obrázek' : 'Upravit obrázek') : 'Odeslat zprávu'}>
                  ${this.getSendButtonText()}
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio': GdmLiveAudio;
  }
}