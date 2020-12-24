import React from 'react';
import ObservableMembrane from 'observable-membrane';

export default class LightningComponent extends React.Component {
  constructor(template) {
    super();

    const membrane = new ObservableMembrane({
      valueMutated: () => {
        if (this.mounted) this.forceUpdate();
      },
    });

    if (!this.__s) {
      this.__s = membrane.getProxy(Object.assign({}, this.props));
    }

    this.template = React.createRef();

    template.customEvents.forEach((event) => {
      const ref = event[2];
      this[ref] = React.createRef();
    });
  }

  componentDidUpdate(prevProps) {
    this.updateMembrane(prevProps);
  }

  componentDidMount(template) {
    this.mounted = true;
    this.updateMembrane();
    this.addLocalStyles(template);
    this.addEventHandlers(template);
  }

  componentWillUnmount(template) {
    this.mounted = false;
    this.cleanupLocalStyles(template);
    this.cleanupEventHandlers(template);
  }

  addLocalStyles(template) {
    this.stylesheets = [];
    template.stylesheets.forEach((stylesheet) => {
      const sheet = document.createElement('style');
      sheet.type = 'text/css';
      sheet.textContent = stylesheet(
        '[' + template.stylesheetTokens.hostAttribute.toLowerCase() + ']',
        '[' + template.stylesheetTokens.shadowAttribute.toLowerCase() + ']',
        null
      );
      document.head.appendChild(sheet);
      this.stylesheets.push(sheet);
    });
  }

  addEventHandlers(template) {
    template.customEvents.forEach((event) => {
      const name = event[0];
      const cb = event[1];
      const ref = event[2];
      this[cb] = this[cb].bind(this);
      if (ref !== 'template') {
        this[ref].current.template.current.addEventListener(name, this[cb]);
      } else {
        this[ref].current.addEventListener(name, this[cb]);
      }
    });
  }

  cleanupLocalStyles() {
    this.stylesheets.forEach((sheet) => {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    });
  }

  cleanupEventHandlers(template) {
    template.customEvents.forEach((event) => {
      const name = event[0];
      const cb = event[1];
      const ref = event[3];

      if (ref !== 'template') {
        this[ref].current.template.current.removeEventListener(name, this[cb]);
      } else {
        this[ref].current.removeEventListener(name, this[cb]);
      }
    });
  }

  updateMembrane(prevProps = {}) {
    Object.keys(this.props).forEach((prop) => {
      if (prevProps[prop] !== this.props[prop])
        this.__s[prop] = this.props[prop];
    });
  }
}
