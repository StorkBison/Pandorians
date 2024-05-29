use crate::*;
use anchor_spl::token::{set_authority, spl_token::instruction::AuthorityType, SetAuthority};

#[derive(Accounts)]
#[instruction(params: UnstakeParams)]
pub struct Unstake<'info> {
    #[account(mut,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    #[account()]
    pub token: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut,
        seeds = [ &token.key().to_bytes()[..], &params.staking_id.to_be_bytes() ],
        bump,
        close = user_authority,
    )]
    pub token_state: AccountLoader<'info, TokenState>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UnstakeParams {
    pub staking_id: u16,
}

impl Unstake<'_> {
    pub fn validate(&self, ctx: &Context<Self>, _params: &UnstakeParams) -> Result<()> {
        let token_state = ctx.accounts.token_state.load()?;
        if token_state.authority != ctx.accounts.user_authority.key() {
            return Err(StakingErrorCode::InvalidAuthority.into());
        }

        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &UnstakeParams) -> Result<()> {
        let staking_state_seeds = [
            STAKING_STATE_SEED,
            &params.staking_id.to_be_bytes()[..],
            &[*ctx.bumps.get("staking_state").unwrap()],
        ];

        set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.staking_state.to_account_info(),
                    account_or_mint: ctx.accounts.token_account.to_account_info(),
                },
                &[&staking_state_seeds[..]],
            ),
            AuthorityType::AccountOwner,
            Some(ctx.accounts.user_authority.key()),
        )?;

        Ok(())
    }
}
