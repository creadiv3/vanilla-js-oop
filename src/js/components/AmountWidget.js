import { settings, select } from '../settings.js';

// shema for widget where we can change amount of our product
class AmountWidget {
  constructor(element) {
    const thisWidget = this;

    thisWidget.getElements(element);
    thisWidget.initActions();
    thisWidget.setValue(settings.amountWidget.defaultValue);

    // console.log('AmountWidget: ', thisWidget);
    // console.log('constructor arguments: ', element);
  }

  getElements(element) {
    const thisWidget = this;

    thisWidget.dom = {};

    thisWidget.dom.element = element;
    thisWidget.dom.input = thisWidget.dom.element.querySelector(
      select.widgets.amount.input
    );
    thisWidget.dom.linkDecrease = thisWidget.dom.element.querySelector(
      select.widgets.amount.linkDecrease
    );
    thisWidget.dom.linkIncrease = thisWidget.dom.element.querySelector(
      select.widgets.amount.linkIncrease
    );
  }

  // validation for our widget
  setValue(value) {
    const thisWidget = this;

    const newValue = parseInt(value);

    if (
      thisWidget.value !== newValue &&
      !isNaN(newValue) &&
      newValue <= settings.amountWidget.defaultMax &&
      newValue >= settings.amountWidget.defaultMin
    ) {
      thisWidget.value = newValue;
      thisWidget.announce();
    }

    thisWidget.dom.input.value = thisWidget.value;
  }

  // add event listener to buttons and inputs
  initActions() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.dom.input.value);
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });
    thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

  // create own event => updated
  announce() {
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true,
    });
    thisWidget.dom.element.dispatchEvent(event);
  }
}

export default AmountWidget;
