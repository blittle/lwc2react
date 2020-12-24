import { LightningElement } from 'lwc';
import { test } from './test';

/**
 * Homepage component. Renders homepage content.
 */
class Home extends LightningElement {
  wowA() {
    alert(test() + 'A');
  }
  wowB() {
    alert(test() + 'B');
  }
}

export default Home;
