import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ReactComponent as NftGradientBorderSvg } from '../../assets/images/svg/nft-border.svg';
import classnames from "classnames";
import Button from "../../components/Button/Button";
import NftImgSrc2x from '../../assets/images/staking/nft-stake-image-1@2x.png';
import NoWalletSrc from '../../assets/images/staking/no-wallet-connected.png';
import NoWalletSrc2x from '../../assets/images/staking/no-wallet-connected@2x.png';
import NoNftSrc from '../../assets/images/staking/no-nft.png';
import NoNftSrc2x from '../../assets/images/staking/no-nft@2x.png';
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import StakingBackground from "../../components/StackingBackground";
import { Staking } from "../../solana";
import useProvider from "../../components/hooks/useProvider";
import { getStakingRate, getStakingRateAndEarned } from "../../utils";
import { useIsDemoMode } from "../../components/hooks";
import useYMetrika from "../../utils/hooks/useYMetrika";
import useGTag from "../../utils/hooks/useGTag";

function WalletNotConnected ( { loading, onBuyClick } ) {
  const wallet = useWallet();

  if ( wallet.connected ) {
    return (
      <div className="wallet-not-connected _no-nft">
        <img srcSet={`${ NoNftSrc } 1x, ${ NoNftSrc2x } 2x`} src={NoNftSrc} alt="No nft" key="no-nft-img" />
        <div className="issue-description">
          You don't have NFT yet
        </div>
        <Button tag="a" href="https://magiceden.io" target="_blank" rel="noreferrer noopener" loading={loading} onClick={onBuyClick}>
          BUY NFT
        </Button>
        {/*<WalletMultiButton />*/}
      </div>
    );
  }

  return (
    <div className="wallet-not-connected">
      <img srcSet={`${ NoWalletSrc } 1x, ${ NoWalletSrc2x } 2x`} src={NoWalletSrc} alt="No connected wallet" key="no-wallet-img" />
      <div className="issue-description">
        Your wallet is not connected to the service
      </div>
      {wallet.connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
    </div>
  );
}

const initialStakingInfo = {
  rate: '—',
  earned: '—',
};

export default function StakingTpl () {
  const wallet = useWallet();
  const connection = useConnection().connection;
  const provider = useProvider();
  const isDemoMode = useIsDemoMode();
  const stakingRef = useRef();
  const isFirstRateCalcAfterWalletConnectRef = useRef( true );
  const [ isMounted, setIsMounted ] = useState( false );
  const [ loading, setLoading ] = useState( true );
  const [ actionLoading, setActionLoading ] = useState( null );

  const [ stakingInfo, setStakingInfo ] = useState( initialStakingInfo );
  const [ stakedSet, setStakedSet ] = useState( () => new Set() );
  const [ unstakedSelectedIdsSet, setUnstakedSelectedIdsSet ] = useState( () => new Set() );
  const [ stakedSelectedIdsSet, setStakedSelectedIdsSet ] = useState( () => new Set() );

  const ym = useYMetrika();
  const gtag = useGTag();
  const [ suitableArr, setSuitableArr ] = useState( [] );
  const itemsById = useMemo( () => (
    [ ...suitableArr, ...stakedSet ].reduce( ( acc, item ) => {
      acc[ item.id ] = item;
      return acc;
    }, {} )
  ), [ suitableArr, stakedSet ] );

  const unstakedArr = useMemo( () => suitableArr.filter( ( item ) => !stakedSet.has( item ) ), [ suitableArr, stakedSet ] );
  const stakedArr = useMemo( () => [ ...stakedSet ], [ stakedSet ] );


  const doAsyncActionOnItems = async ( action, arr ) => {
    setActionLoading( action );
    const failedIdsSet = new Set();
    try {
      const staking = stakingRef.current;
      if ( action === 'stake' ) await staking.stake( arr, connection, wallet );
      else if ( action === 'stakeAll' ) await staking.stake( arr, connection, wallet );
      else if ( action === 'unstake' ) await staking.unstake( arr, connection, wallet );
      else if ( action === 'unstakeAll' ) await staking.unstake( stakedArr, connection, wallet );
      else if ( action === 'claim' ) await staking.claim( stakedArr, connection, wallet );
      if ( failedIdsSet.size ) {
        arr = arr.filter( ( { id } ) => !failedIdsSet.has( id ) );
      }
      await getStakingInfos();
      setActionLoading( null );

      return { processedItems: arr, failedIdsSet };
    } catch ( e ) {
      console.log( e );
      setActionLoading( null );

      return { processedItems: [], failedIdsSet: [ ...arr ] };
    }
  };

  const handleBuyNftClick = useCallback( ( e ) => {
    if ( isDemoMode ) {
      e.preventDefault();
      setSuitableArr( [ { id: 'test', fetchedJson: { image: NftImgSrc2x } }, { id: 'test2', fetchedJson: { image: NftImgSrc2x } } ] );
    }
  }, [ isDemoMode ] );

  const handleItemClick = useCallback( ( e ) => {
    const { id, kind } = e.currentTarget.dataset;

    const updateF = kind === 'staked' ? setStakedSelectedIdsSet : setUnstakedSelectedIdsSet;

    updateF( ( prevSelectedIdsSet ) => {
      const newSelectedIdsSet = new Set( [ ...prevSelectedIdsSet ] );
      if ( prevSelectedIdsSet.has( id ) ) {
        newSelectedIdsSet.delete( id );
      } else {
        newSelectedIdsSet.add( id );
      }
      return newSelectedIdsSet;
    } );
  }, [] );

  const handleinitClick = useCallback( async () => {
    const staking = stakingRef.current;
    await staking.init();
  }, [ unstakedSelectedIdsSet ] );

  const handleStakeClick = useCallback( async () => {
    const newStakedArr = [ ...unstakedSelectedIdsSet ].map( ( id ) => itemsById[ id ] );
    const { processedItems, failedIdsSet } = await doAsyncActionOnItems( 'stake', newStakedArr );
    if ( failedIdsSet.size )
      setSuitableArr( ( prevArr ) => prevArr.filter( ( { id } ) => !unstakedSelectedIdsSet.has( id ) || failedIdsSet.has( id ) ) );
    else
      setSuitableArr( ( prevArr ) => prevArr.filter( ( { id } ) => !unstakedSelectedIdsSet.has( id ) ) );
    setStakedSet( ( prevSet ) => new Set( [ ...prevSet, ...processedItems ] ) );
    setUnstakedSelectedIdsSet( new Set() );
    ym( 'reachGoal', 'Stake' );
    gtag( 'event', 'Stake' );
  }, [ unstakedSelectedIdsSet ] );

  const handleUnstakeClick = useCallback( async () => {
    const newUnstakedArr = [ ...stakedSelectedIdsSet ].map( ( id ) => itemsById[ id ] );
    const { processedItems, failedIdsSet } = await doAsyncActionOnItems( 'unstake', newUnstakedArr );

    setSuitableArr( ( prevArr ) => [ ...prevArr, ...processedItems ] );
    if ( failedIdsSet.size ) {
      setStakedSet( ( prevSet ) => new Set( [ ...prevSet ].filter( ( { id } ) => !stakedSelectedIdsSet.has( id ) || failedIdsSet.has( id ) ) ) );
    } else {
      setStakedSet( ( prevSet ) => new Set( [ ...prevSet ].filter( ( { id } ) => !stakedSelectedIdsSet.has( id ) ) ) );
    }
    setStakedSelectedIdsSet( new Set() );
    ym( 'reachGoal', 'Unstake' );
    gtag( 'event', 'Unstake' );
  }, [ stakedSelectedIdsSet ] );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleClaimClick = useCallback( async () => {
    const newUnstakedArr = [ ...stakedSelectedIdsSet ].map( ( id ) => itemsById[ id ] );
    await doAsyncActionOnItems( 'claim', newUnstakedArr );

  } );

  const handleStakeAllClick = useCallback( async () => {
    const { processedItems, failedIdsSet } = await doAsyncActionOnItems( 'stakeAll', unstakedArr );
    if ( failedIdsSet.size )
      setSuitableArr( ( prevArr ) => prevArr.filter( ( { id } ) => !unstakedSelectedIdsSet.has( id ) || failedIdsSet.has( id ) ) );
    else
      setSuitableArr( ( prevArr ) => prevArr.filter( ( { id } ) => !unstakedSelectedIdsSet.has( id ) ) );
    setStakedSet( ( prev ) => new Set( [ ...prev, ...processedItems ] ) );
    setUnstakedSelectedIdsSet( new Set() );
    ym( 'reachGoal', 'Stake all' );
    gtag( 'event', 'Stake all' );
  }, [ unstakedArr ] );

  const handleUnstakeAllClick = useCallback( async () => {
    const { processedItems, failedIdsSet } = await doAsyncActionOnItems( 'unstakeAll', stakedSet );

    setSuitableArr( ( prevArr ) => [ ...prevArr, ...processedItems ] );
    if ( failedIdsSet.size )
      setStakedSet( ( prevSet ) => new Set( [ ...prevSet ].filter( ( { id } ) => !stakedSelectedIdsSet.has( id ) || failedIdsSet.has( id ) ) ) );
    else {
      setStakedSet( ( prevSet ) => new Set( [ ...prevSet ].filter( ( { id } ) => !stakedSelectedIdsSet.has( id ) ) ) );
    }
    setStakedSelectedIdsSet( new Set() );
    ym( 'reachGoal', 'Unstake all' );
    gtag( 'event', 'Unstake all' );
  }, [ stakedArr ] );

  useEffect( () => {
    setTimeout( () => {
      setIsMounted( true );
    } );
  }, [] );

  const getStakingInfos = async () => {
    try {
      const staking = stakingRef.current;
      const stakedItems = await staking.getStakedItems();
      const getItemJsons = async ( items ) => await Promise.allSettled(
        items.map( ( { uri } ) => (
          fetch( uri ).then( ( response ) => response.json() )
        ) )
      ).then( ( results ) => (
        results
          .map( ( { value }, i ) => ( {
            id: `${ items[ i ].name }-${ items[ i ].uri }`,
            ...items[ i ],
            fetchedJson: value,
          } ) )
          .filter( ( item ) => !!item.fetchedJson )
      ) );

      const [ stakedItemsWithJsons ] = await Promise.allSettled( [
        getItemJsons( stakedItems ),
      ] ).then( ( results ) => results.map( ( { value } ) => value ) );

      const stakedItemsWithJsonsAndStakedDates = stakedItemsWithJsons.map( ( item ) => ( { ...item, stakedDate: item.tokenStateData.stakedAt * 1000 } ) );
      // setStakedSet( new Set( stakedItemsWithJsonsAndStakedDates ) );
      setStakingInfo( getStakingRateAndEarned( stakedItemsWithJsonsAndStakedDates ) );
    } catch ( e ) {
      console.log( e );
    }
  };

  useEffect( () => {
    if ( wallet.connected ) {
      stakingRef.current = new Staking( provider );
      const staking = stakingRef.current;

      const getStakingData = async () => {
        setLoading( true );
        try {
          const stakedItems = await staking.getStakedItems();
          const suitableForStakingItems = await staking.getSuitableForStaking();

          const getItemJsons = async ( items ) => await Promise.allSettled(
            items.map( ( { uri } ) => (
              fetch( uri ).then( ( response ) => response.json() )
            ) )
          ).then( ( results ) => (
            results
              .map( ( { value }, i ) => ( {
                id: `${ items[ i ].name }-${ items[ i ].uri }`,
                ...items[ i ],
                fetchedJson: value,
              } ) )
              .filter( ( item ) => !!item.fetchedJson )
          ) );

          const [ stakedItemsWithJsons, suitableForStakingItemsWithJsons ] = await Promise.allSettled( [
            getItemJsons( stakedItems ),
            getItemJsons( suitableForStakingItems ),
          ] ).then( ( results ) => results.map( ( { value } ) => value ) );
          const stakedItemsWithJsonsAndStakedDates = stakedItemsWithJsons.map( ( item ) => ( { ...item, stakedDate: item.tokenStateData.stakedAt * 1000 } ) );

          isFirstRateCalcAfterWalletConnectRef.current = true;

          setStakedSet( new Set( stakedItemsWithJsonsAndStakedDates ) );
          setStakingInfo( getStakingRateAndEarned( stakedItemsWithJsonsAndStakedDates ) );
          setSuitableArr( suitableForStakingItemsWithJsons );
        } catch ( e ) {
          console.log( e );
        }
        setLoading( false );
      };

      getStakingData();
    } else if ( stakedSet.size || suitableArr.length ) {
      setUnstakedSelectedIdsSet( new Set() );
      setStakedSelectedIdsSet( new Set() );
      setStakedSet( new Set() );
      setStakingInfo( initialStakingInfo );
      setSuitableArr( [] );
    }
  }, [ wallet.connected ] );

  useEffect( () => {
    if ( stakedSet.size ) {
      if ( !isFirstRateCalcAfterWalletConnectRef.current ) {
        const stakedItems = [ ...stakedSet ].map( ( item ) => ( { ...item, stakedDate: item.stakedDate ?? Date.now() } ) );
        const rate = getStakingRate( stakedItems );
        setStakingInfo( ( prev ) => ( { ...prev, rate } ) );
      } else {
        isFirstRateCalcAfterWalletConnectRef.current = false;
      }
    }
  }, [ stakedSet ] );

  return (
    <div className="main_content _staking-main">
      <div className="staking-page-content-container">
        <div className="summary-block">
          <div className="summary-block-item">
            <span className="summary-block-label">RATE:</span> <strong className="summary-block-value">{stakingInfo.rate} / DAY</strong>
          </div>
          <div className="">
            <Button disabled={!( stakingInfo.earned > 0 )} loading={actionLoading === 'claim'} onClick={handleClaimClick}>
              Claim
            </Button>
          </div>
          <div className="summary-block-item">
            <div className="summary-block-label">EARNED:</div>
            <div className="summary-block-value">
              <span className="earn-amount">{stakingInfo.earned}</span>
              <strong className="earn-type">$TXN</strong>
            </div>
          </div>
        </div>

        <div className="staking-blocks-container">
          <div className="staking-block-wrap">
            <div className="staking-block-title">Wallet</div>
            <div className="staking-block wallet">
              {( isMounted && !wallet.connecting ) && (
                <>
                  {( unstakedArr.length === 0 && stakedArr.length === 0 ) ? (
                    <WalletNotConnected loading={loading} onBuyClick={handleBuyNftClick} />
                  ) : (
                    <SimpleBar className="staking-block-scroll-container">
                      <div className="staking-block-items">
                        {unstakedArr.map( ( { id, fetchedJson }, i ) => (
                          <div className="staking-block-item-wrap" key={id}>
                            <button
                              className={classnames( 'staking-block-item', { _selected: unstakedSelectedIdsSet.has( id ) } )}
                              type="button"
                              data-id={id}
                              data-kind="unstaked"
                              onClick={handleItemClick}
                            >
                              <NftGradientBorderSvg className="gradient-border" />
                              <img src={fetchedJson.image} alt="NFT" />
                            </button>
                          </div>
                        ) )}
                      </div>
                    </SimpleBar>
                  )}
                </>
              )}
              <div className="staking-block-footer">
                {/* <Button onClick={handleinitClick}>
                  Init
                </Button> */}
                <Button disabled={unstakedSelectedIdsSet.size === 0 || !!actionLoading} loading={actionLoading === 'stake'} onClick={handleStakeClick}>
                  STAKE
                </Button>
                <Button disabled={unstakedArr.length === 0 || !!actionLoading} loading={actionLoading === 'stakeAll'} onClick={handleStakeAllClick}>
                  STAKE ALL
                </Button>
              </div>
            </div>
          </div>
          <div className="staking-block-wrap">
            <div className="staking-block-title">Staked NFT</div>
            <div className="staking-block staked-nft">
              <SimpleBar className="staking-block-scroll-container">
                <div className="staking-block-items">
                  {stakedArr.map( ( { id, fetchedJson }, i ) => (
                    <div className="staking-block-item-wrap" key={id}>
                      <button
                        className={classnames( 'staking-block-item', { _selected: stakedSelectedIdsSet.has( id ) } )}
                        type="button"
                        data-id={id}
                        data-kind="staked"
                        onClick={handleItemClick}
                      >
                        <NftGradientBorderSvg className="gradient-border" />
                        <img src={fetchedJson.image} alt="NFT" />
                      </button>
                    </div>
                  ) )}
                </div>
              </SimpleBar>
              <div className="staking-block-footer">
                <Button disabled={stakedSelectedIdsSet.size === 0 || !!actionLoading} loading={actionLoading === 'unstake'} onClick={handleUnstakeClick}>
                  UNSTAKE
                </Button>
                <Button disabled={stakedArr.length === 0 || !!actionLoading} loading={actionLoading === 'unstakeAll'} onClick={handleUnstakeAllClick}>
                  UNSTAKE ALL
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StakingBackground />
    </div>
  );
}
