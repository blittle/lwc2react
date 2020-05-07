import { compile } from "../src/compiler";

describe("Events", function () {
  it("bound events in template", function () {
    const source = `
import _implicitStylesheets from "./app.css";

import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element,
    t: api_text,
    b: api_bind
  } = $api;
  const {
    _m0
  } = $ctx;
  return [api_element("div", {
    key: 2
  }, [api_element("span", {
    key: 0
  }, [api_dynamic($cmp.something)]), api_element("button", {
    key: 1,
    on: {
      "click": _m0 || ($ctx._m0 = api_bind($cmp.increment))
    }
  }, [api_text("increment")])])];
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
    `;

    expect(compile("something.html", source)).toBe(
      `
import _implicitStylesheets from "./app.css";
import React from "react";

function tmpl($cmp) {
  return React.createElement("div", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    ref: $cmp.template
  }, [React.createElement("span", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true"
  }, $cmp.something), React.createElement("button", {
    [tmpl.stylesheetTokens.shadowAttribute]: "true",
    onClick: $cmp.increment.bind($cmp)
  }, "increment")]);
}

export default tmpl;
tmpl.stylesheets = [];

if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}

tmpl.stylesheetTokens = {
  hostAttribute: "my-app_app-host",
  shadowAttribute: "my-app_app"
};
  `.trim()
    );
  });

});
