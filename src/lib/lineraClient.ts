export interface GameState {
  board: (string | null)[][];
  score: number;
  currentPiece: {
    pieceType: string;
    position: {
      x: number;
      y: number;
    };
    rotation: number;
  } | null;
  gameOver: boolean;
}

export interface GameResponse {
  success: boolean;
  message: string;
  gameState: GameState | null;
}

export class TetrisLineraClient {
  private contractId: string;
  private privateKey: string;
  private baseUrl: string;

  constructor(contractId: string, privateKey: string) {
    this.contractId = contractId;
    this.privateKey = privateKey;
    this.baseUrl = import.meta.env.VITE_LINERA_NETWORK_URL;
  }

  private async sendRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.privateKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async startGame(): Promise<GameResponse> {
    return this.sendOperation({ action: 'StartGame' });
  }

  async moveLeft(): Promise<GameResponse> {
    return this.sendOperation({ action: 'MoveLeft' });
  }

  async moveRight(): Promise<GameResponse> {
    return this.sendOperation({ action: 'MoveRight' });
  }

  async rotate(): Promise<GameResponse> {
    return this.sendOperation({ action: 'Rotate' });
  }

  async drop(): Promise<GameResponse> {
    return this.sendOperation({ action: 'Drop' });
  }

  async gameOver(): Promise<GameResponse> {
    return this.sendOperation({ action: 'GameOver' });
  }

  async getGameState(): Promise<GameState> {
    return this.sendRequest(`/contracts/${this.contractId}/state`, 'GET');
  }

  private async sendOperation(operation: { action: string }): Promise<GameResponse> {
    return this.sendRequest(`/contracts/${this.contractId}/operations`, 'POST', operation);
  }
} 