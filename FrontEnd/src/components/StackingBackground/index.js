import React from 'react';

import BigTokenSrc from '../../assets/images/staking/bg-big-token-min.png';
import BigTokenSrc2x from '../../assets/images/staking/bg-big-token-min@2x.png';
import MidTokenSrc from '../../assets/images/staking/bg-mid-token-min.png';
import MidTokenSrc2x from '../../assets/images/staking/bg-mid-token-min@2x.png';
import SmTokenSrc from '../../assets/images/staking/bg-sm-token-min.png';
import SmTokenSrc2x from '../../assets/images/staking/bg-sm-token-min@2x.png';
import XsTokenSrc from '../../assets/images/staking/bg-xs-token-min.png';
import XsTokenSrc2x from '../../assets/images/staking/bg-xs-token-min@2x.png';
import OverlaySrc from '../../assets/images/staking/bg-overlay.png';

function StakingBackground() {
  return (
    <div className="staking-page-bg">
      <div className="bg-container">
        <img
          className="big-token"
          srcSet={`${BigTokenSrc} 1x, ${BigTokenSrc2x} 2x`}
          src={BigTokenSrc}
          alt="Big bg token"
        />
        <img
          className="mid-token"
          srcSet={`${MidTokenSrc} 1x, ${MidTokenSrc2x} 2x`}
          src={MidTokenSrc}
          alt="Mid bg token"
        />
        <div className="blur-ellipse-1" />
        <div className="blur-ellipse-2" />
        <img
          className="sm-token"
          srcSet={`${SmTokenSrc} 1x, ${SmTokenSrc2x} 2x`}
          src={SmTokenSrc}
          alt="Sm bg token"
        />
        <div className="blur-ellipse-3" />
        <div className="blur-ellipse-4" />
        <img
          className="xs-token"
          srcSet={`${XsTokenSrc} 1x, ${XsTokenSrc2x} 2x`}
          src={XsTokenSrc}
          alt="Xs bg token"
        />
        <img
          className="bg-blurry-overlay"
          src={OverlaySrc}
          alt="Bg blurry overlay"
        />
      </div>
    </div>
  );
}

export default StakingBackground;
