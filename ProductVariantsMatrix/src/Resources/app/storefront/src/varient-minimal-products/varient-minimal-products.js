import Plugin from "src/plugin-system/plugin.class";
import HttpClient from "src/service/http-client.service";

export default class VarientMinimalProducts extends Plugin {
  /**
   * Initialization of the plugin.
   * Binds various event listeners and sets up the HTTP client.
   */
  init() {
    this.onPlusClick();
    this.onMinusClick();
    this.onInputFieldChange();
    this.onMinimalTableHover();

    // Initialize the HttpClient with the access key and context token
    this._client = new HttpClient(window.accessKey, window.contextToken);
  }

  /**
  * Event handler for the product listing page grid.
  */
  onMinimalTableHover() {
    let summaryTables = document.querySelectorAll(".summary-table-minimal");

    summaryTables.forEach((table) => {
      let modalId = table.getAttribute("data-modal-target");
      let modal = document.getElementById(modalId);
      if (!modal) return;
      let closeModal = modal.querySelector(".close-modal");
      if (!closeModal) return;

      // Show modal on hover
      table.addEventListener("mouseenter", function () {
        modal.classList.add("show");
      });
      modal.addEventListener("mouseleave", function () {
        modal.classList.remove("show");
      });

      // Close modal on close button click
      closeModal.addEventListener("click", function () {
        modal.classList.remove("show");
      });

      // Close modal when clicking outside
      document.addEventListener("click", function (event) {
        if (event.target === modal) {
          modal.classList.remove("show");
        }
      });

      this.onResetButtonClick(modal);
      this.btnAddToCartClick(modal);
    });
  }

  /**
   * Event handler for the quantity plus button click.
   * Updates the subtotal and triggers quantity change logic.
   */
  onPlusClick() {
    const outerThis = this;
    document.querySelectorAll(".varient-product-plus").forEach((plusBtn) => {
      plusBtn.addEventListener("click", function () {
        const currencySymbolEl = document.querySelector("#currency-symbol");
        const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";
        // Update the subtotal for the current variant if applicable
        if (plusBtn.parentElement.parentElement.nextElementSibling) {
          const subtotal =
            plusBtn.previousElementSibling.value *
            plusBtn.getAttribute("data-sub-total-price");
          plusBtn.parentElement.parentElement.nextElementSibling.innerHTML =
            currencySymbol + parseFloat(subtotal).toFixed(2);
        }
      });
    });
  }

  /**
   * Event handler for the quantity minus button click.
   * Updates the subtotal and triggers quantity change logic.
   */
  onMinusClick() {
    document.querySelectorAll(".varient-product-minus").forEach((minusBtn) => {
      minusBtn.addEventListener("click", function () {
        const currencySymbolEl = document.querySelector("#currency-symbol");
        const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";

        // Update the subtotal for the current variant if applicable
        if (minusBtn.parentElement.parentElement.nextElementSibling) {
          const subtotal =
            minusBtn.nextElementSibling.value *
            minusBtn.getAttribute("data-sub-total-price");
          minusBtn.parentElement.parentElement.nextElementSibling.innerHTML =
            currencySymbol + parseFloat(subtotal).toFixed(2);
        }
      });
    });
  }

  /**
   * Event handler for quantity input field changes.
   * Updates the subtotal and triggers quantity change logic.
   */
  onInputFieldChange() {
    document
      .querySelectorAll(".varient-product-input-field")
      .forEach((inputField) => {
        inputField.addEventListener("change", function () {
          // Show the summary table
          const currencySymbolEl = document.querySelector("#currency-symbol");
          const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";

          // Update the subtotal for the current variant if applicable
          if (inputField.parentElement.parentElement.nextElementSibling) {
            const subtotal =
              inputField.value *
              inputField.getAttribute("data-sub-total-price");
            inputField.parentElement.parentElement.nextElementSibling.innerHTML =
              currencySymbol + parseFloat(subtotal).toFixed(2);
          }
        });
      });
  }

  onResetButtonClick(modal) {
    const resetButton = modal.querySelector(".variant-btn-reset");
    if (!resetButton) return;
    const currencySymbolEl = document.querySelector("#currency-symbol");
    const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";
    // Prevent multiple event bindings
    if (resetButton.dataset.listenerAdded) return;
    resetButton.dataset.listenerAdded = true;

    resetButton.addEventListener("click", () => {
      this.resetModal(modal, currencySymbol);
    });
  }

  resetModal(modal, currencySymbol) {
    if (!currencySymbol) {
      const currencySymbolEl = document.querySelector("#currency-symbol");
      currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";
    }
    // Reset each quantity field and subtotal
    modal.querySelectorAll(".varient-product-input-field").forEach((qty) => {
      qty.value = 0;
      if (qty.parentElement.parentElement.nextElementSibling) {
        qty.parentElement.parentElement.nextElementSibling.innerHTML =
          currencySymbol + " 0.00";
      }
    });
  }

  btnAddToCartClick(modal) {
    const outerThis = this;
    const addToCartButton = modal.querySelector(".btn-add-to-cart");
    if (!addToCartButton) return;

    // Prevent multiple event bindings
    if (addToCartButton.dataset.listenerAdded) return;
    addToCartButton.dataset.listenerAdded = true;

    addToCartButton.addEventListener("click", function () {
      const controllerUrl = this.getAttribute("data-url");
      let prodIds = {};

      // Collect selected products with their quantities
      modal.querySelectorAll(".varient-product-input-field").forEach((qty) => {
        if (qty.value > 0) {
          prodIds[qty.getAttribute("data-id")] = {
            id: qty.getAttribute("data-id"),
            qty: qty.value,
          };
        }
      });

      // If there are products selected, send the POST request
      if (Object.keys(prodIds).length > 0) {
        outerThis._client.post(
          controllerUrl,
          JSON.stringify({ variantsIds: prodIds }),
          (response) => {
            try {
              const parsedResponse = JSON.parse(response);
              if (parsedResponse.success) {
                const cartHeader = document.querySelector(".header-cart");
                if (cartHeader) cartHeader.click();
                outerThis.resetModal(modal);
              } else {
                console.log("Failed to add product to cart", response);
              }
            } catch (error) {
              console.error("Failed to parse response:", response);
            }
          }
        );
      }
    });
  }
}
