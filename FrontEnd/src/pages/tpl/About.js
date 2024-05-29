import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProvider, CandyMachine } from '../../solana';

export default function About () {
	const wallet = useWallet();
	const provider = getProvider( wallet );

	const candy = new CandyMachine( "DtFzJ3U5kXFe3hHynHwUjgcxHkG5tqt4hgAZrxSV6UFU", provider );

	async function mintOneToken () {
		await candy.mint();
	}

	return (
		<React.Fragment>
			<div className="top-faq">
				<div className="top-faq-border">
					<img src="/assets/img/faq/decor-top-left.png" alt="image_case" className="faq-decor-left" />
					<img src="/assets/img/faq/decor-top-right.png" alt="" className="faq-decor-right" />
					<div className="top-content-faq">
						<p className="top-content-faq-text1">PANDORIANS</p>
						<p className="top-content-faq-text2">The first gaming platform with Mystery Boxes on Solana blockchain based on VRF (provably fair and verifiable random number generator)</p>
						<div className="button-mint" onClick={mintOneToken}>MINT</div>
					</div>
				</div>
				<div className="image-main-nft-faq">
					<div className="image-nft-group-faq">
						<img src="/assets/img/faq/nft/image-1.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-2.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-3.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-4.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-5.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-6.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-7.png" alt="" className="nft-image-faq" />
						<img src="/assets/img/faq/nft/image-8.png" alt="" className="nft-image-faq" />
					</div>
				</div>
			</div>

			<div className="content-faq-border-cont">
				<div className="main-content-faq">
					<div className="decorate-faq-top"></div>
					<div className="content-left-faq">
						<div className="group-content-left-faq-1">
							<p className="faq-top-text">ABOUT</p>
							<p className="faq-small-text">The Pandora's box that opened one day released a lot of pain, death and destruction into the world, those few who were "lucky enough" to stay alive turned out to be forever cursed hostages of their sins, vices and passions. They are the Pandorians. In the first game mode, participants are invited to find the keys to Pandora's boxes, open them and find out what they are hiding.</p>
						</div>
						<div className="group-content-left-faq-2">
							<p className="faq-top-text">INFO</p>
							<div className="group-content-left-faq-2-list">
								<div className="list-faq-1">Pandorians on <a className="magic_link_about" href="#">Magic Eden<img src="/assets/img/faq/right-arrow.png" alt="" className="list-faq-right-arrow" /></a></div>
								<div className="list-faq-1">Pandorians <a className="magic_link_about" href="#">Rarity Chart<img src="/assets/img/faq/right-arrow.png" alt="" className="list-faq-right-arrow" /></a></div>
								<div className="list-faq-1">Pandorians <a className="magic_link_about" href="#">Whitepaper<img src="/assets/img/faq/right-arrow.png" alt="" className="list-faq-right-arrow" /></a></div>
							</div>
						</div>
						<div className="group-content-left-faq-3">
							<p className="faq-top-text">OVERVIEW</p>
							<div className="group-content-left-faq-3-list">
								<p className="list-faq-3">
									<img src="/assets/img/faq/confirm.png" alt="" className="confirm-faq" />
									Membership
								</p>
								<p className="list-faq-3">
									<img src="/assets/img/faq/confirm.png" alt="" className="confirm-faq" />
									Premium Utility
								</p>
								<p className="list-faq-3">
									<img src="/assets/img/faq/confirm.png" alt="" className="confirm-faq" />
									1000 Supply
								</p>
							</div>
						</div>
						<div className="group-content-left-faq-4">
							<p className="faq-top-text">ROADMAP</p>
							<div className="group-content-left-faq-4-list">
								<div className="list-faq-4">
									<p className="list-faq-4-title">Q3 2022</p>
									<p className="list-faq-4-description">
										●	Release Pandorians Whitepaper V1<br />
										●	Render Pandorians NFT Collection<br />
										●	Start marketing campaign (social, collabs, etc)<br />
										●	Develop smart contracts (box, wheel, staking) and website<br />
										●	Announce mint details (date, supply, etc)<br />
										●	Run close testing on devnet
									</p>
								</div>
								<div className="list-faq-4">
									<p className="list-faq-4-title">Q4 2022</p>
									<p className="list-faq-4-description">
										●	Listing & Mint Pandroians Collection<br />
										●	Deploy to mainnet, open access for everyone<br />
										●	Buy 3rd party NFTs for Boxes<br />
										●	Develop and launch Referral Program<br />
										●	Update Pandorians Whitepaper to V2<br />
										●	Start working on the next game mode
									</p>
								</div>
								<div className="list-faq-4">
									<p className="list-faq-4-title">Q1 2023</p>
									<p className="list-faq-4-description">
										●	... comes with Pandrorians Whitepaper V2
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="content-right-faq">
						<div className="top-right-faq-1">
							<div className="image-button-buy">
								<div className="button-buy-nft-about">BUY NOW! <img src="/assets/img/faq/bank.png" alt="" className="button-buy-nft-about-img" /></div>
								<img src="/assets/img/faq/treding-nft.png" alt="" className="top-rigt-dec-1" />
							</div>

							<div className="group-image-faq-right">
								<a className="group-image-faq-right-a" href="https://phantom.app"><img src="/assets/img/faq/PhantomWallet.png" alt="" className="group-image-obj" /></a>
								<a className="group-image-faq-right-a" href="https://solflare.com"><img src="/assets/img/faq/SolflareWallet.png" alt="" className="group-image-obj" /></a>
								<a className="group-image-faq-right-a" href="https://slope.finance"><img src="/assets/img/faq/SlopeConnect.png" alt="" className="group-image-obj" /></a>
							</div>
						</div>
						<div className="top-right-faq-2">
							<img src="/assets/img/faq/right-background.png" alt="" className="group-image-obj-2" />
						</div>
					</div>
				</div>
			</div>

			<div className="faq-6-content">
				<div className="faq-6-border">
					<p className="faq-top-text">CREATOR TEAM</p>
					<div className="creator-content-faq">
						<div className="creator-content-faq-obj">
							<img src="/assets/img/faq/cop/Borka.jpg" alt="" className="creator-content-faq-img" />
							<p className="top-creator">Borka</p>
							<p className="top-creator-small">Chief Executive Officer</p>
							<div className="social-creator">
								<a href="https://twitter.com/io_borka" className="social-twitter-faq">
									<img src="/assets/img/faq/twitter.svg" alt="" className="social-twitter-img-faq" />
								</a>
							</div>
						</div>
						<div className="creator-content-faq-obj">
							<img src="/assets/img/faq/cop/0x6ix.jpg" alt="" className="creator-content-faq-img" />
							<p className="top-creator">0x6ix</p>
							<p className="top-creator-small">Chief Technical Officer</p>
							<div className="social-creator">
								<a href="https://twitter.com/0x6ix" className="social-twitter-faq">
									<img src="/assets/img/faq/twitter.svg" alt="" className="social-twitter-img-faq" />
								</a>
							</div>
						</div>
						<div className="creator-content-faq-obj">
							<img src="/assets/img/faq/cop/Clamorous.jpg" alt="" className="creator-content-faq-img" />
							<p className="top-creator">Clamorous</p>
							<p className="top-creator-small">Chief Marketing Officer</p>
							<div className="social-creator">
								<a href="https://twitter.com/clamorous_s" className="social-twitter-faq">
									<img src="/assets/img/faq/twitter.svg" alt="" className="social-twitter-img-faq" />
								</a>
							</div>
						</div>
						<div className="creator-content-faq-obj">
							<img src="/assets/img/faq/cop/QnlWhale.jpg" alt="" className="creator-content-faq-img" />
							<p className="top-creator">QnlWhale</p>
							<p className="top-creator-small">Chief Operating Officer</p>
							<div className="social-creator">
								<a href="https://twitter.com/QnIWhale" className="social-twitter-faq">
									<img src="/assets/img/faq/twitter.svg" alt="" className="social-twitter-img-faq" />
								</a>
							</div>
						</div>
						<div className="creator-content-faq-obj">
							<img src="/assets/img/faq/cop/Daryn.jpg" alt="" className="creator-content-faq-img" />
							<p className="top-creator">Daryn</p>
							<p className="top-creator-small">Artist</p>
							<div className="social-creator">
							</div>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}
