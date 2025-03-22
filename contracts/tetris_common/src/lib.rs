use linera_sdk::base::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
pub enum PieceType {
    I,
    O,
    T,
    S,
    Z,
    J,
    L,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameState {
    pub board: [[Option<PieceType>; 10]; 20],
    pub score: u32,
    pub current_piece: Option<Piece>,
    pub game_over: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Piece {
    pub piece_type: PieceType,
    pub position: Position,
    pub rotation: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Operation {
    pub action: GameAction,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum GameAction {
    StartGame,
    MoveLeft,
    MoveRight,
    Rotate,
    Drop,
    GameOver,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameResponse {
    pub success: bool,
    pub message: String,
    pub game_state: Option<GameState>,
}

#[derive(Debug, Clone)]
pub struct Tetromino {
    pub shape: Vec<Vec<bool>>,
    pub piece_type: PieceType,
}

pub const TETROMINOES: &[(PieceType, &[&[bool]])] = &[
    (PieceType::I, &[
        &[false, false, false, false],
        &[true, true, true, true],
        &[false, false, false, false],
        &[false, false, false, false],
    ]),
    (PieceType::O, &[
        &[true, true],
        &[true, true],
    ]),
    (PieceType::T, &[
        &[false, true, false],
        &[true, true, true],
        &[false, false, false],
    ]),
    (PieceType::S, &[
        &[false, true, true],
        &[true, true, false],
        &[false, false, false],
    ]),
    (PieceType::Z, &[
        &[true, true, false],
        &[false, true, true],
        &[false, false, false],
    ]),
    (PieceType::J, &[
        &[true, false, false],
        &[true, true, true],
        &[false, false, false],
    ]),
    (PieceType::L, &[
        &[false, false, true],
        &[true, true, true],
        &[false, false, false],
    ]),
];

pub struct TetrisContract;

impl ContractAbi for TetrisContract {
    type Operation = Operation;
    type Response = GameResponse;
}

impl ServiceAbi for TetrisContract {
    type Query = ();
    type QueryResponse = GameState;
}

impl Default for GameState {
    fn default() -> Self {
        Self {
            board: [[None; 10]; 20],
            score: 0,
            current_piece: None,
            game_over: false,
        }
    }
}

// Додаткові допоміжні функції
pub fn rotate_shape(shape: &[&[bool]], rotation: u8) -> Vec<Vec<bool>> {
    let rotation = rotation % 4;
    if rotation == 0 {
        return shape.iter().map(|row| row.iter().copied().collect()).collect();
    }

    let rows = shape.len();
    let cols = shape[0].len();

    match rotation {
        1 => {
            let mut result = vec![vec![false; rows]; cols];
            for i in 0..rows {
                for j in 0..cols {
                    result[j][rows - 1 - i] = shape[i][j];
                }
            }
            result
        }
        2 => {
            let mut result = vec![vec![false; cols]; rows];
            for i in 0..rows {
                for j in 0..cols {
                    result[rows - 1 - i][cols - 1 - j] = shape[i][j];
                }
            }
            result
        }
        3 => {
            let mut result = vec![vec![false; rows]; cols];
            for i in 0..rows {
                for j in 0..cols {
                    result[cols - 1 - j][i] = shape[i][j];
                }
            }
            result
        }
        _ => unreachable!(),
    }
} 