import React, { Component } from 'react';

class ProfileInfo extends Component {
  render () {
    return (
      <form>
        <div className="mb-15 flex flex-column">
          <label className="label mb-10" htmlFor="wallet">Wallet Adress</label>
          <input type="text" id={'wallet'} className="input" placeholder={'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'} />
        </div>
        <div className="mb-15 flex flex-column">
          <label className="label mb-10" htmlFor="Username">Username</label>
          <input type="text" id={'Username'} className="input" placeholder={'Universal_studio'} />
        </div>
        <div className="mb-15 flex flex-column">
          <label className="label mb-10" htmlFor="Email">Email</label>
          <input type="text" id={'Email'} className="input" placeholder={'SUPPORT@U-STUDIO.SU'} />
        </div>
        <div className="mb-15 flex flex-column">
          <label className="label mb-10" htmlFor="Twitter">Twitter</label>
          <input type="text" id={'Twitter'} className="input" placeholder={'twitter.com/universal_studio'} />
        </div>
        <div className="mb-45 flex flex-column">
          <label className="label mb-10" htmlFor="Discord">Discord</label>
          <input type="text" id={'Discord'} className="input" placeholder={'UniversalStudio#5927'} />
        </div>
        <button className="btn">save</button>
      </form>
    );
  }
}

export default ProfileInfo;