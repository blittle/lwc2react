import { LightningElement } from 'lwc';
import { test } from './test';

/**
 * Homepage component. Renders homepage content.
 */
class Home extends LightningElement {
  wow() {
    alert(test());
  }
}

export default Home;
