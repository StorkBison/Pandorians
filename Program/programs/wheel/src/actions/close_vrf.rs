use crate::*;

#[derive(Accounts)]
#[instruction(params: CloseVRFParams)]
pub struct CloseVRF<'info> {
    #[account(mut, close=user_authority)]
    pub vrf_status: AccountLoader<'info, VRFStatus>,
    #[account(mut, address = vrf_status.load()?.owner)]
    pub user_authority: Signer<'info>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CloseVRFParams {}

impl CloseVRF<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &CloseVRFParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, _params: &CloseVRFParams) -> Result<()> {
        Ok(())
    }
}