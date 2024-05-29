import React, { useRef } from 'react';
import emailjs from '@emailjs/browser';

export const ContactUs = () => {
  const form = useRef();

  const sendEmail = ( e ) => {
    e.preventDefault();

    emailjs.sendForm( 'service_8w9lj98', 'template_sad1rqi', form.current, 'gLR187_oMOaL65K1j' )
      .then( ( result ) => {
        console.log( result.text );
        alert( 'The message was sent successfully' );
      }, ( error ) => {
        console.log( error.text );
      } );
  };

  return (
    <div className="feed_back_block">
      <p className="title-feedback">WHAT SHOULD WE IMPROVE IN pandorians.io</p>
      <div className="inputs-group">
        <form ref={form} onSubmit={sendEmail}>
          <input placeholder="Your email" type="email" name="user_email" className="email" required />
          <div className="textarea-block">
            <textarea placeholder="Your suggestion" name="message" id="" cols="30" rows="10" className="suggest" required></textarea>
            <button type="submit" className="send_suggest">
              <img src="/assets/img/main/send-footer.png?v=2" alt="" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};