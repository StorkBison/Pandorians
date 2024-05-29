use crate::*;

#[derive(Accounts)]
#[instruction(params: InitParams)]
pub struct Init<'info> {
    #[account(
        init,
        seeds = [ BOX_STATE_SEED, &params.box_id.to_be_bytes() ],
        payer = payer,
        space = 8 + mem::size_of::<BoxState>(),
        bump,
    )]
    pub box_state: AccountLoader<'info, BoxState>,

    /// CHECK: it's ok, because it's a system account.
    #[account()]
    pub key_mint:  AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    /*** Programs */
    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitParams {
    pub box_id: u16,
}

impl Init<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &InitParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, _params: &InitParams) -> Result<()> {
        // Init BoxState

        let mut box_state = ctx.accounts.box_state.load_init()?;
        *box_state = BoxState::default();
        box_state.next_id = 1;
        box_state.key_mint = ctx.accounts.key_mint.key();
        Ok(())
    }
}
