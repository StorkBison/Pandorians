use crate::*;

#[derive(Accounts)]
#[instruction(params: InitParams)]
pub struct Init<'info> {
    #[account(
        init,
        seeds = [ WHEEL_STATE_SEED, &params.wheel_id.to_be_bytes() ],
        payer = payer,
        space = 8 + mem::size_of::<WheelState>(),
        bump,
    )]
    pub wheel_state: AccountLoader<'info, WheelState>,

    #[account(
        seeds = [ GLOBAL_STATE_SEED ],
        bump,
    )]
    pub global_state: AccountLoader<'info, GlobalState>,

    /// CHECK: it's ok, because will be initialized inside. global_seed
    #[account(mut, address = global_state.load()?.escrow)]
    pub escrow: AccountInfo<'info>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account()]
    pub ticket_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
    /// CHECK: it's ok, because it's a system account.
    recent_blockhash: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitParams {
    pub escrow: Pubkey,
    pub price: u64,
    pub prizes: [PrizeParams; 6],
    pub wheel_id: u16,
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct PrizeParams {
    pub amount: u64,
    pub cost: u64,
    pub escrow: Option<Pubkey>,
    pub probability: f32,
    pub token: Pubkey,
}

impl Default for PrizeParams {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

impl Init<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, params: &InitParams) -> Result<()> {
        let probabilities = params
            .prizes
            .iter()
            .map(|x| x.probability)
            .collect::<Vec<_>>();
        let total_prize_cost = params
            .prizes
            .iter()
            .map(|x| x.cost as f32 * x.probability)
            .sum::<f32>() as u64;

        if probabilities.iter().any(|x| *x < 0f32)
            || probabilities.iter().sum::<f32>() > 1f32
            || total_prize_cost > params.price
        {
            return Err(WheelErrorCode::InvalidArguments.into());
        }

        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &InitParams) -> Result<()> {
        // Initialize Wheel State
        let mut wheel_state = ctx.accounts.wheel_state.load_init()?;
        *wheel_state = WheelState::default();

        wheel_state.escrow = *ctx.accounts.escrow.key;
        wheel_state.mintable = true;
        wheel_state.price = params.price;
        wheel_state.ticket_mint = *ctx.accounts.ticket_mint.key;
        wheel_state.prizes = params
            .prizes
            .iter()
            .map(|p| Prize {
                amount: p.amount,
                cost: p.cost,
                escrow: p.escrow,
                probability: p.probability,
                token: p.token,
            })
            .collect::<Vec<Prize>>()[..]
            .try_into()
            .unwrap();

        Ok(())
    }
}
