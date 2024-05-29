use anchor_spl::token::{set_authority, spl_token::instruction::AuthorityType, SetAuthority};

use crate::*;

#[derive(Accounts)]
#[instruction(params: StakeParams)]
pub struct Stake<'info> {
    #[account(mut,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    #[account()]
    pub token: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        seeds = [ &token.key().to_bytes()[..], &params.staking_id.to_be_bytes() ],
        payer = user_authority,
        space = 8 + mem::size_of::<TokenState>(),
        bump,
    )]
    pub token_state: AccountLoader<'info, TokenState>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct StakeParams {
    pub staking_id: u16,
    pub rarity: u8,
}

impl Stake<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &StakeParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &StakeParams) -> Result<()> {
        let clock = Clock::get().unwrap();

        set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.user_authority.to_account_info(),
                    account_or_mint: ctx.accounts.token_account.to_account_info(),
                },
            ),
            AuthorityType::AccountOwner,
            Some(ctx.accounts.staking_state.key()),
        )?;

        // Update Token State
        let mut token_state = ctx.accounts.token_state.load_init()?;
        token_state.authority = ctx.accounts.user_authority.key();
        token_state.staked_at = clock.unix_timestamp;
        token_state.rarity = params.rarity;
        Ok(())
    }
}
