/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
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
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
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
      app.cart.add(thisProduct.prepareCartProduct());
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

  // shema for cart
  class Cart {
    constructor(element) {
      const thisCart = this;

      // array for our products in cart
      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      // console.log('new Cart: ', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
        select.cart.toggleTrigger
      );
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
        select.cart.productList
      );
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
        select.cart.deliveryFee
      );
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
        select.cart.subtotalPrice
      );
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
        select.cart.totalPrice
      );
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
        select.cart.totalNumber
      );
    }

    // toggle active class to open/close cart
    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });
    }

    // add products to cart
    add(menuProduct) {
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }

    update() {
      const thisCart = this;

      let deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0;
      let subtotalPrice = 0;

      for (let product of thisCart.products) {
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }

      thisCart.totalPrice = subtotalPrice + deliveryFee;

      if (totalNumber === 0) deliveryFee = 0;

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      thisCart.dom.totalNumber.innerHTML = totalNumber;

      for (let price of thisCart.dom.totalPrice)
        price.innerHTML = thisCart.totalPrice;
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget =
        thisCartProduct.dom.wrapper.querySelector(
          select.cartProduct.amountWidget
        );
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.edit
      );
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.remove
      );
      thisCartProduct.dom.input = thisCartProduct.dom.wrapper.querySelector(
        select.widgets.amount.input
      );
    }

    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(
        thisCartProduct.dom.amountWidget
      );

      // add event to my own created listener
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price =
          thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
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

    // create instance for cart
    initCart() {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
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
      thisApp.initCart();
    },
  };

  app.init();
}
