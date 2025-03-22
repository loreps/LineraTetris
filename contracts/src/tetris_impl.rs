use linera_sdk::{
    base::{ContractAbi, ServiceAbi, WithContractAbi, WithServiceAbi},
    Contract, ContractRuntime, Service, ServiceRuntime,
};

use crate::{
    GameAction, GameResponse, GameState, Operation, Piece, Position, PieceType, TETROMINOES,
};

pub struct TetrisContractImpl {
    state: GameState,
}

linera_sdk::contract!(TetrisContractImpl);

#[derive(Clone)]
pub struct TetrisContractAbi;

impl ContractAbi for TetrisContractAbi {
    type Operation = Operation;
    type Response = GameResponse;
}

#[derive(Clone)]
pub struct TetrisServiceAbi;

impl ServiceAbi for TetrisServiceAbi {
    type Query = ();
    type QueryResponse = GameState;
}

impl WithContractAbi for TetrisContractImpl {
    type Abi = TetrisContractAbi;
}

impl WithServiceAbi for TetrisContractImpl {
    type Abi = TetrisServiceAbi;
}

impl Contract for TetrisContractImpl {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();

    async fn load(_runtime: ContractRuntime<Self>) -> Self {
        Self {
            state: GameState {
                board: vec![vec![None; 10]; 20],
                score: 0,
                current_piece: None,
                game_over: false,
            },
        }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Ініціалізація не потрібна
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation.action {
            GameAction::StartGame => {
                if self.state.game_over {
                    self.state.game_over = false;
                    self.state.score = 0;
                    self.state.board = vec![vec![None; 10]; 20];
                    self.state.current_piece = Some(generate_new_piece());
                    GameResponse {
                        success: true,
                        message: "Game started".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "Game already in progress".to_string(),
                        game_state: None,
                    }
                }
            }
            GameAction::MoveLeft => {
                if let Some(piece) = &mut self.state.current_piece {
                    let mut new_piece = piece.clone();
                    new_piece.position.x -= 1;
                    let board = &self.state.board;
                    if !is_valid_move_with_board(board, &new_piece) {
                        return GameResponse {
                            success: false,
                            message: "Invalid move".to_string(),
                            game_state: None,
                        };
                    }
                    piece.position = new_piece.position;
                    GameResponse {
                        success: true,
                        message: "Moved left".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "No active piece".to_string(),
                        game_state: None,
                    }
                }
            }
            GameAction::MoveRight => {
                if let Some(piece) = &mut self.state.current_piece {
                    let mut new_piece = piece.clone();
                    new_piece.position.x += 1;
                    let board = &self.state.board;
                    if !is_valid_move_with_board(board, &new_piece) {
                        return GameResponse {
                            success: false,
                            message: "Invalid move".to_string(),
                            game_state: None,
                        };
                    }
                    piece.position = new_piece.position;
                    GameResponse {
                        success: true,
                        message: "Moved right".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "No active piece".to_string(),
                        game_state: None,
                    }
                }
            }
            GameAction::Rotate => {
                if let Some(piece) = &mut self.state.current_piece {
                    let mut new_piece = piece.clone();
                    new_piece.rotation = (new_piece.rotation + 1) % 4;
                    let board = &self.state.board;
                    if !is_valid_move_with_board(board, &new_piece) {
                        return GameResponse {
                            success: false,
                            message: "Invalid rotation".to_string(),
                            game_state: None,
                        };
                    }
                    piece.rotation = new_piece.rotation;
                    GameResponse {
                        success: true,
                        message: "Rotated".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "No active piece".to_string(),
                        game_state: None,
                    }
                }
            }
            GameAction::Drop => {
                if let Some(piece) = &mut self.state.current_piece {
                    let mut new_piece = piece.clone();
                    let board = &self.state.board;
                    while is_valid_move_with_board(board, &new_piece) {
                        new_piece.position.y += 1;
                    }
                    new_piece.position.y -= 1;
                    place_piece(&mut self.state, &new_piece);
                    clear_lines(&mut self.state);
                    self.state.current_piece = Some(generate_new_piece());
                    if let Some(new_piece) = &self.state.current_piece {
                        if !is_valid_move(&self.state, new_piece) {
                            self.state.game_over = true;
                            return GameResponse {
                                success: true,
                                message: "Game over".to_string(),
                                game_state: Some(self.state.clone()),
                            };
                        }
                    }
                    GameResponse {
                        success: true,
                        message: "Piece dropped".to_string(),
                        game_state: Some(self.state.clone()),
                    }
                } else {
                    GameResponse {
                        success: false,
                        message: "No active piece".to_string(),
                        game_state: None,
                    }
                }
            }
            GameAction::GameOver => {
                self.state.game_over = true;
                GameResponse {
                    success: true,
                    message: "Game over".to_string(),
                    game_state: Some(self.state.clone()),
                }
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {
        // Немає повідомлень для обробки
    }

    async fn store(self) {
        // Зберігання стану не потрібне
    }
}

impl Service for TetrisContractImpl {
    type Parameters = ();

    async fn new(_runtime: ServiceRuntime<Self>) -> Self {
        Self {
            state: GameState {
                board: vec![vec![None; 10]; 20],
                score: 0,
                current_piece: None,
                game_over: false,
            },
        }
    }

    async fn handle_query(&self, _query: <<Self as WithServiceAbi>::Abi as ServiceAbi>::Query) 
        -> <<Self as WithServiceAbi>::Abi as ServiceAbi>::QueryResponse {
        self.state.clone()
    }
}

fn generate_new_piece() -> Piece {
    let (piece_type, _shape) = TETROMINOES[rand::random::<usize>() % TETROMINOES.len()];
    Piece {
        piece_type,
        position: Position { x: 3, y: 0 },
        rotation: 0,
    }
}

fn is_valid_move_with_board(board: &Vec<Vec<Option<PieceType>>>, piece: &Piece) -> bool {
    let (_, shape) = TETROMINOES.iter().find(|(t, _)| *t == piece.piece_type).unwrap();
    let rotated_shape = rotate_shape(shape, piece.rotation);

    for (y, row) in rotated_shape.iter().enumerate() {
        for (x, &cell) in row.iter().enumerate() {
            if cell {
                let board_x = piece.position.x + x as i32;
                let board_y = piece.position.y + y as i32;
                if board_x < 0 || board_x >= 10 || board_y >= 20 {
                    return false;
                }
                if board_y >= 0 && board[board_y as usize][board_x as usize].is_some() {
                    return false;
                }
            }
        }
    }
    true
}

fn is_valid_move(state: &GameState, piece: &Piece) -> bool {
    is_valid_move_with_board(&state.board, piece)
}

fn rotate_shape(shape: &[&[bool]], rotation: u8) -> Vec<Vec<bool>> {
    let mut rotated = shape.iter()
        .map(|row| row.to_vec())
        .collect::<Vec<_>>();

    for _ in 0..rotation {
        let mut new_rotated = vec![vec![false; rotated.len()]; rotated[0].len()];
        for y in 0..rotated.len() {
            for x in 0..rotated[0].len() {
                new_rotated[x][rotated.len() - 1 - y] = rotated[y][x];
            }
        }
        rotated = new_rotated;
    }
    rotated
}

fn place_piece(state: &mut GameState, piece: &Piece) {
    let (_, shape) = TETROMINOES.iter().find(|(t, _)| *t == piece.piece_type).unwrap();
    let rotated_shape = rotate_shape(shape, piece.rotation);

    for (y, row) in rotated_shape.iter().enumerate() {
        for (x, &cell) in row.iter().enumerate() {
            if cell {
                let board_x = piece.position.x + x as i32;
                let board_y = piece.position.y + y as i32;
                if board_y >= 0 {
                    state.board[board_y as usize][board_x as usize] = Some(piece.piece_type);
                }
            }
        }
    }
}

fn clear_lines(state: &mut GameState) {
    let mut lines_cleared = 0;
    let mut y = 19_i32;
    while y >= 0 {
        if state.board[y as usize].iter().all(|cell| cell.is_some()) {
            state.board.remove(y as usize);
            state.board.insert(0, vec![None; 10]);
            lines_cleared += 1;
        } else {
            y -= 1;
        }
    }
    state.score += lines_cleared * 100;
} 