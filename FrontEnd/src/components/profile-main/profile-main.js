import React, { Component } from 'react';
import './profile-main.css';
import user from '../../assets/images/user.png';
import sprite from '../../assets/images/svg/sprites.svg';

class ProfileMain extends Component {
  render () {
    return (
      <div className="flex items-center col-5 mb-45">
        <div className="mr-25 user-photo radius-50">
          <img src={user} className="radius-50" alt="" />
          <input type="file" id={'photo'} />
          <label htmlFor="photo" className={'flex items-center justify-center radius-50'}>
            <svg width={25} height={23}><use href={`${ sprite }#photo`} /></svg>
          </label>
        </div>
        <div className="flex flex-column flex-grow-1">
          <b className="uppercase fs-16 fh-1 mb-10">Universal_studio</b>
          <a href="#" className="fs-14 fw-medium cl-white-6 link">Log out</a>
        </div>
        <div className={'flex items-center'}>
          <a href="#" className={'link-social'}>
            <svg width={24} height={24}><use href={`${ sprite }#twitter`} /></svg>
          </a>
          <a href="#" className={'link-social ml-20'}>
            <svg width={33} height={32}><use href={`${ sprite }#discord`} /></svg>
          </a>
        </div>
      </div>
    );
  }
}

export default ProfileMain;