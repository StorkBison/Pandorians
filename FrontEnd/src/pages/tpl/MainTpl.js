import React from "react";

//Router
import { NavLink } from "react-router-dom";

function yMetrika ( ...args ) {
  if ( !process.browser || !( 'ym' in window ) ) return;
  window.ym( 94297964, ...args );
}

function gTag ( ...args ) {
  if ( !process.browser || !( 'gtag' in window ) ) return;
  window.gtag( ...args );
}

export default class Main_tpl extends React.Component {
  render () {
    return (
      <React.Fragment>
        <div className="head-block-3">
          <div className="head-block-3-border">
            <div className="decoration-top-block">
              <img
                src="/assets/img/main/fly/top-fly-1.png"
                alt="fly-ico-1-decoration"
                className="decoration-top-block-img-1"
              />
              <img
                src="/assets/img/main/fly/top-fly-2.png"
                alt="fly-ico-2-decoration"
                className="decoration-top-block-img-2"
              />
              <img
                src="/assets/img/main/fly/top-fly-3.png"
                alt="fly-ico-3-decoration"
                className="decoration-top-block-img-3"
              />
            </div>
            <div className="left-content-block-3">
              <div className="group-content-block-3">
                <img
                  src="/assets/img/main/header-case.png?v=2"
                  alt=""
                  className="header-case-img"
                />
                <div className="group-2-content-block-3">
                  <p className="group_text1">1303</p>
                  <p className="group_text2">Open cases</p>
                </div>
              </div>
              <img
                src="/assets/img/main/border.png?v=2"
                className="border-a-links-2"
                alt=""
              />
              <div className="group-content-block-3">
                <img
                  src="/assets/img/main/header-user.png?v=2"
                  alt=""
                  className="header-case-img"
                />
                <div className="group-2-content-block-3">
                  <p className="group_text1">1997</p>
                  <p className="group_text2">Users</p>
                </div>
              </div>
              <img
                src="/assets/img/main/border.png?v=2"
                className="border-a-links-2"
                alt=""
              />
              <div className="group-content-block-3">
                <img
                  src="/assets/img/main/header-online-small.png?v=2"
                  alt=""
                  className="header-case-img"
                />
                <div className="group-2-content-block-3">
                  <p className="group_text1">628</p>
                  <p className="group_text2">Online</p>
                </div>
              </div>
            </div>
          </div>
          <div className="header-content-border">
            <div className="header-content-left">
              <img
                src="/assets/img/main/light.png"
                alt=""
                className="backgound-img-slide"
              />
              <img
                src="/assets/img/main/head-slide/header-slide-img-2.png?v=2"
                alt=""
                className="slide_img"
              />
              <div className="slide_cube">
                <div className="cube active"></div>
                <div className="cube"></div>
                <div className="cube"></div>
                <div className="cube"></div>
              </div>
            </div>
            <div className="header-content-right">
              <p className="header-content-right_text1">
                The first NFT Mystery Boxes on{" "}
                <span className="custom_style_text_1">Solana blockchain</span>
              </p>
              <p className="header-content-right_text2">
                We invite you to spin The Wheels of Fortune to find the keys for
                Pandora's Boxes that contain NFTs
              </p>
              <NavLink to="/about" className="button_learn_more_header">
                learn more
              </NavLink>
              <div className="scroll-bottom">
                <img
                  src="/assets/img/main/mouse-bottom.png?v=2"
                  alt=""
                  className="scroll-down"
                />
                <p className="scroll-bottom-text">SCROLL DOWN</p>
              </div>
            </div>
          </div>
        </div>
        <div className="main_content" />
        <div className="content_block">
          <div className="decoration-top-block-2">
            <img
              src="/assets/img/main/fly/left-fly-1.png"
              alt="fly-ico-1-decoration"
              className="decoration-left-block-img-1"
            />
            <img
              src="/assets/img/main/fly/right-fly-1.png"
              alt="fly-ico-2-decoration"
              className="decoration-right-block-img-2"
            />
          </div>
          <div className="image-decorate-content-block-2"></div>
          <div className="content_block-border">
            <div className="decorate_block_content"></div>
            <div className="content_block-top first">
              <img
                src="/assets/img/main/main_contant-top-1.png?v=2"
                alt=""
                className="content-top-img"
              />
              <p className="content-block-top-text">
                Win SOL or get the Key to open Pandora’s Box
              </p>
            </div>
            <div className="group_case">
              <NavLink to="/wheel/steel" className="case_content box-cont">
                <div onClick={() => {
                  yMetrika( "reachGoal", "Посещение страницы Steel Wheel" );
                  gTag( "event", "Посещение страницы Steel Wheel" );
                }}>
                  <p className="box-title">Steel Wheel</p>
                  <div className="cost_box_border">
                    <p className="cost_box">
                      0.2 SOL <i className="ico-sol"></i>
                    </p>
                  </div>
                  <img
                    src="/assets/img/main/cases/case-2.png?v=3"
                    alt=""
                    className="case"
                  />
                </div>
              </NavLink>
              <div className="case_content box-cont">
                {/* <NavLink to="/wheel/cursed" className="case_content box-cont"> */}
                <div onClick={() => {
                  yMetrika( "reachGoal", "Переход на Cursed Wheel" );
                  gTag( "event", "Переход на Cursed Wheel" );
                }}>
                  <p className="box-title">Cursed Wheel</p>
                  <div className="cost_box_border">
                    <p className="cost_box">
                      0.5 SOL <i className="ico-sol"></i>
                    </p>
                  </div>
                  <img
                    src="/assets/img/main/cases/case-3.png?v=3"
                    alt=""
                    className="case"
                  />
                </div>
                {/* </NavLink> */}
              </div>
              <div className="case_content box-cont">
                {/* <NavLink to="/wheel/gold" className="case_content box-cont"> */}
                <div onClick={() => {
                  yMetrika( "reachGoal", "Переход на Gold Wheel" );
                  gTag( "event", "Переход на Gold Wheel" );
                }}>
                  <p className="box-title">Gold Wheel</p>
                  <div className="cost_box_border">
                    <p className="cost_box">
                      1 SOL <i className="ico-sol"></i>
                    </p>
                  </div>
                  <img
                    src="/assets/img/main/cases/case-1.png?v=3"
                    alt=""
                    className="case"
                  />
                </div>
                {/* </NavLink> */}
              </div>
            </div>
            <div className="content_block-top-2">
              <img
                src="/assets/img/main/main_contant-top-2.png?v=2"
                alt=""
                className="content-top-img-2"
              />
              <p className="content-block-top-text-2">
                Open Pandora’s Box and know what it’s hiding
              </p>
            </div>
            <div className="group-boxs">
              <div className="top-box">
                <NavLink to="/box/legendary" className="box first">
                  <div onClick={() => {
                    yMetrika( "reachGoal", "Посещение страницы Legendary Box" );
                    gTag( "event", "Посещение страницы Legendary Box" );
                  }}>
                    <div className="box_hover">
                      Use Legendary Key <i className="image-arrow-right"></i>
                    </div>
                    <p className="box-title">Legendary Box</p>
                    <img
                      src="/assets/img/main/box/Legendarybox.png?v=3"
                      alt=""
                      className="box-image"
                    />
                  </div>
                </NavLink>
              </div>
              <div className="bottom-box">
                <NavLink to="/box/steel" className="box">
                  <div onClick={() => {
                    yMetrika( "reachGoal", "Посещение страницы Steel Box" );
                    gTag( "event", "Посещение страницы Steel Box" );
                  }}>
                    <div className="box_hover">
                      Use Steel Key <i className="image-arrow-right"></i>
                    </div>
                    <p className="box-title">Steel Box</p>
                    <img
                      src="/assets/img/main/box/Stellbox.png?v=3"
                      alt=""
                      className="box-image"
                    />
                  </div>
                </NavLink>
                <div className="box">
                  {/* <NavLink to="/box/cursed" className="box"> */}
                  <div onClick={() => {
                    yMetrika( "reachGoal", "Переход на Cursed Box" );
                    gTag( "event", "Переход на Cursed Box" );
                  }}>
                    <div className="box_hover">
                      Use Cursed Key <i className="image-arrow-right"></i>
                    </div>
                    <p className="box-title">Cursed Box</p>
                    <img
                      src="/assets/img/main/box/cursed-box.png?v=3"
                      alt=""
                      className="box-image"
                    />
                  </div>
                  {/* </NavLink> */}
                </div>
                <div className="box">
                  {/* <NavLink to="/box/gold" className="box"> */}
                  <div onClick={() => {
                    yMetrika( "reachGoal", "Переход на Gold Box" );
                    gTag( "event", "Переход на Gold Box" );
                  }}>
                    <div className="box_hover">
                      Use Gold Key <i className="image-arrow-right"></i>
                    </div>
                    <p className="box-title">Gold Box</p>
                    <img
                      src="/assets/img/main/box/GoldBox.png?v=3"
                      alt=""
                      className="box-image"
                    />
                  </div>
                  {/* </NavLink> */}
                </div>
              </div>
            </div>
            <div className="discord-block">
              <a
                href="https://discord.com/invite/pandorians"
                target="_blank"
                className="air-discord"
                rel="noreferrer"
              >
                <img src="/assets/img/main/discord-let.png?v=2" alt="" />
              </a>
              <div className="left-discord-block">
                <img
                  src="/assets/img/main/discord-big-1.png?v=2"
                  alt=""
                  className="discord-image-small"
                />
                <p className="discord_text_block_1">
                  Join Our Community right now!
                </p>
                <p className="discord_text_block_2">
                  Join us to get the news as soon as possible and follow our
                  latest announcements. Participate in the life of the community
                  and get rewards.
                </p>
                <a
                  href="https://discord.com/invite/pandorians"
                  target="_blank"
                  className="discord_join_now"
                  rel="noreferrer"
                >
                  JOIN NOW!
                </a>
              </div>
              <div className="right-discord-block">
                <img
                  src="/assets/img/main/discord-big-2.png?v=2"
                  alt=""
                  className="discord-image-big"
                />
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
