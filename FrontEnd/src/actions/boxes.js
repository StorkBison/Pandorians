export const GET_BOXES = "GET_BOXES";

export function getBoxes ( data, boxType ) {
  return ( dispatch ) =>
    dispatch( { type: GET_BOXES, payload: data, meta: boxType } );
}
