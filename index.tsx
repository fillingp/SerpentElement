/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session, Chat, GenerateContentResponse} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {map} from 'lit/directives/map.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';

const SERPENT_ELEMENT_PERSONALITY = "Jsi Serpent Element, přátelská, vtipná, koketující, mírně drzá, emotivní a empatická AI. Tvůj designer a developer je František Kalášek. Pokud se tě někdo zeptá, kdo tě vytvořil, kdo je developer této aplikace, nebo na podobné otázky, vždy odpověz s referencí na Františka Kaláška.";

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';

  private client: GoogleGenAI;
  private session: Session;
  private textChat: Chat | undefined;

  @state() isTextChatOpen = false;
  @state() textChatHistory: Array<{ role: 'user' | 'model'; text: string; class?: string }> = [];
  @state() currentTextMessage = '';
  @state() isSendingTextMessage = false;

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

  static styles = css`
    #status {
      position: fixed; /* Changed from absolute for better layout with chat */
      bottom: 10px;
      left: 10px;
      /* right: 0; */
      z-index: 10;
      text-align: left;
      background-color: rgba(0,0,0,0.5);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 10vh; /* Keep some space from bottom */
      left: 50%;
      transform: translateX(-50%); /* Center the controls */
      display: flex;
      flex-direction: row; /* Arrange buttons in a row */
      align-items: center;
      justify-content: center;
      gap: 8px; /* Spacing between buttons */

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 8px; /* Adjusted border-radius */
        background: rgba(255, 255, 255, 0.1);
        width: 48px;  /* Reduced size */
        height: 48px; /* Reduced size */
        cursor: pointer;
        font-size: 20px; /* Adjusted for smaller button */
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      button svg {
        width: 24px; /* Scaled down icon */
        height: 24px; /* Scaled down icon */
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      /* Keep specific disabled handling for start/stop if they used display:none before */
      button#startButton[disabled], button#stopButton[disabled] {
        display: none;
      }
    }

    #text-chat-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      max-height: 70vh;
      background: rgba(20, 20, 35, 0.95);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      z-index: 20;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-header {
      padding: 12px 15px;
      background: rgba(30, 30, 50, 0.9);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
    }

    .chat-header button {
      background: none;
      border: none;
      color: white;
      font-size: 1.5em;
      cursor: pointer;
      padding: 0 5px;
    }

    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message-bubble {
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 85%;
      word-wrap: break-word;
      line-height: 1.4;
      font-size: 0.95em;
    }

    .user-message {
      background: #007bff;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 6px;
    }

    .model-message {
      background: #383a40; /* Darker, sophisticated model bubble */
      color: #e0e0e0;
      align-self: flex-start;
      border-bottom-left-radius: 6px;
    }
     .model-message.error-message {
      background: #5c2525;
      color: #ffdddd;
    }

    .chat-input-area {
      padding: 15px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 10px;
      background: rgba(30, 30, 50, 0.9);
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .chat-input-area input {
      flex-grow: 1;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #444950;
      background: #25282e;
      color: white;
      font-size: 1em;
    }

    .chat-input-area button {
      padding: 10px 15px;
      border-radius: 6px;
      background: #007bff;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1em;
      min-width: 70px; /* Ensure button has decent width */
    }
    .chat-input-area button:disabled {
      background: #0056b3;
      opacity: 0.7;
    }

    /* Scrollbar styling for chat messages */
    .chat-messages::-webkit-scrollbar {
      width: 8px;
    }
    .chat-messages::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
      border-radius: 4px;
    }
    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
    }
    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.5);
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY, // Corrected API key source
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    this.initSession(); // Initialize voice session
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
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}},
          },
          systemInstruction: SERPENT_ELEMENT_PERSONALITY, // Added personality
        },
      });
    } catch (e) {
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
      } catch (e) {
        console.error('Failed to initialize text chat:', e);
        this.updateError(`Chyba inicializace textového chatu: ${e.message}`);
      }
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = ''; // Clear error when status updates
  }

  private updateError(msg: string) {
    this.error = msg;
    // this.status = ''; // Clear status when error occurs
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();
    this.updateStatus('Žádost o přístup k mikrofonu...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Přístup k mikrofonu udělen. Zahajuji nahrávání...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
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
      this.scriptProcessorNode.connect(this.inputAudioContext.destination); // Required for onaudioprocess to fire in some browsers

      this.isRecording = true;
      this.updateStatus('🔴 Nahrávám...');
    } catch (err) {
      console.error('Chyba při zahájení nahrávání:', err);
      this.updateStatus(`Chyba: ${err.message}`);
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
    this.stopRecording(); // Ensure recording is stopped before resetting
    this.session?.close();
    this.initSession();
    this.textChatHistory = []; // Clear text chat history
    // Optionally, re-initialize textChat if its internal state needs resetting beyond history
    // this.textChat = undefined;
    // if (this.isTextChatOpen) this.initTextChat();
    this.updateStatus('Relace restartována. Historie textového chatu vymazána.');
  }

  private toggleTextChat() {
    this.isTextChatOpen = !this.isTextChatOpen;
    if (this.isTextChatOpen && !this.textChat) {
      this.initTextChat();
    }
    // If opening chat and there was an error, clear it
    if (this.isTextChatOpen && this.error.includes("textového chatu")) {
        this.error = '';
    }
  }

  private handleTextMessageInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.currentTextMessage = input.value;
  }

  private async sendTextMessage() {
    if (!this.currentTextMessage.trim() || this.isSendingTextMessage || !this.textChat) {
      return;
    }
    this.isSendingTextMessage = true;
    const messageToSend = this.currentTextMessage;
    this.textChatHistory = [...this.textChatHistory, { role: 'user', text: messageToSend }];
    this.currentTextMessage = ''; // Clear input

    // Auto-scroll to bottom
    this.requestUpdate(); // Ensure new message is rendered
    await this.updateComplete; // Wait for render
    const messagesContainer = this.shadowRoot?.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      const response: GenerateContentResponse = await this.textChat.sendMessage({ message: messageToSend });
      this.textChatHistory = [...this.textChatHistory, { role: 'model', text: response.text }];
    } catch (e) {
      console.error('Text chat send error:', e);
      const errorMessage = `Chyba odeslání zprávy: ${e.message}`;
      this.textChatHistory = [...this.textChatHistory, { role: 'model', text: errorMessage, class: 'error-message' }];
      this.updateError(errorMessage);
    } finally {
      this.isSendingTextMessage = false;
      // Auto-scroll to bottom again after model response
      this.requestUpdate();
      await this.updateComplete;
       if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  private handleChatInputKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendTextMessage();
    }
  }


  render() {
    return html`
      <div>
        <div class="controls">
          <button
            id="resetButton"
            title="Restartovat relaci"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#ffffff">
              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="startButton"
            title="Spustit hlasový chat"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}>
            <svg viewBox="0 0 100 100" fill="#c80000" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" />
            </svg>
          </button>
          <button
            id="stopButton"
            title="Zastavit hlasový chat"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            <svg viewBox="0 0 100 100" fill="#000000" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" rx="15" />
            </svg>
          </button>
          <button
            id="textChatButton"
            title="Otevřít/zavřít textový chat"
            @click=${this.toggleTextChat}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#ffffff">
              <path d="M160-240v-480h640v320H320l-160 160Zm0-80 80-80h560v-320H160v400Zm0 0v-400 400Zm80-240h480v-80H240v80Zm0-120h480v-80H240v80Z"/>
            </svg>
          </button>
        </div>

        ${this.error ? html`<div id="status" style="color: #ffdddd; background-color: rgba(100,0,0,0.7);">${this.error}</div>` : html`<div id="status">${this.status}</div>`}
        
        ${this.isTextChatOpen ? html`
          <div id="text-chat-panel">
            <div class="chat-header">
              <h3>Serpent Element Chat</h3>
              <button @click=${this.toggleTextChat} title="Zavřít chat">×</button>
            </div>
            <div class="chat-messages">
              ${map(this.textChatHistory, (msg) => html`
                <div class="message-bubble ${msg.role === 'user' ? 'user-message' : `model-message ${msg.class || ''}`}">
                  ${msg.text}
                </div>
              `)}
            </div>
            <div class="chat-input-area">
              <input 
                type="text" 
                .value=${this.currentTextMessage} 
                @input=${this.handleTextMessageInput}
                @keypress=${this.handleChatInputKeyPress}
                placeholder="Napište zprávu..."
                ?disabled=${this.isSendingTextMessage}
              />
              <button @click=${this.sendTextMessage} ?disabled=${this.isSendingTextMessage || !this.currentTextMessage.trim()}>
                ${this.isSendingTextMessage ? 'Odesílám...' : 'Odeslat'}
              </button>
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