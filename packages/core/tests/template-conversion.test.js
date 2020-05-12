import { compile } from '../src/compiler';

describe('templates', function () {
  it('should compile an empty component', function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {} = $api;
  return [];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile div with text', function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 0
  }, [api_text("hi")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile multiple nested divs with text', function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    key: 2
  }, [api_element("div", {
    key: 0
  }, [api_text("hi 1")]), api_element("div", {
    key: 1
  }, [api_text("hi 2")])])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile class attributes', function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    classMap: {
      "hello": true
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile style attributes', function () {
    const source = `
import _implicitStylesheets from "./test.css";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    styleMap: {
      "color": "red"
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile generic attributes', function () {
    const source = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("div", {
    attrs: {
      "title": "wow"
    },
    key: 0
  }, [api_text("text")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile complex heirarchy with attributes', function () {
    const code = `
import _implicitStylesheets from "./test.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    h: api_element,
    t: api_text,
    gid: api_scoped_id
  } = $api;
  return [api_element("figure", {
    attrs: {
      "role": "group"
    },
    key: 3
  }, [api_element("img", {
    styleMap: {
      "border": "1px",
      "borderColor": "red"
    },
    attrs: {
      "src": "operahousesteps.jpg",
      "alt": "The Sydney Opera House"
    },
    key: 0
  }, []), api_element("figcaption", {
    classMap: {
      "something": true,
      "else": true
    },
    key: 2
  }, [api_text("We saw the opera "), api_element("cite", {
    key: 1
  }, [api_text("Barber of Seville")]), api_text(" here!")])])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-test_test-host",
  shadowAttribute: "my-test_test"
};
        `.trim();

    expect(compile('something.html', code)).toMatchSnapshot();
  });

  it('should compile the lwc class into a react class that renders the template', function () {
    const source = `
import _tmpl from "./test.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class Test extends LightningElement {}

export default _registerComponent(Test, {
  tmpl: _tmpl
});
    `;

    expect(compile('something.js', source)).toMatchSnapshot();
  });

  it('should generate the proper template with api bound props', function () {
    const source = `
import _implicitStylesheets from "./product.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    d: api_dynamic,
    h: api_element
  } = $api;
  return [api_element("h1", {
    key: 0
  }, [api_text("Product: "), api_dynamic($cmp.params.productId)])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-product_product-host",
  shadowAttribute: "my-product_product"
};
`;
    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile conditional blocks and expressions', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class ProductImage extends LightningElement {
  constructor(...args) {
    super(...args);
    this.someValue = 1;
  }

  change() {
    const someValue = this.someValue;

    if (this.someValue) {
      this.someValue = this.someValue + 1;
    } else {
      this.someValue = someValue + 1;
    }

    this.someValue = this.someValue ? this.someValue + 1 : someValue + 1;
  }

}

_registerDecorators(ProductImage, {
  fields: ["someValue"]
})

export default _registerComponent(ProductImage, {
  tmpl: _tmpl
});
    `;

    expect(compile('some.js', source)).toMatchSnapshot();
  });

  it('should compile for loops', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class ProductImage extends LightningElement {
  constructor(...args) {
    super(...args);
    this.someValue = 1;
  }

  change() {
    for (let i = this.someValue; i < this.someValue + 1; this.someValue++) {
      this.someValue = this.someValue + 1;
    }
  }

}

_registerDecorators(ProductImage, {
  fields: ["someValue"]
})

export default _registerComponent(ProductImage, {
  tmpl: _tmpl
});
    `;

    expect(compile('some.js', source)).toMatchSnapshot();
  });

  it('should compile forof loops', function () {
    const source = `
import { registerDecorators as _registerDecorators } from "lwc";
import _tmpl from "./app.html";
import { registerComponent as _registerComponent } from "lwc";
import { LightningElement } from 'lwc';

class ProductImage extends LightningElement {
  constructor(...args) {
    super(...args);
    this.arr = [1, 2];
  }

  change() {
    for (let el of this.arr) {
      this.arr.push(this.something);
    }
  }

}

_registerDecorators(ProductImage, {
  fields: ["someValue"]
})

export default _registerComponent(ProductImage, {
  tmpl: _tmpl
});
    `;

    expect(compile('some.js', source)).toMatchSnapshot();
  });

  it('should compile for:each directives', function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    k: api_key,
    h: api_element,
    i: api_iterator
  } = $api;
  return [api_element("ul", {
    key: 1
  }, api_iterator($cmp.list, function (item) {
    return api_element("li", {
      key: api_key(0, item.id)
    }, [api_dynamic(item.value)]);
  }))];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile for:each directives with dynamic attributes', function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element,
    k: api_key,
    i: api_iterator
  } = $api;
  return [api_element("ul", {
    key: 2
  }, api_iterator($cmp.list, function (item) {
    return api_element("li", {
      className: item.value,
      attrs: {
        "title": item.value
      },
      key: api_key(1, item.id)
    }, [api_element("span", {
      className: $cmp.classProp,
      key: 0
    }, [api_dynamic(item.value)])]);
  }))];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should compile if:true directives', function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [$cmp.someProp ? api_element("div", {
    key: 0
  }, [api_text("a")]) : null, !$cmp.someProp ? api_element("div", {
    key: 1
  }, [api_text("b")]) : null];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });
  it('should convert ID attributes', function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    gid: api_scoped_id,
    h: api_element
  } = $api;
  return [api_element("div", {
    attrs: {
      "id": api_scoped_id("1")
    },
    key: 0
  }, [api_text("content")])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
        `.trim();

    expect(compile('something.html', source)).toMatchSnapshot();
  });
});
