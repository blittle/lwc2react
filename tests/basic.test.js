import { convert } from '../src/index';

describe('Basic cases', function() {
    it('should convert an empty component', function() {
        const code = `
            function tmpl($api, $cmp, $slotset, $ctx) {
            const {
                t: api_text
            } = $api;
            return [api_text("hi")];
            }

            var _tmpl = registerTemplate(tmpl);
            tmpl.stylesheets = [];
            tmpl.stylesheetTokens = {
            hostAttribute: "my-app_app-host",
            shadowAttribute: "my-app_app"
            };

            class App extends BaseLightningElement {}

            var MyApp = registerComponent(App, {
            tmpl: _tmpl
            });
        `.trim();

        expect(convert(code)).toBe(`
        class App extends React.Component {
            render() {
                return <span>hi</span>
            }
        }
        `.trim());
    })
});
