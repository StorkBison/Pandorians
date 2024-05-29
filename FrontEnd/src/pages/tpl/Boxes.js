import React, { useCallback, useMemo, useRef } from "react";
import { useState, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { boxes } from "../../config/boxes";
import NotFound from "./../tpl/NotFound";
import { Box, getProvider } from "../../solana";
import { useDispatch, useSelector } from "react-redux";
import { getBoxes } from "../../actions/boxes";
import Modal from "../../components/Modal";
import Loader from "../../components/Loader/Loader";
import { Button } from "../../components/Button";
import { ReactComponent as ArrowDownBg } from '../../assets/images/svg/boxes-arrow-bg.svg';
import ArrowDown from '../../assets/images/boxes/arrow-down.png';
import ArrowDown2x from '../../assets/images/boxes/arrow-down@2x.png';
import classnames from "classnames";
import { delay } from "../../utils";
import DomHolder from "../../components/utils/DomHolder";
import { CSSTransition } from "react-transition-group";
import AltImage from '../../assets/images/boxes/altImage.png';

const openedBoxStyles = [
  {
    background:
      "linear-gradient(180deg, rgba(93, 28, 121, 0.31) 0%, rgba(225, 38, 234, 0.31) 100%)",
    // borderBottom: "4px solid #E126EA",
    bottomBgColorClass: "unic-1",
  },
  {
    background:
      "linear-gradient(180deg, rgba(54, 18, 28, 0.31) 0%, rgba(136, 44, 78, 0.31) 100%)",
    // borderBottom: "4px solid #882C4E",
    bottomBgColorClass: "unic-3",
  },
  {
    background:
      "linear-gradient(180deg, rgba(83, 102, 199, 0) 0%, rgba(83, 102, 199, 0.31) 100%)",
    bottomBgColorClass: "unic-2",
  },
];

function* generateRandomValuesTo ( to, history = [] ) {
  let value;

  while ( true ) {
    for ( let i = 0; i < 5; i++ ) {
      value = Math.floor( Math.random() * to );
      if ( !history.includes( value ) ) break;
    }

    if ( history.length > Math.ceil( to / 2 ) ) {
      history.shift();
    }

    history.push( value );

    yield value;
  }
}

const styleAndBgGenerator = generateRandomValuesTo( 3 );

function getStyleAndBottomBgColorClass () {
  const rndm = styleAndBgGenerator.next().value;
  const { bottomBgColorClass, ...style } = openedBoxStyles[ rndm ];

  return { style, bottomBgColorClass };
}

const MIN_ROULETTE_ROW_LENGTH = 13; // 2560 (max screen width) / 210 (el width + margins) ~ 13
const ROULETTE_PRIZES_ROWS_COUNT = 9;

export default function Boxes () {
  const dispatch = useDispatch();
  const { name } = useParams();
  const config = boxes[ name ];
  const wallet = useWallet();
  const rouletteRef = useRef();
  const lastBoxInitializedRef = useRef( null );
  const box = useMemo( () => {
    if ( !wallet.connected && lastBoxInitializedRef.current ) return lastBoxInitializedRef.current;
    return new Box( config, getProvider( wallet ) );
  }, [ config?.id, wallet ] );
  lastBoxInitializedRef.current = box;
  const currentBoxNfts =
    useSelector( ( state ) => state.boxes.boxes[ config.name ] ) || [];
  const boxKeysCountRef = useRef();
  const [ active, setActive ] = useState( false );
  const [ modalError, setModalError ] = useState( false );
  const [ buyLoading, setBuyLoading ] = useState( false );
  const [ wonPrize, setWonPrize ] = useState( null );
  const [ rouletteIsSpinning, setRouletteIsSpinning ] = useState( false );
  const [ keysCount, setKeysCount ] = useState( 0 );
  const [ errorMessage, setErrorMessage ] = useState( "" );
  const [ prizes, setPrizes ] = useState( currentBoxNfts );
  const [ buttonText, setButtonText ] = useState(
    // box.isPending() ? "Take" : "Open"
    "Open"
  );
  const [ takeButtonText, setTakeButtonText ] = useState( 'Take' );

  const prizesIndexesGenerator = useMemo( () => generateRandomValuesTo( prizes.length ), [ prizes.length ] );

  const prizesRowsForRoulette = useMemo( () => {
    if ( !prizes.length ) return { rows: [], order: [] };
    const row = [];
    const beforeCenterPrizeIndexByRowPositionPart = [];
    const afterCenterPrizeIndexByRowPositionPart = [];
    const rowLength = Math.max( MIN_ROULETTE_ROW_LENGTH, ( prizes.length % 2 ? prizes.length : prizes.length + 1 ) );
    while ( row.length < rowLength ) {
      const prizeIndex = rowLength <= MIN_ROULETTE_ROW_LENGTH ?
        prizesIndexesGenerator.next().value :
        ( row.length === prizes.length ? Math.floor( prizes.length / 2 ) : row.length ); // if even number of prizes -> added one extra prize from row center to the end of row

      if ( row.length < Math.floor( rowLength / 2 ) ) {
        beforeCenterPrizeIndexByRowPositionPart.push( prizeIndex );
      } else {
        afterCenterPrizeIndexByRowPositionPart.push( prizeIndex );
      }
      row.push( prizes[ prizeIndex ] );
    }
    const rows = Array( ROULETTE_PRIZES_ROWS_COUNT ).fill( row );
    const order = [ ...afterCenterPrizeIndexByRowPositionPart, ...beforeCenterPrizeIndexByRowPositionPart ];
    return { rows, order };
  }, [ prizes ] );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function getKeysCount () {
    const count = await box.getKeysCount();
    console.log( `get keys count: ${ count }` );
    return count;
  }

  const toggleModal = useCallback( ( newActive ) => {
    if ( newActive === false ) {
      setModalError( false );
      setErrorMessage( "" );
    }
    setActive( ( prev ) => typeof newActive !== 'undefined' ? newActive : !prev );
  }, [] );

  const getPrizes = useCallback( async () => {
    const p = await box.getPrizes();
    const prizesArr = Object.values( p );

    dispatch( getBoxes( prizesArr, config ) );
    setPrizes( prizesArr.map( ( p ) => ( {
      ...p,
      ...getStyleAndBottomBgColorClass(),
    } ) ) );
  }, [ box, config, dispatch ] );

  const handleBuyKeyClick = useCallback( async () => {
    setBuyLoading( true );
    await box.buyKeys();
    setBuyLoading( false );
  }, [] );

  const openBox = useCallback( async () => {
    if ( keysCount === 0 ) {
      setErrorMessage( "You don't have any keys to open this box. Please go to wheel and spin it to get keys." );
      setModalError( true );
      toggleModal();
      return;
    }
    if ( rouletteIsSpinning || buttonText === "Opening..." ) {
      setErrorMessage( "Box openning transaction is running on chain, Please wait for a min while the tranaction confirm" );
      setModalError( true );
      toggleModal();
      return;
    }

    if ( box.isPending() ) {
      setErrorMessage( "You should take your reward from prev spin!" );
      setModalError( true );
      toggleModal();
      setButtonText( "Take" );
      return;
    }

    setButtonText( "Opening..." );
    try {
      const res = await box.open2();
      const wonPrizeIndex = prizes.findIndex( ( { tokenId } ) => tokenId === res );
      setWonPrize( { ...prizes[ wonPrizeIndex ] } );
      getKeysCount().then( setKeysCount );
    } catch ( e ) {
      setErrorMessage( e.message );
      setModalError( true );
      toggleModal();
      if ( !box.isPending() ) {
        setButtonText( "Open" );
      }
    }
  }, [ buttonText, rouletteIsSpinning, box, prizes, toggleModal ] );

  const takePrize = useCallback( async () => {
    // if ( !box.isPending() ) {
    //   setErrorMessage( "There is nothing to take rewards, maybe your transaction is still running on chain. Please wait for a min." );
    //   setModalError( true );
    //   toggleModal();
    //   setTakeButtonText( "Open" );
    // }
    setTakeButtonText( "Taking..." );
    try {
      await box.take2();
      toggleModal( false );
      setTimeout( () => {
        setTakeButtonText( "Open" );
      }, 300 );
      getPrizes();
    } catch ( e ) {
      setErrorMessage( e.message );
      setModalError( true );
      toggleModal();
      setTimeout( () => {
        setTakeButtonText( "Take" );
      }, 300 );
    }
  }, [ box ] );

  // load prizes
  useEffect( () => {
    getPrizes();
  }, [] );

  useEffect( () => {
    getKeysCount().then( setKeysCount );
  }, [ box ] );

  // open button state
  useEffect( () => {
    if ( wallet.connected ) {
      async function getButtonState () {
        if ( box.isPending() ) {
          await box.waitRandomness();
          setButtonText( "Take" );
        }
      }
      getButtonState();
    }
  }, [ wallet.connected ] );

  useEffect( () => {
    let timeoutId;

    if ( wonPrize ) {
      setRouletteIsSpinning( true );
      const wonPrizeIndex = prizes.findIndex( ( { address } ) => address === wonPrize.address );

      const { order } = prizesRowsForRoulette;
      const position = order.indexOf( wonPrizeIndex );
      const rows = Math.floor( ROULETTE_PRIZES_ROWS_COUNT / 2 );
      const card = 200 + 5 * 2; // 200 width + margin 5 left and 5 right
      const landingPosition = ( rows * order.length * card ) + ( position * card );


      var object = {
        x: Math.floor( Math.random() * 50 ) / 100,
        y: Math.floor( Math.random() * 20 ) / 100
      };

      rouletteRef.current.style.transitionTimingFunction = `cubic-bezier(0,${ object.x },${ object.y },1)`;
      rouletteRef.current.style.transitionDuration = '6s';
      rouletteRef.current.style.transform = `translate3d(-${ landingPosition }px, 0px, 0px)`;

      timeoutId = setTimeout( () => {
        rouletteRef.current.style.transitionTimingFunction = '';
        rouletteRef.current.style.transitionDuration = '';

        const resetTo = -( position * card );
        rouletteRef.current.style.transform = `translate3d(${ resetTo }px, 0px, 0px)`;

        setRouletteIsSpinning( false );
        toggleModal();
        setTimeout( () => {
          setButtonText( "Open" );
        }, 300 );
      }, 6 * 1000 );
    }

    return () => {
      if ( timeoutId ) {
        clearTimeout( timeoutId );
      }
    };
  }, [ wonPrize ] );

  // non existing name.
  if ( !config ) {
    return (
      <React.Fragment>
        <NotFound />
      </React.Fragment>
    );
  }

  return (
    <>
      <div className="main_content">
        <div className="content_case">
          <div className="decorate_block_content" />
          <div className="button-back-group">
            <div className="back-to-case-border">
              <NavLink to="/home" className="button-back-to-case">
                <img
                  src="/assets/img/open_case/arrow-left.png?v=2"
                  alt=""
                  className="arrow-left"
                />
                Back to the Boxes
              </NavLink>
            </div>
          </div>
          <div className="top-case-title">
            <h1 className="open-case">
              Open
              <br />{" "}
              <p className="decor-text-case-title">{config?.name} Box</p>
            </h1>
            {wallet.connected && <img src={config?.src} alt={`${ config?.name } box`} />}
          </div>
        </div>

        {!wallet.connected ? (
          <div className="not-login-content">
            <div className="border-not-login-class">
              <div className="not-login-case">
                <div className="not-logged-block">
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
                <img
                  src={config?.src}
                  alt={`${ config?.name } box`}
                  className="not-login-case"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="top-case-decorate">
              <ArrowDownBg className="top-case-decorate-bg" />
              <img
                srcSet={`${ ArrowDown } 1x, ${ ArrowDown2x } 2x`}
                src={ArrowDown}
                alt="arrow"
                className="top-case-decorate-center-arrow"
              />
            </div>
            <div className="spin_case_wrap">
              <div className="spin_case" ref={rouletteRef}>
                {prizesRowsForRoulette.rows.length === 0 && <Loader />}
                {prizesRowsForRoulette.rows.map( ( prizesRow, rowI ) => (
                  <div className="spin_case_row" key={rowI}>
                    {prizesRow.map( ( prize, prizeI ) => (
                      <div className="case_object" key={`${ rowI }-${ prizeI }`}>
                        <div className={`background-case ${ prize.bottomBgColorClass }`} />
                        <div className="group-text_case">
                          <p className="text_case1">{prize.name}</p>
                          <p className="text_case2">{prize.symbol}</p>
                        </div>
                        <img
                          src={prize.json !== null ? prize.json.image : AltImage}
                          alt={prize.name}
                          className="case_image_a mobile-case-spin"
                        />
                      </div>
                    ) )}
                  </div>
                ) )}
              </div>
            </div>
            <CSSTransition
              in={+keysCount > 0}
              timeout={150}
              classNames="wheel-tickets-count"
              mountOnEnter={false}
              unmountOnExit={false}
              nodeRef={boxKeysCountRef}
            >
              <div className="wheel-tickets-count" ref={boxKeysCountRef}>
                {`KEYS LEFT: ${ +keysCount || 1 }`}
              </div>
            </CSSTransition>
            <div className="group-open-case open-box-style">
              <Button disabled size="m" loading={buyLoading} className="button-buy-key-case" onClick={handleBuyKeyClick}>
                Buy Key
              </Button>
              <Button
                size="m"
                className="button-open-case"
                disabled={rouletteIsSpinning}
                loading={buttonText === "Opening..." || takeButtonText === "Taking..."}
                onClick={buttonText === 'Take' ? takePrize : openBox}
              >
                {buttonText}
              </Button>
              <Button
                size="m"
                className="button-open-case"
                disabled={rouletteIsSpinning}
                loading={buttonText === "Opening..." || takeButtonText === "Taking..."}
                onClick={takePrize}
              >
                {buttonText}
              </Button>
            </div>
          </>
        )}

        <div className="content_block">
          <div className="content_block-border">
            <div className="top-ico">
              <img
                src="/assets/img/open_case/top_case_element-2.png?v=2"
                alt=""
                className="case_content open_case"
              />
              <p className="case-title">Inside the Box</p>
            </div>
            <div className="group-nft-open">
              {prizes.length === 0 && <Loader />}
              {prizes.map( ( prize, index ) => {
                return (
                  <div
                    className="case_object bottom_content_gr-1"
                    key={index}
                    style={prize.style}
                  >
                    <div className={`case-bottom-border ${ prize.bottomBgColorClass }`} />
                    <div className="group-text_case">
                      <p className="text_case1">{prize.name}</p>
                      <p className="text_case2">{prize.symbol}</p>
                    </div>
                    <img
                      src={prize.json !== null ? prize.json.image : AltImage}
                      alt={prize.name}
                      className="case_image_a"
                    />
                  </div>
                );
              } )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        onClose={toggleModal}
        active={active}
        backdropClose={buttonText !== "Opening..."}
        showCloseIcon={buttonText !== "Opening..."}
      >
        <DomHolder>
          {active && (
            <>
              {!modalError && (
                <>
                  <div className="success-content">
                    <p className="modal-custom-header">Congratulations!</p>
                    <p className="modal-custom-text">
                      You have won an item - <strong>{`“${ wonPrize?.name }”`}</strong>
                    </p>
                    <div
                      className="case_object bottom_content_gr-1"
                      style={wonPrize?.style}
                    >
                      <div className={classnames( 'case-bottom-border', wonPrize?.bottomBgColorClass )} />
                      <div className="group-text_case">
                        <p className="text_case1">{wonPrize?.name}</p>
                        <p className="text_case2">{wonPrize?.symbol}</p>
                      </div>
                      <img src={wonPrize.json !== null ? wonPrize.json.image : AltImage} alt="" className="case_image_a" />
                    </div>
                  </div>
                  <Button className="button-open-case" loading={takeButtonText === 'Taking...'} onClick={takePrize}>
                    {takeButtonText}
                  </Button>
                  <div className="success-bg">
                    <div className="circle-1" />
                    <div className="circle-2" />
                    <div className="circle-3" />
                  </div>
                </>
              )}

              {modalError && <p className="modal-text">{errorMessage}</p>}
            </>
          )}
        </DomHolder>
      </Modal>
    </>
  );
}
