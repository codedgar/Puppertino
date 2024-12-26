class PuppertinoModalMan {
  constructor() {
    this.init();
  }

  init() {
    this.attachOpenModalListeners();
    this.attachCloseModalListeners();
    this.attachOutsideClickListener();
    this.preventModalClickPropagation();
  }

  attachOpenModalListeners() {
    const openModalButtons = document.querySelectorAll("[data-p-open-modal]");
    openModalButtons.forEach(button => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const selector = button.getAttribute("data-p-open-modal");

        if (!selector || selector.trim().length === 0) {
          console.warn(
            "Error: The data-p-open-modal attribute is empty. Please specify the ID or selector of the modal you want to open."
          );
          return;
        }

        this.openModal(selector);
      });
    });
  }

  attachCloseModalListeners() {
    const closeModalButtons = document.querySelectorAll("[data-p-cancel]");
    closeModalButtons.forEach(button => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.closeActiveModal();
      });
    });
  }

  attachOutsideClickListener() {
    const modalBackground = document.querySelector(".p-modal-background");
    if (modalBackground) {
      modalBackground.addEventListener("click", (event) => {
        event.preventDefault();
        const activeModal = document.querySelector(".p-modal.active");

        if (
          activeModal &&
          activeModal.getAttribute("data-p-close-on-outside") === "true"
        ) {
          this.closeActiveModal();
        }
      });
    }
  }

  preventModalClickPropagation() {
    const modals = document.querySelectorAll(".p-modal");
    modals.forEach(modal => {
      modal.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    });
  }

  openModal(selector) {
    const modal = document.querySelector(selector);

    if (!modal) {
      console.warn(
        `Error: No modal found matching selector "${selector}". Ensure the selector is correct.`
      );
      return;
    }

    document.querySelector(".p-modal-background").classList.add("nowactive");
    document.body.classList.add("p-modal-opened");
    modal.classList.add("active");
  }

  closeActiveModal() {
    const activeModal = document.querySelector(".p-modal.active");
    if (activeModal) {
      activeModal.classList.remove("active");
    }

    const modalBackground = document.querySelector(".p-modal-background");
    if (modalBackground) {
      modalBackground.classList.remove("nowactive");
    }

    document.body.classList.remove("p-modal-opened");
  }

  closeModal(selector) {
    const modal = document.querySelector(selector);
    if (modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
      const modalBackground = document.querySelector(".p-modal-background");
      if (modalBackground) {
        modalBackground.classList.remove("nowactive");
      }
      document.body.classList.remove("p-modal-opened");
    }
  }

  isModalOpen(selector) {
    const modal = document.querySelector(selector);
    return modal ? modal.classList.contains("active") : false;
  }
}

// Initialize the PuppertinoModalMan instance
const PuppertinoModalManager = new PuppertinoModalMan();