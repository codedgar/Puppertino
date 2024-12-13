(function (document) {
  let p_selector_modal = document.querySelectorAll("[data-p-open-modal]");
  let modals = document.querySelectorAll(".p-modal");
  let cancel_button = document.querySelectorAll("[data-p-cancel]");

  for (const item of p_selector_modal) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      let selector = this.getAttribute("data-p-open-modal");
      if (selector.length === 0) {
        console.warn(
          "Error. The data-p-open-modal attribute is empty, please add the ID of the modal you want to open."
        );
        return false;
      }
      document.querySelector(".p-modal-background").classList.add("nowactive");
      document.body.classList.add("p-modal-opened");
      document.querySelector(selector).classList.add("active");
    });
  }

  for (const element of cancel_button) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      document.querySelector(".p-modal.active").classList.remove("active");
      document.querySelector(".p-modal-background").classList.remove("nowactive");
      document.body.classList.remove("p-modal-opened");
    });
  }

  document
    .querySelector(".p-modal-background")
    .addEventListener("click", function (event) {
      event.preventDefault();
      let opened_modal = document.querySelector(".p-modal.active");
      if (opened_modal.getAttribute("data-p-close-on-outside") === "true") {
        event.stopPropagation();
        opened_modal.classList.remove("active");
        document
          .querySelector(".p-modal-background")
          .classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      }
    });

  for (let modal of modals) {
    modal.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }
})(document)