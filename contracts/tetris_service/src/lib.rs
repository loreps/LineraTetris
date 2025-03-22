use linera_sdk::{
    base::{ServiceAbi, WithServiceAbi},
    Service, ServiceRuntime,
};
use tetris_common::GameState;

pub struct TetrisServiceImpl {
    state: GameState,
}

#[derive(Clone)]
pub struct TetrisServiceAbi;

impl ServiceAbi for TetrisServiceAbi {
    type Query = ();
    type QueryResponse = GameState;
}

impl WithServiceAbi for TetrisServiceImpl {
    type Abi = TetrisServiceAbi;
}

linera_sdk::service!(TetrisServiceImpl);

impl Service for TetrisServiceImpl {
    type Parameters = ();

    async fn new(_runtime: ServiceRuntime<Self>) -> Self {
        Self {
            state: GameState::default(),
        }
    }

    async fn handle_query(&self, _query: Self::Query) -> Self::QueryResponse {
        self.state.clone()
    }
} 