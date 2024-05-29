/* eslint-disable react/no-unused-prop-types */
import { Component } from 'react';
import PropTypes from 'prop-types';

class DomHolder extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  static getDerivedStateFromProps(nextProps) {
    const { children } = nextProps;

    if (children) {
      return { children };
    }

    return null;
  }

  state = {
    children: null,
  };

  render() {
    const { children } = this.state;

    return children;
  }
}

export default DomHolder;
