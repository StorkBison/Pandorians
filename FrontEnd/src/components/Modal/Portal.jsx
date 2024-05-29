import { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

const containers = new Map();

const Portal = forwardRef((props, ref) => {
  const { id, children } = props;
  let container = containers.get(id);

  if (!container) {
    container = document.getElementById(id);
  }

  if (!container) {
    container = window.document.createElement('div');
    container.id = id;

    window.document.body.appendChild(container);
  }

  containers.set(id, container);

  if (ref) {
    if (typeof ref === 'function') {
      ref(container);
    } else {
      ref.current = container;
    }
  }

  return createPortal(children, container);
});

Portal.displayName = 'Portal';

Portal.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Portal;
