import React from 'react';
import Swal from 'sweetalert2';

export default function Whell_not_found () {
	return (
		<React.Fragment>
			<div className="main_content">
				<div className="content_case">
					<div className="button-back-group">
						<div className="back-to-case-border">
							<a href="/home" className="button-back-to-case">
								<img src="/assets/img/open_case/arrow-left.png?v=2" alt="" className="arrow-left" />
								Back to the cases
							</a>
						</div>
					</div>
					<div className="decorate_block_content"></div>
					<div className="top-case-title">
						<h1 className="open-case">You open the case <a className='decor-text-case-title'>”The cursed box”</a></h1>
					</div>
					<div className="roll-main">
						<div className="not-login-roll roll-not-login">
							<div className="not-login-case">
								<div className="not-logged-block roll-not-login">
									<img src="/assets/img/open_case/not-logged-small.png?v=2" alt="" className="not-logged-img" />
									<div className="text-content-not-logged">
										<p className="text-content-not-logged1">You are not logged in!</p>
										<p className="text-content-not-logged2">Please connect your wallet to continue</p>
									</div>
								</div>
							</div>
						</div>

						<div className="roll-content">
							<div className="bottom_backgroumd-roll"></div>
							<img src="/assets/img/roll/arrow-roll.png?v=2" alt="" className="roll-arrow1" />
							<div className="roll_block">
								<div className="roll-block-border">
									<img src="/assets/img/roll/arrow-roll-2.png?v=2" alt="" className="roll-arrow2" />
									<div id="roll" className="roll">
										<div className="item_roll">
											<div className="item_roll_obj item_1">
												<img src="/assets/img/roll/item_roll_obj_img_back.png?v=2" alt="image_case" className="item_roll_obj_img_back" />
												<div className="item_text_roll_obj"><img src="/assets/img/roll/x2.png?v=2" alt="" className="x2-roll" /></div>
												<div className="item_text_roll_obj_2">
													<p className="item_text_roll_obj_2-one">X2 Multiplier</p> <p className="item_text_roll_obj_2-two">“SOL”</p>
												</div>
											</div>
											<div className="item_roll_obj item_2">
												<img src="/assets/img/roll/item_roll_obj_img_back.png?v=2" alt="image_case" className="item_roll_obj_img_back" />
												<div className="item_text_roll_obj"><img src="/assets/img/roll/x10.png?v=2" alt="" className="x10-roll" /></div>
												<div className="item_text_roll_obj_2 obj-x10">
													<p className="item_text_roll_obj_2-one">X10 Multiplier</p> <p className="item_text_roll_obj_2-two">“SOL”</p>
												</div>
											</div>
											<div className="item_roll_obj item_3">
												<img src="/assets/img/roll/monet.png?v=2" alt="image_case" className="item_roll_image_case" />
											</div>
											<div className="item_roll_obj item_4">
												<img src="/assets/img/roll/item_roll_obj_img_back.png?v=2" alt="image_case" className="item_roll_obj_img_back item_4_pos" />
												<div className="percent-item_text_roll_obj" />
												<img src="/assets/img/roll/star.png?v=2" alt="" className="start_roll_obj" />
												-50%
											</div>
											<div className="percent-item_text_roll_obj_2">
												Almost lost
											</div>
										</div>
										<div className="item_roll_obj item_6">
											<img src="/assets/img/roll/item_roll_obj_img_back.png?v=2" alt="image_case" className="item_roll_obj_img_back item_6_pos" />
											<div className="hert-percent-item_text_roll_obj">
												<img src="/assets/img/roll/heart.png?v=2" alt="" className="start_roll_obj heart" />
												-100%
											</div>
											<div className="percent-item_text_roll_obj_2">
												Almost lost
											</div>
										</div>
										<div className="item_roll_obj item_7">
											<img src="/assets/img/roll/monet.png?v=2" alt="image_case" className="item_roll_image_case" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}
