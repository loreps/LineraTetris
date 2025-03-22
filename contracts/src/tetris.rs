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
    pub board: Vec<Vec<Option<PieceType>>>,
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