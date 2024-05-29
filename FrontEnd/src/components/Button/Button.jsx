import React, { forwardRef, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Loader from '../Loader/Loader';

const Button = forwardRef((props, ref) => {
  const {
    className,
    size = 'l',
    design = 'neutral',
    type = 'button',
    children,
    disabled,
    loading,
    icon,
    active,
    tag: Tag = 'button',
    prefix,
    suffix,
    ...attributes
  } = props;
  const cls = classnames(
    'ui-button',
    className,
    `size-${size}`,
    `design-${design}`,
    {
      'has-icon': !!icon,
      'has-prefix': !!prefix,
      'has-suffix': !!suffix,
      empty: !children,
      loading,
      active,
    }
  );
  const loaderContainerRef = useRef(null);

  return (
    <Tag
      {...attributes}
      {...(props.tag !== 'a' ? { type } : null)}
      ref={ref}
      className={cls}
      disabled={disabled || loading}
    >
      <span className="content">
        {icon && (
          <span className={classnames('icon-wrap', { alone: !children })}>
            {icon}
          </span>
        )}
        {prefix && (
          <span className={classnames('icon-wrap', { alone: !children })}>
            {prefix}
          </span>
        )}
        {children}
        {suffix && (
          <span className={classnames('icon-wrap', { alone: !children })}>
            {suffix}
          </span>
        )}
      </span>
      <CSSTransition
        in={loading}
        timeout={150}
        classNames="loader"
        mountOnEnter
        unmountOnExit
        nodeRef={loaderContainerRef}
      >
        <div className="loader-container" ref={loaderContainerRef}>
          <Loader />
        </div>
      </CSSTransition>
    </Tag>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['s', 'm', 'l']),
  design: PropTypes.oneOf(['primary', 'neutral']),
  type: PropTypes.oneOf(['submit', 'button']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  active: PropTypes.bool,
  tag: PropTypes.string,
  onClick: PropTypes.func,
};

Button.defaultProps = {
  design: 'primary',
  size: 'l',
  type: 'button',
};

export default Button;
