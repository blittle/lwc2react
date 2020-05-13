import { LightningElement, api } from 'lwc';

/**
 * Search Bar where visitors can search for stuff
 */
export default class SearchBar extends LightningElement {
  @api query = '';

  /**
   * Use router to make query search
   */
  performSearch() {
    this.dispatchEvent(
      new CustomEvent('someevent', {
        detail: this.query,
      })
    );
  }

  /**
   * Handles pressing 'Enter' in the search field
   */
  searchInputHandler(event) {
    this.query = (event.target.value || '').trim();
  }

  /**
   * Perform the search when enter key pressed
   * @param event
   */
  searchKeyUpHandler(event) {
    if (event.key === 'Enter') {
      this.performSearch();
      event.preventDefault();
    }
  }

  /**
   * User may click the search icon also.
   */
  handleIconClick() {
    this.performSearch();
  }
}
