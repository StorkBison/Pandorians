import { combineReducers } from "redux";
import { createReducer } from "typesafe-actions";
import { GET_BOXES } from "../actions/boxes";

const boxesReducer = createReducer( [] ).handleAction(
  GET_BOXES,
  ( state, { payload, meta } ) => {
    return {
      ...state,
      [ meta.name ]: payload,
    };
  }
);

export default combineReducers( {
  boxes: boxesReducer,
} );
