import { LightningElement, api } from 'lwc';

export default class CommerceHeader extends LightningElement {
  query;

  constructor() {
    super();
    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(e) {
    this.query = e.detail;
  }
}
