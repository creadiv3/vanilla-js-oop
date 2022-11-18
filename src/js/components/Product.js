import utils from '../utils.js';
import { templates, select, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';

// shema for our products
class Product {
  constructor(id, data) {
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElement();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    // console.log('new Product:', thisProduct);
  }

  // using template handlebars to render menu product
  renderInMenu() {
    const thisProduct = this;
    // generate HTML based on template
    const generatedHTML = templates.menuProduct(thisProduct.data);
    // create elem using utils.createElementFromHTML
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    // find menu container
    const menuContainer = document.querySelector(select.containerOf.menu);
    // add elem to menu
    menuContainer.appendChild(thisProduct.element);
  }

  // prepare reference to necessary dom element
  getElement() {
    const thisProduct = this;

    thisProduct.dom = {};

    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(
      select.menuProduct.clickable
    );
    thisProduct.dom.form = thisProduct.element.querySelector(
      select.menuProduct.form
    );
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(
      select.all.formInputs
    );
    thisProduct.dom.cartButton = thisProduct.element.querySelector(
      select.menuProduct.cartButton
    );
    thisProduct.dom.priceElem = thisProduct.element.querySelector(
      select.menuProduct.priceElem
    );
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(
      select.menuProduct.imageWrapper
    );
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(
      select.menuProduct.amountWidget
    );
  }

  // method to open and close chosen option, quantity and add to cart button
  initAccordion() {
    const thisProduct = this;

    thisProduct.dom.accordionTrigger.addEventListener('click', event => {
      event.preventDefault();

      const activeProduct = document.querySelector(
        select.all.menuProductsActive
      );

      if (activeProduct && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }

      thisProduct.element.classList.toggle(
        classNames.menuProduct.wrapperActive
      );
    });
  }

  // add event listener for form, input and button
  initOrderForm() {
    const thisProduct = this;

    thisProduct.dom.form.addEventListener('submit', event => {
      event.preventDefault();

      thisProduct.processOrder();
    });

    for (let input of thisProduct.dom.formInputs) {
      input.addEventListener('change', () => {
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', event => {
      event.preventDefault();

      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  // calculate price and show/hide images depend on chosen option
  processOrder() {
    const thisProduct = this;

    // covnert html form to object
    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    let price = thisProduct.data.price;

    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      for (let optionId in param.options) {
        const option = param.options[optionId];

        const optionImage = thisProduct.dom.imageWrapper.querySelector(
          `.${paramId}-${optionId}`
        );

        const optionSelected =
          formData[paramId] && formData[paramId].includes(optionId);

        // check if there is param with a name of paramId in formData and if it includes optionId
        if (optionSelected) {
          if (optionImage) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          // check if the option is not default
          if (!option.default) {
            // add option price to price variable
            price += option.price;
          }
        } else {
          if (optionImage) {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
          // check if the option is default
          if (option.default) {
            // reduce price variable
            price -= option.price;
          }
        }
      }
    }
    // to calc price based on amount of product
    price *= thisProduct.amountWidget.value;

    thisProduct.priceSingle = price;
    thisProduct.dom.priceElem.innerHTML = price;
  }

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(
      thisProduct.dom.amountWidgetElem
    );

    // add event to my own created listener
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }

  // pass instance of product to add method
  addToCart() {
    const thisProduct = this;

    // pass to add method obj with summary
    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  // prepare smaller obj with only necessary info
  prepareCartProduct() {
    const thisProduct = this;

    const productSummary = {};

    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.data.price;
    productSummary.price = thisProduct.priceSingle;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    const params = {};

    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      params[paramId] = {
        label: param.label,
        options: {},
      };

      for (let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected =
          formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }

    return params;
  }
}

export default Product;
