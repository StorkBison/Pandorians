import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import arrow from "../../assets/images/svg/arrow.svg";
import { NavLink, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { config_wheels } from "./../../config/Config_wheels";
import NotFound from "./../tpl/NotFound";
import {
  useWallet,
} from "@solana/wallet-adapter-react";
import { Wheel } from "./../../solana";
import { Connection } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import { CSSTransition } from "react-transition-group";
import useYMetrika from "../../utils/hooks/useYMetrika";
import useGTag from "../../utils/hooks/useGTag";
import { RPCURL } from "../../config";
const StatusEnum = Object.freeze( {
  IDLE: "IDLE",
  PENDING: "PENDING",
  ERROR: "ERROR",
  FULLFILLED: "FULLFILLED",
} );

const MINUS_PRIZE = 4;

export const useWindowDimensions = () => {
  const [ width, setWidth ] = useState( 0 );
  const [ height, setHeight ] = useState( 0 );
  const changeDimensions = () => {
    setWidth( window.innerWidth );
    setHeight( window.innerHeight );
  };
  useEffect( () => {
    changeDimensions();
    window.addEventListener( "resize", changeDimensions );
    return () => window.removeEventListener( "resize", changeDimensions );
  }, [] );
  return { height, width };
};

const needTakePrizeError = "You should take your reward from prev spin!";

function MessageNotLogin () {
  const wallet = useWallet();

  if ( !wallet.connected ) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <React.Fragment>
        <div className="not-login-roll roll-not-login">
          <div className="not-login-case">
            <div className="not-logged-block roll-not-login">
              <img
                src="/assets/img/open_case/not-logged-small.png?v=2"
                alt=""
                className="not-logged-img"
              />
              <div className="text-content-not-logged">
                <p className="text-content-not-logged1">
                  You are not logged in!
                </p>
                <p className="text-content-not-logged2">
                  Please connect your wallet to continue
                </p>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

function ButtonBuy ( { wheelRef } ) {
  const wallet = useWallet();
  const { Wheel_name } = useParams();
  const name_wheel = config_wheels[ Wheel_name ];
  const wheelTicketsCountRef = useRef();
  const [ prize, setPrize ] = useState( null );
  const [ ticketCount, setTicketCount ] = useState( 0 );
  const [ status, setStatus ] = useState( StatusEnum.IDLE );
  const [ spinAvailableAfterLoose, setSpinAvailableAfterLoose ] = useState( false );
  const [ startTime, setStartTime ] = useState( null );
  const [ startTurns, setStartTurns ] = useState( 0 );
  const [ active, setActive ] = useState( false );
  const [ needTakePrize, setNeedTakePrize ] = useState( false );
  const [ takeButtonDisabled, setTakeButtonDisabled ] = useState( false );
  const [ errorMessage, setErrorMessage ] = useState( "" );
  const opts = {
    preflightCommitment: "processed",
  };

  const ym = useYMetrika();
  const gtag = useGTag();

  const handleCloseModal = useCallback( () => {
    setActive( false );
    setStatus( StatusEnum.IDLE );
  }, [] );

  const handleOpenModal = useCallback( () => {
    setActive( true );
  }, [] );

  function getProvider () {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = RPCURL;
    const connection = new Connection( network, opts.preflightCommitment );

    const provider = new AnchorProvider(
      connection,
      wallet,
      opts.preflightCommitment
    );
    return provider;
  }

  const provider = getProvider();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wheel = new Wheel( name_wheel, provider );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function getTicketsCount () {
    const count = await wheel.getTicketsCount();
    console.log( `get ticket count: ${ count }` );
    return count;
  }

  async function buyTicket () {
    try {
      await wheel.buyTickets( 1 );
      ym( 'reachGoal', `Buy ticket ${ Wheel_name.toUpperCase() } Wheel` );
      gtag( 'event', `Buy ticket ${ Wheel_name.toUpperCase() } Wheel` );
      const count = await getTicketsCount();
      setTicketCount( count );
    } catch ( e ) {
      setErrorMessage( e.message );

      handleOpenModal();
    }
  }

  useEffect( () => {
    if ( localStorage.getItem( wheel.wheelState ) != null ) {
      wheel.getWheelState();
    }
  }, [ prize ] );

  async function spinWheel () {
    try {
      const res = await wheel.spin( setStatus );
      ym( 'reachGoal', `Spin button ${ Wheel_name.toUpperCase() } Wheel` );
      gtag( 'event', `Spin button ${ Wheel_name.toUpperCase() } Wheel` );
      ym( 'reachGoal', 'SpinningCount' );
      if ( spinAvailableAfterLoose ) {
        setPrize( null );
      }

      if ( res ) {
        const firstFourBytes = res.randomness.subarray( 0, 4 );
        const view = new DataView( firstFourBytes.buffer );
        const u32 = view.getUint32( 0, true );
        let limit = 0;
        let result = 0;
        let prizez = name_wheel.Prohibitions;
        for ( let i = 0; i <= 6; i++ ) {
          limit += prizez[ i ] * 4294967295;
          if ( u32 < limit ) {
            result = i;
            break;
          }
        }
        setPrize( result );
        setSpinAvailableAfterLoose( false );
        setStatus( StatusEnum.FULLFILLED );
        return res;
      }
    } catch ( err ) {
      setErrorMessage( err.message );
      setNeedTakePrize(
        err.message
          .trim()
          .toLowerCase()
          .includes( needTakePrizeError.trim().toLowerCase() )
      );
      if ( err.message === "User rejected the request." ) {
        handleOpenModal();
      } else setStatus( StatusEnum.ERROR );
    }
  }

  async function takePrize () {
    try {
      setTakeButtonDisabled( true );
      const res = await wheel.takePrize();
      if ( res ) {
        setTakeButtonDisabled( false );
        setPrize( null );
        setStatus( StatusEnum.IDLE );
        setNeedTakePrize( false );
      }
    } catch ( e ) {
      console.log( e );
      setErrorMessage( e.message );
      setTakeButtonDisabled( false );
      setStatus( StatusEnum.IDLE );
      handleOpenModal();
    }
  }

  const MySwal = withReactContent( Swal );
  function not_auth () {
    MySwal.fire( <p>You need to connect a wallet</p> );
  }

  // component did mount, first render
  useEffect( () => {
    getTicketsCount().then( setTicketCount );
  }, [ wheel ] );

  // looking for current state status and run needed animations
  useEffect( () => {
    const EASE_IN_TURNS = 3;
    const LINEAR_TURNS = 180;
    const EASE_OUT_TURNS = 3;

    switch ( status ) {
      case StatusEnum.PENDING: {
        const startTurns = Math.abs( +wheelRef.current.style.transform.slice( 7, -5 ) );
        setStartTurns( startTurns );
        setStartTime( Date.now() );

        wheelRef.current.style.transitionTimingFunction = "ease-in";
        wheelRef.current.style.transitionDuration = `${ EASE_IN_TURNS }s`;
        wheelRef.current.style.transform = `rotate(-${ startTurns + EASE_IN_TURNS }turn)`;

        setTimeout( () => {
          wheelRef.current.style.transitionTimingFunction = "linear";
          wheelRef.current.style.transitionDuration = `${ LINEAR_TURNS / 2 }s`;
          wheelRef.current.style.transform = `rotate(-${ startTurns + EASE_IN_TURNS + LINEAR_TURNS
            }turn)`;
        }, 3000 );

        break;
      }

      case StatusEnum.FULLFILLED: {
        const elapsed = ( Date.now() - startTime ) / 1000;
        const currentTurns = ( elapsed - EASE_IN_TURNS ) * 2;

        const prizeTurn = prize / 7;
        const easeOutTurns =
          Math.floor( startTurns + currentTurns ) + EASE_OUT_TURNS * 2 + prizeTurn;
        setStartTime( easeOutTurns );

        wheelRef.current.style.transitionTimingFunction = "ease-out";
        wheelRef.current.style.transitionDuration = `${ EASE_OUT_TURNS + prizeTurn
          }s`;

        const onTransEnd = () => {
          if ( prize === MINUS_PRIZE ) {
            localStorage.removeItem( wheel.wheelState );
            setSpinAvailableAfterLoose( true );
          }
          wheelRef.current.removeEventListener( 'transitionend', onTransEnd );
        };

        wheelRef.current.addEventListener( 'transitionend', onTransEnd );

        wheelRef.current.style.transform = `rotate(-${ easeOutTurns }turn)`;

        break;
      }

      case StatusEnum.IDLE: {
        break;
      }

      default: {
        break;
      }
    }
  }, [ status ] );

  useEffect( () => {
    const EASE_IN_TURNS = 3;
    const EASE_OUT_TURNS = 3;

    if ( status === StatusEnum.ERROR ) {
      if ( needTakePrize ) {
        handleOpenModal();
      } else {
        setTimeout( () => {
          const elapsed = ( Date.now() - startTime ) / 1000;
          const currentTurns = ( elapsed - EASE_IN_TURNS ) * 2;
          const easeOutTurns = Math.floor( currentTurns ) + EASE_OUT_TURNS * 2;
          setStartTime( easeOutTurns );
          wheelRef.current.style.transitionTimingFunction = "ease-out";
          wheelRef.current.style.transitionDuration = `${ EASE_OUT_TURNS * 4 }s`;
          wheelRef.current.style.transform = `rotate(-${ easeOutTurns }turn)`;

          handleOpenModal();
        }, 3000 );
      }
    }
  }, [ status, startTime ] );

  if ( wallet.connected ) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <React.Fragment>
        <CSSTransition
          in={ticketCount > 0}
          timeout={150}
          classNames="wheel-tickets-count"
          mountOnEnter={false}
          unmountOnExit={false}
          nodeRef={wheelTicketsCountRef}
        >
          <div className="wheel-tickets-count" ref={wheelTicketsCountRef}>
            {`TICKETS LEFT: ${ +ticketCount || 1 }`}
          </div>
        </CSSTransition>
        <div className="button-open-container">
          <button onClick={buyTicket} className="button-open-case">
            {`BUY TICKET FOR ${ name_wheel.cost } SOL`}
          </button>
          {( status !== StatusEnum.FULLFILLED || prize === MINUS_PRIZE ) && !needTakePrize && (
            <button
              onClick={spinWheel}
              className="button-open-case"
              disabled={ticketCount <= 0 || ( status !== StatusEnum.IDLE && ( prize !== MINUS_PRIZE || !spinAvailableAfterLoose ) )}
            >
              SPIN!
            </button>
          )}
          {( ( status === StatusEnum.FULLFILLED && prize !== MINUS_PRIZE ) || needTakePrize ) && (
            <button disabled={takeButtonDisabled} onClick={takePrize} className="button-open-case">
              TAKE!
            </button>
          )}
        </div>
        <Modal
          onClose={handleCloseModal}
          active={active}
          className="spin-wheel-modal"
        >
          {needTakePrize && status !== StatusEnum.IDLE
            ? needTakePrizeError
            : errorMessage}
        </Modal>
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <div onClick={not_auth} className="button-open-case">
        </div>
      </React.Fragment>
    );
  }
}

export default function SteelWheel () {
  const { Wheel_name } = useParams();
  const { width } = useWindowDimensions();
  const wheelRef = useRef();
  const wallet = useWallet();
  const name_wheel = config_wheels[ Wheel_name ].name;
  const wheelType = name_wheel.split( " " )[ 0 ];

  useEffect( () => { }, [] );

  const prizeItems = useMemo(
    () => [
      { src: "/assets/img/roll/x2.png?v=3" },
      { src: "/assets/img/roll/x10.png?v=2" },
      { src: "/assets/img/main/x1-1.png" },
      { src: "/assets/img/main/100.png?v=2" },
      { src: "/assets/img/main/50.png" },
      { src: `/assets/img/key/${ wheelType.toLowerCase() }-key.png` },
      { src: "/assets/img/key/legendary-key.png" },
    ],
    [ wheelType ]
  );
  try {
    return (
      <React.Fragment>
        <div className="main_content">
          <div className="content_case">
            <div className="button-back-group">
              <div className="back-to-case-border">
                <NavLink to="/home" className="button-back-to-case">
                  <img
                    src="/assets/img/open_case/arrow-left.png?v=2"
                    alt=""
                    className="arrow-left"
                  />
                  Back Home
                </NavLink>
              </div>
            </div>
            <div className="decorate_block_content"></div>
            <div className="top-case-title">
              <h1 className="open-case">
                You roll the
                <br />{" "}
                <p className="decor-text-case-title">
                  {config_wheels[ Wheel_name ].name}
                </p>
              </h1>
            </div>

            <div className="roll-main">
              {!wallet.connected && <MessageNotLogin />}

              <div className="bottom_backgroumd-roll" style={{ width }} />
              <img src={arrow} className="arrow" alt="arrow" />
              <div className="roll-wrap">
                <div className="wheel-wrapper">
                  <div ref={wheelRef} className="wheel">
                    <div className="wheel-border">
                      {Array( 7 )
                        .fill( 0 )
                        .map( ( el, i ) => (
                          <React.Fragment key={`triangle _${ i }`}>
                            <div
                              className={`triangle _${ i }`}
                            />
                            <div key={`lamp _${ i }`} className={`lamp _${ i }`}>
                              <div className="lamp-container" />
                            </div>
                          </React.Fragment>
                        ) )}
                      <div className="wheel-shadow" />
                      <div className="wheel-sections">
                        {Array( 7 )
                          .fill( 0 )
                          .map( ( el, i ) => (
                            <div key={`prize _${ i }`} className={`prize _${ i }`}>
                              <img
                                src={prizeItems[ i ].src}
                                alt=""
                                className="item"
                              />
                            </div>
                          ) )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content_block">
            <div className="content_block-border">
              <div className="group-open-case roll_open">
                <div className="x-roll-group">
                  <ButtonBuy wheelRef={wheelRef} />
                </div>
              </div>
              <div className="top-ico">
                <img
                  src="/assets/img/open_case/top_case_element-2.png?v=2"
                  alt=""
                  className="case_content open_case"
                />
                <p className="case-title">Wheel of Fortune contents</p>
              </div>
              <div className="group-nft-open mb-0">
                <div className="nft-block img-unic-1">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">Total lost</p>
                  </div>
                  <img src="/assets/img/main/100.png" alt="" />
                </div>
                <div className="nft-block img-unic-2">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">Almost lost</p>
                  </div>
                  <img src="/assets/img/main/50.png" alt="" />
                </div>
                <div className="nft-block img-unic-3">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">x1 Multiplier</p>
                  </div>
                  <img src="/assets/img/main/x1-1.png" alt="" width="50" />
                </div>
                <div className="nft-block img-unic-4">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">x2 Multiplier</p>
                  </div>
                  <img
                    src="/assets/img/roll/x2.png?v=2"
                    alt=""
                    className="nft-case"
                  />
                </div>
                <div className="nft-block img-unic-1">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">x10 Multiplier</p>
                  </div>
                  <img
                    src="/assets/img/roll/x10.png?v=2"
                    alt=""
                    className="nft-case"
                  />
                </div>
                <div className="nft-block img-unic-2">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">{`${ wheelType } key`}</p>
                  </div>
                  <img
                    src={`/assets/img/key/${ wheelType.toLowerCase() }-key.png`}
                    alt={`${ wheelType } key`}
                    width="130"
                  />
                </div>
                <div className="nft-block img-unic-3">
                  <div className="group-text_case-gr">
                    <p className="text_case1-gr">Legendary key</p>
                    {/*<p className="text_case2-gr">small_text1</p>*/}
                  </div>
                  <img
                    src="/assets/img/key/legendary-key.png"
                    alt=""
                    width="130"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  } catch ( name_wheel ) {
    return (
      <React.Fragment>
        <NotFound />
      </React.Fragment>
    );
  }
}
