import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import * as reducers from "../reducers";

const middleware = [ thunk ];

export const store = configureStore( {
  reducer: { ...reducers },
  middleware,
  devTools: process.env.NODE_ENV !== "production",
} );
