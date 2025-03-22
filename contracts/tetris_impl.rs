use linera_sdk::base::{ContractAbi, ServiceAbi};
use linera_sdk::contract::Contract;
use linera_sdk::service::Service;
use crate::tetris::{TetrisContract, GameState, Operation, GameResponse, GameAction, Piece, Position, TETROMINOES};
use rand::Rng;

const BOARD_WIDTH: usize = 14;
const BOARD_HEIGHT: usize = 20;
const BLACK_BLOCK_CHANCE: f64 = 0.1;

pub struct TetrisContractImpl {
    state: GameState,
}

impl Contract for TetrisContractImpl {
    type ContractAbi = TetrisContract;

    fn new() -> Self {
        Self {
            state: GameState {
                board: vec![vec![None; BOARD_WIDTH]; BOARD_HEIGHT],
                score: 0,
                current_piece: None,
                game_over: false,
            },
        }
    }

    fn apply_operation(&mut self, operation: Operation) -> GameResponse {
        match operation.action {
            GameAction::StartGame => self.start_game(),
            GameAction::MoveLeft => self.move_left(),
            GameAction::MoveRight => self.move_right(),
            GameAction::Rotate => self.rotate(),
            GameAction::Drop => self.drop(),
            GameAction::GameOver => self.game_over(),
        }
    }
}

impl Service for TetrisContractImpl {
    type ServiceAbi = TetrisContract;

    fn query(&self, _query: ()) -> GameState {
        self.state.clone()
    }
}

impl TetrisContractImpl {
    fn start_game(&mut self) -> GameResponse {
        self.state = GameState {
            board: vec![vec![None; BOARD_WIDTH]; BOARD_HEIGHT],
            score: 0,
            current_piece: self.spawn_new_piece(),
            game_over: false,
        };
        GameResponse {
            success: true,
            message: "Game started".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn move_left(&mut self) -> GameResponse {
        if let Some(piece) = &mut self.state.current_piece {
            piece.position.x -= 1;
            if !self.is_valid_move(piece) {
                piece.position.x += 1;
            }
        }
        GameResponse {
            success: true,
            message: "Moved left".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn move_right(&mut self) -> GameResponse {
        if let Some(piece) = &mut self.state.current_piece {
            piece.position.x += 1;
            if !self.is_valid_move(piece) {
                piece.position.x -= 1;
            }
        }
        GameResponse {
            success: true,
            message: "Moved right".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn rotate(&mut self) -> GameResponse {
        if let Some(piece) = &mut self.state.current_piece {
            piece.rotation = (piece.rotation + 1) % 4;
            if !self.is_valid_move(piece) {
                piece.rotation = (piece.rotation + 3) % 4;
            }
        }
        GameResponse {
            success: true,
            message: "Rotated".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn drop(&mut self) -> GameResponse {
        if let Some(piece) = &mut self.state.current_piece {
            piece.position.y += 1;
            if !self.is_valid_move(piece) {
                piece.position.y -= 1;
                self.merge_piece();
                self.state.current_piece = self.spawn_new_piece();
                if self.state.current_piece.is_none() {
                    self.state.game_over = true;
                }
            }
        }
        GameResponse {
            success: true,
            message: "Dropped".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn game_over(&mut self) -> GameResponse {
        self.state.game_over = true;
        GameResponse {
            success: true,
            message: "Game over".to_string(),
            game_state: Some(self.state.clone()),
        }
    }

    fn spawn_new_piece(&self) -> Option<Piece> {
        let mut rng = rand::thread_rng();
        
        // Check for black block
        if rng.gen::<f64>() < BLACK_BLOCK_CHANCE {
            return Some(Piece {
                piece_type: 'B',
                position: Position {
                    x: (BOARD_WIDTH as i32) / 2,
                    y: -1,
                },
                rotation: 0,
            });
        }

        // Spawn regular piece
        let (piece_type, _) = TETROMINOES[rng.gen_range(0..TETROMINOES.len())];
        Some(Piece {
            piece_type,
            position: Position {
                x: (BOARD_WIDTH as i32) / 2,
                y: -1,
            },
            rotation: 0,
        })
    }

    fn is_valid_move(&self, piece: &Piece) -> bool {
        let (_, shape) = TETROMINOES.iter()
            .find(|(t, _)| *t == piece.piece_type)
            .unwrap_or((&'B', &[&[true]]));

        let rotated_shape = self.rotate_matrix(shape, piece.rotation);

        for (y, row) in rotated_shape.iter().enumerate() {
            for (x, &cell) in row.iter().enumerate() {
                if cell {
                    let board_x = piece.position.x + x as i32;
                    let board_y = piece.position.y + y as i32;

                    if board_x < 0 || board_x >= BOARD_WIDTH as i32 || 
                       board_y >= BOARD_HEIGHT as i32 ||
                       (board_y >= 0 && self.state.board[board_y as usize][board_x as usize].is_some()) {
                        return false;
                    }
                }
            }
        }
        true
    }

    fn merge_piece(&mut self) {
        if let Some(piece) = &self.state.current_piece {
            let (_, shape) = TETROMINOES.iter()
                .find(|(t, _)| *t == piece.piece_type)
                .unwrap_or((&'B', &[&[true]]));

            let rotated_shape = self.rotate_matrix(shape, piece.rotation);

            for (y, row) in rotated_shape.iter().enumerate() {
                for (x, &cell) in row.iter().enumerate() {
                    if cell {
                        let board_x = piece.position.x + x as i32;
                        let board_y = piece.position.y + y as i32;
                        if board_y >= 0 && board_y < BOARD_HEIGHT as i32 && 
                           board_x >= 0 && board_x < BOARD_WIDTH as i32 {
                            self.state.board[board_y as usize][board_x as usize] = Some(piece.piece_type);
                        }
                    }
                }
            }

            // Check for completed lines
            let mut lines_cleared = 0;
            let mut y = BOARD_HEIGHT - 1;
            while y >= 0 {
                if self.state.board[y].iter().all(|cell| cell.is_some()) {
                    self.state.board.remove(y);
                    self.state.board.insert(0, vec![None; BOARD_WIDTH]);
                    lines_cleared += 1;
                } else {
                    y -= 1;
                }
            }

            // Update score
            if lines_cleared > 0 {
                self.state.score += match lines_cleared {
                    1 => 100,
                    2 => 300,
                    3 => 500,
                    4 => 800,
                    _ => 0,
                };
            }
        }
    }

    fn rotate_matrix(&self, matrix: &[&[bool]], rotations: u8) -> Vec<Vec<bool>> {
        let mut result = matrix.iter()
            .map(|row| row.to_vec())
            .collect::<Vec<_>>();

        for _ in 0..rotations {
            let mut new_result = vec![vec![false; result.len()]; result[0].len()];
            for y in 0..result.len() {
                for x in 0..result[0].len() {
                    new_result[x][result.len() - 1 - y] = result[y][x];
                }
            }
            result = new_result;
        }

        result
    }
} 