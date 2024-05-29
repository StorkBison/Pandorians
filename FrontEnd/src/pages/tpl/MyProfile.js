import React from 'react';
import ProfileMain from "../../components/profile-main/profile-main";
import ProfileInfo from "../../components/profile-info/profile-info";
import ProfileStatistics from "../../components/profile-statistics/profile-statistics";
import ProfileTransactions from "../../components/profile-transactions/profile-transactions";

export default function MyProfile () {
  return (
    <React.Fragment>
      <div className="pt-50 pb-50">
        <div className="container">
          <ProfileMain />
          <div className="flex">
            <div className="col col-5 pr-65">
              <ProfileInfo />
            </div>
            <div className="col col-5 pl-65">
              <ProfileStatistics />
            </div>
          </div>
          <div className="">
            <ProfileTransactions />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
