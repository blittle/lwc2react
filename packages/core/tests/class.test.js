import { compile } from '../src/compiler';

describe('General Class Conversion Tests', function () {
  it('should convert a component that extends from something other than LightningElement', function () {
    const source = `
        import { registerDecorators as _registerDecorators } from "lwc";
        import _tmpl from "./button.html";
        import { registerComponent as _registerComponent } from "lwc";
        import { classSet } from 'lightning/utils';
        import { normalizeString as normalize } from 'lightning/utilsPrivate';
        import LightningPrimitiveButton from 'lightning/primitiveButton';
        import template from './button.html';
        /**
         * A clickable element used to perform an action.
         */
        class LightningButton extends LightningPrimitiveButton {
            constructor(...args) {
                super(...args);
            }
            connectedCallback() {
                this.test = 'hi';
            }
            render() {
                return template;
            }
        }

        export default _registerComponent(LightningButton, {
            tmpl: _tmpl
        });
      `;

    expect(compile('sample.js', source)).toMatchSnapshot();
  });

  it('should convert calls to this.template to this.template.current', function () {
    const source = `
        import { registerDecorators as _registerDecorators } from "lwc";
        import _tmpl from "./button.html";
        import { registerComponent as _registerComponent } from "lwc";
        import { classSet } from 'lightning/utils';
        import { normalizeString as normalize } from 'lightning/utilsPrivate';
        import LightningPrimitiveButton from 'lightning/primitiveButton';
        import template from './button.html';
        /**
         * A clickable element used to perform an action.
         */
        class LightningButton extends LightningPrimitiveButton {
            renderedCallback() {
                this.template.host.style.pointerEvents = this.disabled ? 'none' : '';
                this.template.querySelector('hi');
            }

            connectedCallback() {
                this.template.querySelector('hi');
            }

            get computedIconClass() {
                return classSet('slds-button__icon').add({
                    'slds-button__icon_left': this.normalizedIconPosition === 'left',
                    'slds-button__icon_right': this.normalizedIconPosition === 'right'
                }).toString();
            }
        }

        export default _registerComponent(LightningButton, {
            tmpl: _tmpl
        });
      `;

    expect(compile('sample.js', source)).toMatchSnapshot();
  });
});
