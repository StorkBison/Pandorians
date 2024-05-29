use anchor_spl::token::{transfer, Transfer};
use anchor_lang::solana_program::{system_instruction, program::invoke_signed};
use orao_solana_vrf::{
    state::{Randomness},
    RANDOMNESS_ACCOUNT_SEED,
};
use crate::*;

#[derive(Accounts)]
#[instruction(params: TakeParams)]
pub struct Take<'info> {
    #[account(mut,
        seeds = [ WHEEL_STATE_SEED, &params.wheel_id.to_be_bytes() ],
        bump
    )]
    pub wheel_state: AccountLoader<'info, WheelState>,

    #[account(mut, close=user_authority)]
    pub vrf_status: AccountLoader<'info, VRFStatus>,

    #[account(mut,
        seeds = [ GLOBAL_STATE_SEED ],
        bump,
    )]
    pub global_state: AccountLoader<'info, GlobalState>,

    #[account(mut,
        constraint = wheel_token_account.mint == token_mint.key(),
    )]
    pub wheel_token_account: Account<'info, TokenAccount>,

    /// CHECK:
    #[account(
        mut,
        seeds = [RANDOMNESS_ACCOUNT_SEED.as_ref(), params.force.as_ref()],
        bump,
        seeds::program = orao_solana_vrf::ID,
        address = vrf_status.load()?.random,
    )]
    random: AccountInfo<'info>,

    /// CHECK: address is checked.
    #[account(mut, address = global_state.load()?.escrow)]
    pub escrow: AccountInfo<'info>,

    #[account()]
    pub token_mint: Account<'info, Mint>,

    #[account(mut, address = vrf_status.load()?.owner)]
    pub user_authority: Signer<'info>,

    #[account(mut,
        constraint = user_token_account.mint == token_mint.key(),
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: it's ok, because it's a system account.
    recent_blockhash: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TakeParams {
    pub force: [u8; 32],
    pub wheel_id: u16,
}

impl Take<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &TakeParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, _params: &TakeParams) -> Result<()> {
        let wheel_state: std::cell::Ref<'_, WheelState> = ctx.accounts.wheel_state.load()?;
        let global_state_seeds: [&[u8]; 2] = [
            GLOBAL_STATE_SEED,
            &[*ctx.bumps.get("global_state").unwrap()],
        ];

        let account_info = ctx.accounts.random.to_account_info();
        if account_info.data_is_empty() {
            // return an error if the account is not initialized
            msg!("Account not initialized");
        }
        let account: Randomness = Randomness::try_deserialize(&mut &account_info.data.borrow()[..])?;
        let randomness: [u8; 64] = account.randomness;
        let value: [u8; 4] = randomness[0..4].try_into().unwrap();
        let mut result: u32 = u32::from_le_bytes(value);

        let mut limit: u32 = 0u32;
        let mut prize: Option<u8> = Some(0 as u8);
        for (i, p) in wheel_state.prizes.into_iter().enumerate() {
            limit += (u32::MAX as f32 * p.probability) as u32;
            if result <= limit {
                prize = Some(i as u8);
                break;
            }
        }
        if let Some(prize_index) = prize {
            msg!("prize {:?}, {:?}" , prize_index, prize);
            if let Some(prizex) = wheel_state.prizes.get(prize_index as usize) {
                if prize_index == 1 || prize_index == 2 {
                    if prizex.token != ctx.accounts.token_mint.key() {
                        return Err(WheelErrorCode::InvalidArguments.into());
                    }
                    transfer(
                        CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            Transfer {
                                from: ctx.accounts.wheel_token_account.to_account_info(),
                                to: ctx.accounts.user_token_account.to_account_info(),
                                authority: ctx.accounts.global_state.to_account_info(),
                            },
                            &[&global_state_seeds[..]],
                        ),
                        prizex.amount,
                    )?;
                } else {
                    invoke_signed(
                        &system_instruction::withdraw_nonce_account(
                            ctx.accounts.escrow.key,
                            &ctx.accounts.global_state.to_account_info().key(),
                            &ctx.accounts.user_authority.to_account_info().key(),
                            prizex.amount,
                        ),
                        &[
                            ctx.accounts.escrow.clone(),
                            ctx.accounts.user_authority.to_account_info().clone(),
                            ctx.accounts.system_program.to_account_info(),
                            ctx.accounts.rent.to_account_info().clone(),
                            ctx.accounts.recent_blockhash.clone(),
                            ctx.accounts.global_state.to_account_info().clone(),
                        ],
                        &[&global_state_seeds[..]],
                    )?;
                    
                    if prize_index == 3 {
                        let mut i = 0;
                        while i < prize_index {
                            result -= (u32::MAX as f32 * wheel_state.prizes[i as usize].probability) as u32;
                            i = i + 1;
                        }
                        let mut wl_limit: u32 = 0u32;
                        wl_limit += (u32::MAX as f32 * 0.1 * wheel_state.prizes[prize_index as usize].probability) as u32;
                        if result <= wl_limit {
                            transfer(
                                CpiContext::new_with_signer(
                                    ctx.accounts.token_program.to_account_info(),
                                    Transfer {
                                        from: ctx.accounts.wheel_token_account.to_account_info(),
                                        to: ctx.accounts.user_token_account.to_account_info(),
                                        authority: ctx.accounts.global_state.to_account_info(),
                                    },
                                    &[&global_state_seeds[..]],
                                ),
                                1,
                            )?;
                        } else {
                            wl_limit += (u32::MAX as f32 * 0.05 * wheel_state.prizes[prize_index as usize].probability) as u32;
                            if result <= wl_limit {
                                transfer(
                                    CpiContext::new_with_signer(
                                        ctx.accounts.token_program.to_account_info(),
                                        Transfer {
                                            from: ctx.accounts.wheel_token_account.to_account_info(),
                                            to: ctx.accounts.user_token_account.to_account_info(),
                                            authority: ctx.accounts.global_state.to_account_info(),
                                        },
                                        &[&global_state_seeds[..]],
                                    ),
                                    1,
                                )?;
                            } 
                        }

                    }
                }
                
            }
        } else {
            msg!("Nothing this time. Let's try again?")
        }

        Ok(())
    }
}