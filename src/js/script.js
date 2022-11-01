/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  /* eslint-disable */
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
  };
  /* eslint-enable */

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
  };

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
      thisProduct.processOrder();
      thisProduct.initAmountWidget();

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

      thisProduct.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.formInputs = thisProduct.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.imageWrapper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }

    // method to open and close chosen option, quantity and add to cart button
    initAccordion() {
      const thisProduct = this;

      thisProduct.accordionTrigger.addEventListener('click', event => {
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

      thisProduct.form.addEventListener('submit', event => {
        event.preventDefault();

        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', () => {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', event => {
        event.preventDefault();

        thisProduct.processOrder();
      });
    }

    // calculate price and show/hide images depend on chosen option
    processOrder() {
      const thisProduct = this;

      // covnert html form to object
      const formData = utils.serializeFormToObject(thisProduct.form);

      let price = thisProduct.data.price;

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          const optionImage = thisProduct.imageWrapper.querySelector(
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
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    }
  }

  // shema for widget where we can change amount of our product
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.initAction();
      thisWidget.setValue(thisWidget.input.value);

      console.log('AmountWidget: ', thisWidget);
      console.log('constructor arguments: ', element);
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }

    // validation for our widget
    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      if (thisWidget.value !== newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }

      thisWidget.input.value = thisWidget.value;
    }

    // add event listener to buttons and inputs
    initAction() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
  }

  const app = {
    // loop over data product and create instance base on Product class
    initMenu() {
      const thisApp = this;

      // console.log('thisApp.data: ', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    // prepare data from data.js and store them in app property => this.App.data
    initData() {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    // function where we initialize other func
    init() {
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}
