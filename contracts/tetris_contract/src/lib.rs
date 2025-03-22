use linera_sdk::{
    base::{ContractAbi, WithContractAbi},
    Contract, ContractRuntime,
};
use tetris_common::{
    GameAction, GameResponse, GameState, Operation, Piece, PieceType, Position, TETROMINOES,
};

#[derive(Clone)]
pub struct TetrisContractImpl {
    state: GameState,
}

#[derive(Clone)]
pub struct TetrisContractAbi;

impl ContractAbi for TetrisContractAbi {
    type Operation = Operation;
    type Response = GameResponse;
}

impl WithContractAbi for TetrisContractImpl {
    type Abi = TetrisContractAbi;
}

linera_sdk::contract!(TetrisContractImpl);

impl Contract for TetrisContractImpl {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();

    async fn load(_runtime: ContractRuntime<Self>) -> Self {
        Self {
            state: GameState::default(),
        }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Нічого додаткового не потрібно робити під час створення екземпляра
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        let response = match operation.action {
            GameAction::StartGame => {
                if !self.state.game_over && self.state.current_piece.is_some() {
                    return GameResponse {
                        success: false,
                        message: "Game is already in progress".to_string(),
                        game_state: Some(self.state.clone()),
                    };
                }

                // Ініціалізуємо нову гру
                self.state = GameState::default();
                self.state.current_piece = Some(generate_new_piece(&mut self.state));

                GameResponse {
                    success: true,
                    message: "Game started".to_string(),
                    game_state: Some(self.state.clone()),
                }
            }
            GameAction::MoveLeft => {
                if self.state.game_over || self.state.current_piece.is_none() {
                    return GameResponse {
                        success: false,
                        message: "Game not in progress".to_string(),
                        game_state: Some(self.state.clone()),
                    };
                }

                let mut updated_piece = self.state.current_piece.clone().unwrap();
                updated_piece.position.x -= 1;

                if is_valid_move(&self.state, &updated_piece) {
                    self.state.current_piece = Some(updated_piece);
                    GameResponse {
                        success: true,
                        message: "Moved left".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "Cannot move left".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                }
            }
            GameAction::MoveRight => {
                if self.state.game_over || self.state.current_piece.is_none() {
                    return GameResponse {
                        success: false,
                        message: "Game not in progress".to_string(),
                        game_state: Some(self.state.clone()),
                    };
                }

                let mut updated_piece = self.state.current_piece.clone().unwrap();
                updated_piece.position.x += 1;

                if is_valid_move(&self.state, &updated_piece) {
                    self.state.current_piece = Some(updated_piece);
                    GameResponse {
                        success: true,
                        message: "Moved right".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "Cannot move right".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                }
            }
            GameAction::Rotate => {
                if self.state.game_over || self.state.current_piece.is_none() {
                    return GameResponse {
                        success: false,
                        message: "Game not in progress".to_string(),
                        game_state: Some(self.state.clone()),
                    };
                }

                let mut updated_piece = self.state.current_piece.clone().unwrap();
                updated_piece.rotation = (updated_piece.rotation + 1) % 4;

                if is_valid_move(&self.state, &updated_piece) {
                    self.state.current_piece = Some(updated_piece);
                    GameResponse {
                        success: true,
                        message: "Rotated".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "Cannot rotate".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                }
            }
            GameAction::Drop => {
                if self.state.game_over || self.state.current_piece.is_none() {
                    return GameResponse {
                        success: false,
                        message: "Game not in progress".to_string(),
                        game_state: Some(self.state.clone()),
                    };
                }

                let mut current_piece = self.state.current_piece.clone().unwrap();
                
                // Опускаємо фігуру вниз, поки це можливо
                while is_valid_move(&self.state, &Piece {
                    position: Position { x: current_piece.position.x, y: current_piece.position.y + 1 },
                    ..current_piece.clone()
                }) {
                    current_piece.position.y += 1;
                }
                
                // Розміщуємо фігуру на дошці
                place_piece(&mut self.state, &current_piece);
                
                // Перевіряємо та очищаємо заповнені рядки
                clear_lines(&mut self.state);
                
                // Створюємо нову фігуру
                let new_piece = generate_new_piece(&mut self.state);
                
                // Перевіряємо, чи можна розмістити нову фігуру
                if !is_valid_move(&self.state, &new_piece) {
                    self.state.game_over = true;
                    self.state.current_piece = None;
                    
                    GameResponse {
                        success: true,
                        message: "Game over".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    self.state.current_piece = Some(new_piece);
                    
                    GameResponse {
                        success: true,
                        message: "Piece dropped".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                }
            }
            GameAction::GameOver => {
                self.state.game_over = true;
                self.state.current_piece = None;
                
                GameResponse {
                    success: true,
                    message: "Game over".to_string(),
                    game_state: Some(self.state.clone()),
                }
            }
        };

        // Зберігаємо стан після кожної операції
        self.clone().store().await;
        response
    }

    async fn execute_message(&mut self, _message: Self::Message) {
        // Наразі повідомлення не використовуються
    }

    async fn store(self) {
        // Зберігаємо стан (автоматично)
    }
}

fn generate_new_piece(state: &mut GameState) -> Piece {
    // Використовуємо хеш стану для детермінованої генерації
    let hash = state.score as usize;
    let piece_index = hash % TETROMINOES.len();
    let (piece_type, _) = TETROMINOES[piece_index];
    
    Piece {
        piece_type,
        position: Position { x: 4, y: 0 },
        rotation: 0,
    }
}

fn is_valid_move_with_board(board: &[[Option<PieceType>; 10]; 20], piece: &Piece) -> bool {
    let (_piece_type, shape) = TETROMINOES
        .iter()
        .find(|(pt, _)| *pt == piece.piece_type)
        .unwrap();
    
    let rotated_shape = tetris_common::rotate_shape(shape, piece.rotation);
    
    for (y, row) in rotated_shape.iter().enumerate() {
        for (x, &cell) in row.iter().enumerate() {
            if !cell {
                continue; // Пропускаємо порожні клітини фігури
            }
            
            let board_x = piece.position.x + x as i32;
            let board_y = piece.position.y + y as i32;
            
            // Перевіряємо межі дошки
            if board_x < 0 || board_x >= 10 || board_y < 0 || board_y >= 20 {
                return false;
            }
            
            // Перевіряємо колізії
            if board[board_y as usize][board_x as usize].is_some() {
                return false;
            }
        }
    }
    
    true
}

fn is_valid_move(state: &GameState, piece: &Piece) -> bool {
    is_valid_move_with_board(&state.board, piece)
}

fn place_piece(state: &mut GameState, piece: &Piece) {
    let (_piece_type, shape) = TETROMINOES
        .iter()
        .find(|(pt, _)| *pt == piece.piece_type)
        .unwrap();
    
    let rotated_shape = tetris_common::rotate_shape(shape, piece.rotation);
    
    for (y, row) in rotated_shape.iter().enumerate() {
        for (x, &cell) in row.iter().enumerate() {
            if cell {
                let board_x = piece.position.x + x as i32;
                let board_y = piece.position.y + y as i32;
                state.board[board_y as usize][board_x as usize] = Some(piece.piece_type);
            }
        }
    }
}

fn clear_lines(state: &mut GameState) {
    let mut lines_cleared = 0;
    let mut y = 19;
    
    while y > 0 {
        if state.board[y].iter().all(|cell| cell.is_some()) {
            // Зсуваємо всі рядки вище вниз
            for y2 in (1..=y).rev() {
                state.board[y2] = state.board[y2 - 1];
            }
            // Очищаємо верхній рядок
            state.board[0] = [None; 10];
            lines_cleared += 1;
            // Не змінюємо y, щоб перевірити той самий рядок знову
        } else {
            y -= 1;
        }
    }
    
    // Оновлюємо рахунок
    state.score += lines_cleared * 100;
} 