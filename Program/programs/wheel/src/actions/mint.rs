use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token;

use crate::*;

#[derive(Accounts)]
#[instruction(params: MintTicketParams)]
pub struct MintTicket<'info> {
    #[account(mut,
        seeds = [ WHEEL_STATE_SEED, &params.wheel_id.to_be_bytes() ],
        bump,
    )]
    pub wheel_state: AccountLoader<'info, WheelState>,
    
    #[account(mut,
        seeds = [ GLOBAL_STATE_SEED ],
        bump,
    )]
    pub global_state: AccountLoader<'info, GlobalState>,

    #[account(mut,
        constraint = wheel_token_account.mint == ticket_mint.key(),
    )]
    pub wheel_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = user_ticket_account.mint == ticket_mint.key(),
    )]
    pub user_ticket_account: Account<'info, TokenAccount>,

    /// CHECK: address is checked.
    #[account(mut, address = wheel_state.load()?.escrow)]
    pub escrow: AccountInfo<'info>,

    #[account(constraint = wheel_state.load()?.ticket_mint == ticket_mint.key(),)]
    pub ticket_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MintTicketParams {
    pub amount: u16,
    pub wheel_id: u16,
}

impl MintTicket<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &MintTicketParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &MintTicketParams) -> Result<()> {
        let amount = params.amount as u64;

        let wheel_state: std::cell::Ref<'_, WheelState> = ctx.accounts.wheel_state.load()?;
        let global_state_seeds: [&[u8]; 2] = [
            GLOBAL_STATE_SEED,
            &[*ctx.bumps.get("global_state").unwrap()],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.wheel_token_account.to_account_info(),
                    to: ctx.accounts.user_ticket_account.to_account_info(),
                    authority: ctx.accounts.global_state.to_account_info(),
                },
                &[&global_state_seeds[..]],
            ),
            params.amount as u64,
        )?;
        // Transfer total prize cost to Wheel's wallet
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_authority.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                },
            ),
            wheel_state.price * amount,
        )?;

        Ok(())
    }
}
