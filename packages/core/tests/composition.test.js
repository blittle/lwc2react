import { compile } from '../src/compiler';

describe('Component composition', function () {
  it('should render nested component', function () {
    const code = `
import _implicitStylesheets from "./app.css";

import _myComp from "my/comp";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    c: api_custom_element
  } = $api;
  return [api_custom_element("my-comp", _myComp, {
    key: 0
  }, [])];
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

    expect(compile('something.html', code)).toMatchSnapshot();
  });

  it('should render nested components with slots and properties', function () {
    const code = `
import _implicitStylesheets from "./app.css";

import _myComp from "my/comp";
import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element,
    c: api_custom_element
  } = $api;
  return [api_custom_element("my-comp", _myComp, {
    props: {
      "wow": $cmp.wow
    },
    key: 2
  }, [api_element("h1", {
    key: 0
  }, [api_text("a content")]), api_element("h2", {
    attrs: {
      "slot": "b"
    },
    key: 1
  }, [api_text("b content")])])];
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

    expect(compile('temp.html', code)).toMatchSnapshot();
  });

  it('should render slots as children', function () {
    const code = `
import _implicitStylesheets from "./comp.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    s: api_slot
  } = $api;
  return [api_slot("", {
    key: 0
  }, [], $slotset), api_slot("b", {
    attrs: {
      "name": "b"
    },
    key: 1
  }, [], $slotset)];
}

export default registerTemplate(tmpl);
tmpl.slots = ["", "b"];
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-comp_comp-host",
  shadowAttribute: "my-comp_comp"
};
        `.trim();

    expect(compile('temp.html', code)).toMatchSnapshot();
  });

  it('should render slots as children with default markup', function () {
    const code = `
import _implicitStylesheets from "./comp.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element,
    s: api_slot
  } = $api;
  return [api_slot("", {
    key: 1
  }, [api_element("span", {
    key: 0
  }, [api_text("default a")])], $slotset), api_slot("b", {
    attrs: {
      "name": "b"
    },
    key: 4
  }, [api_element("div", {
    key: 3
  }, [api_element("span", {
    key: 2
  }, [api_text("default b")])])], $slotset)];
}

export default registerTemplate(tmpl);
tmpl.slots = ["", "b"];
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-comp_comp-host",
  shadowAttribute: "my-comp_comp"
};
        `.trim();

    expect(compile('temp.html', code)).toMatchSnapshot();
  });

  it('should compile complex object @api properties', function () {
    const code = `
import _implicitStylesheets from "./comp.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element
  } = $api;
  return [api_element("span", {
    key: 0
  }, [api_dynamic($cmp.prop.value)])];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-comp_comp-host",
  shadowAttribute: "my-comp_comp"
};
        `.trim();

    expect(compile('temp.html', code)).toMatchSnapshot();
  });
});
