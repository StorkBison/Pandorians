export const delay = ms => new Promise( res => setTimeout( res, ms ) );


export const shuffle = ( array ) => {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while ( currentIndex != 0 ) {

    // Pick a remaining element.
    randomIndex = Math.floor( Math.random() * currentIndex );
    currentIndex--;

    // And swap it with the current element.
    [ array[ currentIndex ], array[ randomIndex ] ] = [
      array[ randomIndex ], array[ currentIndex ] ];
  }

  return array;
};

export const RARITY_CONFIGS = [
  { supply: 30, capacity: 2000, speed: 1 },
  { supply: 10, capacity: 6000, speed: 2 },
  { supply: 5, capacity: 12000, speed: 3 },
  { supply: 4, capacity: 15000, speed: 4 },
  { supply: 1, capacity: 60000, speed: 5 },
];

export const precisionRound = ( number, precision ) => {
  var factor = Math.pow( 10, precision );
  var n = precision < 0 ? number : 0.01 / factor + number;
  return Math.round( n * factor ) / factor;
};

export const getRarityConfigBySerialNumber = ( serialNumber ) => RARITY_CONFIGS.reduceRight( ( acc, item, i ) => {
  if ( typeof acc !== 'number' ) return acc; // cfg already found
  const sumOfSupplies = acc + item.supply;
  if ( i === 0 && serialNumber > sumOfSupplies ) {
    console.warn( 'Index of NFT is greater, than all supplied tokens' );
  }
  return ( serialNumber > sumOfSupplies && i > 0 ) ? sumOfSupplies : item;
}, 0 );

export const getStakingRate = ( stakedItems ) => {
  return stakedItems.reduce( ( acc, item ) => {
    const serialNumber = item.name.match( /\d+$/ )[ 0 ];
    const { speed } = getRarityConfigBySerialNumber( serialNumber );
    return acc + ( speed * 24 ); // per day;
  }, 0 );
};

export const getStakingRateAndEarned = ( stakedItems ) => {
  const now = Date.now();

  return stakedItems.reduce( ( acc, item ) => {
    const serialNumber = item.name.match( /\d+$/ )[ 0 ];
    const stakedHours = precisionRound( ( now - item.stakedDate ) / ( 1000 * 60 * 60 ), 4 );
    const { speed } = getRarityConfigBySerialNumber( serialNumber );
    acc.earned += speed * stakedHours;
    acc.rate += speed * 24; // per day
    return acc;
  }, { earned: 0, rate: 0 } );
};
