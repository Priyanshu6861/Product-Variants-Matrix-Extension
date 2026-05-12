import Plugin from "src/plugin-system/plugin.class";
import HttpClient from "src/service/http-client.service";

export default class VarientProducts extends Plugin {
  /**
   * Initialization of the plugin.
   * Binds various event listeners and sets up the HTTP client.
   */
  init() {
    this.onPlusClick();
    this.onMinusClick();
    this.onInputFieldChange();
    this.onResetButtonClick();
    this.btnAddToCartClick();
    this.searchVariants();

    // Initialize the HttpClient with the access key and context token
    this._client = new HttpClient(window.accessKey, window.contextToken);
  }

  /**
   * Event handler for the quantity plus button click.
   * Updates the subtotal and triggers quantity change logic.
   */
  onPlusClick() {
    const outerThis = this;
    document.querySelectorAll(".varient-product-plus").forEach((plusBtn) => {
      plusBtn.addEventListener("click", function () {
        // Show the summary table
        const summaryTable = document.querySelector(".summary-table");
        if (summaryTable) {
          summaryTable.classList.remove("d-none");
        }
        const currencySymbolEl = document.querySelector("#currency-symbol");
        const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";
        // Update the subtotal for the current variant if applicable
        if (plusBtn.parentElement.parentElement.nextElementSibling) {
          const subtotal = plusBtn.previousElementSibling.value * plusBtn.getAttribute("data-sub-total-price");
          plusBtn.parentElement.parentElement.nextElementSibling.innerHTML = currencySymbol + " " + parseFloat(subtotal).toFixed(2);
        }

        // Trigger the quantity change logic
        outerThis.onQuentityChange();
      });
    });
  }

  /**
   * Event handler for the quantity minus button click.
   * Updates the subtotal and triggers quantity change logic.
   */
  onMinusClick() {
    const outerThis = this;
    document.querySelectorAll(".varient-product-minus").forEach((minusBtn) => {
      minusBtn.addEventListener("click", function () {
        // Show the summary table
        const summaryTable = document.querySelector(".summary-table");
        if (summaryTable) {
          summaryTable.classList.remove("d-none");
        }
        const currencySymbolEl = document.querySelector("#currency-symbol");
        const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";

        // Update the subtotal for the current variant if applicable
        if (minusBtn.parentElement.parentElement.nextElementSibling) {
          const subtotal =
            minusBtn.nextElementSibling.value *
            minusBtn.getAttribute("data-sub-total-price");
          minusBtn.parentElement.parentElement.nextElementSibling.innerHTML = currencySymbol + " " + parseFloat(subtotal).toFixed(2);
        }

        // Trigger the quantity change logic
        outerThis.onQuentityChange();
      });
    });
  }

  /**
   * Event handler for quantity input field changes.
   * Updates the subtotal and triggers quantity change logic.
   */
  onInputFieldChange() {
    const outerThis = this;
    document
      .querySelectorAll(".varient-product-input-field")
      .forEach((inputField) => {
        inputField.addEventListener("change", function () {
          // Show the summary table
          const summaryTable = document.querySelector(".summary-table");
          if (summaryTable) {
            summaryTable.classList.remove("d-none");
          }
          const currencySymbolEl = document.querySelector("#currency-symbol");
          const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";

          // Update the subtotal for the current variant if applicable
          if (inputField.parentElement.parentElement.nextElementSibling) {
            const subtotal =
              inputField.value *
              inputField.getAttribute("data-sub-total-price");
            inputField.parentElement.parentElement.nextElementSibling.innerHTML = currencySymbol + " " +
              parseFloat(subtotal).toFixed(2);
          }

          // Trigger the quantity change logic
          outerThis.onQuentityChange();
        });
      });
  }

  /**
   * Event handler for the reset button click.
   * Resets all quantity fields and hides the summary table.
   */
  onResetButtonClick() {
    const resetBtn = document.querySelector(".variant-btn-reset");
    if (!resetBtn) return;

    resetBtn.addEventListener("click", function () {
      if (document.querySelector("#summary-table-body")) {
        document.querySelector("#summary-table-body").innerHTML = '';
      }
      if (document.querySelector(".summary-table")) {
        document.querySelector(".summary-table").classList.add("d-none");
      }

      const currencySymbolEl = document.querySelector("#currency-symbol");
      const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";

      // Reset each quantity field and subtotal
      document
        .querySelectorAll(".varient-product-input-field")
        .forEach((qty) => {
          qty.value = 0;
          if (qty.parentElement.parentElement.nextElementSibling) {
            qty.parentElement.parentElement.nextElementSibling.innerHTML =
              currencySymbol + " 0.00";
          }
        });

      // Reset grand total and quantity display
      if (document.querySelector("#grandTotal")) {
        document.querySelector("#grandTotal").innerHTML = "0.00";
      }
      if (document.querySelector("#netquantity")) {
        document.querySelector("#netquantity").innerHTML = 0;
      }
    });
  }

  /**
   * Handles the logic for when the quantity changes (either by click or field input).
   * Updates the grand total, quantity, and the summary table.
   */
  onQuentityChange() {
    let totalQty = 0;
    let grandTotal = 0;
    let rowHtml = '';

    const summaryTableBody = document.querySelector("#summary-table-body");
    const summaryTable = document.querySelector(".summary-table");
    const grandTotalElement = document.querySelector("#grandTotal");
    const netQuantityElement = document.querySelector("#netquantity");

    document.querySelectorAll(".varient-product-input-field").forEach((qty) => {
      const price = parseFloat(qty.getAttribute("data-sub-total-price"));
      const quantity = parseInt(qty.value, 10);

      if (quantity > 0) {
        // Update totals
        grandTotal += quantity * price;
        totalQty += quantity;

        // Build the label HTML for product variants
        if (qty.getAttribute("data-display")) {
          const label = this.buildVariantLabel(
            JSON.parse(qty.getAttribute("data-display"))
          );

          // Build the row HTML
          rowHtml += `
                    <tr>
                      <td>${qty.getAttribute("data-sku")}</td>
                      <td><div class="d-flex justify-content-center">${label}</div></td>
                      <td>${qty.value}</td>
                      <td>
                        <button class="btn btn-danger remove-row-btn lh-base">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>`;
        }
      }
    });

    // Update table visibility
    if (summaryTable) {
      summaryTable.classList.toggle("d-none", rowHtml === '');
    }
    if (summaryTableBody) {
      summaryTableBody.innerHTML = rowHtml;
    }

    // Update grand total and total quantity
    if (grandTotalElement) {
      grandTotalElement.innerHTML = `${grandTotal.toFixed(2)}`;
    }
    if (netQuantityElement) {
      netQuantityElement.innerHTML = totalQty;
    }

    // Re-apply remove row click event
    this.removeSummaryRowClick();
  }

  // Helper method to build variant label HTML
  buildVariantLabel(variantOptions) {
    let label = '';
    variantOptions
      .sort((a, b) => {
        if (a.group.position !== b.group.position) {
          return a.group.position - b.group.position;
        }
        const nameA = (a.group.translated && a.group.translated.name) ? a.group.translated.name : (a.group.name || '');
        const nameB = (b.group.translated && b.group.translated.name) ? b.group.translated.name : (b.group.name || '');
        return nameA.localeCompare(nameB);
      }) // Sort the options
      .forEach((attr) => {
        let sameHtml = `<input type="radio" class="product-detail-configurator-option-input btn-check"><label class="product-detail-configurator-option-label btn" style="opacity: 1;margin-right: 10px; /* padding: 0px; */ height: 30px;`;
        if (attr.colorHexCode) {
          label +=
            sameHtml +
            `background-color: ${attr.colorHexCode}; min-width: 50px;"></label>`;
        } else if (attr.media) {
          label +=
            sameHtml +
            `"><img src="${attr.media.url}" class="product-detail-configurator-option-image"></label>`;
        } else {
          label +=
            sameHtml + `font-size: 12px;">${attr.translated.name}</label>`;
        }
      });

    return label;
  }

  /**
   * Event handler for the remove button click in the summary table.
   * Removes a product from the summary and updates the quantity.
   */
  removeSummaryRowClick() {
    const outerThis = this;
    document.querySelectorAll(".remove-row-btn").forEach((removeBtn) => {
      removeBtn.addEventListener("click", function () {
        const skuElement =
          this.closest("td").previousElementSibling.previousElementSibling
            .previousElementSibling;

        // Reset the quantity of the corresponding input field to zero
        document
          .querySelectorAll(".varient-product-input-field")
          .forEach((qty) => {
            if (skuElement.innerHTML === qty.getAttribute("data-sku")) {
              const currencySymbolEl = document.querySelector("#currency-symbol");
              const currencySymbol = currencySymbolEl ? currencySymbolEl.value : "";
              qty.value = 0;
              if (qty.parentElement.parentElement.nextElementSibling) {
                qty.parentElement.parentElement.nextElementSibling.innerHTML =
                  currencySymbol + " 0.00";
              }
              outerThis.onQuentityChange();
            }
          });
      });
    });
  }

  /**
   * Event handler for the "Add to Cart" button click.
   * Collects the selected products and sends them via an HTTP POST request.
   */
  btnAddToCartClick() {
    document.querySelector(".btn-add-to-cart").addEventListener("click", () => {
      const controllerUrl = document
        .querySelector(".btn-add-to-cart")
        .getAttribute("data-url");
      let prodIds = {};

      // Collect selected products with their quantities
      document
        .querySelectorAll(".varient-product-input-field")
        .forEach((qty) => {
          if (qty.value > 0) {
            prodIds[qty.getAttribute("data-id")] = {
              id: qty.getAttribute("data-id"),
              qty: qty.value,
            };
          }
        });

      // If there are products selected, send the POST request
      if (Object.keys(prodIds).length > 0) {
        this._client.post(
          controllerUrl,
          JSON.stringify({ variantsIds: prodIds }),
          (response) => {
            try {
              const parsedResponse = JSON.parse(response);

              if (parsedResponse.success) {
                document.querySelector(".header-cart").click();
                document.querySelector(".variant-btn-reset").click();
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

  /**
   * Event handler for the search bar keyup for matrix grid.
   * search the product row from matrix grid..
   */
  searchVariants() {
    const searchQuery = document.getElementById('variantSearch');
    const notFoundElement = document.querySelector('.notfound');

    if (searchQuery) {
      searchQuery.addEventListener("keyup", () => {
        let searchVal = searchQuery.value.toLowerCase();
        const rows = document.querySelectorAll('.matrix-table tbody .variant-record');
        let isAnyRowVisible = false;

        rows.forEach(row => {
          const variantLabel = row.querySelector('.variant-label')?.textContent.toLowerCase();
          const attribute = row.querySelector('.single-attr')?.textContent.toLowerCase();
          const sku = row.querySelector('.product-sku')?.textContent.toLowerCase();

          if (variantLabel?.includes(searchVal) || attribute?.includes(searchVal) || sku?.includes(searchVal)) {
            row.style.display = "";
            isAnyRowVisible = true;
          } else {
            row.style.display = "none";
          }
        });

        if (isAnyRowVisible) {
          notFoundElement.classList.add('d-none');
        } else {
          notFoundElement.classList.remove('d-none');
        }
      });
    }
  }
}
