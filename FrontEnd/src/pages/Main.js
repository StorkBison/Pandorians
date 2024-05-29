import React from "react";
import { ContactUs } from "../components/ContactUs";

/*Connect Solana Connect*/
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { store } from "../store/store";

//Router
import {
  Route,
  BrowserRouter,
  Routes,
  NavLink,
} from "react-router-dom";
import MainTpl from "./tpl/MainTpl";
import About from "./tpl/About";
import NotFound from "./tpl/NotFound";
import Faq from "./tpl/Faq";
import WheelNotFound from "./tpl/WheelNotFound";
import OpenCaseNotLogin from "./tpl/OpenCaseNotLogin";
import Boxes from "./tpl/Boxes";
import Wheels from "./tpl/Wheels";
import MyProfile from "./tpl/MyProfile";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import StakingTpl from "./tpl/Staking";
import { Provider } from "react-redux";
import { RPCURL } from "../config";
require( "@solana/wallet-adapter-react-ui/styles.css" );

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter(),
];


function App () {
  const wallet = useWallet();
  if ( !wallet.connected ) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return <WalletMultiButton />;
  } else {
    return <WalletDisconnectButton><span>{wallet.publicKey?.toBase58()}</span></WalletDisconnectButton>;
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const Main = () => (
  <Provider store={store}>
    <BrowserRouter>
      <ConnectionProvider endpoint={RPCURL}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <React.Fragment>
              <div className="head-block-2">
                <div className="head-block-border-2">
                  <div className="head-block-border-2-left">
                    <div className="head-block-2-logotype">
                      <img
                        src="/assets/img/main/logo-left.svg"
                        className="logotype_image"
                        alt=""
                      />
                      <a href="/" className="logotype_link">
                        <p className="logotype_text">PANDORIANS</p>
                      </a>
                    </div>
                    <div className="a-links">
                      <NavLink to="home" className="a-link_head">
                        <img
                          src="/assets/img/main/a-link_hover.png?v=2"
                          className="a-href-link hide"
                          alt=""
                        />
                        <img
                          src="/assets/img/main/a-link-1.png?v=2"
                          className="a-href-link"
                          alt=""
                        />
                        <p className="a-href-link-text">HOME</p>
                      </NavLink>
                      <img
                        src="/assets/img/main/border-small.png?v=2"
                        className="border-a-links"
                        alt=""
                      />
                      <NavLink to="about" className="a-link_head">
                        <img
                          src="/assets/img/main/a-link_hover.png?v=2"
                          className="a-href-link hide"
                          alt=""
                        />
                        <img
                          src="/assets/img/main/a-link-2.png?v=2"
                          className="a-href-link"
                          alt=""
                        />
                        <p className="a-href-link-text">ABOUT</p>
                      </NavLink>
                      <img
                        src="/assets/img/main/border-small.png?v=2"
                        className="border-a-links"
                        alt=""
                      />
                      <NavLink to="faq" className="a-link_head">
                        <img
                          src="/assets/img/main/a-link_hover.png?v=2"
                          className="a-href-link hide"
                          alt=""
                        />
                        <img
                          src="/assets/img/main/a-link-3.png?v=2"
                          className="a-href-link"
                          alt=""
                        />
                        <p className="a-href-link-text">FAQ</p>
                      </NavLink>
                      <NavLink to="staking" className="button-link_head">
                        Staking
                      </NavLink>
                    </div>
                  </div>
                  <div className="head-block-border-2-right">
                    <div className="social_link">
                      <a
                        href="https://discord.gg/pandorians"
                        target="_blank"
                        className="a-href-link-discord"
                        rel="noreferrer"
                      >
                        <img
                          src="/assets/img/main/discord.png?v=2"
                          alt=""
                          className="a-discord"
                        />
                      </a>
                      <a
                        href="https://twitter.com/Pandorians_"
                        target="_blank"
                        className="a-href-link-twitter"
                        rel="noreferrer"
                      >
                        <img
                          src="/assets/img/main/twitter.png?v=2"
                          alt=""
                          className="a-twitter"
                        />
                      </a>
                    </div>
                    <App />
                  </div>
                </div>
              </div>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<MainTpl />} />
                <Route path="/home" element={<MainTpl />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/wheelNotFound" element={<WheelNotFound />} />
                <Route path="/wheel/:Wheel_name" element={<Wheels />} />
                <Route
                  path="/openCaseNotLogin"
                  element={<OpenCaseNotLogin />}
                />
                <Route path="/box/:name" element={<Boxes />} />
                <Route path="/myProfile" element={<MyProfile />} />
                <Route path="/staking" element={<StakingTpl />} />
                <Route path="*" element={<NotFound />} />
              </Routes>

              <div className="footer-block">
                <div className="footer-block-top">
                  <div className="footer-block-top-border">
                    <div className="block-footer-a">
                      <p className="title-footer-block">INFORMATION</p>
                      <div className="title-footer-group-a">
                        <NavLink to="home" className="link-footer">
                          <img
                            src="/assets/img/main/a-link-1.png?v=2"
                            alt=""
                            className="link-footer-image"
                          />
                          HOME
                        </NavLink>
                        <NavLink to="about" className="link-footer">
                          <img
                            src="/assets/img/main/a-link-2.png?v=2"
                            alt=""
                            className="link-footer-image"
                          />
                          ABOUT
                        </NavLink>
                        <NavLink to="faq" className="link-footer">
                          <img
                            src="/assets/img/main/a-link-3.png?v=2"
                            alt=""
                            className="link-footer-image"
                          />
                          FAQ
                        </NavLink>
                      </div>
                    </div>
                    <div className="block-footer-a">
                      <p className="title-footer-block">ABOUT US</p>
                      <div className="title-footer-group-a">
                        <a
                          href="https://pandorians.gitbook.io/pandorians-whitepaper/"
                          target="_blank"
                          className="link-footer"
                          rel="noreferrer"
                        >
                          Whitepaper
                        </a>
                        <NavLink to="faq" className="link-footer">
                          FAQ
                        </NavLink>
                      </div>
                    </div>
                    <div className="block-footer-a">
                      <p className="title-footer-block">OUR SOCIALS</p>
                      <div className="title-footer-group-b">
                        <div className="social_link-footer">
                          <a
                            href="https://discord.gg/pandorians"
                            target="_blank"
                            className="a-href-link-discord"
                            rel="noreferrer"
                          >
                            <img
                              src="/assets/img/main/discord.png?v=2"
                              alt=""
                              className="a-discord"
                            />
                          </a>
                          <a
                            href="https://twitter.com/Pandorians_"
                            target="_blank"
                            className="a-href-link-twitter"
                            rel="noreferrer"
                          >
                            <img
                              src="/assets/img/main/twitter.png?v=2"
                              alt=""
                              className="a-twitter"
                            />
                          </a>
                          <a
                            href="https://t.me/PandoriansNFT"
                            target="_blank"
                            className="a-href-link-telegram"
                            rel="noreferrer"
                          >
                            <img
                              src="/assets/img/main/telegram.png?v=2"
                              alt=""
                              className="a-telegram"
                            />
                          </a>
                        </div>
                      </div>
                      <div className="title-footer-group-c">
                        <p className="title-footer-block">CONTACT US</p>
                        <div className="title-footer-group-b">
                          <a
                            href="mailto:info@pandorians.io"
                            className="link-footer-mail"
                          >
                            info@pandorians.io
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="block-footer-a">
                      <ContactUs />
                    </div>
                  </div>
                </div>
              </div>

              <div className="footer-block-bottom">
                <div className="footer-block-bottom-border">
                  <p className="cop_footer">
                    © 2022 Pandorians.com All Rights Reserved.
                  </p>
                  {/*<div className="group-link-cop-footer">*/}
                  {/*	<a href="#" className="footer-link-cop-footer">User agreement</a>*/}
                  {/*	<a href="#" className="footer-link-cop-footer">Usage Policy</a>*/}
                  {/*</div>*/}
                </div>
              </div>
            </React.Fragment>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </BrowserRouter>
  </Provider>
);

export default Main;
