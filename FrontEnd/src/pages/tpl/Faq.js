import React from 'react';

export default function Faq () {
  return (
    <React.Fragment>
      <div className="Grid-group-faq-5-content">
        <div className="faq-5-content">
          <div className="faq-5-content-border">
            <p className="faq-top-text-5">FAQ</p>
            <div className="content-group-faq-5">
              <div className="faq-5-content-left">
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What are Pandorians?</p>
                  <div className="open-faq-5-obj-read">
                    Pandorians are building special site to change gambling meta. The idea starts with Mystery Boxes and Keys to open them.
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">How can I trust your random system?</p>
                  <div className="open-faq-5-obj-read">
                    For full transparency and honesty of the system functioning, we used - VFR.
                    A Verifiable Random Function (VRF) is a public-key pseudorandom function that provides proofs that its outputs were calculated correctly. This means we can use a cryptographic keypair to generate a random number with a proof, which can then be validated by anyone to ensure the value was calculated correctly without the possibility of leaking the producer’s secret key.
                    Switchboard's VRF implementation uses the oracle authority secret key to publish the VRF proof on-chain. The on-chain proof verification is very computationally expensive and requires 276 instructions on-chain to fully verify. Once the proof is submitted on-chain anyone can turn the VRF crank to produce the pseduorandom result, although for simplicity and speed the Switchboard oracle that submitted the proof also submits the verification instructions.
                    The final proof verification instruction invokes the VRF Account's specified callback, which allows developers to integrate pseduorandomness into their applications and be confident they are consuming the latest pseduorandom r
                    esult.

                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">Where can i track transactions?</p>
                  <div className="open-faq-5-obj-read">
                    -
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What is the supply? </p>
                  <div className="open-faq-5-obj-read">
                    1000
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What is Pandora’s Store? (coming soon)</p>
                  <div className="open-faq-5-obj-read">
                    Pandora's Tower Store is a place where users can buy some game items, such as keys to secret boxes, spins of the wheel of fortune for $SOL and $PND.
                  </div>
                </div>
              </div>

              <div className="faq-5-content-right">
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What are Pandorians utilities for holders?</p>
                  <div className="open-faq-5-obj-read">
                    Utility for holders:<br />
                    · % for spins made on the site based on NFT rarity paid in SOL<br />
                    · DAO we gonna sweep some collections so we have to make a decision what to buy for mystery boxes. For good votings and invest advices holders will get the keys by airdrop and also free spins
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What are Pandorians utilities for participants?</p>
                  <div className="open-faq-5-obj-read">
                    Utility for players:<br />
                    · 3 types of Wheels of Fortune where they can multiply their SOL or win a key<br />
                    · 4 rarities of Mystery Boxes with different prizes inside<br />
                    · Referral program
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What are the odds?</p>
                  <div className="open-faq-5-obj-read">
                    <table>
                      <tr>
                        <th></th>
                        <th>Steel Wheel</th>
                        <th>Cursed Wheel</th>
                        <th>Gold Wheel</th>
                      </tr>
                      <tr>
                        <td>0%</td>
                        <td>38.8%</td>
                        <td>39.8%</td>
                        <td>40%</td>
                      </tr>
                      <tr>
                        <td>50%</td>
                        <td>20%</td>
                        <td>20%</td>
                        <td>19.8%</td>
                      </tr>
                      <tr>
                        <td>100%</td>
                        <td>34%</td>
                        <td>34%</td>
                        <td>34%</td>
                      </tr>
                      <tr>
                        <td>200%</td>
                        <td>6%</td>
                        <td>5%</td>
                        <td>5%</td>
                      </tr>
                      <tr>
                        <td>Steel Key</td>
                        <td>0.7%</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                      <tr>
                        <td>Cursed Key</td>
                        <td>-</td>
                        <td>0.2%</td>
                        <td>-</td>
                      </tr>
                      <tr>
                        <td>Gold Key</td>
                        <td>-</td>
                        <td>-</td>
                        <td>0.4%</td>
                      </tr>
                      <tr>
                        <td>Legendary Key</td>
                        <td>0.1%</td>
                        <td>0.2%</td>
                        <td>0.4%</td>
                      </tr>
                    </table>
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">Referral Program (coming soon)</p>
                  <div className="open-faq-5-obj-read">
                    Each user can participate in the referral system of the project. You can get a unique promo code in your account, according to this promo code, for active actions in the project (attracting new players, posts in social networks etc) the user can get rewards.
                  </div>
                </div>
                <div className="open-faq-5-obj">
                  <img src="/assets/img/faq/plus.png" alt="" className="plus-faq" />
                  <p className="open-faq-5-text">What is $PND? (coming soon)</p>
                  <div className="open-faq-5-obj-read">
                    As a reward for social activity and inviting new participants, users get off-chain $PND tokens. Users can spend them in Pandora’s Store.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="discord-center-faq">
          <div className="discord-block discord-faq-content">
            <img src="/assets/img/main/discord-let.png" alt="" className="air-discord" />
            <div className="left-discord-block">
              <img src="/assets/img/main/discord-big-1.png" alt="" className="discord-image-small" />
              <p className="discord_text_block_1">Join Our Community right now!</p>
              <p className="discord_text_block_2">You are offered a choice of agents armed with various deadly skills, with which any weapon in your hands will sparkle with new colors.</p>
              <a href="#" className="discord_join_now">JOIN NOW!</a>
            </div>
            <div className="right-discord-block">
              <img src="/assets/img/main/discord-big-2.png" alt="" className="discord-image-big" />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}