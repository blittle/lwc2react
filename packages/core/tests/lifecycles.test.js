import { compile } from '../src/compiler';

describe('Lifecycles', function () {
  it('connectedCallback', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  connectedCallback() {
    this.a++;
    this.a++;
    this.a++;
  }
}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('disconnectedCallback', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  disconnectedCallback() {
    this.a++;
    this.a++;
    this.a++;
  }
}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('renderedCallback', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  renderedCallback() {
    this.a++;
    this.a++;
    this.a++;
  }
}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('errorCallback', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {
  constructor(...args) {
    super(...args);
    this.a = 1;
  }

  errorCallback(error, stack) {
    this.a++;
    this.a++;
    this.a++;
  }
}

_registerDecorators(Test, {
  fields: ["a"]
})

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(compile('something.js', source)).toMatchSnapshot();
  });
});
