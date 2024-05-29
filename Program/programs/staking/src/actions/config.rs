use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::{initialize_account, spl_token::native_mint, InitializeAccount};

use crate::*;

#[derive(Accounts)]
#[instruction(params: ConfigParams)]
pub struct Config<'info> {
    #[account(
        init,
        seeds = [ STAKING_STATE_SEED, &params.staking_id.to_be_bytes() ],
        payer = payer,
        space = 8 + mem::size_of::<StakingState>(),
        bump,
    )]
    pub staking_state: AccountLoader<'info, StakingState>,

    /// CHECK: it's ok, because will be initialized inside.
    #[account(mut,
        seeds = [ STAKING_WALLET_SEED, &params.staking_id.to_be_bytes() ],
        bump
    )]
    pub staking_wallet: UncheckedAccount<'info>,

    #[account(address = native_mint::ID)]
    pub native_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ConfigParams {
    pub configs: [RarityConfigParams; 5],
    pub fund_fee_basis_points: u16,
    pub staking_id: u16,
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct RarityConfigParams {
    pub capacity: u32,
    pub speed: u32,
    pub supply: u32,
}

impl Default for RarityConfigParams {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

impl Config<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &ConfigParams) -> Result<()> {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &ConfigParams) -> Result<()> {
        let staking_wallet_seeds = [
            STAKING_WALLET_SEED,
            &params.staking_id.to_be_bytes()[..],
            &[*ctx.bumps.get("staking_wallet").unwrap()],
        ];

        // Initialize Staking wallet
        create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.staking_wallet.to_account_info(),
                },
                &[&staking_wallet_seeds[..]],
            ),
            ctx.accounts.rent.minimum_balance(TokenAccount::LEN),
            TokenAccount::LEN as u64,
            &ctx.accounts.token_program.key(),
        )?;

        initialize_account(CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            InitializeAccount {
                account: ctx.accounts.staking_wallet.to_account_info(),
                mint: ctx.accounts.native_mint.to_account_info(),
                authority: ctx.accounts.staking_state.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &[&staking_wallet_seeds[..]],
        ))?;

        // Initialize Staking State
        let mut staking_state = ctx.accounts.staking_state.load_init()?;
        *staking_state = StakingState::default();

        staking_state.fund_fee_basis_points = params.fund_fee_basis_points as u32;
        for (i, config) in params.configs.iter().enumerate() {
            staking_state.configs[i] = RarityConfig {
                capacity: config.capacity,
                speed: config.speed,
                supply: config.supply,
            }
        }

        Ok(())
    }
}
