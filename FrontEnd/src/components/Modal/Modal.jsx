import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import classnames from 'classnames';
import { ReactComponent as CloseIconDefault } from './assets/close.svg';
import Portal from './Portal';
import './modal.scss';

let scrollbarWidth;
const noop = () => {};

class Modal extends PureComponent {
  static getScrollbarWidth() {
    if (typeof scrollbarWidth === 'undefined') {
      const scrollDiv = document.createElement('div');
      scrollDiv.style.top = '-9999px';
      scrollDiv.style.width = '50px';
      scrollDiv.style.height = '50px';
      scrollDiv.style.overflow = 'scroll';
      document.body.appendChild(scrollDiv);
      scrollbarWidth =
        scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
    }

    return scrollbarWidth;
  }

  timeoutId = 0;
  element = React.createRef();
  content = React.createRef();
  backdrop = React.createRef();
  prevActiveElement = null;

  componentDidMount() {
    const { active } = this.props;

    if (active) {
      this.onShow();
    }
  }

  componentDidUpdate(prevProps) {
    const { active } = this.props;

    if (active !== prevProps.active) {
      if (active) {
        this.onShow();
      } else {
        this.onHide();
      }
    }
  }

  onShow() {
    const scrollbarWidth = Modal.getScrollbarWidth();

    clearTimeout(this.timeoutId);

    document.body.classList.add('ui-modal-open');
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    if (this.element.current) {
      this.element.current.style.paddingRight = `${scrollbarWidth}px`;
    }

    if (document.activeElement) {
      this.prevActiveElement = document.activeElement;
    }

    if (this.element.current) {
      this.element.current.focus();
    }
  }

  onHide() {
    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      document.body.classList.remove('ui-modal-open');
      document.body.style.paddingRight = '';
      if (this.element.current) {
        this.element.current.style.paddingRight = '';
      }

      if (this.prevActiveElement) {
        try {
          this.prevActiveElement.focus();
        } catch {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[Modal] Error occurred on saved element focus',
              this.prevActiveElement
            );
          }
        }
      }
    }, 300);
    this.props.onClose(false);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.props.onClose(false);
    }
  };

  handleClose = () => this.props.onClose(false);

  render() {
    const {
      className,
      header,
      active,
      closeIcon: CloseIcon,
      children,
      backdropClose,
      showCloseIcon,
    } = this.props;
    const transitionProps = {
      classNames: 'ui-modal-transition',
      timeout: 300,
      in: active,
      mountOnEnter: true,
      unmountOnExit: true,
      // ref: this.content,
    };

    return (
      <Portal id="__modal_container">
        <CSSTransition {...transitionProps} nodeRef={this.element}>
          <div className={classnames('modal', className)} ref={this.element}>
            <div
              className="modal-content"
              ref={this.content}
              tabIndex="0"
              onKeyDown={this.handleKeyDown}
            >
              {header && <div className="modal-header">{header}</div>}

              {showCloseIcon && (
                <button
                  className="close-btn"
                  onClick={this.handleClose}
                  tabIndex="-1"
                >
                  <CloseIcon className="close-icon" />
                </button>
              )}

              <div className="modal-body">{children}</div>
            </div>
            <CSSTransition {...transitionProps} nodeRef={this.backdrop}>
              <div
                className="modal-backdrop"
                ref={this.backdrop}
                onClick={backdropClose ? this.handleClose : noop}
              />
            </CSSTransition>
          </div>
        </CSSTransition>
      </Portal>
    );
  }
}

Modal.propTypes = {
  className: PropTypes.string,
  header: PropTypes.node,
  children: PropTypes.node.isRequired,
  active: PropTypes.bool.isRequired,
  closeIcon: PropTypes.elementType,
  onClose: PropTypes.func.isRequired,
  backdropClose: PropTypes.bool,
  showCloseIcon: PropTypes.bool,
};

Modal.defaultProps = {
  closeIcon: CloseIconDefault,
  backdropClose: true,
  showCloseIcon: true,
};

export default Modal;
