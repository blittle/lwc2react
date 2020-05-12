import { compile } from '../src/compiler';

describe('Events', function () {
  it('bound events in template', function () {
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

    expect(compile('something.html', source)).toMatchSnapshot();
  });

  it('should render input form events and attributes', function () {
    const source = `
import _implicitStylesheets from "./searchBar.css";
import { registerTemplate } from "lwc";
function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    h: api_element,
    b: api_bind
  } = $api;
  const {
    _m0,
    _m1,
    _m2
  } = $ctx;
  return [api_element("div", {
    classMap: {
      "site-search": true
    },
    key: 3
  }, [api_element("span", {
    classMap: {
      "fa": true,
      "fa-search": true
    },
    key: 0
  }, []), api_element("input", {
    classMap: {
      "form-control": true,
      "search-field": true
    },
    attrs: {
      "placeholder": "Search (keywords, brands, etc)",
      "type": "search"
    },
    props: {
      "value": $cmp.query,
      "autofocus": true
    },
    key: 1,
    on: {
      "input": _m0 || ($ctx._m0 = api_bind($cmp.searchInputHandler)),
      "keyup": _m1 || ($ctx._m1 = api_bind($cmp.searchKeyUpHandler))
    }
  }, []), api_element("i", {
    classMap: {
      "fa": true,
      "fa-search": true
    },
    key: 2,
    on: {
      "click": _m2 || ($ctx._m2 = api_bind($cmp.handleIconClick))
    }
  }, [])])];
}
export default registerTemplate(tmpl);
tmpl.stylesheets = [];
if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-searchBar_searchBar-host",
  shadowAttribute: "my-searchBar_searchBar"
};`;

    expect(compile('some.html', source)).toMatchSnapshot();
  });
});
